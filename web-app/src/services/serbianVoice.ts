const LANGUAGE_PRIORITY = ['sr', 'bs', 'hr'] as const;
const PREFERRED_NAMES = ['sophie', 'neural', 'premium', 'natural', 'google', 'microsoft'];

const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ', Е: 'E', Ж: 'Ž', З: 'Z',
  И: 'I', Ј: 'J', К: 'K', Л: 'L', Љ: 'Lj', М: 'M', Н: 'N', Њ: 'Nj', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', Ћ: 'Ć', У: 'U', Ф: 'F', Х: 'H', Ц: 'C',
  Ч: 'Č', Џ: 'Dž', Ш: 'Š',
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š'
};

function languageCode(voice: SpeechSynthesisVoice): string {
  return voice.lang.toLowerCase().split(/[-_]/)[0];
}

function nameRank(voice: SpeechSynthesisVoice): number {
  const lowerName = voice.name.toLowerCase();
  const rank = PREFERRED_NAMES.findIndex((name) => lowerName.includes(name));
  return rank === -1 ? PREFERRED_NAMES.length : rank;
}

export function selectSerbianVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  return [...voices]
    .filter((voice) => LANGUAGE_PRIORITY.includes(languageCode(voice) as typeof LANGUAGE_PRIORITY[number]))
    .sort((left, right) => {
      const languageDifference =
        LANGUAGE_PRIORITY.indexOf(languageCode(left) as typeof LANGUAGE_PRIORITY[number]) -
        LANGUAGE_PRIORITY.indexOf(languageCode(right) as typeof LANGUAGE_PRIORITY[number]);
      return languageDifference || nameRank(left) - nameRank(right);
    })[0];
}

export function prepareTextForVoice(text: string, voice: SpeechSynthesisVoice): string {
  if (languageCode(voice) === 'sr') return text;
  return [...text].map((character) => CYRILLIC_TO_LATIN[character] ?? character).join('');
}
