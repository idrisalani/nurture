import { Audio } from 'expo-av';

const ALERT_FILES: Record<string, Record<string, any>> = {
  screen_time_exceeded: {
    en: require('../../assets/audio/screen_time_en.mp3'),
    ha: require('../../assets/audio/screen_time_ha.mp3'),
    yo: require('../../assets/audio/screen_time_yo.mp3'),
    ig: require('../../assets/audio/screen_time_ig.mp3'),
    pc: require('../../assets/audio/screen_time_pc.mp3'),
  },
};

export async function playVoiceAlert(alertType: string, lang: string): Promise<void> {
  const alertFiles = ALERT_FILES[alertType];
  if (!alertFiles) return;
  const file = alertFiles[lang] || alertFiles['en'];
  if (!file) return;
  try {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (err) {
    console.warn('Voice alert playback error:', err);
  }
}
