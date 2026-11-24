// Well-known Android package names, used for category rules and exam mode.
// Anything not listed is still classified by Android's own app category (game, social, video) on the device.
export const PACKAGES = {
  social: ['com.facebook.katana', 'com.instagram.android', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill', 'com.snapchat.android', 'com.twitter.android'],
  messaging: ['com.whatsapp', 'org.telegram.messenger', 'com.facebook.orca'],
  entertainment: ['com.google.android.youtube', 'com.netflix.mediaclient', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill'],
};
/** Backend category key -> what to block on the phone. Web-only categories (adult, gambling...) need the web filter and are not enforced here. */
export const CATEGORY_RULES: Record<string, { packages: string[]; android?: 'game' | 'social' | 'video' }> = {
  social_media: { packages: PACKAGES.social, android: 'social' },
  gaming: { packages: [], android: 'game' },
};
