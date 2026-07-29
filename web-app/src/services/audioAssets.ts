/**
 * Menjati samo kada se objavi novi provereni paket srpskih snimaka.
 *
 * Audio je ranije godinama ostajao u CacheFirst kešu pod istim URL-om, pa su
 * telefon i PWA mogli da reprodukuju staru verziju i posle novog izdanja.
 */
export const AUDIO_ASSET_VERSION = 'sr-sophie-quiz-v5-20260729';

export function versionAudioUrl(source: string): string {
  if (/[?&]v=/.test(source)) return source;
  const separator = source.includes('?') ? '&' : '?';
  return `${source}${separator}v=${AUDIO_ASSET_VERSION}`;
}
