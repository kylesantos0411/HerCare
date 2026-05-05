const BACKGROUND_MUSIC_SRC = '/audio/weighted-blanket.mp3';
const BACKGROUND_MUSIC_VOLUME = 0.32;

let backgroundAudio: HTMLAudioElement | null = null;

function getBackgroundAudio() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!backgroundAudio) {
    backgroundAudio = new Audio(BACKGROUND_MUSIC_SRC);
    backgroundAudio.loop = true;
    backgroundAudio.preload = 'auto';
    backgroundAudio.volume = BACKGROUND_MUSIC_VOLUME;
    backgroundAudio.setAttribute('playsinline', 'true');
  }

  return backgroundAudio;
}

export async function startBackgroundMusic() {
  const audio = getBackgroundAudio();

  if (!audio) {
    return false;
  }

  audio.loop = true;
  audio.volume = BACKGROUND_MUSIC_VOLUME;

  if (!audio.paused) {
    return true;
  }

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopBackgroundMusic() {
  if (!backgroundAudio) {
    return;
  }

  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}
