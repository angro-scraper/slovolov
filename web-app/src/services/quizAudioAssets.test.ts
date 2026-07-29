import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('srpski glas slikovnog kviza', () => {
  it('koristi isti glas i tempo kao poruka „Bravo” i samo ćirilični prompt', () => {
    const quizGenerator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-quiz-audio.py'),
      'utf8'
    );
    const feedbackGenerator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-letter-audio.py'),
      'utf8'
    );

    expect(quizGenerator).toContain('VOICE = "sr-RS-SophieNeural"');
    expect(feedbackGenerator).toContain('VOICE = "sr-RS-SophieNeural"');
    expect(quizGenerator).toContain('QUIZ_RATE = "-18%"');
    expect(feedbackGenerator).toContain('FEEDBACK_RATE = "-18%"');
    expect(quizGenerator).toContain('На слици је {word}. Које је прво слово?');
    expect(quizGenerator).not.toContain('Na slici je');
    expect(quizGenerator).not.toContain('rate="-10%"');
  });

  it('svih 90 pitanja ima lokalni audio-snimak', () => {
    for (let index = 1; index <= 90; index += 1) {
      const filename = `${String(index).padStart(2, '0')}.mp3`;
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'quiz',
        filename
      )).byteLength).toBeGreaterThan(5_000);
    }
  });
});
