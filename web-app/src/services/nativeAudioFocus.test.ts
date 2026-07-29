import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('native prekid glasa telefona', () => {
  it('Android prekida govor accessibility servisa pre lokalnog snimka', () => {
    const source = readFileSync(resolve(
      'android/app/src/main/java/rs/slovolov/app/SlovolovAudioSessionPlugin.java'
    ), 'utf8');

    expect(source).toContain('AccessibilityManager');
    expect(source).toContain('accessibilityManager.interrupt()');
    expect(source).toContain('IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS');
    expect(source).toContain('IMPORTANT_FOR_ACCESSIBILITY_YES');
  });

  it('iOS prekida druge spoken-audio sesije dok Slovolov govori', () => {
    const source = readFileSync(resolve('ios/App/App/AppDelegate.swift'), 'utf8');

    expect(source).toContain('.interruptSpokenAudioAndMixWithOthers');
    expect(source).toContain('accessibilityElementsHidden = true');
    expect(source).toContain('accessibilityElementsHidden = false');
  });
});
