export interface SupportMessage {
  id: string;
  title: string;
  snippet: string;
  body: string;
  signoff: string;
}

export interface ComfortCornerItem {
  id: string;
  title: string;
  description: string;
}

export type OpenWhenAccent = 'violet' | 'sunrise' | 'sage' | 'glow';

export interface OpenWhenCard {
  id: string;
  title: string;
  preview: string;
  gentleReminder: string;
  message: string[];
  steps: string[];
  keepsakeTitle?: string;
  keepsakeText?: string;
  accent: OpenWhenAccent;
}

const supportMessages: SupportMessage[] = [
  {
    id: 'mid-shift-featured',
    title: 'Mid-shift rescue',
    snippet: "Baby, pause ka muna ha. Breathe. You're not behind just because mahirap yung shift mo.",
    body:
      "Baby... if everything starts to feel too loud and parang ang bilis na ng utak mo, pause ka muna ha. Breathe. You're not behind just because mahirap yung shift mo. I know you, love. You always push through kahit pagod ka na. Pero you don't have to carry everything at once. I'm still here... same me na kausap mo about random things and kakulitan after your shift. I'm proud of you, always.",
    signoff: 'Kai',
  },
  {
    id: 'mid-shift-card',
    title: 'Mid-shift rescue',
    snippet:
      "Guppy, pause ka lang muna. Breathe. Alam mo ginagawa mo. Remember mo yung sinabi mo before na 'kaya ko toh.' Oo, kaya mo talaga.",
    body:
      "Guppy, pause ka lang muna. Breathe. Alam mo ginagawa mo. Remember mo yung sinabi mo before na 'kaya ko toh.' Oo, kaya mo talaga.",
    signoff: 'Kai',
  },
  {
    id: 'drive-home',
    title: 'Drive-home note',
    snippet:
      "Love, pag out mo, tapos na ha. Don't think about everything sa utak mo. Uwi ka lang safe.",
    body:
      "Love, pag out mo, tapos na ha. Don't think about everything sa utak mo. Uwi ka lang safe. Pahinga ka. Think about getting your favorite drink or just lying down. You've done enough today, baby.",
    signoff: 'Kai',
  },
];

const comfortCornerItems: ComfortCornerItem[] = [
  {
    id: 'reset',
    title: 'Reset your body',
    description:
      'Baby, relax mo muna shoulders mo... alam ko pag ganito napapansin ko sayo mabilis ka mairita, then one slow breath. Inhale, exhale. Isa lang muna. Okay na yun.',
  },
  {
    id: 'ground',
    title: 'Ground the moment',
    description:
      "Jam, tingin ka muna sa paligid. Name a few things you can see... kahit isang bagay lang okay na yun. Kahit maliit lang. You're still here. You're still doing okay.",
  },
  {
    id: 'reach-out',
    title: 'Send the tiny text',
    description:
      "Chat mo lang ako, baho: 'I'm tired, I miss you.' Kahit ganyan lang. Alam mo naman, rereply ako agad or babawi ako later. I'm here.",
  },
];

export const openWhenCards: OpenWhenCard[] = [
  {
    id: 'tired',
    title: 'You are feeling tired',
    preview: "For the moments when kahit nakaupo ka lang, pagod ka pa rin.",
    gentleReminder: "Don't push yourself too hard, okay? Pahinga ka pag kaya mo.",
    message: [
      "My baby... I know pagod ka na. Yung tipong kahit nakaupo ka lang, pagod ka pa rin. I wish I could just pull you into a hug right now and let you rest. Kahit saglit lang. Don't push yourself too hard, okay? Pahinga ka pag kaya mo.",
    ],
    steps: [],
    accent: 'violet',
  },
  {
    id: 'overwhelmed',
    title: 'You are feeling overwhelmed',
    preview: 'For the moments when sabay-sabay na lahat and parang hindi mo na kaya.',
    gentleReminder: "One thing at a time. Hindi mo kailangan i-carry lahat.",
    message: [
      "Love, pag sabay-sabay na lahat and parang hindi mo na kaya, slow down lang muna. One thing at a time. Hindi mo kailangan i-carry lahat. Alam ko minsan iniisip mo kailangan mo maging strong all the time... pero hindi. You can breathe muna. I've got you.",
    ],
    steps: [],
    accent: 'sunrise',
  },
  {
    id: 'miss-you',
    title: 'You miss home',
    preview: 'For the quiet stretch when you miss home and just want something familiar.',
    gentleReminder: 'When you think of me, I hope medyo gumagaan kahit konti.',
    message: [
      "Guppy, I know you miss home... yung tahimik, yung familiar, yung feeling na safe ka lang. I can't fully give that right now, pero I hope kahit papaano, when you think of me... medyo gumagaan kahit konti. I'm here for you, always.",
    ],
    steps: [],
    accent: 'sage',
  },
  {
    id: 'doubting-yourself',
    title: 'You are doubting yourself',
    preview: 'For the moments when one hard shift or one bad moment makes you doubt yourself nang sobra.',
    gentleReminder: "One mistake doesn't change who you are.",
    message: [
      "Baby... wag ka masyadong harsh sa sarili mo. I've seen you on your good days and your bad days, and you're still the same strong person. One mistake doesn't change that. Alam ko minsan nag-ooverthink ka after one bad moment... pero trust me, you're doing better than you think.",
    ],
    steps: [],
    accent: 'glow',
  },
];

export function getFeaturedMessage() {
  return supportMessages[0];
}

export function getSavedMessages() {
  return supportMessages.slice(1, 3);
}

export function getOpenWhenCard(cardId: string | null) {
  return openWhenCards.find((card) => card.id === cardId) ?? null;
}

export { comfortCornerItems };
