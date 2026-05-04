const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const PARTNER_PUSH_CHANNEL_ID = 'hercare-partner-alerts';
const PARTNER_SHARE_PATH = 'partnerShares/{shareCode}';

function getOwnerName(data) {
  return (data && typeof data.ownerName === 'string' && data.ownerName.trim()) || 'your person';
}

function buildPushPayload(beforeData, afterData, shareCode) {
  const beforeCheckInAt = beforeData?.latestCheckIn?.createdAtIso || '';
  const afterCheckIn = afterData?.latestCheckIn || null;
  const afterCheckInAt = afterCheckIn?.createdAtIso || '';

  if (afterCheckInAt && afterCheckInAt !== beforeCheckInAt) {
    return {
      recipient: 'partner',
      title: `A little check-in from ${getOwnerName(afterData)}`,
      body: afterCheckIn.message,
      data: {
        type: 'partner_checkin',
        shareCode,
        createdAtIso: afterCheckInAt,
        title: `A little check-in from ${getOwnerName(afterData)}`,
        body: afterCheckIn.message,
      },
      tag: 'partner-checkin',
    };
  }

  const beforeOwnerNudgeAt = beforeData?.latestOwnerNudge?.createdAtIso || '';
  const afterOwnerNudge = afterData?.latestOwnerNudge || null;
  const afterOwnerNudgeAt = afterOwnerNudge?.createdAtIso || '';

  if (afterOwnerNudgeAt && afterOwnerNudgeAt !== beforeOwnerNudgeAt) {
    return {
      recipient: 'partner',
      title: afterOwnerNudge.title,
      body: afterOwnerNudge.message,
      data: {
        type: 'partner_owner_nudge',
        shareCode,
        createdAtIso: afterOwnerNudgeAt,
        title: afterOwnerNudge.title,
        body: afterOwnerNudge.message,
        nudgeType: afterOwnerNudge.type || 'general',
      },
      tag: `partner-owner-nudge-${afterOwnerNudge.type || 'general'}`,
    };
  }

  const beforePartnerNudgeAt = beforeData?.latestPartnerNudge?.createdAtIso || '';
  const afterPartnerNudge = afterData?.latestPartnerNudge || null;
  const afterPartnerNudgeAt = afterPartnerNudge?.createdAtIso || '';

  if (afterPartnerNudgeAt && afterPartnerNudgeAt !== beforePartnerNudgeAt) {
    return {
      recipient: 'owner',
      title: afterPartnerNudge.title,
      body: afterPartnerNudge.message,
      data: {
        type: 'partner_partner_nudge',
        shareCode,
        createdAtIso: afterPartnerNudgeAt,
        title: afterPartnerNudge.title,
        body: afterPartnerNudge.message,
        nudgeType: afterPartnerNudge.type || 'general',
      },
      tag: `partner-partner-nudge-${afterPartnerNudge.type || 'general'}`,
    };
  }

  const beforeLocationAt = beforeData?.latestLocation?.sharedAtIso || '';
  const afterLocation = afterData?.latestLocation || null;
  const afterLocationAt = afterLocation?.sharedAtIso || '';

  if (afterLocationAt && afterLocationAt !== beforeLocationAt) {
    return {
      recipient: 'partner',
      title: `${getOwnerName(afterData)} shared a location pin`,
      body: 'Open HerCare when you are ready to see where she checked in from.',
      data: {
        type: 'partner_location',
        shareCode,
        sharedAtIso: afterLocationAt,
        title: `${getOwnerName(afterData)} shared a location pin`,
        body: 'Open HerCare when you are ready to see where she checked in from.',
      },
      tag: 'partner-location',
    };
  }

  return null;
}

async function clearPushToken(shareCode, recipient) {
  const updates =
    recipient === 'owner'
      ? {
          ownerPushToken: null,
          ownerPushAlertsEnabled: false,
          ownerPushUpdatedAtIso: new Date().toISOString(),
        }
      : {
          partnerPushToken: null,
          partnerPushAlertsEnabled: false,
          partnerPushUpdatedAtIso: new Date().toISOString(),
        };

  await db.doc(`partnerShares/${shareCode}`).update(updates);
}

exports.sendPartnerPushAlert = onDocumentUpdated(PARTNER_SHARE_PATH, async (event) => {
  const beforeData = event.data?.before?.data() || null;
  const afterData = event.data?.after?.data() || null;
  const shareCode = event.params.shareCode;

  const payload = buildPushPayload(beforeData, afterData, shareCode);

  if (!payload) {
    return;
  }

  if (!afterData) {
    return;
  }

  const targetToken =
    payload.recipient === 'owner'
      ? afterData.ownerPushAlertsEnabled && afterData.ownerUid
        ? afterData.ownerPushToken
        : null
      : afterData.partnerPushAlertsEnabled && afterData.partnerUid
        ? afterData.partnerPushToken
        : null;

  if (!targetToken) {
    return;
  }

  try {
    await messaging.send({
      token: targetToken,
      data: payload.data,
      android: {
        priority: 'high',
      },
    });
  } catch (error) {
    const errorCode = error && typeof error === 'object' ? error.code : '';

    if (errorCode === 'messaging/registration-token-not-registered') {
      await clearPushToken(shareCode, payload.recipient);
      return;
    }

    throw error;
  }
});
