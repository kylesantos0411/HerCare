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
      title: `A little check-in from ${getOwnerName(afterData)}`,
      body: afterCheckIn.message,
      data: {
        type: 'partner_checkin',
        shareCode,
        createdAtIso: afterCheckInAt,
      },
      tag: 'partner-checkin',
    };
  }

  const beforeLocationAt = beforeData?.latestLocation?.sharedAtIso || '';
  const afterLocation = afterData?.latestLocation || null;
  const afterLocationAt = afterLocation?.sharedAtIso || '';

  if (afterLocationAt && afterLocationAt !== beforeLocationAt) {
    return {
      title: `${getOwnerName(afterData)} shared a location pin`,
      body: 'Open HerCare when you are ready to see where she checked in from.',
      data: {
        type: 'partner_location',
        shareCode,
        sharedAtIso: afterLocationAt,
      },
      tag: 'partner-location',
    };
  }

  return null;
}

async function clearPartnerPushToken(shareCode) {
  await db.doc(`partnerShares/${shareCode}`).update({
    partnerPushToken: null,
    partnerPushAlertsEnabled: false,
    partnerPushUpdatedAtIso: new Date().toISOString(),
  });
}

exports.sendPartnerPushAlert = onDocumentUpdated(PARTNER_SHARE_PATH, async (event) => {
  const beforeData = event.data?.before?.data() || null;
  const afterData = event.data?.after?.data() || null;
  const shareCode = event.params.shareCode;

  if (!afterData || !afterData.partnerPushToken || !afterData.partnerPushAlertsEnabled || !afterData.partnerUid) {
    return;
  }

  const payload = buildPushPayload(beforeData, afterData, shareCode);

  if (!payload) {
    return;
  }

  try {
    await messaging.send({
      token: afterData.partnerPushToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: PARTNER_PUSH_CHANNEL_ID,
          tag: payload.tag,
        },
      },
    });
  } catch (error) {
    const errorCode = error && typeof error === 'object' ? error.code : '';

    if (errorCode === 'messaging/registration-token-not-registered') {
      await clearPartnerPushToken(shareCode);
      return;
    }

    throw error;
  }
});
