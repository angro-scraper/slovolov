import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('Slovolov paket za prodavnice', () => {
  it('objašnjava i traži mikrofon na obe mobilne platforme', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain(
      'android.permission.RECORD_AUDIO',
    );
    const infoPlist = read('ios/App/App/Info.plist');
    expect(infoPlist).toContain('NSMicrophoneUsageDescription');
    expect(infoPlist).toContain('Snimak ne napušta uređaj');
  });

  it('iOS paket proglašava srpski kao jezik aplikacije i tačan encryption status', () => {
    const infoPlist = read('ios/App/App/Info.plist');
    expect(infoPlist).toMatch(
      /<key>CFBundleDevelopmentRegion<\/key>\s*<string>sr<\/string>/,
    );
    expect(infoPlist).toMatch(
      /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/,
    );
  });

  it('mobilni omoti prikazuju istu javnu web aplikaciju 1 kroz 1', () => {
    const capacitorConfig = read('capacitor.config.ts');
    expect(capacitorConfig).toContain(
      "url: 'https://slovolov-download.onrender.com/?slovolov-premium=ios'",
    );
    expect(capacitorConfig).toContain(
      "allowNavigation: ['slovolov-download.onrender.com']",
    );
    expect(capacitorConfig).toContain('cleartext: false');
  });

  it('ima javnu politiku privatnosti usklađenu sa ponašanjem aplikacije', () => {
    const privacy = read('public/privacy.html');
    expect(privacy).toContain('Politika privatnosti');
    expect(privacy).toContain('ne šalje ime deteta');
    expect(privacy).toContain('ne šalje snimak glasa');
    expect(privacy).toContain('Google Play');
    expect(privacy).toContain('Apple App Store');
    expect(privacy).toContain('pretplatu');
    expect(read('public/terms.html')).toContain('Uslovi korišćenja');
  });

  it('release potpis koristi samo promenljive okruženja', () => {
    const gradle = read('android/app/build.gradle');
    for (const variable of [
      'SLOVOLOV_UPLOAD_KEYSTORE',
      'SLOVOLOV_KEYSTORE_PASSWORD',
      'SLOVOLOV_UPLOAD_KEY_ALIAS',
      'SLOVOLOV_UPLOAD_KEY_PASSWORD',
    ]) {
      expect(gradle).toContain(variable);
    }
    expect(gradle).not.toMatch(/storePassword\s+["'][^"']+["']/);
    expect(gradle).not.toMatch(/keyPassword\s+["'][^"']+["']/);
  });

  it('Android nativni plejer zadrzava APK audio fajl do kraja reprodukcije', () => {
    const plugin = read('android/app/src/main/java/rs/slovolov/app/SlovolovAudioSessionPlugin.java');
    const activity = read('android/app/src/main/java/rs/slovolov/app/MainActivity.java');

    expect(plugin).toContain('private AssetFileDescriptor activeAssetDescriptor;');
    expect(plugin).toContain('closeAssetDescriptor();');
    expect(plugin).toContain('requestPlaybackAudioFocus()');
    expect(plugin).toContain('releasePlaybackAudioFocus()');
    expect(plugin).not.toContain('try (AssetFileDescriptor descriptor');
    expect(activity).not.toContain('requestExclusiveAudioFocus()');
  });
});
