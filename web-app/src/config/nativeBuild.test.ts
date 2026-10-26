import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Slovolov nativne izdanje', () => {
  it('cilja Android API 36 za nova Google Play ažuriranja', () => {
    const androidVariables = readProjectFile('android/variables.gradle');
    const androidBuild = readProjectFile('android/build.gradle');

    expect(androidVariables).toMatch(/compileSdkVersion\s*=\s*36\b/);
    expect(androidVariables).toMatch(/targetSdkVersion\s*=\s*36\b/);
    expect(androidBuild).toMatch(/com\.android\.tools\.build:gradle:8\.(?:9|[1-9]\d)\./);
  });

  it('koristi sledeći Android kod i iOS build za izdanje 3.4.2', () => {
    const packageJson = JSON.parse(readProjectFile('package.json')) as { version: string };
    const androidBuild = readProjectFile('android/app/build.gradle');
    const iosProject = readProjectFile('ios/App/App.xcodeproj/project.pbxproj');

    expect(packageJson.version).toBe('3.4.2');
    expect(androidBuild).toMatch(/versionCode\s+32\b/);
    expect(androidBuild).toMatch(/versionName\s+"3\.4\.2"/);
    expect(iosProject.match(/CURRENT_PROJECT_VERSION = 17;/g)).toHaveLength(2);
    expect(iosProject.match(/MARKETING_VERSION = 3\.4\.2;/g)).toHaveLength(2);
  });
});
