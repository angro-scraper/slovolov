import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TracePad } from './components/TracePad';
import { ColoringPad } from './components/ColoringPad';
import { VoicePractice } from './components/VoicePractice';
import { isCommerceEnabled, isIosPremiumEnabled } from './config/commerce';
import { fairyTaleAges, fairyTales, type FairyTaleAge } from './data/fairyTales';
import { numberLessons } from './data/numbers';
import { readingStories, storyAges, type ReadingAge } from './data/stories';
import { rhymeRounds, syllableSets, wordReadingRounds } from './data/readingLessons';
import { familyMissions } from './data/familyMissions';
import { logicChallenges } from './data/logicChallenges';
import { getStickerCollectionProgress } from './domain/rewardCollections';
import { getLetterAnimation } from './domain/letterAnimation';
import { cultureCards } from './data/serbianCulture';
import { seededChoices } from './domain/choices';
import { canAccessFeature, canAccessLetter, canAccessNumber, canAccessStory } from './domain/access';
import { nextLetterToPractice, summarizeLearning } from './domain/learning';
import { displayLetter, letters, transliterate, type Letter, type LetterWord } from './domain/letters';
import {
  buildCreativeStory,
  creativeEndings,
  creativeHelpers,
  creativeHeroes,
  creativePlaces,
  creativeQuests
} from './domain/creativeStory';
import {
  adventureWorlds,
  getAdventureProgress,
  isAdventureLevelUnlocked,
  type AdventureLevel
} from './domain/adventure';
import { isTrailUnlocked, trails, trailChoices, type Trail } from './domain/trailGame';
import { narrateSentences, type NarrationSession } from './services/narration';
import {
  createCreativeNarrationSources,
  deserializeCreativeBook,
  serializeCreativeBook,
  type CreativeSelection
} from './services/creativeNarration';
import { loadFullStoryContent, type FullStoryContent } from './services/fullStoryLibrary';
import {
  downloadStoryForOffline,
  isStoryAvailableOffline,
  type StoryDownloadProgress
} from './services/storyOffline';
import {
  speak,
  speakAndWait,
  speakRecordedPrompt,
  speakRecordedPromptAndWait,
  stopAppSpeech
} from './services/speech';
import {
  adventureLiteracyAudio,
  dailyLogicAudio,
  readingRhymeAudio,
  readingStorySentenceAudio,
  readingSyllableAudio,
  readingWordAudio
} from './services/readingAudio';
import { createQuizRound } from './data/quizQuestions';
import { applyInterfaceScript } from './services/interfaceScript';
import {
  createDefaultPurchaseGateway,
  createPurchaseManager,
  isNativePurchasePlatform,
  type PurchaseOffer
} from './services/purchases';
import { useProgressStore } from './store/progress';

type Screen = 'home' | 'adventure' | 'trail' | 'voice' | 'family-missions' | 'logic' | 'culture' | 'adaptive' | 'daily' | 'learn' | 'lesson' | 'write' | 'coloring' | 'games' | 'quiz' | 'numbers' | 'reading' | 'fairy-tales' | 'creative' | 'progress' | 'settings';
const OWL_MASCOT_SRC = '/images/mascot-owl-v1.png';
const coloringPages = letters.map((letter) => ({ id: letter.upper, ...letter.words[0] }));
const coloringSpriteSheets = [
  '/images/coloring/objects-sheet-1-v1.png',
  '/images/coloring/objects-sheet-2-v1.png',
  '/images/coloring/objects-sheet-3-v1.png',
  '/images/coloring/objects-sheet-4-v1.png',
  '/images/coloring/objects-sheet-5-v1.png'
];

const menus: Array<{ screen: Screen; icon: string; title: string; subtitle: string }> = [
  { screen: 'adventure', icon: '🗺️', title: 'Moja avantura', subtitle: '36 nivoa koji postaju sve teži' },
  { screen: 'adaptive', icon: '✨', title: 'Moja lekcija', subtitle: 'Pametno ponavljanje baš za mene' },
  { screen: 'daily', icon: '🌞', title: 'Dnevni izazov', subtitle: 'Tri kratka koraka i 3 zvezdice' },
  { screen: 'learn', icon: '🔤', title: 'Nauči slova', subtitle: 'Slušaj, gledaj i pamti' },
  { screen: 'write', icon: '✍️', title: 'Piši slova', subtitle: 'Crtaj prstom po putanji' },
  { screen: 'coloring', icon: '🎨', title: 'Bojanka', subtitle: 'Oboji, sačuvaj i pokaži' },
  { screen: 'games', icon: '🎮', title: 'Igre', subtitle: 'Spoji, pogodi i složi' },
  { screen: 'quiz', icon: '🏆', title: 'Kviz', subtitle: 'Osvoji novu medalju' },
  { screen: 'numbers', icon: '🔢', title: 'Brojevi 0–100', subtitle: 'Prebroj, poslušaj i osvoji zvezdicu' },
  { screen: 'reading', icon: '📚', title: 'Čitanje', subtitle: 'Slogovi, reči i priče' },
  { screen: 'fairy-tales', icon: '🌙', title: 'Bajke i priče', subtitle: 'Slušaj, čitaj i osvajaj zvezdice' },
  { screen: 'creative', icon: '🎭', title: 'Moja priča', subtitle: 'Izaberi junaka i smisli avanturu' },
  { screen: 'progress', icon: '⭐', title: 'Moj napredak', subtitle: 'Zvezdice, dnevni niz i nagrade' }
];

function WordIllustration({ word, className = '' }: { word: LetterWord; className?: string }) {
  return word.image
    ? <img className={`word-illustration ${className}`} src={word.image} alt="" />
    : <span>{word.emoji}</span>;
}

function ArrowIcon({ direction = 'right', className = '' }: { direction?: 'left' | 'right'; className?: string }) {
  const path = direction === 'left' ? 'M19 12H5m7 7-7-7 7-7' : 'M5 12h14m-7-7 7 7-7 7';
  return <svg className={`arrow-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={path} /></svg>;
}

function Back({ onClick }: { onClick: () => void }) {
  return <button className="back" onClick={onClick} aria-label="Nazad"><ArrowIcon direction="left" /></button>;
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="screen-header">
      {onBack ? (
        <Back onClick={onBack} />
      ) : (
        <img className="mascot" src="/icons/slovolov-icon-192.png" alt="Slovolov sova" />
      )}
      <div><small>Slovolov</small><h1>{title}</h1></div>
      <span className="star-pill">⭐ {useProgressStore((state) => state.profile.stars)}</span>
    </header>
  );
}

function PlayBanner({ icon, label, title, hint }: { icon: string; label: string; title: string; hint: string }) {
  return (
    <section className="play-banner" aria-label={`${label}: ${title}`} data-testid="play-banner">
      <div className="play-banner-copy">
        <small>{label}</small>
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
      <span className="play-banner-icon" aria-hidden="true">{icon}</span>
      <img src={OWL_MASCOT_SRC} alt="" aria-hidden="true" />
      <span className="play-banner-sparkle sparkle-a" aria-hidden="true">✦</span>
      <span className="play-banner-sparkle sparkle-b" aria-hidden="true">✦</span>
    </section>
  );
}

export function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<Screen>(() => {
    const preview = new URLSearchParams(window.location.search).get('preview');
    return import.meta.env.DEV && (preview === 'adventure' || preview === 'adaptive' || preview === 'daily') ? preview : 'home';
  });
  const [selected, setSelected] = useState<Letter>(letters[0]);
  const [coloringIndex, setColoringIndex] = useState(0);
  const [activeAdventureLevel, setActiveAdventureLevel] = useState<AdventureLevel | null>(null);
  const [activeTrail, setActiveTrail] = useState<Trail | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [letterCase, setLetterCase] = useState<'upper' | 'lower'>('upper');
  const [traceMessage, setTraceMessage] = useState('Prati celo svetlo slovo prstom.');
  const sound = useProgressStore((state) => state.soundEnabled);
  const darkMode = useProgressStore((state) => state.darkMode);
  const script = useProgressStore((state) => state.script);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const addLearningSeconds = useProgressStore((state) => state.addLearningSeconds);
  const profile = useProgressStore((state) => state.profile);
  const accessibility = useProgressStore((state) => state.accessibility);
  const purchasedFamily = useProgressStore((state) => state.familyAccess.isUnlocked);
  const setStoreSubscriptionAccess = useProgressStore((state) => state.setStoreSubscriptionAccess);
  const familyUnlocked = !isCommerceEnabled() || purchasedFamily;
  const navigate = useCallback((nextScreen: Screen) => {
    stopAppSpeech();
    setScreen(canAccessFeature(nextScreen, familyUnlocked) ? nextScreen : 'settings');
  }, [familyUnlocked]);
  const openAdventureLevel = useCallback((level: AdventureLevel) => {
    setActiveAdventureLevel(level);
    navigate(level.route);
  }, [navigate]);
  const finishAdventureLevel = useCallback(() => {
    if (activeAdventureLevel) {
      useProgressStore.getState().completeLearningPath(activeAdventureLevel.id);
    }
    setActiveAdventureLevel(null);
    navigate('adventure');
  }, [activeAdventureLevel, navigate]);

  useLayoutEffect(() => {
    const root = appRef.current;
    if (!root) return undefined;

    const apply = () => applyInterfaceScript(root, script);
    apply();
    const observer = new MutationObserver(() => {
      observer.disconnect();
      apply();
      observer.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-label', 'placeholder', 'title']
      });
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'placeholder', 'title']
    });
    return () => observer.disconnect();
  }, [script, screen]);

  useEffect(() => {
    if (screen === 'home' || screen === 'settings' || screen === 'progress') return undefined;
    const timer = window.setInterval(() => addLearningSeconds(60), 60_000);
    return () => window.clearInterval(timer);
  }, [addLearningSeconds, screen]);

  useEffect(() => {
    if (!isCommerceEnabled() || !isNativePurchasePlatform()) return undefined;
    let active = true;
    let refreshPromise: Promise<unknown> | null = null;
    const manager = createPurchaseManager(createDefaultPurchaseGateway(), (unlocked) => {
      if (active) setStoreSubscriptionAccess(unlocked);
    });
    const stopOwnershipUpdates = manager.subscribeOwnership();
    const refreshEntitlement = () => {
      if (!active || refreshPromise) return;
      refreshPromise = manager.initialize().catch(() => {
        // Privremeni StoreKit ili mrežni prekid ne sme da zaključa aktivnu pretplatu.
      }).finally(() => { refreshPromise = null; });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshEntitlement();
    };
    refreshEntitlement();
    window.addEventListener('focus', refreshEntitlement);
    window.addEventListener('pageshow', refreshEntitlement);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      stopOwnershipUpdates();
      window.removeEventListener('focus', refreshEntitlement);
      window.removeEventListener('pageshow', refreshEntitlement);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [setStoreSubscriptionAccess]);

  const visibleLetter = (letter: Letter, requestedCase: 'upper' | 'lower' = 'upper') => {
    if (script === 'cyrillic') return requestedCase === 'upper' ? letter.upper : letter.lower;
    const latin = displayLetter(letter, script);
    return requestedCase === 'upper' ? latin : latin.toLocaleLowerCase('sr-Latn');
  };

  const openLesson = (letter: Letter) => {
    setSelected(letter);
    navigate('lesson');
    void speak(`${letter.upper} kao ${letter.words[0].word}`, sound);
  };

  const finishTrace = () => {
    learnLetter(selected.upper);
    setCelebrate(true);
    setTraceMessage(`Bravo! Naučio si slovo ${visibleLetter(selected, letterCase)}!`);
    void speak('Bravo! Naučio si novo slovo!', sound);
    window.setTimeout(() => setCelebrate(false), 1800);
  };

  const body = useMemo(() => {
    if (screen === 'home') {
      const completed = profile.completedLearningPaths;
      const adventureProgress = getAdventureProgress(completed);
      const nextLevel = adventureWorlds.flatMap((world) => world.levels).find((level) => !completed.includes(level.id));
      const nextWorld = nextLevel && adventureWorlds.find((world) => world.levels.some((level) => level.id === nextLevel.id));

      return (
        <div className="game-home">
          <Header title={`Zdravo, ${profile.name}!`} />
          <main className="game-home-content">
            <section className="game-home-hero">
              <div className="game-home-copy">
                <span className="eyebrow">SLOVOLOV · TVOJ SVET ZA IGRU I UČENJE</span>
                <h2>Svaka reč<br />je nova avantura!</h2>
                <p>Uči, istražuj i skupljaj zvezdice sa Sovicom.</p>
                <button className="game-home-primary" onClick={() => nextLevel ? openAdventureLevel(nextLevel) : navigate('adventure')}>
                  {nextLevel ? 'Nastavi avanturu' : 'Istraži avanturu'} <span className="inline-arrow"><ArrowIcon /></span>
                </button>
              </div>
              <div className="game-home-mascot" aria-label="Sovica, tvoj vodič kroz Slovolov" role="img">
                <span className="mascot-sparkle sparkle-one">✦</span>
                <span className="mascot-sparkle sparkle-two">✧</span>
                <img className="mascot-owl" src={OWL_MASCOT_SRC} alt="" />
                <span className="mascot-speech">Hajde da se igramo!</span>
              </div>
              <div className="game-home-cloud cloud-one" aria-hidden="true" />
              <div className="game-home-cloud cloud-two" aria-hidden="true" />
            </section>

            <section className="game-home-discovery" aria-label="Uči, čitaj i maštaj" data-testid="home-learning-grid">
              <div className="game-home-section-heading"><div><small>SOVICA JE SPREMILA</small><h2>Šta ćemo danas?</h2></div></div>
              <div className="game-discovery-grid">
                {(['learn', 'write', 'reading', 'numbers', 'daily', 'adaptive', 'fairy-tales', 'creative'] as const).map((screen) => {
                  const item = menus.find((entry) => entry.screen === screen)!;
                  const description = screen === 'learn'
                    ? 'Upoznaj 30 slova i njihove glasove'
                    : screen === 'write'
                      ? 'Piši velika i mala slova prstom'
                    : screen === 'daily'
                      ? 'Tri zadatka za danas'
                    : screen === 'adaptive'
                      ? 'Tri pitanja baš za tebe'
                    : screen === 'numbers'
                    ? `${numberLessons.length} brojeva · slušaj i broji`
                    : screen === 'reading'
                      ? `${readingStories.length} kratkih priča · slogovi i reči`
                      : screen === 'fairy-tales'
                        ? `${fairyTales.filter((story) => story.age === fairyTaleAges[0]).length} naslova · 2 uzrasta`
                        : 'Izmisli junaka i svoju priču';
                  const accessible = canAccessFeature(screen, familyUnlocked);
                  return (
                    <button
                      key={screen}
                      className={`game-discovery-card discovery-${screen} ${accessible ? '' : 'content-locked'}`}
                      onClick={() => navigate(screen)}
                      aria-label={accessible ? `${item.title}. ${description}` : `${item.title} · Premium zaključano`}
                    >
                      <span className="discovery-icon" aria-hidden="true">{item.icon}</span>
                      <span className="discovery-copy"><strong>{item.title}</strong><small>{accessible ? description : '🔒 Premium sadržaj'}</small></span>
                      <span className="discovery-arrow" aria-hidden="true"><ArrowIcon /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="game-home-progress" aria-label="Tvoj napredak u avanturi">
              <div className="game-home-progress-heading">
                <span className="game-home-progress-icon">🗺️</span>
                <div><small>TVOJ VELIKI PUT</small><strong>{adventureProgress.completed} od {adventureProgress.total} nivoa</strong></div>
                <b>{adventureProgress.percent}%</b>
              </div>
              <div className="game-home-progress-track"><span style={{ width: `${adventureProgress.percent}%` }} /></div>
              <p>{nextWorld ? `Sledeće: ${nextWorld.title} · ${nextLevel?.title}` : 'Svaka čast! Istražio/la si ceo Slovolov svet.'}</p>
            </section>

            <section className="game-home-worlds">
              <div className="game-home-section-heading"><div><small>IZABERI GDE ĆEMO DANAS</small><h2>Slovolov svet</h2></div><button onClick={() => navigate('adventure')}>Cela mapa <span className="inline-arrow"><ArrowIcon /></span></button></div>
              <div className="game-world-strip">
                {adventureWorlds.map((world, index) => {
                  const worldDone = world.levels.filter((level) => completed.includes(level.id)).length;
                  const firstOpenLevel = world.levels.find((level) => !completed.includes(level.id));
                  return (
                    <button className={`game-world-card world-card-${index + 1}`} key={world.id} onClick={() => navigate('adventure')} style={{ '--world-color': world.color } as React.CSSProperties}>
                      <span className="game-world-card-art" aria-hidden="true">{['🌳', '📚', '🌼', '⛰️', '🎨', '🌌'][index]}</span>
                      <span className="game-world-card-copy"><small>OBLAST {index + 1} · {worldDone}/6</small><strong>{world.title}</strong><em>{firstOpenLevel?.title ?? 'Svi nivoi završeni'} <span className="inline-arrow"><ArrowIcon /></span></em></span>
                      <span className="game-world-card-dots" aria-hidden="true">{world.levels.map((level) => <i key={level.id} className={completed.includes(level.id) ? 'done' : ''} />)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="game-home-activities">
              <div className="game-home-section-heading"><div><small>JOŠ NAČINA ZA IGRU</small><h2>Mala igrališta</h2></div><button onClick={() => navigate('games')}>Igre <span className="inline-arrow"><ArrowIcon /></span></button></div>
              <div className="game-activity-strip">
                {menus.filter((item) => ['coloring', 'quiz', 'progress'].includes(item.screen)).map((item) => {
                  const accessible = canAccessFeature(item.screen, familyUnlocked);
                  return (
                    <button key={item.screen} className={`game-activity-card menu-${item.screen} ${accessible ? '' : 'content-locked'}`} onClick={() => navigate(item.screen)} aria-label={accessible ? item.title : `${item.title} · Premium zaključano`}>
                      <span className="menu-icon">{item.icon}</span><strong>{item.title}</strong><small>{accessible ? item.subtitle : '🔒 Premium sadržaj'}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>
          <button className="settings-fab" onClick={() => navigate('settings')} aria-label="Podešavanja">⚙️</button>
        </div>
      );
    }

    if (screen === 'learn') return (
      <>
        <Header title="Azbuka" onBack={() => navigate('home')} />
        <main className="letter-grid" aria-label="Srpska azbuka">
          {letters.map((letter, index) => {
            const accessible = canAccessLetter(index, familyUnlocked);
            return (
            <button
              key={letter.upper}
              className={`letter-button ${accessible ? '' : 'content-locked'}`}
              style={{ '--letter-color': letter.color } as React.CSSProperties}
              onClick={() => accessible ? openLesson(letter) : navigate('settings')}
              aria-label={`${visibleLetter(letter)} ${visibleLetter(letter, 'lower')}${accessible ? '' : ' zaključano'}`}
            >
              <strong>{visibleLetter(letter)}</strong>
              <small>{visibleLetter(letter, 'lower')}</small>
              {profile.learnedLetters.includes(letter.upper) && <span>★</span>}
              {!accessible && <span aria-hidden="true">🔒</span>}
            </button>
          )})}
        </main>
      </>
    );

    if (screen === 'lesson') return (
      <div className="single-screen">
        <Header title={`Slovo ${visibleLetter(selected)} ${visibleLetter(selected, 'lower')}`} onBack={() => navigate('learn')} />
        <main className="lesson">
          <button className="giant-letter" onClick={() => void speak(selected.upper, sound)}>
            {displayLetter(selected, script)} <small>{script === 'cyrillic' ? selected.lower : displayLetter(selected, script).toLowerCase()}</small>
          </button>
          <section className="picture-challenge" aria-live="polite">
            <div className="picture-game-scene">
              <div className="picture-game-title-card">
                <small>SLIKOVNI LOV</small>
                <h2>Pronađi sliku za reč {script === 'cyrillic' ? selected.words[0].word : transliterate(selected.words[0].word)}</h2>
                <p>Koji crtež počinje ovim slovom?</p>
              </div>
              {(() => {
                const animation = getLetterAnimation(selected.upper);
                return (
                  <div className={`letter-lesson-animation motion-${animation.motion}`} aria-label={animation.label} data-testid="letter-animation">
                    <WordIllustration word={selected.words[0]} />
                  </div>
                );
              })()}
              <img className="picture-game-owl" src={OWL_MASCOT_SRC} alt="" aria-hidden="true" />
              <button className="picture-game-listen" aria-label={`Poslušaj reč ${selected.words[0].word}`} onClick={() => void speak(`${selected.upper} kao ${selected.words[0].word}`, sound)}>
                <span aria-hidden="true">🔊</span><small>Poslušaj</small>
              </button>
            </div>
            <p className="picture-options-label">Izaberi jednu sličicu</p>
            <div className="picture-options">
              {seededChoices(selected.words, letters.indexOf(selected))
                .map((word) => (
                  <button
                    className="picture-choice-card"
                    key={word.word}
                    aria-label={`Odaberi sliku: ${word.word}`}
                    onClick={() => {
                      if (word.word !== selected.words[0].word) {
                        recordSkillAttempt(`letter:${selected.upper}`, false);
                        setTraceMessage('Pokušaj ponovo. Pažljivo pogledaj sličice.');
                        void speak('Pokušaj ponovo.', sound);
                        return;
                      }
                      recordSkillAttempt(`letter:${selected.upper}`, true);
                      learnLetter(selected.upper);
                      setCelebrate(true);
                      void speak('Bravo! Dobio si zvezdicu. Idemo na sledeće slovo!', sound);
                      const nextIndex = (letters.indexOf(selected) + 1) % letters.length;
                      if (canAccessLetter(nextIndex, familyUnlocked)) {
                        setTraceMessage(`Bravo! Naučio si ${visibleLetter(selected)}. Sledeće slovo je ${visibleLetter(letters[nextIndex])}.`);
                        setSelected(letters[nextIndex]);
                      } else {
                        setTraceMessage(`Bravo! Završio si svih ${letters.indexOf(selected) + 1} besplatnih slova.`);
                      }
                      window.setTimeout(() => setCelebrate(false), 1400);
                    }}
                  >
                    <WordIllustration word={word} />
                    <strong>{script === 'cyrillic' ? word.word : transliterate(word.word)}</strong>
                  </button>
                ))}
            </div>
            {celebrate && <div className="reward-pop" role="status">⭐ Bravo! Sledeće slovo!</div>}
          </section>
          <div className="lesson-actions">
            <button className="primary" onClick={() => void speak(`${selected.upper} kao ${selected.words[0].word}`, sound)}>🔊 Slušaj ponovo</button>
            <button className="secondary" onClick={() => navigate('write')}>✍️ Piši slovo</button>
          </div>
        </main>
      </div>
    );

    if (screen === 'write') return (
      <div className="single-screen" data-testid="practice-screen">
        <Header title={`Pišemo ${visibleLetter(selected, letterCase)}`} onBack={() => navigate('home')} />
        <main className="practice">
          <div className="case-switch" aria-label="Izbor veličine slova">
            <button className={letterCase === 'upper' ? 'active' : ''} aria-pressed={letterCase === 'upper'} onClick={() => { setLetterCase('upper'); setTraceMessage(`Prati veliko slovo ${visibleLetter(selected, 'upper')} od vrha do dna.`); }}>Veliko slovo</button>
            <button className={letterCase === 'lower' ? 'active' : ''} aria-pressed={letterCase === 'lower'} onClick={() => { setLetterCase('lower'); setTraceMessage(`Prati malo slovo ${visibleLetter(selected, 'lower')} od vrha do dna.`); }}>Malo slovo</button>
          </div>
          <div className="practice-letters">
            {letters.map((letter, index) => (
              <button
                key={letter.upper}
                className={`${letter === selected ? 'active' : ''} ${canAccessLetter(index, familyUnlocked) ? '' : 'content-locked'}`}
                onClick={() => canAccessLetter(index, familyUnlocked) ? setSelected(letter) : navigate('settings')}
              >
                {displayLetter(letter, script)}
                {!canAccessLetter(index, familyUnlocked) && <small aria-hidden="true">🔒</small>}
              </button>
            ))}
          </div>
          <p className="instruction" role="status">{traceMessage}</p>
          <TracePad
            key={`${selected.upper}-${letterCase}-${script}`}
            letter={visibleLetter(selected, letterCase)}
            letterCase={letterCase}
            script={script}
            difficulty={profile.difficulty}
            onAttempt={(success) => {
              recordSkillAttempt(`writing:${selected.upper}:${letterCase}`, success);
              if (!success) setTraceMessage('Još malo! Prati celo slovo od vrha do dna i pokušaj ponovo.');
            }}
            onComplete={finishTrace}
          />
          {celebrate && <div className="celebrate" role="status">🎉 ⭐ {traceMessage} ⭐ 🎉</div>}
        </main>
      </div>
    );

    if (screen === 'coloring') return (
      <div className="single-screen">
        <Header title="Bojanka" onBack={() => navigate('home')} />
        <main className="coloring">
          <div className="coloring-object-nav" aria-label="Izbor predmeta za bojenje">
            <button className="secondary" aria-label="Prethodni predmet" onClick={() => {
              const next = (coloringIndex - 1 + coloringPages.length) % coloringPages.length;
              if (canAccessLetter(next, familyUnlocked)) setColoringIndex(next);
              else navigate('settings');
            }}>←</button>
            <strong>Predmet {coloringIndex + 1} od {coloringPages.length}</strong>
            <button className="secondary" aria-label="Sledeći predmet" onClick={() => {
              const next = (coloringIndex + 1) % coloringPages.length;
              if (canAccessLetter(next, familyUnlocked)) setColoringIndex(next);
              else navigate('settings');
            }}>→</button>
          </div>
          <ColoringPad
            key={`coloring-${coloringPages[coloringIndex].id}`}
            letter=""
            objectName={script === 'latin' ? transliterate(coloringPages[coloringIndex].word) : coloringPages[coloringIndex].word}
            requireDrawing
            storageKey={`object-detail-v3-${coloringPages[coloringIndex].id}`}
            illustration={coloringPages[coloringIndex].emoji}
            illustrationImage={coloringIndex === 0
              ? '/images/coloring/airplane-coloring-v1.png'
              : coloringIndex === 1
                ? '/images/coloring/balloon-coloring-v1.svg'
              : coloringIndex === 6
                ? '/images/coloring/ekser-coloring-v1.svg'
              : coloringIndex === 11
                ? '/images/coloring/whale-coloring-v1.svg'
              : coloringIndex === 22
                ? '/images/coloring/rug-coloring-v1.svg'
              : coloringIndex === 25
                ? '/images/coloring/bread-coloring-v1.svg'
              : coloringSpriteSheets[Math.floor(coloringIndex / 6)]}
            templateIndex={coloringIndex === 0 || coloringIndex === 1 || coloringIndex === 6 || coloringIndex === 11 || coloringIndex === 22 || coloringIndex === 25 ? 0 : coloringIndex % 6}
            templateColumns={coloringIndex === 0 || coloringIndex === 1 || coloringIndex === 6 || coloringIndex === 11 || coloringIndex === 22 || coloringIndex === 25 ? 1 : 3}
            templateRows={coloringIndex === 0 || coloringIndex === 1 || coloringIndex === 6 || coloringIndex === 11 || coloringIndex === 22 || coloringIndex === 25 ? 1 : 2}
            templateCropInsetLeft={coloringIndex === 23 ? 0.28 : undefined}
            templateCropInsetRight={coloringIndex === 10 ? 0.12 : undefined}
            onSaved={() => {
              void speak(`Bravo! Obojao si ${coloringPages[coloringIndex].word.toLocaleLowerCase('sr-RS')}. Reč je ${coloringPages[coloringIndex].word}.`, sound);
            }}
          />
          <p className="coloring-feedback">Dodirni zatvoren deo slike da ga popuniš bojom ili prevuci prstom da crtaš.</p>
        </main>
      </div>
    );

    if (screen === 'adventure') return <AdventureMap onBack={() => navigate('home')} onOpen={openAdventureLevel} onPlayTrail={(trail) => { setActiveTrail(trail); navigate('trail'); }} />;
    if (screen === 'trail' && activeTrail) return <TrailGame trail={activeTrail} onBack={() => navigate('adventure')} onComplete={() => { setActiveTrail(null); navigate('adventure'); }} sound={sound} script={script} />;
    if (screen === 'voice') return <VoiceQuest level={activeAdventureLevel} onBack={() => navigate('adventure')} onComplete={finishAdventureLevel} sound={sound} />;
    if (screen === 'family-missions') return <FamilyMissions level={activeAdventureLevel} onBack={() => navigate('adventure')} onComplete={finishAdventureLevel} />;
    if (screen === 'logic') return <LogicLab level={activeAdventureLevel} onBack={() => navigate('adventure')} onComplete={finishAdventureLevel} sound={sound} />;
    if (screen === 'culture') return <CultureExplorer level={activeAdventureLevel} onBack={() => navigate('adventure')} onComplete={finishAdventureLevel} script={script} />;
    if (screen === 'adaptive') return <AdaptiveLesson onBack={() => navigate('home')} sound={sound} />;
    if (screen === 'daily') return <DailyChallenge onBack={() => navigate('home')} sound={sound} />;
    if (screen === 'games') return <GameHub onBack={() => navigate('home')} sound={sound} />;

    if (screen === 'quiz') return <Quiz onBack={() => navigate('home')} sound={sound} />;
    if (screen === 'numbers') return <Numbers onBack={() => navigate('home')} onFamily={() => navigate('settings')} sound={sound} />;
    if (screen === 'reading') return <Reading onBack={() => activeAdventureLevel ? navigate('adventure') : navigate('home')} sound={sound} onLevelComplete={activeAdventureLevel ? finishAdventureLevel : undefined} adventureDifficulty={activeAdventureLevel?.difficulty} />;
    if (screen === 'fairy-tales') return <FairyTales onBack={() => navigate('home')} onFamily={() => navigate('settings')} sound={sound} />;
    if (screen === 'creative') return <CreativeStudio onBack={() => activeAdventureLevel ? navigate('adventure') : navigate('home')} sound={sound} onLevelComplete={activeAdventureLevel ? finishAdventureLevel : undefined} adventureDifficulty={activeAdventureLevel?.difficulty} />;
    if (screen === 'progress') return <Progress onBack={() => navigate('home')} sound={sound} />;
    return <Settings onBack={() => navigate('home')} />;
  }, [activeAdventureLevel, celebrate, coloringIndex, familyUnlocked, finishAdventureLevel, letterCase, navigate, openAdventureLevel, profile, recordSkillAttempt, screen, script, selected, sound, traceMessage]);

  const appClasses = [
    'app',
    'game-world',
    darkMode ? 'dark' : '',
    accessibility.reducedMotion ? 'reduced-motion' : '',
    accessibility.highContrast ? 'high-contrast' : '',
    accessibility.largeText ? 'large-ui-text' : '',
    accessibility.dyslexiaFriendly ? 'dyslexia-friendly' : ''
  ].filter(Boolean).join(' ');

  return <div ref={appRef} className={appClasses} data-script={script}>{body}</div>;
}

function AdventureMap({
  onBack,
  onOpen,
  onPlayTrail
}: {
  onBack: () => void;
  onOpen: (level: AdventureLevel) => void;
  onPlayTrail: (trail: Trail) => void;
}) {
  const completed = useProgressStore((state) => state.profile.completedLearningPaths);
  const completedGames = useProgressStore((state) => state.profile.completedGames);
  const progress = getAdventureProgress(completed);
  const levels = adventureWorlds.flatMap((world) => world.levels);
  const nextLevel = levels.find((level) => !completed.includes(level.id));
  const levelPositions = [
    { x: '16%', y: '37%' }, { x: '50%', y: '31%' }, { x: '84%', y: '37%' },
    { x: '84%', y: '75%' }, { x: '50%', y: '81%' }, { x: '16%', y: '75%' }
  ];
  const regionArt = ['🌳', '📚', '🌼', '⛰️', '🎨', '🌌'];
  const regionY = ['0%', '20%', '40%', '60%', '80%', '100%'];
  return (
    <div className="adventure-screen">
      <Header title="Moja avantura" onBack={onBack} />
      <main className="adventure-map">
        <section className="map-journey-banner">
          <div className="map-journey-copy">
            <small>VELIKA SLOVOLOV AVANTURA</small>
            <h2>Hajde, staza te zove!</h2>
            <p>{progress.completed} od {progress.total} nivoa · {progress.percent}% istraženo</p>
            {nextLevel && <button onClick={() => onOpen(nextLevel)}>Nastavi: {nextLevel.title} <span className="inline-arrow"><ArrowIcon /></span></button>}
          </div>
          <div className="map-journey-ring" style={{ '--progress': `${progress.percent * 3.6}deg` } as React.CSSProperties}><strong>{progress.percent}%</strong></div>
          <img className="map-banner-mascot" src={OWL_MASCOT_SRC} alt="" aria-hidden="true" />
        </section>
        <div className="map-key" aria-label="Oznake nivoa">
          <span><i className="key-open">●</i> Tvoj sledeći nivo</span>
          <span><i className="key-done">✓</i> Završeno</span>
          <span><i className="key-locked">🔒</i> Još malo pa stižeš</span>
        </div>
        <div className="adventure-worlds new-adventure-map">
          {adventureWorlds.map((world, worldIndex) => {
            const worldDone = world.levels.filter((level) => completed.includes(level.id)).length;
            return (
              <section
                className={`adventure-world map-region map-region-${world.id}`}
                key={world.id}
                style={{ '--world-color': world.color, '--map-position': regionY[worldIndex] } as React.CSSProperties}
              >
                <div className="map-region-backdrop" style={{ backgroundPosition: `center ${regionY[worldIndex]}` }} aria-hidden="true" />
                <div className="map-region-shade" aria-hidden="true" />
                <header className="map-region-heading">
                  <span className="map-region-icon" aria-hidden="true">{regionArt[worldIndex]}</span>
                  <div><small>OBLAST {worldIndex + 1} <i>·</i> {worldDone}/6 ZVEZDICA</small><h3>{world.title}</h3><p>{world.description}</p></div>
                  <span className="map-region-trophy" aria-hidden="true">{worldDone === 6 ? '🏆' : '✨'}</span>
                </header>
                <svg className="map-region-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M16 37 C25 20 39 25 50 31 S75 51 84 37 C93 54 76 70 84 75 S62 91 50 81 S26 61 16 75" />
                </svg>
                <div className="map-region-levels">
                  {world.levels.map((level, levelIndex) => {
                    const done = completed.includes(level.id);
                    const unlocked = done || isAdventureLevelUnlocked(level, completed);
                    const current = unlocked && !done && level.id === nextLevel?.id;
                    const position = levelPositions[levelIndex];
                    return (
                      <button
                        key={level.id}
                        className={`map-level-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
                        style={{ '--node-x': position.x, '--node-y': position.y } as React.CSSProperties}
                        disabled={!unlocked}
                        onClick={() => onOpen(level)}
                        aria-label={`Nivo ${level.order}: ${level.title}${done ? ', završeno' : current ? ', sledeći nivo' : unlocked ? '' : ', zaključano'}`}
                      >
                        <span className="map-node-face">{done ? '✓' : current ? '🦉' : unlocked ? level.icon : '🔒'}</span>
                        <strong>{level.order}</strong>
                        <small>{level.title}</small>
                        {current && <i className="map-node-sparkle" aria-hidden="true">✦</i>}
                      </button>
                    );
                  })}
                </div>
                <div className="map-region-footer"><span>⭐ {worldDone} / 6</span><span>{worldDone === 6 ? 'Oblast završena!' : 'Pronađi sledeći trag'}</span></div>
              </section>
            );
          })}
        </div>
        <section className="map-bonus-trails">
          <div><small>IGRA ZA PREDah</small><h2>Bonus staze</h2><p>Sakupi simbole i otkrij šta se krije na kraju!</p></div>
          <div className="map-bonus-grid">
            {trails.map((trail, index) => {
              const unlocked = isTrailUnlocked(index, completedGames);
              const done = completedGames.includes(trail.id);
              return <button key={trail.id} disabled={!unlocked} className={`map-bonus-node ${done ? 'done' : ''}`} onClick={() => onPlayTrail(trail)} aria-label={`${trail.title}${done ? ', završeno' : unlocked ? '' : ', zaključano'}`}>
                <span>{unlocked ? trail.scene : '🔒'}</span><strong>{trail.title}</strong><small>{done ? 'Završeno ✓' : trail.subtitle}</small>
              </button>;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function TrailGame({
  trail,
  onBack,
  onComplete,
  sound,
  script
}: {
  trail: Trail;
  onBack: () => void;
  onComplete: () => void;
  sound: boolean;
  script: 'cyrillic' | 'latin';
}) {
  const visibleToken = (token: string) => script === 'latin' ? transliterate(token) : token;
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState(`Pronađi ${visibleToken(trail.targets[0])} i dodirni ga.`);
  const [finished, setFinished] = useState(false);
  const [collectingToken, setCollectingToken] = useState<string | null>(null);
  const [incorrectToken, setIncorrectToken] = useState<string | null>(null);
  const collectTimer = useRef<number | undefined>(undefined);
  const choices = finished ? [] : trailChoices(trail, step);
  const completeGame = useProgressStore((state) => state.completeGame);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const learnNumber = useProgressStore((state) => state.learnNumber);
  const target = trail.targets[step];

  useEffect(() => () => window.clearTimeout(collectTimer.current), []);

  const selectToken = (token: string) => {
    if (finished || collectingToken) return;
    if (token !== target) {
      setIncorrectToken(token);
      setMessage('Još jednom! Pronađi simbol koji Sovica traži.');
      void speak('Pokušaj ponovo.', sound);
      return;
    }
    setIncorrectToken(null);
    setCollectingToken(token);
    collectTimer.current = window.setTimeout(() => {
      setCollectingToken(null);
      const asNumber = Number(token);
      if (Number.isInteger(asNumber) && token.trim() !== '') learnNumber(asNumber);
      else learnLetter(token);
      if (step === trail.targets.length - 1) {
        completeGame(trail.id);
        setStep(trail.targets.length);
        setFinished(true);
        setMessage('Bravo! Stigao si do cilja i osvojio dve zvezdice.');
        void speak('Bravo! Stigao si do cilja!', sound);
        return;
      }
      const nextStep = step + 1;
      setStep(nextStep);
      setMessage(`Bravo! Sada pronađi ${visibleToken(trail.targets[nextStep])}.`);
      void speak('Bravo! Nastavi stazom.', sound);
    }, 520);
  };

  return <div className={`trail-game trail-game-${trail.id.replace('trail-', '')}`} data-testid="trail-game">
    <Header title={trail.title} onBack={onBack} />
    <main className="trail-play-area">
      <section className="trail-game-card">
        <div className="trail-scenery" aria-hidden="true">
          <span className="trail-landmark">{trail.scene}</span>
          <i>⭐</i><i>✨</i>
          <span className="trail-cloud trail-cloud-one">☁️</span>
          <span className="trail-cloud trail-cloud-two">☁️</span>
          <img className="trail-owl" src={OWL_MASCOT_SRC} alt="" />
        </div>
        <small>STAZA {finished ? trail.targets.length : step + 1}/{trail.targets.length}</small>
        <div className="trail-task-prompt">
          <h2>{finished ? 'Stigao si do cilja!' : `Sakupi: ${visibleToken(target)}`}</h2>
          {!finished && <button className="trail-repeat" onClick={() => void speak(visibleToken(target), sound)} aria-label={`Poslušaj slovo ${visibleToken(target)}`}>🔊</button>}
        </div>
        <div className="trail-route" aria-label={`Putanja kroz ${trail.title}`}>
          <span className="trail-route-line" />
          {trail.targets.map((item, index) => <i key={`${item}-${index}`} className={index < step ? 'passed' : index === step ? 'current' : ''}>{index < step ? '✓' : visibleToken(item)}</i>)}
          <b style={{ left: `${Math.min(92, 8 + step * 42)}%` }}><img src={OWL_MASCOT_SRC} alt="" /></b>
        </div>
        <div className="trail-progress" aria-label={`Napredak ${step} od ${trail.targets.length}`}><span style={{ width: `${(step / trail.targets.length) * 100}%` }} /></div>
        {!finished ? <div className="trail-tokens" aria-label="Simboli na stazi">
          {choices.map((token) => <button key={token} disabled={Boolean(collectingToken)} className={`${collectingToken === token ? 'collecting' : ''} ${incorrectToken === token ? 'incorrect' : ''}`} onClick={() => selectToken(token)} aria-label={`Sakupi ${visibleToken(token)}`}>{visibleToken(token)}</button>)}
        </div> : <button className="primary trail-finish" onClick={onComplete}>Nastavi na mapu 🗺️</button>}
        <p className={collectingToken ? 'trail-message cheering' : 'trail-message'} role="status">{collectingToken ? 'Sovica nosi simbol na stazu! ✨' : message}</p>
      </section>
    </main>
  </div>;
}

function VoiceQuest({
  level,
  onBack,
  onComplete,
  sound
}: {
  level: AdventureLevel | null;
  onBack: () => void;
  onComplete: () => void;
  sound: boolean;
}) {
  const difficulty = level?.difficulty ?? 1;
  const tasks = [
    { kind: 'input', label: 'Упиши слово', target: 'А', hint: 'А' },
    { kind: 'input', label: 'Упиши реч', target: 'АВИОН', hint: 'АВИОН' },
    { kind: 'tiles', label: 'Сложи кратку реченицу', target: 'СОВА ЛЕТИ', tiles: ['ЛЕТИ', 'СОВА'] },
    { kind: 'input', label: 'Упиши тежу реч', target: 'ЉУЉАШКА', hint: 'ЉУЉАШКА' },
    { kind: 'tiles', label: 'Сложи дужу реченицу', target: 'МАЛА СОВА ЛЕТИ ИЗНАД ШУМЕ', tiles: ['ШУМЕ', 'СОВА', 'ИЗНАД', 'МАЛА', 'ЛЕТИ'] },
    {
      kind: 'sentences',
      label: 'Сложи малу причу',
      target: 'МАЛА СОВА ЈЕ НАШЛА ЗВЕЗДУ|ОНА ЈЕ ПОНЕЛА ЗВЕЗДУ ДО БРДА|ЗАЈЕДНО СУ ЈЕ ВРАТИЛЕ НА НЕБО',
      tiles: ['ОНА ЈЕ ПОНЕЛА ЗВЕЗДУ ДО БРДА', 'ЗАЈЕДНО СУ ЈЕ ВРАТИЛЕ НА НЕБО', 'МАЛА СОВА ЈЕ НАШЛА ЗВЕЗДУ']
    }
  ] as const;
  const task = tasks[Math.min(tasks.length - 1, difficulty - 1)];
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('Послушај Совицу и реши задатак.');
  const normalized = (value: string) => transliterate(value).toLocaleUpperCase('sr').replace(/[.!?]/g, '').replace(/\s+/g, ' ').trim();
  const assembled = selected.join(task.kind === 'sentences' ? '|' : ' ');
  const correct = task.kind === 'input'
    ? normalized(answer) === normalized(task.target)
    : normalized(assembled.replace(/\|/g, '|')) === normalized(task.target.replace(/\|/g, '|'));

  useEffect(() => {
    void speakRecordedPrompt(task.label, adventureLiteracyAudio(difficulty), sound);
  }, [difficulty, sound, task.label]);

  const check = () => {
    if (!correct) {
      setMessage('Покушај поново. Погледај редослед и пажљиво напиши.');
      return;
    }
    setMessage('Браво! Тачно си написао и освојио звездицу. ⭐');
    void speak('Bravo! Tačan odgovor!', sound);
  };

  return (
    <div className="single-screen">
      <Header title="Piši sa Sovicom" onBack={onBack} />
      <main className="voice-quest">
        <section className="owl-coach">
          <img src={OWL_MASCOT_SRC} alt="" aria-hidden="true" />
          <div><small>NIVO {level?.order ?? 1}</small><h2>{level?.title ?? 'Vežba pisanja'}</h2><p>Sovica čita zadatak, a ti pišeš ili slažeš reči.</p></div>
        </section>
        <button
          className="secondary narrator-replay"
          onClick={() => void speakRecordedPrompt(task.label, adventureLiteracyAudio(difficulty), sound)}
        >
          🔊 Poslušaj Sovicu
        </button>
        <div className="voice-phrase"><small>{task.label}</small><strong>{task.kind === 'input' ? task.hint : selected.join(' ') || 'ДОДИРНИ РЕЧИ'}</strong></div>
        {task.kind === 'input' ? (
          <input
            className="literacy-input"
            aria-label={task.label}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
          />
        ) : (
          <div className="literacy-tiles">
            {task.tiles.map((tile) => (
              <button key={tile} disabled={selected.includes(tile)} onClick={() => setSelected((current) => [...current, tile])}>{tile}</button>
            ))}
            {selected.length > 0 && <button onClick={() => setSelected([])}>Почни поново</button>}
          </div>
        )}
        <p role="status" aria-live="off">{message}</p>
        <button className="secondary" onClick={check}>Провери</button>
        {correct && message.startsWith('Браво') && <button className="primary" onClick={onComplete}>Настави авантуру ⭐</button>}
      </main>
    </div>
  );
}

function FamilyMissions({
  level,
  onBack,
  onComplete
}: {
  level: AdventureLevel | null;
  onBack: () => void;
  onComplete: () => void;
}) {
  const desiredDifficulty = Math.min(3, Math.max(1, Math.ceil((level?.difficulty ?? 1) / 2))) as 1 | 2 | 3;
  const missions = familyMissions.filter((mission) => mission.difficulty === desiredDifficulty);
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = missions[missionIndex % missions.length];
  return (
    <div className="single-screen">
      <Header title="Porodična misija" onBack={onBack} />
      <main className="family-mission">
        <section className="mission-card">
          <span className="mission-icon">{mission.icon}</span>
          <small>BEZ EKRANA · TEŽINA {mission.difficulty}/3</small>
          <h2>{mission.title}</h2>
          <p className="child-prompt">{mission.childPrompt}</p>
          <aside><strong>Za roditelja</strong><p>{mission.parentPrompt}</p></aside>
        </section>
        <div className="mission-actions">
          <button className="secondary" onClick={() => setMissionIndex((value) => value + 1)}>Druga misija</button>
          <button className="primary" onClick={onComplete}>Uradili smo zajedno ⭐</button>
        </div>
        <p className="safe-note">Telefon sada može da se spusti. Kada završite, vratite se i potvrdite zajedno.</p>
      </main>
    </div>
  );
}

function LogicLab({
  level,
  onBack,
  onComplete,
  sound
}: {
  level: AdventureLevel | null;
  onBack: () => void;
  onComplete: () => void;
  sound: boolean;
}) {
  const requestedLevel = Math.min(logicChallenges.length, Math.max(1, level?.difficulty ?? 1));
  const challenge = logicChallenges[requestedLevel - 1];
  const [message, setMessage] = useState('Pogledaj, razmisli i izaberi odgovor.');
  const [solved, setSolved] = useState(false);
  return (
    <div className="single-screen">
      <Header title="Svet brojeva i logike" onBack={onBack} />
      <main className="logic-lab">
        <section className="logic-card">
          <div className="logic-level"><span>{challenge.icon}</span><small>NIVO {challenge.level}/8</small></div>
          <h2>{challenge.prompt}</h2>
          <div className="logic-visual" aria-label={challenge.prompt}>{challenge.visual}</div>
          <div className="logic-answers">
            {challenge.answers.map((answer) => <button key={answer} disabled={solved} onClick={() => {
              if (answer !== challenge.correct) {
                setMessage('Pokušaj ponovo. Razmisli korak po korak.');
                return;
              }
              setSolved(true);
              setMessage(`Tačno! ${challenge.explanation} ⭐`);
              void speak('Bravo! Tačan odgovor.', sound);
            }}>{answer}</button>)}
          </div>
          <p role="status">{message}</p>
        </section>
        {solved && <button className="primary" onClick={onComplete}>Nastavi avanturu</button>}
      </main>
    </div>
  );
}

function CultureExplorer({
  level,
  onBack,
  onComplete,
  script
}: {
  level: AdventureLevel | null;
  onBack: () => void;
  onComplete: () => void;
  script: 'cyrillic' | 'latin';
}) {
  const desiredLevel = Math.min(3, Math.max(1, Math.ceil((level?.difficulty ?? 1) / 2))) as 1 | 2 | 3;
  const cards = cultureCards.filter((card) => card.level <= desiredLevel);
  const [index, setIndex] = useState(0);
  const card = cards[index % cards.length];
  return (
    <div className="single-screen">
      <Header title="Srpski kod kuće" onBack={onBack} />
      <main className="culture-explorer">
        <section className="culture-card">
          <span>{card.icon}</span>
          <small>{card.category.toLocaleUpperCase('sr')}</small>
          <h2>{script === 'cyrillic' ? card.titleCyrillic : card.titleLatin}</h2>
          <p>{script === 'cyrillic' ? card.fact : transliterate(card.fact)}</p>
          <aside><strong>Razgovarajte zajedno</strong><p>{script === 'cyrillic' ? card.familyPrompt : transliterate(card.familyPrompt)}</p></aside>
        </section>
        <div className="mission-actions">
          <button className="secondary" onClick={() => setIndex((value) => value + 1)}>Sledeća kartica</button>
          <button className="primary" onClick={onComplete}>Naučili smo nešto novo ⭐</button>
        </div>
      </main>
    </div>
  );
}

function AdaptiveLesson({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const profile = useProgressStore((state) => state.profile);
  const script = useProgressStore((state) => state.script);
  const familyUnlocked = useProgressStore((state) => state.familyAccess.isUnlocked);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const completeLearningPath = useProgressStore((state) => state.completeLearningPath);
  const recommendedUpper = nextLetterToPractice(
    letters.filter((_, index) => canAccessLetter(index, familyUnlocked)).map((letter) => letter.upper),
    profile.learnedLetters,
    profile.skillStats
  );
  const recommended = letters.find((letter) => letter.upper === recommendedUpper) ?? letters[0];
  const [solved, setSolved] = useState<number[]>([]);
  const [message, setMessage] = useState('Odgovori na sva tri pitanja i osvoji 3 zvezdice.');
  const lessonId = `adaptive-${new Date().toISOString().slice(0, 10)}-${recommended.upper}`;
  const lessonSyllable = 'АЕИОУ'.includes(recommended.upper) ? `М${recommended.upper}` : `${recommended.upper}А`;
  const recommendedIndex = letters.indexOf(recommended);
  const letterChoices = seededChoices([
    recommended.upper,
    letters[(recommendedIndex + 4) % letters.length].upper,
    letters[(recommendedIndex + 11) % letters.length].upper
  ], recommendedIndex);
  const pictureChoices = seededChoices([
    recommended.words[0],
    letters[(recommendedIndex + 7) % letters.length].words[0],
    letters[(recommendedIndex + 15) % letters.length].words[0]
  ], recommendedIndex + 1);
  const show = (value: string) => script === 'latin' ? transliterate(value) : value;

  const answer = (index: number, choice: string, expected: string) => {
    if (solved.includes(index)) return;
    if (choice !== expected) {
      recordSkillAttempt(`adaptive:${recommended.upper}:${index + 1}`, false);
      setMessage(`Pitanje ${index + 1}: pokušaj ponovo, pažljivo pogledaj ili poslušaj.`);
      void speak('Pokušaj ponovo.', sound);
      return;
    }
    recordSkillAttempt(`adaptive:${recommended.upper}:${index + 1}`, true);
    const nextSolved = [...solved, index];
    setSolved(nextSolved);
    if (nextSolved.length === 3) {
      completeLearningPath(lessonId);
      setMessage('Bravo! Pametna lekcija je završena. Osvojio si 3 zvezdice! ⭐');
      void speak('Bravo! Završio si svoju lekciju!', sound);
    } else {
      setMessage(`Odlično! Tačno ${nextSolved.length} od 3. Nastavi sa preostalim pitanjima.`);
    }
  };

  return (
    <div className="single-screen">
      <Header title="Moja pametna lekcija" onBack={onBack} />
      <main className="adaptive-lesson">
        <section className="adaptive-hero">
          <WordIllustration word={recommended.words[0]} />
          <div>
            <small>PREPORUKA ZA DANAS</small>
            <h2>Danas ponavljamo slovo {recommended.upper}</h2>
            <p>{profile.skillStats[`letter:${recommended.upper}`] ? 'Ovo slovo vežbamo još malo.' : 'Ovo je tvoje sledeće novo slovo.'}</p>
          </div>
        </section>
        <div className="adaptive-progress" role="progressbar" aria-label="Napredak moje lekcije" aria-valuemin={0} aria-valuemax={3} aria-valuenow={solved.length}>
          <span style={{ width: `${solved.length / 3 * 100}%` }} />
        </div>
        <div className="adaptive-steps">
          <section className={`adaptive-question ${solved.includes(0) ? 'done' : ''}`} aria-label="Pitanje 1: Koje slovo čuješ?">
            <div className="adaptive-question-heading"><span>1</span><div><small>SLUŠAJ</small><h3>Koje slovo čuješ?</h3></div><button className="adaptive-listen" aria-label="Poslušaj slovo" onClick={() => void speak(recommended.upper, sound)}>🔊</button></div>
            <div className="adaptive-answer-slot">Odgovor: <strong>{solved.includes(0) ? show(recommended.upper) : '○'}</strong></div>
            <div className="adaptive-choice-row">{letterChoices.map((choice) => <button key={choice} disabled={solved.includes(0)} onClick={() => answer(0, choice, recommended.upper)}>{show(choice)}</button>)}</div>
          </section>
          <section className={`adaptive-question ${solved.includes(1) ? 'done' : ''}`} aria-label="Pitanje 2: Pronađi sliku">
            <div className="adaptive-question-heading"><span>2</span><div><small>GLEDAJ</small><h3>Pronađi sliku: {show(recommended.words[0].word)}</h3></div></div>
            <div className="adaptive-answer-slot">Odgovor: <strong>{solved.includes(1) ? show(recommended.words[0].word) : '○'}</strong></div>
            <div className="adaptive-picture-row">{pictureChoices.map((choice) => <button key={choice.word} disabled={solved.includes(1)} aria-label={`Slika: ${show(choice.word)}`} onClick={() => answer(1, choice.word, recommended.words[0].word)}><WordIllustration word={choice} /><small>{show(choice.word)}</small></button>)}</div>
          </section>
          <section className={`adaptive-question ${solved.includes(2) ? 'done' : ''}`} aria-label="Pitanje 3: Dopuni slog">
            <div className="adaptive-question-heading"><span>3</span><div><small>SLOŽI</small><h3>Dopuni slog {show(lessonSyllable.replace(recommended.upper, '_'))}</h3></div></div>
            <div className="adaptive-answer-slot">Odgovor: <strong>{solved.includes(2) ? show(lessonSyllable) : show(lessonSyllable.replace(recommended.upper, '□'))}</strong></div>
            <div className="adaptive-choice-row">{letterChoices.map((choice) => <button key={choice} disabled={solved.includes(2)} onClick={() => answer(2, choice, recommended.upper)}>{show(choice)}</button>)}</div>
          </section>
        </div>
        <p className="adaptive-status" role="status">{message}</p>
      </main>
    </div>
  );
}

function DailyChallenge({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const daySeed = Array.from(dateKey).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const script = useProgressStore((state) => state.script);
  const displayText = (value: string) => script === 'latin' ? transliterate(value) : value;
  const rhyme = rhymeRounds[daySeed % rhymeRounds.length];
  const completeDailyChallenge = useProgressStore((state) => state.completeDailyChallenge);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const alreadyCompleted = useProgressStore((state) => state.profile.completedDailyChallenges.includes(dateKey));
  const difficulty = useProgressStore((state) => state.profile.difficulty);
  const logicStart = difficulty === 'easy' ? 0 : difficulty === 'challenge' ? 4 : 2;
  const firstLogic = logicChallenges[(daySeed + logicStart) % logicChallenges.length];
  const secondLogic = logicChallenges[(daySeed + logicStart + 3) % logicChallenges.length];
  const challenges = [firstLogic, secondLogic];
  const [completed, setCompleted] = useState<number[]>([]);
  const [message, setMessage] = useState('Reši tri mala zadatka i osvoji zvezdice.');

  const playRhymePrompt = () => void speakRecordedPrompt(rhyme.prompt, readingRhymeAudio(rhyme.id, 'prompt'), sound);
  const playLogicPrompt = (challenge: typeof firstLogic) => void speakRecordedPrompt(challenge.prompt, dailyLogicAudio(challenge.id), sound);

  useEffect(() => {
    playRhymePrompt();
  // A new daily seed changes the recorded prompt; avoid re-starting it on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhyme.id, sound]);

  const answer = (step: number, choice: string, expected: string) => {
    if (alreadyCompleted || completed.includes(step) || (step > 1 && !completed.includes(step - 1))) return;
    if (choice !== expected) {
      recordSkillAttempt(`daily:${dateKey}:${step}`, false);
      setMessage('Pokušaj ponovo — uporedi tragove pažljivo.');
      void speak('Pokušaj ponovo.', sound);
      return;
    }
    setCompleted((current) => [...current, step]);
    recordSkillAttempt(`daily:${dateKey}:${step}`, true);
    setMessage(step === 3 ? 'Sva tri odgovora su tačna! Preuzmi zvezdice.' : 'Bravo! Reši sledeći zadatak.');
    void (async () => {
      await speakAndWait(choice, sound);
      const next = step === 1 ? firstLogic : step === 2 ? secondLogic : null;
      if (next) await speakRecordedPrompt(next.prompt, dailyLogicAudio(next.id), sound);
      if (step === 3) await speak('Sva tri odgovora su tačna! Osvojio si tri zvezdice.', sound);
    })();
  };

  const currentStep = alreadyCompleted ? 3 : completed.length;
  const canAnswer = (step: number) => !alreadyCompleted && !completed.includes(step) && (step === 1 || completed.includes(step - 1));

  return (
    <div className="single-screen">
      <Header title="Današnja avantura" onBack={onBack} />
      <main className="daily-challenge">
        <section className="daily-quest-hero">
          <div className="daily-quest-scene" aria-hidden="true"><span className="daily-quest-moon">☀️</span><img className="daily-quest-owl" src={OWL_MASCOT_SRC} alt="" /><span className="daily-quest-fox">🦊</span><i>✨</i><i>⭐</i></div>
          <small>DANAŠNJA MISIJA</small>
          <h2>Tri mala koraka</h2>
          <p>Rima, logika i mozgalica — razmišljaj i otkrij tragove.</p>
          <div className="daily-quest-route" aria-label={`Korak ${currentStep} od 3`}>
            {[0, 1, 2].map((index) => <span key={index} className={index < currentStep ? 'done' : index === currentStep ? 'active' : ''}>{index < currentStep ? '✓' : index + 1}</span>)}
          </div>
          <small className="daily-difficulty">Težina: {difficulty === 'easy' ? 'lako' : difficulty === 'challenge' ? 'izazovno' : 'standardno'}</small>
        </section>
        <section className={`daily-task-card daily-rhyme-card ${completed.includes(1) || alreadyCompleted ? 'done' : ''}`} aria-label="Korak 1: Rima">
          <div className="daily-task-title"><h3>Korak 1 · 🎵 Rima</h3>{canAnswer(1) && <button className="daily-listen" aria-label="Poslušaj zadatak sa rimom" onClick={playRhymePrompt}>🔊</button>}</div>
          <p className="daily-prompt">Koja reč se rimuje sa: <strong>{displayText(rhyme.prompt)}</strong>?</p>
          {!canAnswer(1) && !completed.includes(1) && !alreadyCompleted && <p className="daily-locked">🔒 Prvo reši ovaj zadatak.</p>}
          {canAnswer(1) && <div className="daily-answer-grid">{seededChoices(rhyme.options, daySeed).map((option) => <button key={option} onClick={() => answer(1, option, rhyme.correct)}>{displayText(option)}</button>)}</div>}
          {(completed.includes(1) || alreadyCompleted) && <p className="daily-explanation">💡 {displayText(rhyme.prompt)} i {displayText(rhyme.correct)} završavaju se sličnim glasom.</p>}
        </section>
        {challenges.map((challenge, index) => {
          const step = index + 2;
          const done = alreadyCompleted || completed.includes(step);
          const unlocked = canAnswer(step);
          return <section key={challenge.id} className={`daily-task-card daily-logic-card ${done ? 'done' : ''}`} aria-label={`Korak ${step}: ${index === 0 ? 'Logika' : 'Mozgalica'}`}>
            <div className="daily-task-title"><h3>Korak {step} · {done ? '✓' : `${challenge.icon} ${index === 0 ? 'Logika' : 'Mozgalica'}`}</h3>{unlocked && <button className="daily-listen" aria-label={`Poslušaj zadatak ${step}`} onClick={() => playLogicPrompt(challenge)}>🔊</button>}</div>
            <p className="daily-prompt">{challenge.prompt}</p>
            {!unlocked && !done && <p className="daily-locked">🔒 Prvo reši prethodni zadatak.</p>}
            {unlocked && <><div className="daily-visual" aria-label={`Slikovni prikaz zadatka ${step}`}>{challenge.visual}</div><div className="daily-answer-grid">{seededChoices(challenge.answers, daySeed + step).map((option) => <button key={option} onClick={() => answer(step, option, challenge.correct)}>{option}</button>)}</div></>}
            {done && <p className="daily-explanation">💡 {challenge.explanation}</p>}
          </section>;
        })}
        <p className="daily-feedback" role="status">{alreadyCompleted ? 'Današnji izazov je već završen!' : message}</p>
        <section className="daily-reward-card" aria-label={`${currentStep} od 3 zadatka završeno; nagrada je škrinja sa zvezdicama`}>
          <img src="/images/reward-chest-v1.png" alt="Otvorena škrinja sa zvezdicama" />
          <div className="daily-reward-copy"><small>BLAGO TE ČEKA</small><strong>{currentStep === 3 || alreadyCompleted ? 'Škrinja je tvoja!' : 'Još malo do škrinje!'}</strong>
            <div className="daily-reward-preview" aria-label={`${currentStep} od 3 zadatka završeno`}>{[0, 1, 2].map((index) => <span key={index}>{index < currentStep ? '⭐' : '☆'}</span>)}</div>
          </div>
        </section>
        <button className="primary daily-reward" disabled={currentStep < 3 || alreadyCompleted} onClick={() => { completeDailyChallenge(dateKey); void speak('Bravo! Osvojio si tri zvezdice!', sound); }}>{alreadyCompleted ? '⭐ Današnji izazov je završen' : 'Preuzmi 3 zvezdice'}</button>
      </main>
    </div>
  );
}

type MemoryCard = { pair: string; face: string };
const memoryDeck: MemoryCard[] = [
  { pair: 'А', face: 'А' },
  { pair: 'Б', face: '🎈' },
  { pair: 'М', face: 'М' },
  { pair: 'А', face: '✈️' },
  { pair: 'Б', face: 'Б' },
  { pair: 'М', face: '🐻' }
];

const starterWordBuilderRounds = [
  { word: 'МАМА', image: '👩' },
  { word: 'МЕД', image: '🍯' },
  { word: 'МОРЕ', image: '🌊' },
  { word: 'СОВА', image: '🦉' },
  { word: 'ЛОПТА', image: '⚽' }
];
const starterWordSet = new Set(starterWordBuilderRounds.map(({ word }) => word));
const wordBuilderRounds = [
  ...starterWordBuilderRounds,
  ...wordReadingRounds.flatMap((round) => round.words)
    .filter(({ word }) => !starterWordSet.has(word))
];

function GameHub({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [mode, setMode] = useState<'match' | 'memory' | 'listen' | 'word' | 'balloons'>('match');
  const [gameIndex, setGameIndex] = useState(14);
  const [message, setMessage] = useState('Pronađi sličicu koja počinje ovim slovom.');
  const [answerFeedback, setAnswerFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [feedbackWord, setFeedbackWord] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [builtWord, setBuiltWord] = useState('');
  const [wordRoundIndex, setWordRoundIndex] = useState(0);
  const [wordCompleted, setWordCompleted] = useState(false);
  const [balloonScore, setBalloonScore] = useState(0);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const completeGame = useProgressStore((state) => state.completeGame);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const gameLetter = letters[gameIndex % letters.length];
  const visibleGameStep = (gameIndex % letters.length) + 1;
  const gameProgress = Math.round((visibleGameStep / letters.length) * 100);
  const wordRound = wordBuilderRounds[wordRoundIndex];
  const wordTarget = wordRound.word;
  const shuffledWord = [...wordTarget.slice(1), wordTarget[0]];

  const openMemoryCard = (index: number) => {
    if (revealed.includes(index) || matched.includes(memoryDeck[index].pair)) return;
    if (revealed.length >= 2) {
      setRevealed([index]);
      setMessage('Pronađi par.');
      return;
    }
    const next = [...revealed, index];
    setRevealed(next);
    if (next.length === 2) {
      const [first, second] = next;
      if (memoryDeck[first].pair === memoryDeck[second].pair) {
        const pair = memoryDeck[first].pair;
        const nextMatched = [...matched, pair];
        setMatched(nextMatched);
        setMessage(`Pronađen par ${pair}! ⭐`);
        void speak('Bravo! Pronađen par!', sound);
        if (nextMatched.length === 3) completeGame('memory-letters-1');
      } else {
        setMessage('Nije isti par. Pogledaj i pokušaj ponovo.');
      }
    }
  };

  return (
    <div className="single-screen">
      <Header title="Igre sa slovima" onBack={onBack} />
      <main className="game">
        <PlayBanner icon="🧩" label="MALO IGRALIŠTE" title="Igraj i istražuj" hint="Slušaj, pronađi par i složi reč." />
        <div className="game-tabs">
          <button className={mode === 'match' ? 'active' : ''} onClick={() => { setMode('match'); setAnswerFeedback('idle'); setFeedbackWord(null); setMessage('Pronađi sličicu koja počinje ovim slovom.'); }}>Slovo i slika</button>
          <button className={mode === 'memory' ? 'active' : ''} onClick={() => setMode('memory')}>Memory</button>
          <button className={mode === 'listen' ? 'active' : ''} onClick={() => { setMode('listen'); void speak(gameLetter.upper, sound); }}>Pogodi glas</button>
          <button className={mode === 'word' ? 'active' : ''} onClick={() => { setMode('word'); setBuiltWord(''); }}>Složi reč</button>
          <button className={mode === 'balloons' ? 'active' : ''} onClick={() => { setMode('balloons'); setMessage('Dodirni balon sa slovom koje tražimo.'); }}>Baloni</button>
        </div>
        {mode === 'match' && (
          <>
            <section className={`letter-match-stage feedback-${answerFeedback}`} aria-label={`Zadatak sa slovom ${gameLetter.upper}`}>
              <div className="letter-match-toolbar" role="group" aria-label="Kontrole zadatka">
                <div className="letter-match-progress-copy"><span>Slovo {visibleGameStep} od {letters.length}</span><small>{gameProgress}%</small></div>
                <button className="letter-match-listen" aria-label={`Poslušaj slovo ${gameLetter.upper}`} onClick={() => void speak(gameLetter.upper, sound)}>🔊</button>
              </div>
              <div className="letter-match-progress" role="progressbar" aria-label="Napredak kroz slova" aria-valuemin={1} aria-valuemax={letters.length} aria-valuenow={visibleGameStep}>
                <span style={{ width: `${gameProgress}%` }} />
              </div>
              <div className="letter-match-focus">
                <div className="game-letter" aria-label={`Veliko slovo ${gameLetter.upper}`}>{gameLetter.upper}</div>
              </div>
              <p className="letter-match-prompt">Pronađi sličicu koja počinje slovom <strong>{gameLetter.upper}</strong></p>
              <p className="letter-match-message" role="status" aria-live="polite">{message}</p>
            </section>
            <div className="answer-grid">
              {seededChoices([gameLetter.words[0], letters[(gameIndex + 3) % letters.length].words[0], letters[(gameIndex + 7) % letters.length].words[0]], gameIndex)
                .map((word) => (
                  <button key={word.word} className={answerFeedback === 'wrong' && feedbackWord === word.word ? 'answer-retry' : ''} onClick={() => {
                    if (word === gameLetter.words[0]) {
                      recordSkillAttempt(`letter:${gameLetter.upper}`, true);
                      learnLetter(gameLetter.upper);
                      const nextLetter = letters[(gameIndex + 1) % letters.length].upper;
                      setAnswerFeedback('correct');
                      setFeedbackWord(null);
                      setMessage(`Bravo! ${word.word} počinje slovom ${gameLetter.upper}. Sledeće je ${nextLetter}! ⭐`);
                      void speak('Bravo! Tačan odgovor!', sound);
                      setGameIndex((value) => value + 1);
                    } else {
                      recordSkillAttempt(`letter:${gameLetter.upper}`, false);
                      setAnswerFeedback('wrong');
                      setFeedbackWord(word.word);
                      setMessage('Skoro! Pogledaj sličice još jednom i probaj ponovo.');
                      void speak('Pokušaj ponovo.', sound);
                    }
                  }}>
                    <WordIllustration word={word} /><strong>{word.word}</strong>
                  </button>
                ))}
            </div>
          </>
        )}
        {mode === 'memory' && (
          <>
            <p role="status">{message}</p>
            <div className="memory-grid">
              {memoryDeck.map((card, index) => {
                const visible = revealed.includes(index) || matched.includes(card.pair);
                return (
                  <button
                    key={`${card.pair}-${index}`}
                    className={`${matched.includes(card.pair) ? 'matched' : ''} ${visible ? 'revealed' : 'card-back'}`}
                    aria-label={visible ? `Memory kartica ${index + 1}: ${card.face}` : `Otvori memory karticu ${index + 1}`}
                    onClick={() => openMemoryCard(index)}
                  >
                    {visible ? card.face : <><img src={OWL_MASCOT_SRC} alt="" aria-hidden="true" /><span aria-hidden="true">?</span></>}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {mode === 'listen' && (
          <section className="listen-game">
            <button className="sound-orb" aria-label="Poslušaj glas ponovo" onClick={() => void speak(gameLetter.upper, sound)}>🔊</button>
            <h2>Koje slovo čuješ?</h2>
            <div className="quiz-choices">
              {seededChoices([gameLetter, letters[(gameIndex + 4) % letters.length], letters[(gameIndex + 9) % letters.length]], gameIndex + 1)
                .map((letter) => (
                  <button key={letter.upper} onClick={() => {
                    const correct = letter === gameLetter;
                    recordSkillAttempt(`sound:${gameLetter.upper}`, correct);
                    if (!correct) {
                      setMessage('Poslušaj još jednom.');
                      void speak(gameLetter.upper, sound);
                      return;
                    }
                    completeGame(`sound-${gameLetter.upper}`);
                    setMessage('Odlično čuješ glasove! ⭐');
                    void speak('Bravo! Tačan odgovor!', sound);
                    setGameIndex((value) => value + 1);
                  }}>{letter.upper}</button>
                ))}
            </div>
          </section>
        )}
        {mode === 'word' && (
          <section className="word-builder" aria-label="Slagalica reči">
            <div className="word-builder-progress" role="progressbar" aria-label="Napredak u slaganju reči" aria-valuemin={1} aria-valuemax={wordBuilderRounds.length} aria-valuenow={wordRoundIndex + 1}>
              <span>Reč {wordRoundIndex + 1} od {wordBuilderRounds.length}</span>
              <div><i style={{ width: `${((wordRoundIndex + 1) / wordBuilderRounds.length) * 100}%` }} /></div>
            </div>
            <span className="word-builder-art" aria-hidden="true">{wordRound.image}</span>
            <h2>Složi reč {wordTarget}</h2>
            <div className="built-word" aria-label="Složena reč">{builtWord || Array.from({ length: wordTarget.length }, () => '_').join(' ')}</div>
            <div className="letter-tiles">
              {shuffledWord.map((letter, index) => (
                <button key={`${letter}-${index}`} aria-label={`Dodaj slovo ${letter} (${index + 1})`} disabled={wordCompleted} onClick={() => {
                  const next = `${builtWord}${letter}`;
                  setBuiltWord(next);
                  if (next.length === wordTarget.length) {
                    const correct = next === wordTarget;
                    recordSkillAttempt(`word:${wordTarget}`, correct);
                    if (correct) {
                      setWordCompleted(true);
                      completeGame(`word-builder-${wordRoundIndex + 1}`);
                      setMessage(`Bravo! Složio si reč ${wordTarget}! ⭐`);
                      void speak(wordTarget, sound);
                    } else {
                      setMessage(`Skoro! Obriši i pokušaj ponovo da složiš ${wordTarget}.`);
                    }
                  }
                }}>{letter}</button>
              ))}
            </div>
            {!wordCompleted && <button className="secondary" onClick={() => { setBuiltWord(''); setMessage('Složi slova pravim redom.'); }}>Obriši reč</button>}
            {wordCompleted && <button className="primary" onClick={() => {
              if (wordRoundIndex === wordBuilderRounds.length - 1) {
                setWordRoundIndex(0);
                setMessage('Počinje nova igra reči. Složi prvu reč!');
              } else {
                setWordRoundIndex((index) => index + 1);
                setMessage('Složi slova pravim redom.');
              }
              setBuiltWord('');
              setWordCompleted(false);
            }}>{wordRoundIndex === wordBuilderRounds.length - 1 ? 'Igraj ponovo' : 'Sledeća reč'}</button>}
            <p role="status">{message}</p>
          </section>
        )}
        {mode === 'balloons' && (
          <section className="balloon-game" aria-label="Igra sa balonima">
            <div className="balloon-game-heading">
              <span className="balloon-game-target" aria-label={`Traženo slovo ${gameLetter.upper}`}>{gameLetter.upper}</span>
              <div><h2>Pronađi slovo <strong>{gameLetter.upper}</strong></h2><p>⭐ Baloni tačno pogođeni: {balloonScore}</p></div>
              <button className="sound-orb" aria-label="Ponovi traženo slovo" onClick={() => void speak(gameLetter.upper, sound)}>🔊</button>
            </div>
            <div className="balloon-grid">
              {seededChoices([gameLetter, letters[(gameIndex + 5) % letters.length], letters[(gameIndex + 11) % letters.length]], gameIndex + 2)
                .map((letter, index) => (
                  <button
                    key={`${letter.upper}-${index}`}
                    className={`letter-balloon balloon-${index + 1}`}
                    aria-label={`Balon sa slovom ${letter.upper}`}
                    onClick={() => {
                      const correct = letter === gameLetter;
                      recordSkillAttempt(`balloon:${gameLetter.upper}`, correct);
                      if (!correct) {
                        setMessage('Skoro! Pogledaj slovo još jednom i probaj drugi balon.');
                        void speak('Pokušaj ponovo.', sound);
                        return;
                      }
                      completeGame(`balloon-${gameLetter.upper}`);
                      setBalloonScore((score) => score + 1);
                      setMessage('Bravo! Balon sa pravim slovom! 🎈');
                      void speak('Bravo! Pronašao si slovo!', sound);
                      setGameIndex((value) => value + 1);
                    }}
                  >{letter.upper}</button>
                ))}
            </div>
            <p role="status" aria-live="polite">{message}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Quiz({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [round] = useState(() => createQuizRound(Date.now()));
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Poslušaj naziv slike i izaberi početno slovo.');
  const [advancing, setAdvancing] = useState(false);
  const [promptPlaying, setPromptPlaying] = useState(false);
  const mounted = useRef(true);
  const promptGeneration = useRef(0);
  const target = round[Math.min(question, round.length - 1)];
  const targetLetter = letters[target.letterIndex];
  const prompt = `Na slici je ${target.word}. Koje je prvo slovo?`;
  const choices = seededChoices([
    targetLetter,
    letters[(target.letterIndex + 5) % 30],
    letters[(target.letterIndex + 11) % 30]
  ], question + target.letterIndex);

  const playPrompt = useCallback(async () => {
    const generation = ++promptGeneration.current;
    setPromptPlaying(true);
    await speakRecordedPromptAndWait(prompt, target.audioSource, sound);
    if (mounted.current && generation === promptGeneration.current) {
      setPromptPlaying(false);
    }
  }, [prompt, sound, target.audioSource]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      promptGeneration.current += 1;
      stopAppSpeech();
    };
  }, []);

  useEffect(() => {
    if (question < round.length) void playPrompt();
    return () => {
      promptGeneration.current += 1;
      stopAppSpeech();
    };
  }, [playPrompt, question, round.length]);

  return (
    <div className="single-screen">
      <Header title={`Kviz ${Math.min(question + 1, round.length)}/${round.length}`} onBack={onBack} />
      <main className="quiz">
        {question < round.length ? <>
          <PlayBanner icon="🏅" label={`PITANJE ${question + 1} OD ${round.length}`} title="Mali detektiv" hint="Poslušaj naziv slike i pronađi početno slovo." />
          <p>Poslušaj i pogodi početno slovo.</p>
          <div className="quiz-emoji" role="img" aria-label="Slika za kviz pitanje">
            <WordIllustration word={target} className="quiz-word-illustration" />
          </div>
          <button
            className="secondary quiz-listen"
            aria-label="Poslušaj naziv slike ponovo"
            disabled={advancing || promptPlaying}
            onClick={() => void playPrompt()}
          >
            🔊 Poslušaj ponovo
          </button>
          <div className="quiz-choices">{choices.map((letter) => <button key={letter.upper} disabled={advancing} onClick={() => {
            if (letter !== targetLetter) {
              setMessage('Pokušaj ponovo. Poslušaj naziv slike još jednom.');
              void speakRecordedPrompt(prompt, target.audioSource, sound);
              return;
            }
            setScore((value) => value + 1);
            setMessage('Bravo! Tačan odgovor.');
            setAdvancing(true);
            promptGeneration.current += 1;
            void (async () => {
              await speakAndWait('Bravo! Tačan odgovor!', sound);
              if (!mounted.current) return;
              setQuestion((value) => value + 1);
              setMessage('Poslušaj naziv slike i izaberi početno slovo.');
              setAdvancing(false);
            })();
          }}>{letter.upper}</button>)}</div>
          <p aria-live="off">{message}</p>
        </> : <div className="result"><span>{score >= 9 ? '🥇' : score >= 7 ? '🥈' : '🥉'}</span><h2>{score}/{round.length} tačnih!</h2><button className="primary" onClick={onBack}>Na početak</button></div>}
      </main>
    </div>
  );
}

function Numbers({ onBack, onFamily, sound }: { onBack: () => void; onFamily: () => void; sound: boolean }) {
  const [selectedNumber, setSelectedNumber] = useState(numberLessons[1]);
  const [mode, setMode] = useState<'learn' | 'write' | 'math'>('learn');
  const [message, setMessage] = useState('Poslušaj pitanje, prebroj sličice i izaberi odgovor.');
  const [advancing, setAdvancing] = useState(false);
  const nextNumberTimer = useRef<number | null>(null);
  const learnNumber = useProgressStore((state) => state.learnNumber);
  const learnedNumbers = useProgressStore((state) => state.profile.learnedNumbers);
  const difficulty = useProgressStore((state) => state.profile.difficulty);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const purchasedFamily = useProgressStore((state) => state.familyAccess.isUnlocked);
  const familyUnlocked = purchasedFamily || !isCommerceEnabled();
  const amount = selectedNumber.value;
  const options = amount === 0
    ? [0, 1, 2]
    : amount === 100
      ? [98, 99, 100]
      : [amount - 1, amount, amount + 1];

  useEffect(() => () => {
    if (nextNumberTimer.current !== null) window.clearTimeout(nextNumberTimer.current);
  }, []);

  useEffect(() => {
    if (mode !== 'learn' || advancing) return;
    void speakRecordedPrompt(
      'Koliko sličica vidiš?',
      '/audio/feedback/number-question.mp3',
      sound
    );
  }, [advancing, amount, mode, sound]);

  return (
    <div className="single-screen">
      <Header title="Brojevi 0–100" onBack={onBack} />
      <main className="numbers-screen">
        <PlayBanner icon="🔢" label="BROJEVNA AVANTURA" title="Hajde da brojimo!" hint="Prebroj sličice, napiši broj ili reši zadatak." />
        <div className="number-mode">
          <button className={mode === 'learn' ? 'active' : ''} onClick={() => setMode('learn')}>Uči broj</button>
          <button className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}>Piši broj</button>
          <button className={mode === 'math' ? 'active' : ''} onClick={() => { setMode('math'); setMessage('Prebroj zvezdice i izaberi rezultat.'); }}>Računanje</button>
        </div>
        {mode !== 'learn' && <div className="number-strip" aria-label="Izaberi broj">
          {numberLessons.map((number) => (
            <button
              key={number.value}
              className={`${number.value === amount ? 'active' : ''} ${canAccessNumber(number.value, familyUnlocked) ? '' : 'content-locked'}`}
              aria-label={`Broj ${number.value}`}
              onClick={() => {
                if (!canAccessNumber(number.value, familyUnlocked)) {
                  onFamily();
                  return;
                }
                setSelectedNumber(number);
                setMessage('Izbroj sličice i pronađi pravi broj.');
                void speak(number.word, sound);
              }}
            >
              {number.value}
              {!canAccessNumber(number.value, familyUnlocked) && <small aria-hidden="true">🔒</small>}
              {learnedNumbers.includes(number.value) && <small>★</small>}
            </button>
          ))}
        </div>}
        {mode === 'learn' && <section className="number-card" style={{ '--number-color': selectedNumber.color } as React.CSSProperties}>
          <div
            className={`counting-row ${amount <= 10 ? 'counting-low' : amount <= 40 ? 'counting-medium' : 'counting-high'}`}
            aria-label={`${amount} sličica`}
          >
            {amount === 0 ? <span className="empty-set">Nema nijedne</span> : Array.from({ length: amount }, (_, index) => (
              <span data-testid="counting-picture" key={index}>{selectedNumber.emoji}</span>
            ))}
          </div>
          <h2>Koliko sličica vidiš?</h2>
          <div className="number-options">
            {options.map((option) => (
              <button
                key={option}
                aria-label={`Odgovor ${option}`}
                disabled={advancing}
                onClick={() => {
                if (option !== amount) {
                  recordSkillAttempt(`number:${amount}`, false);
                  setMessage('Pokušaj ponovo. Prebroj polako.');
                  void speak('Pokušaj ponovo.', sound);
                  return;
                }
                recordSkillAttempt(`number:${amount}`, true);
                learnNumber(amount);
                setAdvancing(true);
                setMessage('Bravo! Dobio si zvezdicu. Idemo na sledeći broj! ⭐');
                void speakRecordedPrompt(
                  'Bravo! Sledeći broj!',
                  '/audio/feedback/bravo-next-number.mp3',
                  sound
                );
                nextNumberTimer.current = window.setTimeout(() => {
                  const nextValue = amount >= 100 ? 0 : amount + 1;
                  setSelectedNumber(numberLessons[nextValue]);
                  setMessage('Poslušaj pitanje, prebroj sličice i izaberi odgovor.');
                  setAdvancing(false);
                }, 4_400);
              }}
              >{option}</button>
            ))}
          </div>
          <p role="status">{message}</p>
        </section>}
        {mode === 'write' && <section className="number-writing">
          <p role="status">{message}</p>
          <TracePad
            key={`number-${amount}`}
            letter={String(amount)}
            difficulty={difficulty}
            onAttempt={(success) => {
              recordSkillAttempt(`number-writing:${amount}`, success);
              if (!success) setMessage('Prati ceo svetli broj i pokušaj ponovo.');
            }}
            onComplete={() => {
              learnNumber(amount);
              setMessage(`Bravo! Lepo si napisao broj ${amount}! ⭐`);
              void speak('Bravo! Lepo si napisao broj!', sound);
            }}
          />
        </section>}
        {mode === 'math' && <section className="math-stage">
          <div className="math-art" aria-label="Dve zvezdice i jedna zvezdica">⭐⭐ <b>+</b> ⭐</div>
          <h2>Koliko je 2 + 1?</h2>
          <div className="number-options">
            {[2, 3, 4].map((answer) => (
              <button key={answer} aria-label={String(answer)} onClick={() => {
                const correct = answer === 3;
                recordSkillAttempt('math:addition:2+1', correct);
                if (!correct) {
                  setMessage('Pokušaj ponovo. Prebroj sve zvezdice.');
                  return;
                }
                learnNumber(3);
                setMessage('Tačno! Dve i jedna su tri. ⭐');
                void speak('Tačno! Dve i jedna su tri.', sound);
              }}>{answer}</button>
            ))}
          </div>
          <p role="status">{message}</p>
        </section>}
      </main>
    </div>
  );
}

function Reading({
  onBack,
  sound,
  onLevelComplete,
  adventureDifficulty
}: {
  onBack: () => void;
  sound: boolean;
  onLevelComplete?: () => void;
  adventureDifficulty?: number;
}) {
  const [active, setActive] = useState(0);
  const [level, setLevel] = useState<'phonics' | 'syllables' | 'words' | 'story'>(
    adventureDifficulty === undefined ? 'syllables' : adventureDifficulty <= 1 ? 'syllables' : adventureDifficulty <= 2 || adventureDifficulty === 5 ? 'words' : 'story'
  );
  const [age, setAge] = useState<ReadingAge>(
    adventureDifficulty === undefined ? '6–8' : adventureDifficulty <= 3 ? '4–6' : adventureDifficulty <= 4 ? '6–8' : '8–10'
  );
  const [storyIndex, setStoryIndex] = useState(0);
  const [rhymeIndex, setRhymeIndex] = useState(0);
  const [syllableSetIndex, setSyllableSetIndex] = useState(0);
  const [wordRoundIndex, setWordRoundIndex] = useState(0);
  const [message, setMessage] = useState('Slušaj, pa pročitaj naglas.');
  const completeReading = useProgressStore((state) => state.completeReading);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const rhymeRound = rhymeRounds[rhymeIndex % rhymeRounds.length];
  const syllableSet = syllableSets[syllableSetIndex % syllableSets.length];
  const wordRound = wordReadingRounds[wordRoundIndex % wordReadingRounds.length];
  const storiesForAge = readingStories.filter((story) => story.age === age);
  const story = storiesForAge[storyIndex];
  const sentences = story.sentences;
  const selectStory = (nextIndex: number) => {
    setStoryIndex(nextIndex);
    setActive(0);
    setMessage('Slušaj, pa pročitaj naglas.');
  };
  return (
    <div className="single-screen">
      <Header title="Čitam samostalno" onBack={onBack} />
      <main className="reading">
        <PlayBanner icon="📖" label="ČAROBNA ČITAONICA" title="Reči oživele" hint="Slušaj, sastavi slogove i otkrij priču." />
        <div className="reading-levels">
          <button className={level === 'phonics' ? 'active' : ''} onClick={() => setLevel('phonics')}>Glasovi i rime</button>
          <button className={level === 'syllables' ? 'active' : ''} onClick={() => setLevel('syllables')}>Slogovi</button>
          <button className={level === 'words' ? 'active' : ''} onClick={() => setLevel('words')}>Reči</button>
          <button className={level === 'story' ? 'active' : ''} onClick={() => setLevel('story')}>Priča</button>
        </div>
        {level === 'phonics' && (
          <section className="reading-stage phonics-stage">
            <div className="story-art">👂 🎵</div>
            <h2>Koje se reči rimuju?</h2>
            <small>Rima {rhymeIndex + 1}/{rhymeRounds.length}</small>
            <button className="rhyme-prompt" onClick={() => void speakRecordedPrompt(rhymeRound.prompt, readingRhymeAudio(rhymeRound.id, 'prompt'), sound)}>{rhymeRound.prompt} 🔊</button>
            <div className="word-reading-grid">
              {rhymeRound.options.map((word) => (
                <button key={word} onClick={() => {
                  const correct = word === rhymeRound.correct;
                  recordSkillAttempt(`phonics:rhyme:${rhymeRound.prompt}`, correct);
                  if (!correct) {
                    setMessage(`Poslušaj završetak: ${rhymeRound.prompt} — ${rhymeRound.correct}.`);
                    return;
                  }
                  setMessage(`Tačno! ${rhymeRound.prompt} i ${rhymeRound.correct} se rimuju. ⭐`);
                  void speakRecordedPrompt(`${rhymeRound.prompt}, ${rhymeRound.correct}`, readingRhymeAudio(rhymeRound.id, 'result'), sound);
                }}>{word}</button>
              ))}
            </div>
            <button className="secondary" onClick={() => { setRhymeIndex((value) => (value + 1) % rhymeRounds.length); setMessage('Poslušaj novu reč i pronađi rimu.'); }}>Sledeća rima</button>
            <p role="status">{message}</p>
          </section>
        )}
        {level === 'syllables' && (
          <section className="reading-stage">
            <div className="story-art">🗣️ {syllableSet.lead} + А</div>
            <h2>Spoj glasove u slog</h2>
            <small>Grupa {syllableSetIndex + 1}/{syllableSets.length}</small>
            <div className="syllable-grid">
              {syllableSet.syllables.map((syllable) => (
                <button key={syllable} onClick={() => {
                  setMessage(`Čuješ slog ${syllable}. Ponovi ga polako.`);
                  void speakRecordedPrompt(syllable, readingSyllableAudio(syllable), sound);
                }}>{syllable} 🔊</button>
              ))}
            </div>
            <p>Dodirni svaki slog, poslušaj ga i ponovi naglas.</p>
            <button className="secondary" onClick={() => { setSyllableSetIndex((value) => (value + 1) % syllableSets.length); setMessage('Nova grupa slogova je spremna.'); }}>Sledeći slogovi</button>
            {onLevelComplete && <button className="primary" onClick={onLevelComplete}>Završio sam slogove ⭐</button>}
          </section>
        )}
        {level === 'words' && (
          <section className="reading-stage">
            <div className="story-art">{wordRound.words.map((item) => item.image).join(' ')}</div>
            <h2>Pročitaj celu reč</h2>
            <small>Grupa {wordRoundIndex + 1}/{wordReadingRounds.length}</small>
            <div className="word-reading-grid">
              {wordRound.words.map(({ word, image }) => (
                <button key={word} aria-label={`${image} ${word}`} onClick={() => {
                  setMessage(`Čuješ samo reč ${word}.`);
                  void speakRecordedPrompt(word, readingWordAudio(word), sound);
                }}><span>{image}</span><strong>{word}</strong> 🔊</button>
              ))}
            </div>
            <p>Prvo pročitaj samostalno, zatim dodirni reč za proveru.</p>
            <button className="secondary" onClick={() => { setWordRoundIndex((value) => (value + 1) % wordReadingRounds.length); setMessage('Nova grupa reči je spremna.'); }}>Sledeće reči</button>
            {onLevelComplete && <button className="primary" onClick={onLevelComplete}>Završio sam čitanje ⭐</button>}
          </section>
        )}
        {level === 'story' && (
          <section className="reading-stage">
            <div className="age-tabs">
              {storyAges.map((item) => (
                <button
                  key={item}
                  className={item === age ? 'active' : ''}
                  aria-label={`Uzrast ${item}`}
                  onClick={() => { setAge(item); selectStory(0); }}
                >{item}</button>
              ))}
            </div>
            <div className="story-navigation">
              <button aria-label="Prethodna priča" disabled={storyIndex === 0} onClick={() => selectStory(storyIndex - 1)}><ArrowIcon direction="left" /></button>
              <strong>Priča {storyIndex + 1}/{storiesForAge.length}</strong>
              <button aria-label="Sledeća priča" disabled={storyIndex === storiesForAge.length - 1} onClick={() => selectStory(storyIndex + 1)}><ArrowIcon /></button>
            </div>
            <div className="story-art">{story.art}</div>
            <h2>{story.title}</h2>
            {sentences.map((sentence, index) => (
              <button key={sentence} className={index === active ? 'sentence active' : 'sentence'} onClick={() => { setActive(index); setMessage(`Slušaš rečenicu ${index + 1}.`); void speakRecordedPrompt(sentence, readingStorySentenceAudio(story.id, index), sound); }}>
                {sentence}
              </button>
            ))}
            <p className="reading-question">{story.question}</p>
            <div className="reading-answers">
              {story.answers.map((answer) => (
                <button key={answer} onClick={() => {
                  if (answer !== story.correct) {
                    recordSkillAttempt(`reading:${story.id}`, false);
                    setMessage('Pokušaj ponovo. Pročitaj prvu rečenicu.');
                    return;
                  }
                  recordSkillAttempt(`reading:${story.id}`, true);
                  completeReading(story.id);
                  setMessage('Bravo! Razumeo si priču i osvojio zvezdicu! ⭐');
                  void speak('Bravo! Razumeo si priču.', sound);
                  onLevelComplete?.();
                }}>{answer}</button>
              ))}
            </div>
            <button className="primary" onClick={() => { setMessage(`Slušaš rečenicu ${active + 1}.`); void speakRecordedPrompt(sentences[active], readingStorySentenceAudio(story.id, active), sound); }}>🔊 Pročitaj rečenicu</button>
          </section>
        )}
        <p className="reading-feedback" role="status" aria-live="off">{message}</p>
      </main>
    </div>
  );
}

function FairyTales({ onBack, onFamily, sound }: { onBack: () => void; onFamily: () => void; sound: boolean }) {
  const [age, setAge] = useState<FairyTaleAge>('4–6');
  const [storyIndex, setStoryIndex] = useState(0);
  const stories = fairyTales.filter((story) => story.age === age);
  const story = stories[storyIndex];
  const profile = useProgressStore((state) => state.profile);
  const familyUnlocked = useProgressStore((state) => state.familyAccess.isUnlocked);
  const completeReading = useProgressStore((state) => state.completeReading);
  const setStoryBookmark = useProgressStore((state) => state.setStoryBookmark);
  const [activeSentence, setActiveSentence] = useState(profile.storyBookmarks[story.id] ?? 0);
  const [playback, setPlayback] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [largeText, setLargeText] = useState(false);
  const [showText, setShowText] = useState(false);
  const [narrationSource, setNarrationSource] = useState<'recorded' | 'unavailable' | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [message, setMessage] = useState('Izaberi rečenicu ili poslušaj celu priču.');
  const [fullContent, setFullContent] = useState<FullStoryContent | null>(null);
  const [contentState, setContentState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [contentError, setContentError] = useState('');
  const [contentRetry, setContentRetry] = useState(0);
  const [offlineState, setOfflineState] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error'>('idle');
  const [offlineProgress, setOfflineProgress] = useState<StoryDownloadProgress>({ completed: 0, total: 0 });
  const [offlineError, setOfflineError] = useState('');
  const sessionRef = useRef<NarrationSession | null>(null);
  const offlineControllerRef = useRef<AbortController | null>(null);
  const storyPages = fullContent?.pages ?? story.pages;
  const storySentences = storyPages.flat();
  const pageStarts = storyPages.map((_, pageIndex) => (
    storyPages.slice(0, pageIndex).reduce((total, page) => total + page.length, 0)
  ));
  const currentPageIndex = Math.max(0, storyPages.findIndex((page, pageIndex) => {
    const start = pageStarts[pageIndex];
    return activeSentence >= start && activeSentence < start + page.length;
  }));
  const currentPage = storyPages[currentPageIndex] ?? storyPages[0];
  const isLastPage = currentPageIndex === storyPages.length - 1;

  const openStory = (nextIndex: number, nextAge = age) => {
    sessionRef.current?.stop();
    const nextStories = fairyTales.filter((item) => item.age === nextAge);
    const nextStory = nextStories[nextIndex];
    if (!canAccessStory(nextIndex, familyUnlocked)) {
      onFamily();
      return;
    }
    setStoryIndex(nextIndex);
    setActiveSentence(profile.storyBookmarks[nextStory.id] ?? 0);
    setPlayback('idle');
    setShowText(false);
    setNarrationSource(null);
    setFullContent(null);
    setContentState('idle');
    setContentError('');
    offlineControllerRef.current?.abort();
    setOfflineState('idle');
    setOfflineProgress({ completed: 0, total: 0 });
    setOfflineError('');
    setCelebrating(false);
    setMessage('Izaberi rečenicu ili poslušaj celu priču.');
  };

  const stop = () => {
    sessionRef.current?.stop();
    setPlayback('idle');
    setMessage('Slušanje je zaustavljeno. Možeš da nastaviš od obeležene rečenice.');
  };

  const openPage = (pageIndex: number) => {
    sessionRef.current?.stop();
    const firstSentence = pageStarts[pageIndex];
    setActiveSentence(firstSentence);
    setStoryBookmark(story.id, firstSentence);
    setPlayback('idle');
    setCelebrating(false);
    setMessage(`Strana ${pageIndex + 1} je otvorena. Dodirni rečenicu ili nastavi čitanje.`);
  };

  const start = () => {
    sessionRef.current?.stop();
    if (!sound) {
      setPlayback('idle');
      setNarrationSource('unavailable');
      setMessage('Uključi zvuk u podešavanjima da bi slušao priču.');
      return;
    }
    if (story.fullContentAvailable && contentState !== 'ready') {
      setPlayback('idle');
      setNarrationSource('unavailable');
      setMessage(
        contentState === 'error'
          ? 'Cela bajka nije učitana. Pokušaj ponovo.'
          : 'Sačekaj da se cela bajka učita.'
      );
      return;
    }
    setPlayback('playing');
    setMessage('Priča se čita naglas. Aktivna rečenica je označena.');
    sessionRef.current = narrateSentences(storySentences, {
      enabled: sound,
      audioKey: fullContent
        ? (fullContent.audio.available ? fullContent.audio.key : undefined)
        : (story.recordedAudio ? story.audioKey : undefined),
      startIndex: activeSentence,
      onSentence: (index) => {
        setActiveSentence(index);
        setStoryBookmark(story.id, index);
      },
      onSource: setNarrationSource,
      onComplete: () => {
        setPlayback('idle');
        setMessage('Priča je pročitana. Odgovori na pitanje i osvoji zvezdicu!');
      }
    });
  };

  useEffect(() => () => {
    sessionRef.current?.stop();
    offlineControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    sessionRef.current?.stop();
    setPlayback('idle');
    setNarrationSource(null);
    setFullContent(null);
    setContentError('');
    if (!story.fullContentAvailable) {
      setContentState('idle');
      return undefined;
    }
    const controller = new AbortController();
    setContentState('loading');
    setMessage('Učitavam celu proverenu bajku…');
    void loadFullStoryContent(story.plotKey, controller.signal)
      .then((content) => {
        if (controller.signal.aborted) return;
        setFullContent(content);
        setContentState('ready');
        setActiveSentence(Math.min(profile.storyBookmarks[story.id] ?? 0, content.sentenceCount - 1));
        setMessage(`Cela bajka je spremna: ${content.wordCount} reči, ${content.pages.length} strana.`);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setContentState('error');
        setContentError(error instanceof Error ? error.message : 'Cela bajka nije učitana.');
        setMessage('Cela bajka trenutno nije učitana. Proveri vezu ili pokušaj ponovo.');
      });
    return () => controller.abort();
  }, [story.id, story.plotKey, story.fullContentAvailable, contentRetry]);

  useEffect(() => {
    if (!fullContent?.audio.available) {
      setOfflineState('idle');
      return undefined;
    }
    let active = true;
    setOfflineState('checking');
    void isStoryAvailableOffline(fullContent)
      .then((available) => {
        if (active) setOfflineState(available ? 'ready' : 'idle');
      })
      .catch(() => {
        if (active) setOfflineState('idle');
      });
    return () => { active = false; };
  }, [fullContent]);

  const saveStoryOffline = async () => {
    if (!fullContent || offlineState === 'downloading') return;
    offlineControllerRef.current?.abort();
    const controller = new AbortController();
    offlineControllerRef.current = controller;
    setOfflineState('downloading');
    setOfflineError('');
    try {
      await downloadStoryForOffline(
        fullContent,
        (progress) => {
          if (!controller.signal.aborted) setOfflineProgress(progress);
        },
        controller.signal
      );
      if (controller.signal.aborted) return;
      setOfflineState('ready');
      setMessage('Bajka i ceo audio su sačuvani za slušanje bez interneta.');
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      setOfflineState('error');
      setOfflineError(error instanceof Error ? error.message : 'Bajka nije sačuvana za offline rad.');
    }
  };

  return (
    <div className="single-screen fairy-screen">
      <Header title="Bajke i priče" onBack={() => { stop(); onBack(); }} />
      <main className="fairy-tales" data-testid="fairy-tale" data-story-id={story.id}>
        <div className="fairy-age-tabs">
          {fairyTaleAges.map((item) => (
            <button
              key={item}
              className={age === item ? 'active' : ''}
              onClick={() => { setAge(item); openStory(0, item); }}
            >{item} godina</button>
          ))}
        </div>
        <div className="story-navigation">
          <button aria-label="Prethodna bajka" disabled={storyIndex === 0} onClick={() => openStory(storyIndex - 1)}><ArrowIcon direction="left" /></button>
          <label className="story-picker">
            <span>Bajka {storyIndex + 1}/{stories.length}</span>
            <select
              aria-label="Izaberi bajku"
              value={storyIndex}
              onChange={(event) => openStory(Number(event.target.value))}
            >
              {stories.map((item, index) => (
                <option key={item.id} value={index}>{item.title}</option>
              ))}
            </select>
          </label>
          <button aria-label="Sledeća bajka" disabled={storyIndex === stories.length - 1} onClick={() => openStory(storyIndex + 1)}><ArrowIcon /></button>
        </div>
        <section
          className="fairy-card storybook-reader"
          data-testid="storybook-reader"
          data-reader-mode="immersive"
        >
          <div className="storybook-scene">
            <span role="img" aria-label={`Ilustracija za ${story.title}`}>{story.art}</span>
            <div className="fairy-title">
              <div><small>{story.category}</small><h2>{story.title}</h2></div>
            </div>
            <p className="storybook-source" aria-label={`Izvor bajke: ${story.source.author}`}>
              Prema slobodnom izvoru: <strong>{fullContent?.source.author ?? story.source.author}</strong>
              <span>
                {fullContent
                  ? `${fullContent.source.provider} · ${fullContent.source.license}`
                  : story.fullContentAvailable
                    ? 'Izvorno provereno srpsko izdanje se učitava'
                    : 'Originalna srpska adaptacija'}
              </span>
              {fullContent && (
                <a href={fullContent.source.url} target="_blank" rel="noreferrer">
                  Otvori tačno izvorno izdanje
                </a>
              )}
            </p>
            <span className="storybook-sparkle sparkle-one" aria-hidden="true">✦</span>
            <span className="storybook-sparkle sparkle-two" aria-hidden="true">✧</span>
          </div>
          <div className="book-page-navigation">
            <button
              aria-label="Prethodna stranica"
              disabled={currentPageIndex === 0}
              onClick={() => openPage(currentPageIndex - 1)}
            ><ArrowIcon direction="left" /></button>
            <div className="storybook-page-progress">
              <strong>Strana {currentPageIndex + 1}/{storyPages.length}</strong>
              <div
                className="storybook-progress-track"
                role="progressbar"
                aria-label="Napredak kroz bajku"
                aria-valuemin={1}
                aria-valuemax={storyPages.length}
                aria-valuenow={currentPageIndex + 1}
              >
                <span style={{ width: `${((currentPageIndex + 1) / storyPages.length) * 100}%` }} />
              </div>
            </div>
            <button
              aria-label="Sledeća stranica"
              disabled={isLastPage}
              onClick={() => openPage(currentPageIndex + 1)}
            ><ArrowIcon /></button>
          </div>
          <div className="story-mode-controls">
            <span className={`edition-badge ${story.edition}`}>
              {fullContent
                ? `Cela bajka · ${fullContent.wordCount} reči`
                : contentState === 'loading'
                  ? 'Učitavam celu bajku…'
                  : story.fullContentAvailable
                    ? 'Cela bajka · izvorno provereno izdanje'
                    : 'Dečje izdanje · uzrasno prilagođena priča'}
            </span>
            <button
              className="read-along-toggle"
              aria-label={showText ? 'Sakrij tekst' : 'Čitaj zajedno'}
              onClick={() => setShowText((value) => !value)}
            >{showText ? '🎧 Samo slušaj' : '📖 Čitaj zajedno'}</button>
          </div>
          {showText ? (
            <article
              className={`fairy-sentences storybook-page${largeText ? ' large-text' : ''}`}
              aria-label="Tekst priče"
            >
              {currentPage.map((sentence, pageSentenceIndex) => {
                const index = pageStarts[currentPageIndex] + pageSentenceIndex;
                return (
                <button
                  key={sentence}
                  className={index === activeSentence ? 'active' : ''}
                  aria-label={`Rečenica ${index + 1}: ${sentence}`}
                  onClick={() => {
                    sessionRef.current?.stop();
                    setActiveSentence(index);
                    setStoryBookmark(story.id, index);
                    setPlayback('idle');
                    void speak(sentence, sound);
                  }}
                >{sentence}</button>
                );
              })}
            </article>
          ) : (
            <div className="audio-story-stage" role="region" aria-label="Audio-bajka">
              <span aria-hidden="true">{playback === 'playing' ? '🎙️' : '🎧'}</span>
              <strong>{playback === 'playing' ? 'Slušamo priču…' : 'Spremno za slušanje'}</strong>
              <small>Poglavlje {currentPageIndex + 1} od {storyPages.length}</small>
            </div>
          )}
          {contentState === 'error' && (
            <div className="story-content-error" role="alert">
              <strong>Cela bajka nije učitana.</strong>
              <span>{contentError}</span>
              <button onClick={() => setContentRetry((value) => value + 1)}>Pokušaj ponovo</button>
            </div>
          )}
          <div className="storybook-reader-tools">
            <button
              className="text-size-toggle"
              aria-label={largeText ? 'Smanji tekst' : 'Uvećaj tekst'}
              disabled={!showText}
              onClick={() => setLargeText((value) => !value)}
            >Aa {largeText ? 'Normalno' : 'Veće'}</button>
            <p className={`narrator-source ${narrationSource ?? 'ready'}`}>
              {narrationSource === 'recorded' && '🎙️ Čita provereni snimljeni srpski narator'}
              {narrationSource === 'unavailable' && '⚠️ Glas nije dostupan na ovom uređaju'}
              {narrationSource === null && (
                fullContent?.audio.available || (!fullContent && story.recordedAudio)
                  ? '🎙️ Snimljeni srpski narator je spreman'
                  : '⚠️ Ova priča još nema provereni srpski snimak'
              )}
            </p>
          </div>
          {fullContent?.audio.available && (
            <div className={`story-offline ${offlineState}`} aria-live="polite">
              <button
                className="secondary"
                disabled={offlineState === 'checking' || offlineState === 'downloading' || offlineState === 'ready'}
                onClick={() => void saveStoryOffline()}
              >
                {offlineState === 'checking' && 'Proveravam offline paket…'}
                {offlineState === 'downloading' && `Preuzimam ${offlineProgress.completed}/${offlineProgress.total}…`}
                {offlineState === 'ready' && '✓ Dostupno bez interneta'}
                {(offlineState === 'idle' || offlineState === 'error') && '⬇ Preuzmi celu bajku za offline'}
              </button>
              {offlineState === 'downloading' && (
                <progress
                  aria-label="Preuzimanje cele audio-bajke"
                  max={Math.max(offlineProgress.total, 1)}
                  value={offlineProgress.completed}
                />
              )}
              {offlineState === 'error' && <span role="alert">{offlineError}</span>}
            </div>
          )}
          <div className="narration-controls">
            <button className="primary" aria-label="Slušaj celu priču" onClick={start}>▶ Slušaj</button>
            <button
              className="secondary"
              aria-label="Pauza"
              disabled={playback !== 'playing'}
              onClick={() => { sessionRef.current?.pause(); setPlayback('paused'); setMessage('Priča je pauzirana.'); }}
            >⏸ Pauza</button>
            <button
              className="secondary"
              aria-label="Nastavi slušanje"
              disabled={playback !== 'paused'}
              onClick={() => { sessionRef.current?.resume(); setPlayback('playing'); setMessage('Nastavljamo priču.'); }}
            >▶ Nastavi</button>
            <button className="secondary" aria-label="Zaustavi slušanje" disabled={playback === 'idle'} onClick={stop}>■ Zaustavi</button>
          </div>
          {isLastPage && <div className="fairy-question">
            <p>{story.question}</p>
            <div>
              {seededChoices(story.answers, storyIndex).map((answer) => (
                <button key={answer} onClick={() => {
                  if (answer !== story.correct) {
                    setMessage('Pokušaj ponovo. Priseti se šta je pronađeno.');
                    void speak('Pokušaj ponovo.', sound);
                    return;
                  }
                  completeReading(`fairy-${story.id}`);
                  setCelebrating(true);
                  setMessage('⭐ Bravo! Razumeo si priču i osvojio zvezdicu!');
                  void speak('Bravo! Razumeo si priču i osvojio zvezdicu!', sound);
                }}>{answer}</button>
              ))}
            </div>
          </div>}
          {celebrating && (
            <div className="storybook-celebration" role="region" aria-live="polite" aria-label="Osvojena zvezdica">
              <span aria-hidden="true">⭐</span>
              <strong>Bravo, mali čitaoče!</strong>
              <small>Završio si bajku i osvojio zvezdicu.</small>
            </div>
          )}
        </section>
        <p className="fairy-status" role="status">{message}</p>
      </main>
    </div>
  );
}

function CreativeStudio({
  onBack,
  sound,
  onLevelComplete,
  adventureDifficulty
}: {
  onBack: () => void;
  sound: boolean;
  onLevelComplete?: () => void;
  adventureDifficulty?: number;
}) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [placeIndex, setPlaceIndex] = useState(0);
  const [questIndex, setQuestIndex] = useState(0);
  const [helperIndex, setHelperIndex] = useState(0);
  const [endingIndex, setEndingIndex] = useState(0);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [storyPlayback, setStoryPlayback] = useState<'idle' | 'playing'>('idle');
  const [activeStoryParagraph, setActiveStoryParagraph] = useState(-1);
  const [narratorSource, setNarratorSource] = useState<'recorded' | 'unavailable' | null>(null);
  const [message, setMessage] = useState('Izaberi junaka i tok priče. Svaki izbor menja avanturu.');
  const storySessionRef = useRef<NarrationSession | null>(null);
  const saveCreation = useProgressStore((state) => state.saveCreation);
  const completeGame = useProgressStore((state) => state.completeGame);
  const profile = useProgressStore((state) => state.profile);
  const microphoneEnabled = useProgressStore((state) => state.microphonePracticeEnabled);
  const hero = creativeHeroes[heroIndex];
  const story = useMemo(() => buildCreativeStory({
    childName: profile.name,
    hero,
    place: creativePlaces[placeIndex],
    quest: creativeQuests[questIndex],
    helper: creativeHelpers[helperIndex],
    ending: creativeEndings[endingIndex]
  }), [endingIndex, helperIndex, hero, placeIndex, profile.name, questIndex]);
  const storySelection: CreativeSelection = {
    heroIndex,
    placeIndex,
    questIndex,
    helperIndex,
    endingIndex
  };
  const chapterLabels = ['Почетак', 'Изазов', 'Решење', 'Срећан крај'];

  const stopStory = useCallback(() => {
    storySessionRef.current?.stop();
    storySessionRef.current = null;
    setStoryPlayback('idle');
    setActiveStoryParagraph(-1);
  }, []);

  const playStory = () => {
    stopStory();
    if (!sound) {
      setNarratorSource('unavailable');
      setMessage('Uključi zvuk u podešavanjima da bi narator pročitao Moju knjigu.');
      return;
    }
    setStoryPlayback('playing');
    setNarratorSource(null);
    setMessage('Sophie, naš provereni srpski narator, čita tvoju priču.');
    storySessionRef.current = narrateSentences(story.narrationParagraphs, {
      enabled: true,
      audioSources: createCreativeNarrationSources(storySelection),
      onSentence: setActiveStoryParagraph,
      onSource: (source) => {
        setNarratorSource(source);
        if (source === 'unavailable') {
          setStoryPlayback('idle');
          setMessage('Naratorski snimak trenutno nije dostupan. Glas telefona neće biti korišćen.');
        }
      },
      onComplete: () => {
        setStoryPlayback('idle');
        setActiveStoryParagraph(-1);
        setMessage('Sophie je pročitala celu tvoju priču. ⭐');
      }
    });
  };

  useEffect(() => () => storySessionRef.current?.stop(), []);
  useEffect(() => {
    stopStory();
    setNarratorSource(null);
  }, [endingIndex, helperIndex, heroIndex, placeIndex, questIndex, stopStory]);

  return (
    <div className="single-screen">
      <Header title="Moja priča" onBack={onBack} />
      <main className="creative-studio">
        <section className="creative-preview">
          <header className="creative-cover">
            <span aria-hidden="true">{hero.emoji}</span>
            <div>
              <small>MOJA KNJIGA · PRIČA KOJU JE OSMISLILO DETE</small>
              <h2>{story.title}</h2>
              <p>Autor: {profile.name}</p>
            </div>
          </header>
          <div className="creative-story-pages" aria-label="Cela moja priča">
            {story.paragraphs.map((paragraph, index) => (
              <article key={chapterLabels[index]} className={activeStoryParagraph === index ? 'narrating' : ''}>
                <strong>{chapterLabels[index]}</strong>
                <p>{paragraph}</p>
              </article>
            ))}
          </div>
          <div className="creative-preview-actions">
            {storyPlayback === 'playing'
              ? <button className="primary" onClick={stopStory}>⏹ Zaustavi priču</button>
              : <button className="primary" onClick={playStory}>🔊 Slušaj moju priču</button>}
            <button className="secondary" onClick={() => {
              setHeroIndex((value) => (value + 1) % creativeHeroes.length);
              setPlaceIndex((value) => (value + 1) % creativePlaces.length);
              setQuestIndex((value) => (value + 1) % creativeQuests.length);
              setHelperIndex((value) => (value + 1) % creativeHelpers.length);
              setEndingIndex((value) => (value + 1) % creativeEndings.length);
              setMessage('Napravljena je nova kombinacija priče.');
            }}>🎲 Nova priča</button>
            {adventureDifficulty === undefined && <button className="secondary" onClick={() => setVoiceOpen((value) => !value)}>🎙️ Ispričaj je svojim glasom</button>}
            {(adventureDifficulty === undefined || adventureDifficulty >= 5) && <button className="secondary" onClick={() => setDrawingOpen((value) => !value)}>🎨 Nacrtaj naslovnicu</button>}
          </div>
          <p className={`creative-narrator ${narratorSource ?? 'ready'}`}>
            {narratorSource === 'recorded' && '🎙️ Čita postojeći provereni srpski narator Sophie'}
            {narratorSource === 'unavailable' && '⚠️ Snimak nije dostupan — glas telefona je i dalje isključen'}
            {narratorSource === null && '🎧 Moju knjigu čita isti narator kao ostale Slovolov priče'}
          </p>
        </section>
        {voiceOpen && <VoicePractice enabled={microphoneEnabled} phrase={story.title} />}
        {drawingOpen && (
          <section className="creative-drawing" aria-label="Ilustracija za Moju knjigu">
            <ColoringPad
              letter=""
              storageKey={`moja-knjiga-${heroIndex}-${placeIndex}-${questIndex}`}
              canvasLabel="Platno za naslovnicu Moje knjige"
              illustration={hero.emoji}
              onSaved={() => setMessage('Naslovnica je sačuvana lokalno uz tvoju Moju knjigu.')}
            />
          </section>
        )}
        <section className="creative-options">
          <fieldset>
            <legend>1. Junak</legend>
            <div>{creativeHeroes.map((item, index) => <button key={item.name} className={index === heroIndex ? 'active' : ''} onClick={() => setHeroIndex(index)}>{item.emoji} {item.name}</button>)}</div>
          </fieldset>
          {(adventureDifficulty === undefined || adventureDifficulty >= 2) && <fieldset>
            <legend>2. Mesto</legend>
            <div>{creativePlaces.map((place, index) => <button key={place.label} className={index === placeIndex ? 'active' : ''} onClick={() => setPlaceIndex(index)}>{place.emoji} {place.label}</button>)}</div>
          </fieldset>}
          {(adventureDifficulty === undefined || adventureDifficulty >= 3) && <fieldset>
            <legend>3. Pustolovina</legend>
            <div>{creativeQuests.map((quest, index) => <button key={quest.label} className={index === questIndex ? 'active' : ''} onClick={() => setQuestIndex(index)}>{quest.label}</button>)}</div>
          </fieldset>}
          {(adventureDifficulty === undefined || adventureDifficulty >= 4) && <fieldset>
            <legend>4. Pomoćnik</legend>
            <div>{creativeHelpers.map((helper, index) => <button key={helper.name} className={index === helperIndex ? 'active' : ''} onClick={() => setHelperIndex(index)}>{helper.emoji} {helper.name}</button>)}</div>
          </fieldset>}
          {(adventureDifficulty === undefined || adventureDifficulty >= 4) && <fieldset>
            <legend>5. Završetak</legend>
            <div>{creativeEndings.map((ending, index) => <button key={ending.label} className={index === endingIndex ? 'active' : ''} onClick={() => setEndingIndex(index)}>{ending.label}</button>)}</div>
          </fieldset>}
        </section>
        <button className="primary" onClick={() => {
          saveCreation(serializeCreativeBook(story.text, storySelection));
          completeGame('creative-first-story');
          setMessage('Cela priča je sačuvana samo na ovom uređaju. Osvojio si 2 zvezdice! ⭐');
          void speak('Bravo! Tvoja priča je sačuvana.', sound);
          onLevelComplete?.();
        }}>💾 Sačuvaj moju priču</button>
        <p className="creative-status" role="status">{message}</p>
      </main>
    </div>
  );
}

function SavedCreation({ saved, sound }: { saved: string; sound: boolean }) {
  const restored = useMemo(() => deserializeCreativeBook(saved), [saved]);
  const [playback, setPlayback] = useState<'idle' | 'playing'>('idle');
  const [message, setMessage] = useState('');
  const sessionRef = useRef<NarrationSession | null>(null);
  const [title, ...body] = restored.text.split('\n').filter(Boolean);

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setPlayback('idle');
  };

  useEffect(() => () => sessionRef.current?.stop(), []);

  const play = () => {
    if (!restored.selection || !sound) {
      setMessage(sound
        ? 'Ova starija priča nema sačuvane naratorske segmente.'
        : 'Uključi zvuk u podešavanjima.');
      return;
    }
    stop();
    const paragraphs = restored.text.split(/\n\s*\n/).slice(1);
    setPlayback('playing');
    setMessage('Sophie čita priču.');
    sessionRef.current = narrateSentences(paragraphs, {
      enabled: true,
      audioSources: createCreativeNarrationSources(restored.selection),
      onSource: (source) => {
        if (source === 'unavailable') {
          setPlayback('idle');
          setMessage('Snimak nije dostupan. Glas telefona neće biti korišćen.');
        }
      },
      onComplete: () => {
        setPlayback('idle');
        setMessage('Priča je pročitana.');
      }
    });
  };

  return (
    <article>
      <strong>🎭 {title}</strong>
      <small>{body.join(' ').slice(0, 130)}…</small>
      {restored.selection && (
        <button className="small-action" onClick={playback === 'playing' ? stop : play}>
          {playback === 'playing' ? '⏹ Zaustavi' : '🔊 Slušaj priču'}
        </button>
      )}
      {message && <small role="status">{message}</small>}
    </article>
  );
}

function Progress({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const profile = useProgressStore((state) => state.profile);
  const percent = Math.round(profile.learnedLetters.length / 30 * 100);
  const summary = summarizeLearning(profile.skillStats);
  const learningMinutes = Math.round(profile.learningSeconds / 60);
  const adventureProgress = getAdventureProgress(profile.completedLearningPaths);
  const stickerCollections = getStickerCollectionProgress(profile.learnedLetters);
  return (
    <>
      <Header title="Moj napredak" onBack={onBack} />
      <main className="progress">
        <div className="profile-avatar">{profile.avatar}</div><h2>{profile.name}</h2>
        <div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><span>{percent}%</span></div>
        <div className="stats"><article><b>{profile.learnedLetters.length}</b><small>Naučenih slova</small></article><article><b>{profile.learnedNumbers.length}</b><small>Naučenih brojeva</small></article><article><b>{profile.stars} ⭐</b><small>Zvezdica</small></article><article><b>{profile.streak} 🔥</b><small>Dnevni niz</small></article></div>
        <section className="adventure-progress-card">
          <div><strong>{adventureProgress.completed}/{adventureProgress.total}</strong><small>Završenih nivoa avanture</small></div>
          <div className="adventure-progress-track"><span style={{ width: `${adventureProgress.percent}%` }} /></div>
          <p>{summary.needsPractice.length
            ? 'Sledeći nivo će ponoviti veštine koje su detetu trenutno najpotrebnije.'
            : 'Spremno je za sledeći otključani nivo na mapi avanture.'}</p>
        </section>
        <section className="learning-insights">
          <h3>Moj pregled učenja</h3>
          <div>
            <article><b>{summary.accuracy}%</b><small>Tačnost</small></article>
            <article><b>{summary.practicedSkills}</b><small>Vežbane veštine</small></article>
            <article><b>{learningMinutes}</b><small>Minuta učenja</small></article>
          </div>
          <p>{summary.needsPractice.length
            ? `Sledeće ponavljamo: ${summary.needsPractice.slice(0, 3).map((skill) => skill.split(':').at(-1)).join(', ')}.`
            : 'Odlično napreduješ! Nastavi sa sledećom pametnom lekcijom.'}</p>
        </section>
        {profile.savedCreations.length > 0 && (
          <section className="saved-creations">
            <h3>Moje priče</h3>
            {profile.savedCreations.slice(-3).reverse().map((creation) => (
              <SavedCreation key={creation} saved={creation} sound={sound} />
            ))}
          </section>
        )}
        <h3>Medalje</h3><div className="medals">{['🥉', '🥈', '🥇'].map((medal, index) => <span key={medal} className={profile.medals.length > index ? '' : 'locked'}>{medal}</span>)}</div>
        <section className="sticker-collections" aria-label="Kolekcije nalepnica">
          <h3>Kolekcije nalepnica</h3>
          {stickerCollections.map((collection) => (
            <article className="sticker-collection" key={collection.id}>
              <div className="sticker-collection-heading"><span>{collection.emoji}</span><strong>{collection.name}</strong><small>{collection.earnedCount}/{collection.total} nalepnica</small></div>
              <div className="sticker-collection-items">
                {collection.stickers.map((letter) => {
                  const earned = profile.learnedLetters.includes(letter.upper);
                  return <span key={letter.upper} className={earned ? 'sticker-earned' : 'sticker-locked'} aria-label={`${letter.words[0].word}${earned ? ' osvojena' : ' zaključana'} nalepnica`}>{earned ? letter.words[0].emoji : '🔒'}</span>;
                })}
              </div>
              <small>{collection.unlocked ? 'Kolekcija je kompletna! 🎉' : 'Nauči još slova da pronađeš sve nalepnice.'}</small>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

function Settings({ onBack }: { onBack: () => void }) {
  const store = useProgressStore();
  const commerceEnabled = isCommerceEnabled();
  const iosPremium = isIosPremiumEnabled();
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [gateAnswer, setGateAnswer] = useState('');
  const [gateError, setGateError] = useState('');
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState('');
  const [purchaseOffer, setPurchaseOffer] = useState<PurchaseOffer>({
    available: false,
    owned: store.familyAccess.isUnlocked
  });
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const purchaseManager = useMemo(
    () => createPurchaseManager(createDefaultPurchaseGateway(), store.setStoreSubscriptionAccess),
    [store.setStoreSubscriptionAccess]
  );
  const parentHelp = {
    sr: 'Dečji sadržaj ostaje na srpskom jeziku. Ovde roditelj podešava pristupačnost i nivo težine.',
    en: 'Children’s lessons stay in Serbian. Parents can adjust accessibility and difficulty here.',
    de: 'Kinderinhalte bleiben auf Serbisch. Eltern können hier Barrierefreiheit und Schwierigkeit einstellen.',
    fr: 'Les leçons des enfants restent en serbe. Les parents règlent ici l’accessibilité et la difficulté.'
  }[store.parentLanguage];

  useEffect(() => {
    if (!parentUnlocked || !commerceEnabled) return undefined;
    let active = true;
    setPurchaseBusy(true);
    purchaseManager.initialize()
      .then((offer) => {
        if (!active) return;
        setPurchaseOffer(offer);
        if (offer.reason) setPurchaseMessage(offer.reason);
      })
      .catch((error: unknown) => {
        if (active) setPurchaseMessage(error instanceof Error ? error.message : 'Prodavnica trenutno nije dostupna.');
      })
      .finally(() => {
        if (active) setPurchaseBusy(false);
      });
    return () => { active = false; };
  }, [commerceEnabled, parentUnlocked, purchaseManager]);

  const buyFamily = async () => {
    setPurchaseBusy(true);
    setPurchaseMessage('Otvaram bezbednu kupovinu u prodavnici…');
    try {
      const result = await purchaseManager.purchase();
      if (result.state === 'verified') {
        setPurchaseMessage('Slovolov Premium je aktivan na ovom uređaju.');
      } else if (result.state === 'pending') {
        setPurchaseMessage('Kupovina čeka potvrdu prodavnice. Sadržaj još nije otključan.');
      } else if (result.state === 'cancelled') {
        setPurchaseMessage('Kupovina je otkazana. Ništa nije naplaćeno.');
      } else {
        setPurchaseMessage(result.message ?? 'Kupovina trenutno nije dostupna.');
      }
    } catch (error) {
      setPurchaseMessage(error instanceof Error ? error.message : 'Kupovina nije uspela.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const restoreFamily = async () => {
    setPurchaseBusy(true);
    setPurchaseMessage('Proveravam raniju kupovinu…');
    try {
      const result = await purchaseManager.restore();
      setPurchaseMessage(result.owned
        ? 'Aktivna Slovolov Premium pretplata je pronađena.'
        : result.message ?? 'Aktivna pretplata nije pronađena na ovom nalogu.');
    } catch (error) {
      setPurchaseMessage(error instanceof Error ? error.message : 'Vraćanje kupovine nije uspelo.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const saveNewProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const avatar = ['🐉', '🦉', '🐝'][store.profiles.length % 3];
    if (!store.addProfile(newName, avatar)) {
      setNameError('Upišite ime deteta.');
      return;
    }
    setNewName('');
    setNameError('');
    setAddingProfile(false);
  };

  const saveEditedName = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProfileId || !store.renameProfile(editingProfileId, editedName)) {
      setNameError('Upišite novo ime deteta.');
      return;
    }
    setEditedName('');
    setNameError('');
    setEditingProfileId(null);
  };

  if (!parentUnlocked) {
    return (
      <div className="single-screen">
        <Header title="Roditeljski deo" onBack={onBack} />
        <main className="parent-gate">
          <section className="parent-gate-card">
            <span className="parent-gate-icon" aria-hidden="true">🔐</span>
            <div className="parent-gate-copy">
              <h2>Provera za roditelje</h2>
              <p>Ovaj deo menja profile, mikrofon i način učenja.</p>
            </div>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (gateAnswer.trim() !== '7') {
                setGateError('Odgovor nije tačan. Pokušajte ponovo.');
                return;
              }
              setGateError('');
              setParentUnlocked(true);
            }}>
              <label htmlFor="parent-gate-answer">Koliko je 4 + 3?</label>
              <input id="parent-gate-answer" inputMode="numeric" value={gateAnswer} onChange={(event) => setGateAnswer(event.target.value)} />
              <button className="primary" type="submit">Otvori roditeljski deo</button>
            </form>
            {gateError && <p className="form-error" role="alert">{gateError}</p>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <>
      <Header title="Podešavanja za roditelje" onBack={onBack} />
      <main className="settings">
        <section className={`family-section ${store.familyAccess.isUnlocked || !commerceEnabled ? 'unlocked' : ''}`}>
          <div className="premium-world-art" aria-hidden="true">
            <div className="premium-world-sun" />
            <span className="premium-world-star premium-star-one">✦</span>
            <span className="premium-world-star premium-star-two">✧</span>
            <span className="premium-world-cloud premium-cloud-one">☁</span>
            <span className="premium-world-cloud premium-cloud-two">☁</span>
            <div className="premium-world-island"><span>🌳</span><span>📚</span><span>🌼</span></div>
            <img className="premium-world-owl" src={OWL_MASCOT_SRC} alt="" />
            <span className="premium-world-ribbon">PORODIČNA AVANTURA</span>
          </div>
          <div className="family-heading">
            <span aria-hidden="true">{store.familyAccess.isUnlocked || !commerceEnabled ? '✨' : '👨‍👩‍👧‍👦'}</span>
            <div>
              <h2>Slovolov Premium</h2>
              <p>
                {store.familyAccess.isUnlocked
                  ? 'Pretplata je aktivna'
                  : !commerceEnabled
                    ? 'Prvih 7 slova, brojevi 0–10 i prve 3 priče su besplatni.'
                     : iosPremium
                       ? `${purchaseOffer.price ?? '3,99 €'} mesečno${purchaseOffer.trialDays ? ` · prvih ${purchaseOffer.trialDays} dana besplatno` : ''}`
                       : purchaseOffer.price ?? 'Cena u Google Play prodavnici'}
              </p>
            </div>
          </div>
          {!store.familyAccess.isUnlocked && commerceEnabled && (
            <div className="family-trust-row" aria-label="Prednosti porodičnog paketa">
              {iosPremium && purchaseOffer.trialDays && <span>✓ {purchaseOffer.trialDays} dana besplatno</span>}
              {!iosPremium && <span>✓ Jednokratna kupovina</span>}
              <span>✓ Bez reklama</span>
              <span>{iosPremium ? '✓ Otkazivanje u Apple nalogu' : '✓ Google Play kupovina'}</span>
            </div>
          )}
          <ul className="premium-benefits">
            <li><span aria-hidden="true">🔤</span><span><strong>Cela azbuka</strong><small>Svih 30 slova i brojevi 0–100</small></span></li>
            <li><span aria-hidden="true">🧩</span><span><strong>Igre i učenje</strong><small>Čitanje, igre i celokupna biblioteka priča</small></span></li>
            <li><span aria-hidden="true">👨‍👩‍👧</span><span><strong>Za celu porodicu</strong><small>Više dečjih profila na istom uređaju</small></span></li>
          </ul>
          {commerceEnabled && !store.familyAccess.isUnlocked && (
            <div className="family-actions">
              <button className="primary" disabled={!purchaseOffer.available || purchaseBusy} onClick={() => void buyFamily()}>
                 {purchaseBusy ? 'Proveravam…' : iosPremium && purchaseOffer.trialDays ? `Pokreni ${purchaseOffer.trialDays} dana besplatno` : iosPremium ? 'Pretplati se' : 'Kupi Premium'}
              </button>
              <button className="secondary" disabled={!purchaseOffer.available || purchaseBusy} onClick={() => void restoreFamily()}>
                Vrati kupovinu
              </button>
            </div>
          )}
          {(store.familyAccess.isUnlocked || !commerceEnabled) && <strong className="family-owned">✓ Premium sadržaj je dostupan svim profilima.</strong>}
          {commerceEnabled && !isNativePurchasePlatform() && !purchaseMessage && (
            <p className="purchase-message">Slovolov Premium je dostupan samo u instaliranoj iOS aplikaciji.</p>
          )}
          {purchaseMessage && <p className="purchase-message" role="status">{purchaseMessage}</p>}
           <small>{iosPremium ? 'Kupovinu potvrđuje roditelj. Mesečna pretplata se automatski obnavlja dok se ne otkaže u Apple ID podešavanjima → Pretplate.' : 'Kupovinu potvrđuje roditelj. Google Play porodična kupovina je jednokratna.'}{' '}<a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer">Uslovi korišćenja</a>{' · '}<a href="/privacy.html" target="_blank" rel="noreferrer">Politika privatnosti</a></small>
        </section>
        <label><span>🔊 Zvuk</span><input type="checkbox" checked={store.soundEnabled} onChange={store.toggleSound} /></label>
        <label><span>🌙 Tamni režim</span><input type="checkbox" checked={store.darkMode} onChange={store.toggleTheme} /></label>
        <button className="setting-button" onClick={store.toggleScript}><span>🔤 Pismo</span><strong>{store.script === 'cyrillic' ? 'Ćirilica' : 'Latinica'}</strong></button>
        <section className="accessibility-section">
          <h2>Pristupačnost</h2>
          <label><span>🔎 Veći tekst</span><input type="checkbox" checked={store.accessibility.largeText} onChange={(event) => store.setAccessibility({ ...store.accessibility, largeText: event.target.checked })} /></label>
          <label><span>◐ Jači kontrast</span><input type="checkbox" checked={store.accessibility.highContrast} onChange={(event) => store.setAccessibility({ ...store.accessibility, highContrast: event.target.checked })} /></label>
          <label><span>🧘 Manje animacija</span><input type="checkbox" checked={store.accessibility.reducedMotion} onChange={(event) => store.setAccessibility({ ...store.accessibility, reducedMotion: event.target.checked })} /></label>
          <label><span>📖 Lakše čitljiv font</span><input type="checkbox" checked={store.accessibility.dyslexiaFriendly} onChange={(event) => store.setAccessibility({ ...store.accessibility, dyslexiaFriendly: event.target.checked })} /></label>
        </section>
        <section className="privacy-section">
          <h2>Privatna vežba govora</h2>
          <p>Mikrofon se koristi samo za lokalno snimanje i preslušavanje. Snimak se ne šalje niti trajno čuva.</p>
          <label><span>🎙️ Dozvoli lokalnu vežbu glasa</span><input type="checkbox" checked={store.microphonePracticeEnabled} onChange={(event) => store.setMicrophonePracticeEnabled(event.target.checked)} /></label>
        </section>
        <section className="parent-language-section">
          <h2>Jezik pomoći roditelju</h2>
          <select aria-label="Jezik pomoći roditelju" value={store.parentLanguage} onChange={(event) => store.setParentLanguage(event.target.value as typeof store.parentLanguage)}>
            <option value="sr">Srpski</option>
            <option value="en">Engleski</option>
            <option value="de">Nemački</option>
            <option value="fr">Francuski</option>
          </select>
          <p>{parentHelp}</p>
        </section>
        <section className="difficulty-section">
          <h2>Težina zadataka</h2>
          <p>Prilagodite proveru pisanja i izazove uzrastu deteta.</p>
          <div className="difficulty-options">
            {([
              ['easy', 'Lako'],
              ['standard', 'Standardno'],
              ['challenge', 'Izazovno']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={store.profile.difficulty === value ? 'active' : ''}
                onClick={() => store.setDifficulty(value)}
              >{label}</button>
            ))}
          </div>
        </section>
        <section className="profiles-section">
          <h2>Profili dece</h2>
          {store.profiles.map((profile) => (
            <div key={profile.id} className={`profile-row ${store.activeProfileId === profile.id ? 'active' : ''}`}>
              <button className="profile-select" onClick={() => store.setActiveProfile(profile.id)} aria-label={`Izaberi profil ${profile.name}`}>
                <span>{profile.avatar}</span><strong>{profile.name}</strong>
                {store.activeProfileId === profile.id && <small>Aktivan</small>}
              </button>
              <button
                className="profile-edit"
                aria-label={`Promeni ime za ${profile.name}`}
                onClick={() => {
                  setEditingProfileId(profile.id);
                  setEditedName(profile.name);
                  setAddingProfile(false);
                  setNameError('');
                }}
              >
                ✏️
              </button>
              {editingProfileId === profile.id && (
                <form className="profile-form" onSubmit={saveEditedName}>
                  <label htmlFor={`profile-name-${profile.id}`}>Novo ime deteta</label>
                  <input
                    id={`profile-name-${profile.id}`}
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                    maxLength={32}
                    autoFocus
                  />
                  <div>
                    <button type="button" className="secondary" onClick={() => setEditingProfileId(null)}>Odustani</button>
                    <button type="submit" className="primary">Sačuvaj ime</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </section>
        {!addingProfile && (!commerceEnabled || store.familyAccess.isUnlocked) && (
          <button
            className="secondary"
            onClick={() => {
              setAddingProfile(true);
              setEditingProfileId(null);
              setNameError('');
            }}
          >
            + Dodaj profil
          </button>
        )}
        {commerceEnabled && !store.familyAccess.isUnlocked && (
          <p className="parent-note">Slovolov Premium omogućava više profila dece na istom uređaju.</p>
        )}
        {addingProfile && (
          <form className="profile-form new-profile-form" onSubmit={saveNewProfile}>
            <label htmlFor="new-profile-name">Ime deteta</label>
            <input
              id="new-profile-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Na primer: Лука"
              maxLength={32}
              autoFocus
            />
            <div>
              <button type="button" className="secondary" onClick={() => setAddingProfile(false)}>Odustani</button>
              <button type="submit" className="primary">Sačuvaj profil</button>
            </div>
          </form>
        )}
        {nameError && <p className="form-error" role="alert">{nameError}</p>}
        <p className="parent-note">
          Aplikacija nema reklame, naloge ni praćenje. Napredak ostaje samo na uređaju.
          {' '}<a href="/privacy.html" target="_blank" rel="noreferrer">Politika privatnosti</a>
        </p>
      </main>
    </>
  );
}
