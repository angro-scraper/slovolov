import { useEffect, useMemo, useRef, useState } from 'react';
import { TracePad } from './components/TracePad';
import { ColoringPad } from './components/ColoringPad';
import { fairyTaleAges, fairyTales, type FairyTaleAge } from './data/fairyTales';
import { numberLessons } from './data/numbers';
import { readingStories, storyAges, type ReadingAge } from './data/stories';
import { seededChoices } from './domain/choices';
import { displayLetter, letters, transliterate, type Letter } from './domain/letters';
import { narrateSentences, type NarrationSession } from './services/narration';
import { speak } from './services/speech';
import { useProgressStore } from './store/progress';

type Screen = 'home' | 'daily' | 'learn' | 'lesson' | 'write' | 'coloring' | 'games' | 'quiz' | 'numbers' | 'reading' | 'fairy-tales' | 'progress' | 'settings';

const menus: Array<{ screen: Screen; icon: string; title: string; subtitle: string }> = [
  { screen: 'daily', icon: '🌞', title: 'Dnevni izazov', subtitle: 'Tri kratka koraka i 3 zvezdice' },
  { screen: 'learn', icon: '🔤', title: 'Nauči slova', subtitle: 'Slušaj, gledaj i pamti' },
  { screen: 'write', icon: '✍️', title: 'Piši slova', subtitle: 'Crtaj prstom po putanji' },
  { screen: 'coloring', icon: '🎨', title: 'Bojanka', subtitle: 'Oboji, sačuvaj i pokaži' },
  { screen: 'games', icon: '🎮', title: 'Igre', subtitle: 'Spoji, pogodi i složi' },
  { screen: 'quiz', icon: '🏆', title: 'Kviz', subtitle: 'Osvoji novu medalju' },
  { screen: 'numbers', icon: '🔢', title: 'Brojevi 0–10', subtitle: 'Broj, količina i zvuk' },
  { screen: 'reading', icon: '📚', title: 'Čitanje', subtitle: 'Slogovi, reči i priče' },
  { screen: 'fairy-tales', icon: '🌙', title: 'Bajke i priče', subtitle: 'Slušaj, čitaj i osvajaj zvezdice' },
  { screen: 'progress', icon: '⭐', title: 'Moj napredak', subtitle: 'Zvezdice, streak i nagrade' }
];

function Back({ onClick }: { onClick: () => void }) {
  return <button className="back" onClick={onClick} aria-label="Nazad">←</button>;
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="screen-header">
      {onBack ? <Back onClick={onBack} /> : <span className="mascot">🦉</span>}
      <div><small>Slovolov</small><h1>{title}</h1></div>
      <span className="star-pill">⭐ {useProgressStore((state) => state.profile.stars)}</span>
    </header>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<Letter>(letters[0]);
  const [celebrate, setCelebrate] = useState(false);
  const [letterCase, setLetterCase] = useState<'upper' | 'lower'>('upper');
  const [traceMessage, setTraceMessage] = useState('Prati celo svetlo slovo prstom.');
  const [coloringMessage, setColoringMessage] = useState('');
  const sound = useProgressStore((state) => state.soundEnabled);
  const darkMode = useProgressStore((state) => state.darkMode);
  const script = useProgressStore((state) => state.script);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const profile = useProgressStore((state) => state.profile);

  const visibleLetter = (letter: Letter, requestedCase: 'upper' | 'lower' = 'upper') => {
    if (script === 'cyrillic') return requestedCase === 'upper' ? letter.upper : letter.lower;
    const latin = displayLetter(letter, script);
    return requestedCase === 'upper' ? latin : latin.toLocaleLowerCase('sr-Latn');
  };

  const openLesson = (letter: Letter) => {
    setSelected(letter);
    setScreen('lesson');
    void speak(`${letter.upper}. ${letter.upper} kao ${letter.words[0].word}`, sound);
  };

  const finishTrace = () => {
    learnLetter(selected.upper);
    setCelebrate(true);
    setTraceMessage(`Bravo! Naučio si slovo ${visibleLetter(selected, letterCase)}!`);
    void speak(`Bravo! Naučio si slovo ${selected.upper}!`, sound);
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
            <button key={item.screen} className={`menu-card menu-${item.screen}`} onClick={() => setScreen(item.screen)}>
              <span className="menu-icon">{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
              <b>›</b>
            </button>
          ))}
        </main>
        <button className="settings-fab" onClick={() => setScreen('settings')} aria-label="Podešavanja">⚙️</button>
      </>
    );

    if (screen === 'learn') return (
      <>
        <Header title="Azbuka" onBack={() => setScreen('home')} />
        <main className="letter-grid" aria-label="Srpska azbuka">
          {letters.map((letter) => (
            <button
              key={letter.upper}
              className="letter-button"
              style={{ '--letter-color': letter.color } as React.CSSProperties}
              onClick={() => openLesson(letter)}
              aria-label={`${visibleLetter(letter)} ${visibleLetter(letter, 'lower')}`}
            >
              <strong>{visibleLetter(letter)}</strong>
              <small>{visibleLetter(letter, 'lower')}</small>
              {profile.learnedLetters.includes(letter.upper) && <span>★</span>}
            </button>
          ))}
        </main>
      </>
    );

    if (screen === 'lesson') return (
      <div className="single-screen">
        <Header title={`Slovo ${visibleLetter(selected)} ${visibleLetter(selected, 'lower')}`} onBack={() => setScreen('learn')} />
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
                        setTraceMessage('Pokušaj ponovo. Pažljivo pogledaj sličice.');
                        void speak('Pokušaj ponovo.', sound);
                        return;
                      }
                      learnLetter(selected.upper);
                      setCelebrate(true);
                      void speak('Bravo! Dobio si zvezdicu. Idemo na sledeće slovo!', sound);
                      const nextIndex = (letters.indexOf(selected) + 1) % letters.length;
                      setTraceMessage(`Bravo! Naučio si ${visibleLetter(selected)}. Sledeće slovo je ${visibleLetter(letters[nextIndex])}.`);
                      setSelected(letters[nextIndex]);
                      window.setTimeout(() => setCelebrate(false), 1400);
                    }}
                  >
                    <span>{word.emoji}</span>
                    <strong>{script === 'cyrillic' ? word.word : transliterate(word.word)}</strong>
                  </button>
                ))}
            </div>
            {celebrate && <div className="reward-pop" role="status">⭐ Bravo! Sledeće slovo!</div>}
          </section>
          <div className="lesson-actions">
            <button className="primary" onClick={() => void speak(`${selected.upper} kao ${selected.words[0].word}`, sound)}>🔊 Slušaj ponovo</button>
            <button className="secondary" onClick={() => setScreen('write')}>✍️ Piši slovo</button>
          </div>
        </main>
      </div>
    );

    if (screen === 'write') return (
      <div className="single-screen" data-testid="practice-screen">
        <Header title={`Pišemo ${displayLetter(selected, script)}`} onBack={() => setScreen('home')} />
        <main className="practice">
          <div className="case-switch" aria-label="Izbor veličine slova">
            <button className={letterCase === 'upper' ? 'active' : ''} onClick={() => { setLetterCase('upper'); setTraceMessage('Prati celo svetlo slovo prstom.'); }}>Veliko slovo</button>
            <button className={letterCase === 'lower' ? 'active' : ''} onClick={() => { setLetterCase('lower'); setTraceMessage('Prati celo svetlo slovo prstom.'); }}>Malo slovo</button>
          </div>
          <div className="practice-letters">
            {letters.map((letter) => (
              <button key={letter.upper} className={letter === selected ? 'active' : ''} onClick={() => setSelected(letter)}>
                {displayLetter(letter, script)}
              </button>
            ))}
          </div>
          <p className="instruction" role="status">{traceMessage}</p>
          <TracePad
            key={`${selected.upper}-${letterCase}-${script}`}
            letter={visibleLetter(selected, letterCase)}
            difficulty={profile.difficulty}
            onAttempt={(success) => {
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
        <Header title={`Bojanka ${displayLetter(selected, script)}`} onBack={() => setScreen('home')} />
        <main className="coloring">
          <div className="practice-letters">
            {letters.map((letter) => (
              <button key={letter.upper} className={letter === selected ? 'active' : ''} onClick={() => { setSelected(letter); setColoringMessage(''); }}>
                {displayLetter(letter, script)}
              </button>
            ))}
          </div>
          <ColoringPad
            key={`coloring-${selected.upper}-${script}`}
            letter={displayLetter(selected, script)}
            illustration={selected.words[0].emoji}
            onSaved={() => {
              const saved = selected;
              const next = letters[(letters.indexOf(saved) + 1) % letters.length];
              setColoringMessage(`Crtež za ${displayLetter(saved, script)} je sačuvan. Sledeće slovo je ${displayLetter(next, script)}.`);
              setSelected(next);
            }}
          />
          <p className="coloring-feedback" role="status">{coloringMessage}</p>
        </main>
      </div>
    );

    if (screen === 'daily') return <DailyChallenge onBack={() => setScreen('home')} sound={sound} />;
    if (screen === 'games') return <GameHub onBack={() => setScreen('home')} sound={sound} />;

    if (screen === 'quiz') return <Quiz onBack={() => setScreen('home')} />;
    if (screen === 'numbers') return <Numbers onBack={() => setScreen('home')} sound={sound} />;
    if (screen === 'reading') return <Reading onBack={() => setScreen('home')} sound={sound} />;
    if (screen === 'fairy-tales') return <FairyTales onBack={() => setScreen('home')} sound={sound} />;
    if (screen === 'progress') return <Progress onBack={() => setScreen('home')} />;
    return <Settings onBack={() => setScreen('home')} />;
  }, [celebrate, coloringMessage, letterCase, profile, screen, script, selected, sound, traceMessage]);

  return <div className={darkMode ? 'app dark' : 'app'}>{body}</div>;
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
  const [mode, setMode] = useState<'match' | 'memory'>('match');
  const [gameIndex, setGameIndex] = useState(14);
  const [message, setMessage] = useState('Pronađi sliku za slovo.');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const completeGame = useProgressStore((state) => state.completeGame);
  const gameLetter = letters[gameIndex % letters.length];

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
        </div>
        {mode === 'match' ? (
          <>
            <div className="game-letter">{gameLetter.upper}</div>
            <p role="status">{message}</p>
            <div className="answer-grid">
              {[gameLetter.words[0], letters[(gameIndex + 3) % 30].words[0], letters[(gameIndex + 7) % 30].words[0]]
                .sort((first, second) => first.word.localeCompare(second.word))
                .map((word) => (
                  <button key={word.word} onClick={() => {
                    if (word === gameLetter.words[0]) {
                      learnLetter(gameLetter.upper);
                      setMessage('Bravo! Tačan odgovor! ⭐');
                      void speak('Bravo! Tačan odgovor!', sound);
                      setGameIndex((value) => value + 1);
                    } else setMessage('Pokušaj ponovo.');
                  }}>
                    <span>{word.emoji}</span><strong>{word.word}</strong>
                  </button>
                ))}
            </div>
          </>
        ) : (
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
      </main>
    </div>
  );
}

function Quiz({ onBack }: { onBack: () => void }) {
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const target = letters[question % letters.length];
  const choices = seededChoices([target, letters[(question + 5) % 30], letters[(question + 11) % 30]], question);
  return (
    <div className="single-screen">
      <Header title={`Kviz ${question + 1}/10`} onBack={onBack} />
      <main className="quiz">
        {question < 10 ? <>
          <p>Koje slovo počinje reč?</p><div className="quiz-emoji">{target.words[0].emoji}</div><h2>{target.words[0].word}</h2>
          <div className="quiz-choices">{choices.map((letter) => <button key={letter.upper} onClick={() => {
            if (letter === target) setScore((value) => value + 1);
            setQuestion((value) => value + 1);
          }}>{letter.upper}</button>)}</div>
        </> : <div className="result"><span>{score >= 9 ? '🥇' : score >= 7 ? '🥈' : '🥉'}</span><h2>{score}/10 tačnih!</h2><button className="primary" onClick={onBack}>Na početak</button></div>}
      </main>
    </div>
  );
}

function Numbers({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [selectedNumber, setSelectedNumber] = useState(numberLessons[1]);
  const [mode, setMode] = useState<'learn' | 'write'>('learn');
  const [message, setMessage] = useState('Dodirni broj, izbroj sličice i pronađi odgovor.');
  const learnNumber = useProgressStore((state) => state.learnNumber);
  const learnedNumbers = useProgressStore((state) => state.profile.learnedNumbers);
  const difficulty = useProgressStore((state) => state.profile.difficulty);
  const amount = selectedNumber.value;
  const options = Array.from(new Set([
    amount,
    Math.max(0, amount - 1),
    Math.min(10, amount + 1)
  ])).sort((first, second) => first - second);

  return (
    <div className="single-screen">
      <Header title="Brojevi 0–10" onBack={onBack} />
      <main className="numbers-screen">
        <div className="number-mode">
          <button className={mode === 'learn' ? 'active' : ''} onClick={() => setMode('learn')}>Uči broj</button>
          <button className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}>Piši broj</button>
        </div>
        <div className="number-strip" aria-label="Izaberi broj">
          {numberLessons.map((number) => (
            <button
              key={number.value}
              className={number.value === amount ? 'active' : ''}
              aria-label={`Broj ${number.value}`}
              onClick={() => {
                setSelectedNumber(number);
                setMessage('Izbroj sličice i pronađi pravi broj.');
                void speak(number.word, sound);
              }}
            >
              {number.value}
              {learnedNumbers.includes(number.value) && <small>★</small>}
            </button>
          ))}
        </div>
        {mode === 'learn' ? <section className="number-card" style={{ '--number-color': selectedNumber.color } as React.CSSProperties}>
          <button className="big-number" onClick={() => void speak(selectedNumber.word, sound)}>
            <strong>{amount}</strong><small>{selectedNumber.word}</small>
          </button>
          <div className="counting-row" aria-label={`${amount} sličica`}>
            {amount === 0 ? <span className="empty-set">Nema nijedne</span> : Array.from({ length: amount }, (_, index) => (
              <span key={index}>{selectedNumber.emoji}</span>
            ))}
          </div>
          <h2>Koliko ima {selectedNumber.countLabel}?</h2>
          <div className="number-options">
            {options.map((option) => (
              <button key={option} onClick={() => {
                if (option !== amount) {
                  setMessage('Pokušaj ponovo. Prebroj polako.');
                  return;
                }
                learnNumber(amount);
                setMessage(`Bravo! Broj ${amount} vredi jednu zvezdicu! ⭐`);
                void speak(`Bravo! Ovo je broj ${selectedNumber.word}.`, sound);
              }}>{option}</button>
            ))}
          </div>
          <p role="status">{message}</p>
        </section> : <section className="number-writing">
          <p role="status">{message}</p>
          <TracePad
            key={`number-${amount}`}
            letter={String(amount)}
            difficulty={difficulty}
            onAttempt={(success) => {
              if (!success) setMessage('Prati ceo svetli broj i pokušaj ponovo.');
            }}
            onComplete={() => {
              learnNumber(amount);
              setMessage(`Bravo! Lepo si napisao broj ${amount}! ⭐`);
              void speak(`Bravo! Naučio si da napišeš broj ${selectedNumber.word}.`, sound);
            }}
          />
        </section>}
      </main>
    </div>
  );
}

function Reading({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [active, setActive] = useState(0);
  const [level, setLevel] = useState<'syllables' | 'words' | 'story'>('syllables');
  const [age, setAge] = useState<ReadingAge>('6–8');
  const [storyIndex, setStoryIndex] = useState(0);
  const [message, setMessage] = useState('Slušaj, pa pročitaj naglas.');
  const completeReading = useProgressStore((state) => state.completeReading);
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
          <button className={level === 'syllables' ? 'active' : ''} onClick={() => setLevel('syllables')}>Slogovi</button>
          <button className={level === 'words' ? 'active' : ''} onClick={() => setLevel('words')}>Reči</button>
          <button className={level === 'story' ? 'active' : ''} onClick={() => setLevel('story')}>Priča</button>
        </div>
        {level === 'syllables' && (
          <section className="reading-stage">
            <div className="story-art">🗣️ М + А</div>
            <h2>Spoj glasove u slog</h2>
            <div className="syllable-grid">
              {['МА', 'МЕ', 'МИ', 'МО', 'МУ'].map((syllable) => (
                <button key={syllable} onClick={() => void speak(syllable, sound)}>{syllable}</button>
              ))}
            </div>
            <p>Dodirni svaki slog, poslušaj ga i ponovi naglas.</p>
          </section>
        )}
        {level === 'words' && (
          <section className="reading-stage">
            <div className="story-art">👩 🦉 🌳</div>
            <h2>Pročitaj celu reč</h2>
            <div className="word-reading-grid">
              {['МАМА', 'СОВА', 'ШУМА'].map((word) => (
                <button key={word} onClick={() => void speak(word, sound)}>{word}</button>
              ))}
            </div>
            <p>Prvo pročitaj samostalno, zatim dodirni reč za proveru.</p>
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
              <button key={sentence} className={index === active ? 'sentence active' : 'sentence'} onClick={() => { setActive(index); void speak(sentence, sound); }}>
                {sentence}
              </button>
            ))}
            <p className="reading-question">{story.question}</p>
            <div className="reading-answers">
              {story.answers.map((answer) => (
                <button key={answer} onClick={() => {
                  if (answer !== story.correct) {
                    setMessage('Pokušaj ponovo. Pročitaj prvu rečenicu.');
                    return;
                  }
                  completeReading(story.id);
                  setMessage('Bravo! Razumeo si priču i osvojio zvezdicu! ⭐');
                  void speak('Bravo! Razumeo si priču.', sound);
                }}>{answer}</button>
              ))}
            </div>
            <button className="primary" onClick={() => void speak(sentences[active], sound)}>🔊 Pročitaj rečenicu</button>
          </section>
        )}
        <p className="reading-feedback" role="status">{message}</p>
      </main>
    </div>
  );
}

function FairyTales({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const [age, setAge] = useState<FairyTaleAge>('4–6');
  const [storyIndex, setStoryIndex] = useState(0);
  const stories = fairyTales.filter((story) => story.age === age);
  const story = stories[storyIndex];
  const profile = useProgressStore((state) => state.profile);
  const completeReading = useProgressStore((state) => state.completeReading);
  const setStoryBookmark = useProgressStore((state) => state.setStoryBookmark);
  const [activeSentence, setActiveSentence] = useState(profile.storyBookmarks[story.id] ?? 0);
  const [playback, setPlayback] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [largeText, setLargeText] = useState(false);
  const [showText, setShowText] = useState(false);
  const [narrationSource, setNarrationSource] = useState<'recorded' | 'system' | 'unavailable' | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [message, setMessage] = useState('Izaberi rečenicu ili poslušaj celu priču.');
  const sessionRef = useRef<NarrationSession | null>(null);
  const pageStarts = story.pages.map((_, pageIndex) => (
    story.pages.slice(0, pageIndex).reduce((total, page) => total + page.length, 0)
  ));
  const currentPageIndex = Math.max(0, story.pages.findIndex((page, pageIndex) => {
    const start = pageStarts[pageIndex];
    return activeSentence >= start && activeSentence < start + page.length;
  }));
  const currentPage = story.pages[currentPageIndex];
  const isLastPage = currentPageIndex === story.pages.length - 1;

  const openStory = (nextIndex: number, nextAge = age) => {
    sessionRef.current?.stop();
    const nextStories = fairyTales.filter((item) => item.age === nextAge);
    const nextStory = nextStories[nextIndex];
    setStoryIndex(nextIndex);
    setActiveSentence(profile.storyBookmarks[nextStory.id] ?? 0);
    setPlayback('idle');
    setShowText(false);
    setNarrationSource(null);
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
    setPlayback('playing');
    setMessage('Priča se čita naglas. Aktivna rečenica je označena.');
    sessionRef.current = narrateSentences(story.sentences, {
      enabled: sound,
      audioKey: story.recordedAudio ? story.audioKey : undefined,
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

  useEffect(() => () => sessionRef.current?.stop(), []);

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
          <strong>Bajka {storyIndex + 1}/{stories.length}</strong>
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
              Prema javnodomenskom delu: <strong>{story.source.author}</strong>
              <span>Originalna srpska adaptacija</span>
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
              <strong>Strana {currentPageIndex + 1}/{story.pages.length}</strong>
              <div
                className="storybook-progress-track"
                role="progressbar"
                aria-label="Napredak kroz bajku"
                aria-valuemin={1}
                aria-valuemax={story.pages.length}
                aria-valuenow={currentPageIndex + 1}
              >
                <span style={{ width: `${((currentPageIndex + 1) / story.pages.length) * 100}%` }} />
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
              {story.edition === 'complete' ? 'Cela audio-bajka' : 'Sažeta verzija · cela priča je u pripremi'}
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
              <small>Poglavlje {currentPageIndex + 1} od {story.pages.length}</small>
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
              {narrationSource === 'recorded' && '🎙️ Čita topli ženski Sophie narator'}
              {narrationSource === 'system' && '🔊 Čita srpski glas ovog uređaja'}
              {narrationSource === 'unavailable' && '⚠️ Glas nije dostupan na ovom uređaju'}
              {narrationSource === null && (
                story.recordedAudio
                  ? '🎙️ Snimljeni glas ima prednost; glas uređaja je rezerva'
                  : '🔊 Koristi najbolji srpski glas dostupan na uređaju'
              )}
            </p>
          </div>
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
            <button className="secondary" aria-label="Zaustavi slušanje" disabled={playback === 'idle'} onClick={stop}>■ Stop</button>
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

function Progress({ onBack }: { onBack: () => void }) {
  const profile = useProgressStore((state) => state.profile);
  const percent = Math.round(profile.learnedLetters.length / 30 * 100);
  return (
    <>
      <Header title="Moj napredak" onBack={onBack} />
      <main className="progress">
        <div className="profile-avatar">{profile.avatar}</div><h2>{profile.name}</h2>
        <div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><span>{percent}%</span></div>
        <div className="stats"><article><b>{profile.learnedLetters.length}</b><small>Naučenih slova</small></article><article><b>{profile.learnedNumbers.length}</b><small>Naučenih brojeva</small></article><article><b>{profile.stars} ⭐</b><small>Zvezdica</small></article><article><b>{profile.streak} 🔥</b><small>Dnevni niz</small></article></div>
        <h3>Medalje</h3><div className="medals">{['🥉', '🥈', '🥇'].map((medal, index) => <span key={medal} className={profile.medals.length > index ? '' : 'locked'}>{medal}</span>)}</div>
      </main>
    </>
  );
}

function Settings({ onBack }: { onBack: () => void }) {
  const store = useProgressStore();
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState('');

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

  return (
    <>
      <Header title="Podešavanja za roditelje" onBack={onBack} />
      <main className="settings">
        <label><span>🔊 Zvuk</span><input type="checkbox" checked={store.soundEnabled} onChange={store.toggleSound} /></label>
        <label><span>🌙 Tamni režim</span><input type="checkbox" checked={store.darkMode} onChange={store.toggleTheme} /></label>
        <button className="setting-button" onClick={store.toggleScript}><span>🔤 Pismo</span><strong>{store.script === 'cyrillic' ? 'Ćirilica' : 'Latinica'}</strong></button>
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
        {!addingProfile && (
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
        <p className="parent-note">Aplikacija nema reklame, naloge ni praćenje. Napredak ostaje samo na uređaju.</p>
      </main>
    </>
  );
}
