// NurtureNet design tokens.
// Palette idea: adire indigo-dyed cloth (ink + chalk), with green reserved for "safe",
// kola-nut ochre for "needs attention" (prayer, bedtime) and chili red for danger only.
export const palettes = {
  light: {
    bg: '#F3F5FB',        // chalk, tinted toward the indigo
    surface: '#FFFFFF',
    surfaceAlt: '#E8ECF7',
    line: '#DCE1F0',
    ink: '#141C4A',       // strongest text and headings
    text: '#1F2747',
    muted: '#566082',
    primary: '#212E86',   // adire indigo
    onPrimary: '#FFFFFF',
    primaryTint: '#E3E7F8',
    safe: '#11765A',      // text-safe green (AA on white)
    safeFill: '#1D9E75',  // brand green for fills
    safeTint: '#DFF3EA',
    warn: '#8F5A00',      // text-safe ochre
    warnFill: '#E3A02F',
    warnTint: '#FBEFD6',
    danger: '#B3261E',
    dangerTint: '#FBE3E0',
    rest: '#C9D0EE',      // day-rhythm: bedtime
    school: '#AEB8DE',    // day-rhythm: school hours
    overlay: 'rgba(20,28,74,0.45)',
  },
  dark: {
    bg: '#0D122E',
    surface: '#161D45',
    surfaceAlt: '#212A5C',
    line: '#2C3668',
    ink: '#F2F4FF',
    text: '#E4E8FA',
    muted: '#A3ADD6',
    primary: '#9AA9FF',
    onPrimary: '#0D122E',
    primaryTint: '#232C66',
    safe: '#4BDCAE',
    safeFill: '#2FBE92',
    safeTint: '#14382F',
    warn: '#F1B85A',
    warnFill: '#E3A02F',
    warnTint: '#3A2E12',
    danger: '#FF8A80',
    dangerTint: '#42191A',
    rest: '#2E3A80',
    school: '#3D4A94',
    overlay: 'rgba(0,0,0,0.6)',
  },
};
export type Palette = typeof palettes.light;
export type Scheme = 'light' | 'dark';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
// Different jobs get different radii on purpose.
export const radius = { field: 10, group: 18, tile: 24, pill: 999, sheet: 28 };

// Noto Sans: chosen because it is the only widely available family that contains every
// letter used in Hausa (ɓ ɗ ƙ), Yoruba and Igbo (ẹ ọ ṣ ị ụ, tone marks) and the naira sign ₦.
export const fonts = { regular: 'NotoSans_400Regular', semi: 'NotoSans_600SemiBold', bold: 'NotoSans_700Bold' };

export const type = {
  caption: { size: 13, line: 18, font: fonts.regular },
  body: { size: 16, line: 24, font: fonts.regular },
  bodyL: { size: 18, line: 27, font: fonts.regular },
  label: { size: 15, line: 21, font: fonts.semi },
  title: { size: 21, line: 28, font: fonts.bold },
  headline: { size: 28, line: 34, font: fonts.bold },
  display: { size: 34, line: 40, font: fonts.bold },
};
export type TypeVariant = keyof typeof type;
