import { useMemo, useState } from 'react';
import { TracePad } from './components/TracePad';
import { ColoringPad } from './components/ColoringPad';
import { displayLetter, letters, transliterate, type Letter } from './domain/letters';
import { speak } from './services/speech';
import { useProgressStore } from './store/progress';

type Screen = 'home' | 'learn' | 'lesson' | 'write' | 'coloring' | 'games' | 'quiz' | 'reading' | 'progress' | 'settings';

const menus: Array<{ screen: Screen; icon: string; title: string; subtitle: string }> = [
  { screen: 'learn', icon: '🔤', title: 'Nauči slova', subtitle: 'Slušaj, gledaj i pamti' },
  { screen: 'write', icon: '✍️', title: 'Piši slova', subtitle: 'Crtaj prstom po putanji' },
  { screen: 'coloring', icon: '🎨', title: 'Bojanka', subtitle: 'Oboji, sačuvaj i pokaži' },
  { screen: 'games', icon: '🎮', title: 'Igre', subtitle: 'Spoji, pogodi i složi' },
  { screen: 'quiz', icon: '🏆', title: 'Kviz', subtitle: 'Osvoji novu medalju' },
  { screen: 'reading', icon: '📚', title: 'Čitanje 8–10', subtitle: 'Rečenice i kratke priče' },
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
  const sound = useProgressStore((state) => state.soundEnabled);
  const darkMode = useProgressStore((state) => state.darkMode);
  const script = useProgressStore((state) => state.script);
  const learnLetter = useProgressStore((state) => state.learnLetter);
  const profile = useProgressStore((state) => state.profile);
  const [gameIndex, setGameIndex] = useState(14);
  const [gameMessage, setGameMessage] = useState('Pronađi sliku za slovo.');

  const openLesson = (letter: Letter) => {
    setSelected(letter);
    setScreen('lesson');
    void speak(`${letter.upper}. ${letter.upper} kao ${letter.words[0].word}`, sound);
  };

  const finishTrace = () => {
    learnLetter(selected.upper);
    setCelebrate(true);
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
              aria-label={letter.upper}
            >
              {displayLetter(letter, script)}
              {profile.learnedLetters.includes(letter.upper) && <span>★</span>}
            </button>
          ))}
        </main>
      </>
    );

    if (screen === 'lesson') return (
      <div className="single-screen">
        <Header title={`Slovo ${displayLetter(selected, script)}`} onBack={() => setScreen('learn')} />
        <main className="lesson">
          <button className="giant-letter" onClick={() => void speak(selected.upper, sound)}>
            {displayLetter(selected, script)} <small>{script === 'cyrillic' ? selected.lower : displayLetter(selected, script).toLowerCase()}</small>
          </button>
          <div className="word-row">
            {selected.words.map((word) => (
              <button key={word.word} className="word-card" onClick={() => void speak(word.word, sound)}>
                <span>{word.emoji}</span>
                <strong>{script === 'cyrillic' ? word.word : transliterate(word.word)}</strong>
              </button>
            ))}
          </div>
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
          <div className="practice-letters">
            {letters.map((letter) => (
              <button key={letter.upper} className={letter === selected ? 'active' : ''} onClick={() => setSelected(letter)}>
                {displayLetter(letter, script)}
              </button>
            ))}
          </div>
          <p className="instruction">Počni od tačke 1 i prati svetlo slovo prstom.</p>
          <TracePad letter={displayLetter(selected, script)} onComplete={finishTrace} />
          {celebrate && <div className="celebrate" role="status">🎉 ⭐ Bravo! ⭐ 🎉</div>}
        </main>
      </div>
    );

    if (screen === 'coloring') return (
      <div className="single-screen">
        <Header title={`Bojanka ${displayLetter(selected, script)}`} onBack={() => setScreen('home')} />
        <main className="coloring">
          <div className="practice-letters">
            {letters.map((letter) => (
              <button key={letter.upper} className={letter === selected ? 'active' : ''} onClick={() => setSelected(letter)}>
                {displayLetter(letter, script)}
              </button>
            ))}
          </div>
          <ColoringPad letter={displayLetter(selected, script)} />
        </main>
      </div>
    );

    if (screen === 'games') {
      const gameLetter = letters[gameIndex % letters.length];
      return (
        <div className="single-screen">
          <Header title="Spoji slovo i sliku" onBack={() => setScreen('home')} />
          <main className="game">
            <div className="game-letter">{gameLetter.upper}</div>
            <p>{gameMessage}</p>
            <div className="answer-grid">
              {[gameLetter.words[0], letters[(gameIndex + 3) % 30].words[0], letters[(gameIndex + 7) % 30].words[0]]
                .sort((a, b) => a.word.localeCompare(b.word))
                .map((word) => (
                  <button key={word.word} onClick={() => {
                    if (word === gameLetter.words[0]) {
                      setGameMessage('Bravo! Tačan odgovor! ⭐');
                      void speak('Bravo! Tačan odgovor!', sound);
                      window.setTimeout(() => { setGameIndex((value) => value + 1); setGameMessage('Pronađi sliku za slovo.'); }, 900);
                    } else setGameMessage('Pokušaj ponovo.');
                  }}>
                    <span>{word.emoji}</span><strong>{word.word}</strong>
                  </button>
                ))}
            </div>
          </main>
        </div>
      );
    }

    if (screen === 'quiz') return <Quiz onBack={() => setScreen('home')} />;
    if (screen === 'reading') return <Reading onBack={() => setScreen('home')} sound={sound} />;
    if (screen === 'progress') return <Progress onBack={() => setScreen('home')} />;
    return <Settings onBack={() => setScreen('home')} />;
  }, [celebrate, gameIndex, gameMessage, profile, screen, script, selected, sound]);

  return <div className={darkMode ? 'app dark' : 'app'}>{body}</div>;
}

function Quiz({ onBack }: { onBack: () => void }) {
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const target = letters[question % letters.length];
  const choices = [target, letters[(question + 5) % 30], letters[(question + 11) % 30]];
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

function Reading({ onBack, sound }: { onBack: () => void; sound: boolean }) {
  const sentences = ['Мила има малу сову.', 'Сова лети изнад шуме.', 'У шуми је пронашла новог друга.'];
  const [active, setActive] = useState(0);
  return (
    <div className="single-screen">
      <Header title="Čitam samostalno" onBack={onBack} />
      <main className="reading">
        <div className="story-art">🌙 🦉 🌲</div>
        <h2>Мила и мудра сова</h2>
        {sentences.map((sentence, index) => (
          <button key={sentence} className={index === active ? 'sentence active' : 'sentence'} onClick={() => { setActive(index); void speak(sentence, sound); }}>
            {sentence}
          </button>
        ))}
        <p className="reading-question">Кога је Мила пронашла у шуми?</p>
        <button className="primary" onClick={() => void speak(sentences[active], sound)}>🔊 Pročitaj rečenicu</button>
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
        <div className="stats"><article><b>{profile.learnedLetters.length}</b><small>Naučenih slova</small></article><article><b>{profile.stars} ⭐</b><small>Zvezdica</small></article><article><b>{profile.streak} 🔥</b><small>Dnevni niz</small></article></div>
        <h3>Medalje</h3><div className="medals">{['🥉', '🥈', '🥇'].map((medal, index) => <span key={medal} className={profile.medals.length > index ? '' : 'locked'}>{medal}</span>)}</div>
      </main>
    </>
  );
}

function Settings({ onBack }: { onBack: () => void }) {
  const store = useProgressStore();
  return (
    <>
      <Header title="Podešavanja za roditelje" onBack={onBack} />
      <main className="settings">
        <label><span>🔊 Zvuk</span><input type="checkbox" checked={store.soundEnabled} onChange={store.toggleSound} /></label>
        <label><span>🌙 Tamni režim</span><input type="checkbox" checked={store.darkMode} onChange={store.toggleTheme} /></label>
        <button className="setting-button" onClick={store.toggleScript}><span>🔤 Pismo</span><strong>{store.script === 'cyrillic' ? 'Ćirilica' : 'Latinica'}</strong></button>
        <section><h2>Profili dece</h2>{store.profiles.map((profile) => <button key={profile.id} className="profile-row" onClick={() => store.setActiveProfile(profile.id)}>{profile.avatar} {profile.name}</button>)}</section>
        <button className="secondary" onClick={() => store.addProfile(`Дете ${store.profiles.length + 1}`, ['🐉', '🦉', '🐝'][store.profiles.length % 3])}>+ Dodaj profil</button>
        <p className="parent-note">Aplikacija nema reklame, naloge ni praćenje. Napredak ostaje samo na uređaju.</p>
      </main>
    </>
  );
}
