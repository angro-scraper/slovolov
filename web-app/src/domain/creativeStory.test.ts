import { describe, expect, it } from 'vitest';
import { buildCreativeStory, creativeHeroes, creativePlaces, creativeQuests, creativeHelpers, creativeEndings } from './creativeStory';

describe('Kreativni studio', () => {
  it('pravi punu dečju priču sa naslovom, razvojem i završetkom', () => {
    const story = buildCreativeStory({
      childName: 'Мила',
      hero: creativeHeroes[0],
      place: creativePlaces[0],
      quest: creativeQuests[0],
      helper: creativeHelpers[0],
      ending: creativeEndings[0]
    });

    expect(story.title.length).toBeGreaterThan(10);
    expect(story.paragraphs).toHaveLength(4);
    expect(story.narrationParagraphs).toHaveLength(4);
    expect(story.narrationParagraphs.join(' ')).not.toContain('Мила');
    expect(story.narrationParagraphs.join(' ')).toContain('мали аутор');
    expect(story.text.split(/[.!?]+/).filter(Boolean).length).toBeGreaterThanOrEqual(9);
    expect(story.text.length).toBeGreaterThan(500);
    expect(story.text).toContain('Мила');
    expect(story.text).toContain(creativeHeroes[0].name);
    expect(story.text).toContain(creativePlaces[0].label);
    expect(story.text).toContain(creativeHelpers[0].name);
    expect(story.text).not.toContain('стигао је у чаробној шуми');
    expect(story.text).not.toContain('знао да умео је');
    expect(story.text).not.toContain('разумео да највећа награда била је');
  });

  it('svaki izbor stvarno utiče na sadržaj priče', () => {
    const base = {
      childName: 'Лука',
      hero: creativeHeroes[0],
      place: creativePlaces[0],
      quest: creativeQuests[0],
      helper: creativeHelpers[0],
      ending: creativeEndings[0]
    };

    expect(buildCreativeStory(base).text).not.toBe(buildCreativeStory({
      ...base,
      hero: creativeHeroes[1],
      place: creativePlaces[1],
      quest: creativeQuests[1],
      helper: creativeHelpers[1],
      ending: creativeEndings[1]
    }).text);
  });
});
