import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TracePad } from './components/TracePad';
import { ColoringPad } from './components/ColoringPad';
import { VoicePractice } from './components/VoicePractice';
import { isCommerceEnabled } from './config/commerce';
import { fairyTaleAges, fairyTales, type FairyTaleAge } from './data/fairyTales';
import { numberLessons } from './data/numbers';
import { readingStories, storyAges, type ReadingAge } from './data/stories';
import { rhymeRounds, syllableSets, wordReadingRounds } from './data/readingLessons';
import { familyMissions } from './data/familyMissions';
import { logicChallenges } from './data/logicChallenges';
import { cultureCards } from './data/serbianCulture';
import { seededChoices } from './domain/choices';
import { canAccessLetter, canAccessNumber, canAccessStory } from './domain/access';
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
import { isTrailUnlocked, trails, type Trail } from './domain/trailGame';
import { advancePlatformer, createPlatformerLevel, createPlatformerState } from './domain/platformer';
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

function Back({ onClick }: { onClick: () => void }) {
  return <button className="back" onClick={onClick} aria-label="Nazad">←</button>;
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

export function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<Letter>(letters[0]);
  const [activeAdventureLevel, setActiveAdventureLevel] = useState<AdventureLevel | null>(null);
  const [activeTrail, setActiveTrail] = useState<Trail | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [letterCase, setLetterCase] = useState<'upper' | 'lower'>('upper');
  const [traceMessage, setTraceMessage] = useState('Prati celo svetlo slovo prstom.');
  const [coloringMessage, setColoringMessage] = useState('');
  const sound = useProgressStore((state) => state.soundEnabled);
  const darkMode = useProgressStore((state) => state.darkMode);
  const script = useProgressStore((state) => state.script);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const addLearningSeconds = useProgressStore((state) => state.addLearningSeconds);
  const profile = useProgressStore((state) => state.profile);
  const accessibility = useProgressStore((state) => state.accessibility);
  const purchasedFamily = useProgressStore((state) => state.familyAccess.isUnlocked);
  const familyUnlocked = !isCommerceEnabled() || purchasedFamily;
  const navigate = useCallback((nextScreen: Screen) => {
    stopAppSpeech();
    setScreen(nextScreen);
  }, []);
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
    if (screen === 'home') return (
      <>
        <Header title={`Zdravo, ${profile.name}!`} />
        <section className="hero">
          <div><span className="eyebrow">DANAS UČIMO KROZ IGRU</span><h2>Pronađi svoje<br />novo slovo!</h2></div>
          <div className="hero-art" aria-hidden="true">🐉<span>А</span></div>
        </section>
        <main className="menu-grid">
          {menus.map((item) => (
            <button key={item.screen} className={`menu-card menu-${item.screen}`} onClick={() => navigate(item.screen)}>
              <span className="menu-icon">{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
              <b>›</b>
            </button>
          ))}
        </main>
        <button className="settings-fab" onClick={() => navigate('settings')} aria-label="Podešavanja">⚙️</button>
      </>
    );

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
            <h2>Pronađi sliku za reč {script === 'cyrillic' ? selected.words[0].word : transliterate(selected.words[0].word)}</h2>
            <div className="picture-options">
              {seededChoices(selected.words, letters.indexOf(selected))
                .map((word) => (
                  <button
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
        <Header title={`Pišemo ${displayLetter(selected, script)}`} onBack={() => navigate('home')} />
        <main className="practice">
          <div className="case-switch" aria-label="Izbor veličine slova">
            <button className={letterCase === 'upper' ? 'active' : ''} onClick={() => { setLetterCase('upper'); setTraceMessage('Prati celo svetlo slovo prstom.'); }}>Veliko slovo</button>
            <button className={letterCase === 'lower' ? 'active' : ''} onClick={() => { setLetterCase('lower'); setTraceMessage('Prati celo svetlo slovo prstom.'); }}>Malo slovo</button>
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
        <Header title={`Bojanka ${displayLetter(selected, script)}`} onBack={() => navigate('home')} />
        <main className="coloring">
          <div className="practice-letters">
            {letters.map((letter, index) => (
              <button
                key={letter.upper}
                className={`${letter === selected ? 'active' : ''} ${canAccessLetter(index, familyUnlocked) ? '' : 'content-locked'}`}
                onClick={() => {
                  if (!canAccessLetter(index, familyUnlocked)) {
                    navigate('settings');
                    return;
                  }
                  setSelected(letter);
                  setColoringMessage('');
                }}
              >
                {displayLetter(letter, script)}
                {!canAccessLetter(index, familyUnlocked) && <small aria-hidden="true">🔒</small>}
              </button>
            ))}
          </div>
          <ColoringPad
            key={`coloring-${selected.upper}-${script}`}
            letter={displayLetter(selected, script)}
            illustration={selected.words[0].emoji}
            illustrationImage={selected.words[0].image}
            onSaved={() => {
              const saved = selected;
              const nextIndex = (letters.indexOf(saved) + 1) % letters.length;
              const next = letters[nextIndex];
              if (canAccessLetter(nextIndex, familyUnlocked)) {
                setColoringMessage(`Crtež za ${displayLetter(saved, script)} je sačuvan. Sledeće slovo je ${displayLetter(next, script)}.`);
                setSelected(next);
              } else {
                setColoringMessage(`Crtež za ${displayLetter(saved, script)} je sačuvan. Završio si besplatni deo bojanke.`);
              }
            }}
          />
          <p className="coloring-feedback" role="status">{coloringMessage}</p>
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
  }, [activeAdventureLevel, celebrate, coloringMessage, familyUnlocked, finishAdventureLevel, letterCase, navigate, openAdventureLevel, profile, recordSkillAttempt, screen, script, selected, sound, traceMessage]);

  const appClasses = [
    'app',
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
  return (
    <div className="adventure-screen">
      <Header title="Moja avantura" onBack={onBack} />
      <main className="adventure-map">
        <section className="adventure-summary">
          <div>
            <small>VELIKA SLOVOLOV AVANTURA</small>
            <h2>{progress.completed}/{progress.total} nivoa</h2>
            <p>Svaki sledeći nivo donosi malo teži zadatak.</p>
          </div>
          <div className="adventure-ring" style={{ '--progress': `${progress.percent * 3.6}deg` } as React.CSSProperties}>
            <strong>{progress.percent}%</strong>
          </div>
        </section>
        <section className="trail-picker" aria-labelledby="trail-picker-title">
          <div className="trail-picker-heading">
            <div><small>IGRA SKUPLJANJA</small><h2 id="trail-picker-title">Mapa avanture</h2><p>Vodi Sovicu kroz staze, skupi simbole i otvori blago.</p></div>
            <span aria-hidden="true">🧭</span>
          </div>
          <div className="trail-picker-grid">
            {trails.map((trail, index) => {
              const unlocked = isTrailUnlocked(index, completedGames);
              const done = completedGames.includes(trail.id);
              return <button
                key={trail.id}
                className={`trail-choice trail-${trail.id.replace('trail-', '')} ${done ? 'done' : ''} ${unlocked ? '' : 'locked'}`}
                disabled={!unlocked}
                onClick={() => onPlayTrail(trail)}
                aria-label={`${trail.title}${done ? ', završeno' : unlocked ? '' : ', zaključano'}`}
              >
                <span className="trail-board-owl" aria-hidden="true">{unlocked ? (trail.id === 'trail-forest' ? '🦉' : trail.scene) : '🔒'}</span>
                <strong>{trail.title}</strong>
                <span className="trail-board-path" aria-hidden="true">
                  {trail.targets.map((target, targetIndex) => <i key={targetIndex}>{unlocked ? target : '•'}</i>)}
                  <b>🎁</b>
                </span>
                <small>{done ? 'Završeno ✓' : trail.subtitle}</small>
              </button>;
            })}
          </div>
        </section>
        <div className="adventure-worlds">
          {adventureWorlds.map((world) => (
            <section className={`adventure-world adventure-world-${world.id}`} key={world.id} style={{ '--world-color': world.color } as React.CSSProperties}>
              <div className="world-scenery" aria-hidden="true"><span>{world.id === 'voice' ? '🌲' : world.id === 'reading' ? '📚' : world.id === 'family' ? '🌻' : world.id === 'logic' ? '🏔️' : world.id === 'creative' ? '🎨' : '🌌'}</span><i>✨</i><i>{world.levels.at(-1)?.icon}</i></div>
              <header><div><small>OBLAST {Math.ceil(world.levels[0].order / 6)}</small><h3>{world.title}</h3><p>{world.description}</p></div><span>{world.levels.at(-1)?.icon}</span></header>
              <div className="adventure-levels">
                {world.levels.map((level) => {
                  const done = completed.includes(level.id);
                  const unlocked = done || isAdventureLevelUnlocked(level, completed);
                  return (
                    <button
                      key={level.id}
                      className={`${done ? 'done' : ''} ${unlocked ? '' : 'locked'}`}
                      disabled={!unlocked}
                      onClick={() => onOpen(level)}
                      aria-label={`Nivo ${level.order}: ${level.title}${done ? ', završeno' : unlocked ? '' : ', zaključano'}`}
                    >
                      <span>{done ? '✓' : unlocked ? level.icon : '🔒'}</span>
                      <strong>{level.order}</strong>
                      <small>{level.title}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
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
  const level = useMemo(() => createPlatformerLevel(trail.targets), [trail.targets]);
  const [game, setGame] = useState(() => createPlatformerState());
  const [message, setMessage] = useState(`Kreći se strelicama i skači. Sakupi ${visibleToken(trail.targets[0])}.`);
  const controls = useRef({ direction: 0 as -1 | 0 | 1, jump: false });
  const gameRef = useRef(game);
  const completeGame = useProgressStore((state) => state.completeGame);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const learnNumber = useProgressStore((state) => state.learnNumber);
  const reportedCollected = useRef<string[]>([]);
  const completedGame = useRef(false);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { controls.current.direction = -1; event.preventDefault(); }
      if (event.key === 'ArrowRight') { controls.current.direction = 1; event.preventDefault(); }
      if (event.key === 'ArrowUp' || event.key === ' ') { controls.current.jump = true; event.preventDefault(); }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') controls.current.direction = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const next = advancePlatformer(gameRef.current, controls.current, level, (now - previous) / 1000);
      controls.current.jump = false;
      previous = now;
      if (next.collected.length > reportedCollected.current.length) {
        const token = next.collected.at(-1)!;
        reportedCollected.current = next.collected;
        const asNumber = Number(token);
        if (Number.isInteger(asNumber)) learnNumber(asNumber); else learnLetter(token);
        setMessage(next.collected.length === level.collectibles.length ? 'Bravo! Sada dođi do sanduka.' : `Bravo! Sakupi još ${visibleToken(trail.targets[next.collected.length])}.`);
        void speak('Bravo! Sakupio si simbol.', sound);
      }
      if (next.finished && !completedGame.current) {
        completedGame.current = true;
        completeGame(trail.id);
        setMessage('Bravo! Otvorio si blago i osvojio dve zvezdice.');
        void speak('Bravo! Stigao si do cilja!', sound);
      }
      gameRef.current = next;
      setGame(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [completeGame, learnLetter, learnNumber, level, sound, trail.id, trail.targets]);

  const press = (direction: -1 | 0 | 1, jump = false) => { controls.current.direction = direction; controls.current.jump = jump; };

  return <div className={`trail-game trail-game-${trail.id.replace('trail-', '')}`} data-testid="trail-game">
    <Header title={trail.title} onBack={onBack} />
    <main className="trail-play-area">
      <section className="trail-game-card">
        <small>SAKUPLJENO {game.collected.length}/{trail.targets.length}</small>
        <h2>{game.finished ? 'Stigao si do blaga!' : `Sakupi: ${visibleToken(trail.targets[game.collected.length])}`}</h2>
        <div className="trail-game-stage" aria-label={`Igračka staza kroz ${trail.title}`}>
          <span className="trail-cloud cloud-one" aria-hidden="true">☁️</span><span className="trail-cloud cloud-two" aria-hidden="true">☁️</span>
          <span className="trail-ground" aria-hidden="true" />
          <span className="trail-dotted-path" aria-hidden="true" />
          {level.platforms.map((platform, index) => <span key={index} className="platform" style={{ left: `${platform.x}%`, width: `${platform.width}%`, bottom: `${platform.y}%` }} />)}
          <img className={`trail-owl ${game.velocityY > 4 ? 'jumping' : ''}`} style={{ left: `${game.x}%`, bottom: `${game.y + 5}%` }} src="/icons/slovolov-icon-192.png" alt="Sovica" />
          {level.collectibles.map((collectible, index) => <span key={collectible.token} className={`trail-token trail-token-${index} ${game.collected.includes(collectible.token) ? 'collected' : ''}`} style={{ left: `${collectible.x}%`, bottom: `${collectible.y + 4}%` }}>{visibleToken(collectible.token)}</span>)}
          <span className="trail-treasure" aria-hidden="true">🎁</span>
        </div>
        {!game.finished ? <div className="platformer-controls" aria-label="Kontrole igre">
          <button onPointerDown={() => press(-1)} onPointerUp={() => press(0)} onPointerCancel={() => press(0)} aria-label="Idi levo">◀</button>
          <button className="jump-button" onPointerDown={() => press(0, true)} aria-label="Skoči">SKOČI ⤒</button>
          <button onPointerDown={() => press(1)} onPointerUp={() => press(0)} onPointerCancel={() => press(0)} aria-label="Idi desno">▶</button>
        </div> : <button className="primary trail-finish" onClick={onComplete}>Nastavi na mapu 🗺️</button>}
        <p role="status">{message}</p>
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
          <span aria-hidden="true">🦉</span>
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
  const familyUnlocked = useProgressStore((state) => state.familyAccess.isUnlocked);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const completeLearningPath = useProgressStore((state) => state.completeLearningPath);
  const recommendedUpper = nextLetterToPractice(
    letters.filter((_, index) => canAccessLetter(index, familyUnlocked)).map((letter) => letter.upper),
    profile.learnedLetters,
    profile.skillStats
  );
  const recommended = letters.find((letter) => letter.upper === recommendedUpper) ?? letters[0];
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('3 kratka koraka · oko 5 minuta');
  const lessonId = `adaptive-${new Date().toISOString().slice(0, 10)}-${recommended.upper}`;
  const lessonSyllable = 'АЕИОУ'.includes(recommended.upper) ? `М${recommended.upper}` : `${recommended.upper}А`;
  const tasks = [
    { title: `Poslušaj slovo ${recommended.upper}`, icon: '🔊' },
    { title: `Pronađi ${recommended.words[0].word}`, icon: recommended.words[0].emoji },
    { title: `Pročitaj slog ${lessonSyllable}`, icon: '📖' }
  ];

  const completeStep = (index: number) => {
    if (index !== step) return;
    recordSkillAttempt(`adaptive:${recommended.upper}:${index + 1}`, true);
    if (index === 0) void speak(recommended.upper, sound);
    if (index === 1) void speak(recommended.words[0].word, sound);
    if (index === 2) void speak(lessonSyllable, sound);
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === tasks.length) {
      completeLearningPath(lessonId);
      setMessage('Bravo! Pametna lekcija je završena. Osvojio si 3 zvezdice! ⭐');
      void speak('Bravo! Završio si svoju lekciju!', sound);
    } else {
      setMessage(`Odlično! Još ${tasks.length - nextStep} ${tasks.length - nextStep === 1 ? 'korak' : 'koraka'}.`);
    }
  };

  return (
    <div className="single-screen">
      <Header title="Moja pametna lekcija" onBack={onBack} />
      <main className="adaptive-lesson">
        <section className="adaptive-hero">
          <span>{recommended.words[0].emoji}</span>
          <div>
            <small>PREPORUKA ZA DANAS</small>
            <h2>Danas ponavljamo slovo {recommended.upper}</h2>
            <p>{profile.skillStats[`letter:${recommended.upper}`] ? 'Ovo slovo vežbamo još malo.' : 'Ovo je tvoje sledeće novo slovo.'}</p>
          </div>
        </section>
        <div className="adaptive-steps">
          {tasks.map((task, index) => (
            <button
              key={task.title}
              className={`${index < step ? 'done' : ''}${index === step ? ' active' : ''}`}
              disabled={index > step}
              onClick={() => completeStep(index)}
            >
              <span>{index < step ? '✓' : task.icon}</span>
              <strong>{task.title}</strong>
              <small>{index < step ? 'Završeno' : index === step ? 'Dodirni da počneš' : 'Sledeći korak'}</small>
            </button>
          ))}
        </div>
        <p className="adaptive-status" role="status">{message}</p>
      </main>
    </div>
  );
}

function DailyChallenge({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const daySeed = Array.from(dateKey).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const dailyLetter = letters[daySeed % letters.length];
  const dailyNumber = numberLessons[daySeed % numberLessons.length];
  const [completed, setCompleted] = useState<number[]>([]);
  const completeDailyChallenge = useProgressStore((state) => state.completeDailyChallenge);
  const alreadyCompleted = useProgressStore((state) => state.profile.completedDailyChallenges.includes(dateKey));
  const difficulty = useProgressStore((state) => state.profile.difficulty);

  const mark = (step: number, phrase: string) => {
    setCompleted((current) => current.includes(step) ? current : [...current, step]);
    void speak(phrase, sound);
  };

  return (
    <div className="single-screen">
      <Header title="Današnja avantura" onBack={onBack} />
      <main className="daily-challenge">
        <div className="daily-hero"><span>🌞</span><div><h2>Tri mala koraka</h2><p>Težina: {difficulty === 'easy' ? 'lako' : difficulty === 'challenge' ? 'izazovno' : 'standardno'}</p></div></div>
        <button className={completed.includes(1) ? 'daily-step done' : 'daily-step'} onClick={() => mark(1, dailyLetter.upper)}>
          <b>Korak 1</b><span>Izgovori slovo {dailyLetter.upper}</span><strong>{completed.includes(1) ? '✓' : '🔊'}</strong>
        </button>
        <button className={completed.includes(2) ? 'daily-step done' : 'daily-step'} onClick={() => mark(2, dailyLetter.words[0].word)}>
          <b>Korak 2</b><span>Pronađi i izgovori: {dailyLetter.words[0].emoji} {dailyLetter.words[0].word}</span><strong>{completed.includes(2) ? '✓' : '👀'}</strong>
        </button>
        <button className={completed.includes(3) ? 'daily-step done' : 'daily-step'} onClick={() => mark(3, dailyNumber.word)}>
          <b>Korak 3</b><span>Prebroj do {dailyNumber.value}</span><strong>{completed.includes(3) ? '✓' : '🔢'}</strong>
        </button>
        <button
          className="primary daily-reward"
          disabled={completed.length < 3 || alreadyCompleted}
          onClick={() => {
            completeDailyChallenge(dateKey);
            void speak('Bravo! Osvojio si tri zvezdice!', sound);
          }}
        >
          {alreadyCompleted ? '⭐ Današnji izazov je završen' : 'Preuzmi 3 zvezdice'}
        </button>
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

function GameHub({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [mode, setMode] = useState<'match' | 'memory' | 'listen' | 'word'>('match');
  const [gameIndex, setGameIndex] = useState(14);
  const [message, setMessage] = useState('Pronađi sliku za slovo.');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [builtWord, setBuiltWord] = useState('');
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const completeGame = useProgressStore((state) => state.completeGame);
  const recordSkillAttempt = useProgressStore((state) => state.recordSkillAttempt);
  const gameLetter = letters[gameIndex % letters.length];
  const wordTarget = 'МАМА';
  const shuffledWord = ['А', 'М', 'А', 'М'];

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
        <div className="game-tabs">
          <button className={mode === 'match' ? 'active' : ''} onClick={() => setMode('match')}>Slovo i slika</button>
          <button className={mode === 'memory' ? 'active' : ''} onClick={() => setMode('memory')}>Memory</button>
          <button className={mode === 'listen' ? 'active' : ''} onClick={() => { setMode('listen'); void speak(gameLetter.upper, sound); }}>Pogodi glas</button>
          <button className={mode === 'word' ? 'active' : ''} onClick={() => { setMode('word'); setBuiltWord(''); }}>Složi reč</button>
        </div>
        {mode === 'match' && (
          <>
            <div className="game-letter">{gameLetter.upper}</div>
            <p role="status">{message}</p>
            <div className="answer-grid">
              {[gameLetter.words[0], letters[(gameIndex + 3) % 30].words[0], letters[(gameIndex + 7) % 30].words[0]]
                .sort((first, second) => first.word.localeCompare(second.word))
                .map((word) => (
                  <button key={word.word} onClick={() => {
                    if (word === gameLetter.words[0]) {
                      recordSkillAttempt(`letter:${gameLetter.upper}`, true);
                      learnLetter(gameLetter.upper);
                      setMessage('Bravo! Tačan odgovor! ⭐');
                      void speak('Bravo! Tačan odgovor!', sound);
                      setGameIndex((value) => value + 1);
                    } else {
                      recordSkillAttempt(`letter:${gameLetter.upper}`, false);
                      setMessage('Pokušaj ponovo.');
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
                    className={matched.includes(card.pair) ? 'matched' : ''}
                    aria-label={visible ? `Memory kartica ${index + 1}: ${card.face}` : `Otvori memory karticu ${index + 1}`}
                    onClick={() => openMemoryCard(index)}
                  >
                    {visible ? card.face : '?'}
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
              {[gameLetter, letters[(gameIndex + 4) % letters.length], letters[(gameIndex + 9) % letters.length]]
                .sort((first, second) => first.upper.localeCompare(second.upper))
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
          <section className="word-builder">
            <span className="word-builder-art">👩</span>
            <h2>Složi reč МАМА</h2>
            <div className="built-word" aria-label="Složena reč">{builtWord || '_ _ _ _'}</div>
            <div className="letter-tiles">
              {shuffledWord.map((letter, index) => (
                <button key={`${letter}-${index}`} onClick={() => {
                  const next = `${builtWord}${letter}`;
                  setBuiltWord(next);
                  if (next.length === wordTarget.length) {
                    const correct = next === wordTarget;
                    recordSkillAttempt('word:МАМА', correct);
                    if (correct) {
                      completeGame('word-mama');
                      setMessage('Bravo! Složio si reč МАМА! ⭐');
                      void speak('Мама', sound);
                    } else {
                      setMessage('Skoro! Obriši i pokušaj redom М, А, М, А.');
                    }
                  }
                }}>{letter}</button>
              ))}
            </div>
            <button className="secondary" onClick={() => { setBuiltWord(''); setMessage('Složi slova pravim redom.'); }}>Obriši reč</button>
            <p role="status">{message}</p>
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
              <button aria-label="Prethodna priča" disabled={storyIndex === 0} onClick={() => selectStory(storyIndex - 1)}>←</button>
              <strong>Priča {storyIndex + 1}/{storiesForAge.length}</strong>
              <button aria-label="Sledeća priča" disabled={storyIndex === storiesForAge.length - 1} onClick={() => selectStory(storyIndex + 1)}>→</button>
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
          <button aria-label="Prethodna bajka" disabled={storyIndex === 0} onClick={() => openStory(storyIndex - 1)}>←</button>
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
          <button aria-label="Sledeća bajka" disabled={storyIndex === stories.length - 1} onClick={() => openStory(storyIndex + 1)}>→</button>
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
            >←</button>
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
            >→</button>
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
    <div className="single-screen creative-screen">
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
      </main>
    </>
  );
}

function Settings({ onBack }: { onBack: () => void }) {
  const store = useProgressStore();
  const commerceEnabled = isCommerceEnabled();
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
    () => createPurchaseManager(createDefaultPurchaseGateway(), store.grantFamilyAccess),
    [store.grantFamilyAccess]
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
        setPurchaseMessage('Slovolov Porodica je uspešno otključan na ovom uređaju.');
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
        ? 'Kupovina je pronađena i Slovolov Porodica je vraćen.'
        : result.message ?? 'Kupovina nije pronađena na ovom nalogu.');
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
          <div className="family-heading">
            <span aria-hidden="true">{store.familyAccess.isUnlocked || !commerceEnabled ? '✨' : '👨‍👩‍👧‍👦'}</span>
            <div>
              <h2>Slovolov Porodica</h2>
              <p>
                {store.familyAccess.isUnlocked
                  ? 'Otključano zauvek'
                  : !commerceEnabled
                    ? 'Sadržaj je dostupan tokom pripreme prodavnice'
                    : `${purchaseOffer.price ?? '6,99 €'} · jednokratno`}
              </p>
            </div>
          </div>
          {!store.familyAccess.isUnlocked && commerceEnabled && (
            <div className="family-trust-row" aria-label="Prednosti porodičnog paketa">
              <span>✓ Jedna kupovina</span>
              <span>✓ Bez reklama</span>
              <span>✓ Bez pretplate</span>
            </div>
          )}
          <ul>
            <li>Svih 30 slova i brojevi 0–100</li>
            <li>Sve kompletne bajke i buduća proširenja sadržaja</li>
            <li>Više dečjih profila na istom uređaju</li>
          </ul>
          {commerceEnabled && !store.familyAccess.isUnlocked && (
            <div className="family-actions">
              <button className="primary" disabled={!purchaseOffer.available || purchaseBusy} onClick={() => void buyFamily()}>
                {purchaseBusy ? 'Proveravam…' : 'Otključaj celu aplikaciju'}
              </button>
              <button className="secondary" disabled={!purchaseOffer.available || purchaseBusy} onClick={() => void restoreFamily()}>
                Vrati kupovinu
              </button>
            </div>
          )}
          {(store.familyAccess.isUnlocked || !commerceEnabled) && <strong className="family-owned">✓ Porodični sadržaj je dostupan svim profilima.</strong>}
          {commerceEnabled && !isNativePurchasePlatform() && !purchaseMessage && (
            <p className="purchase-message">Kupovina je dostupna u instaliranoj Android/iOS aplikaciji.</p>
          )}
          {purchaseMessage && <p className="purchase-message" role="status">{purchaseMessage}</p>}
          <small>Kupovinu potvrđuje roditelj. Nema reklama, pretplate ni automatskog obnavljanja.</small>
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
          <p className="parent-note">Slovolov Porodica omogućava više profila dece na istom uređaju.</p>
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
