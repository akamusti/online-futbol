import { useState } from "react";
import type { Mode, Player } from "./types";
import type { Difficulty } from "./game/auction";
import { DEFAULT_BUDGET } from "./game/auction";
import { simulateMatch, type MatchResult, type Squad } from "./game/match";
import SetupScreen from "./components/SetupScreen";
import AuctionScreen from "./components/AuctionScreen";
import ReadyScreen from "./components/ReadyScreen";
import MatchScreen from "./components/MatchScreen";
import DraftScreen from "./components/DraftScreen";

type Phase = "setup" | "auction" | "ready" | "match" | "draft";

export default function App() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("orta");
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [you, setYou] = useState<Player[]>([]);
  const [ai, setAi] = useState<Player[]>([]);
  const [youBudget, setYouBudget] = useState(0);
  const [aiBudget, setAiBudget] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);

  const names = mode === "local"
    ? { you: "Oyuncu 1", ai: "Oyuncu 2" }
    : { you: "Sen", ai: "Rakip" };

  const startMatch = () => {
    const home: Squad = { name: names.you, players: you, budgetLeft: youBudget };
    const away: Squad = { name: names.ai, players: ai, budgetLeft: aiBudget };
    setResult(simulateMatch(home, away, Date.now()));
    setPhase("match");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => phase !== "auction" && setPhase("setup")}>
          <span className="brand__mark">⚽</span>
          <span className="brand__name">FUTBOL<span>MEZATI</span></span>
        </div>
        {phase === "draft" ? (
          <nav className="topnav"><span className="active">🎯 Görev Draftı</span></nav>
        ) : (
        <nav className="topnav">
          <span className={phase === "setup" ? "active" : ""}>1 · Kurulum</span>
          <span className={phase === "auction" ? "active" : ""}>2 · Mezat</span>
          <span className={phase === "ready" ? "active" : ""}>3 · Kadrolar</span>
          <span className={phase === "match" ? "active" : ""}>4 · Maç</span>
        </nav>
        )}
        <div className="topbar__badge">🇹🇷 {phase === "draft" ? "DRAFT" : `${mode === "local" ? "2 OYUNCU" : "AI"} · ₺${budget}M`}</div>
      </header>

      <main className="main">
        {phase === "setup" && (
          <SetupScreen
            mode={mode}
            onMode={setMode}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            budget={budget}
            onBudget={setBudget}
            onStart={() => setPhase("auction")}
            onDraft={() => setPhase("draft")}
          />
        )}
        {phase === "auction" && (
          <AuctionScreen
            key={`${mode}-${budget}`}
            mode={mode}
            difficulty={difficulty}
            budget={budget}
            onFinish={(y, a, yb, ab) => {
              setYou(y); setAi(a); setYouBudget(yb); setAiBudget(ab); setPhase("ready");
            }}
          />
        )}
        {phase === "ready" && (
          <ReadyScreen
            you={you} ai={ai} youBudget={youBudget} aiBudget={aiBudget}
            names={names} onStart={startMatch}
          />
        )}
        {phase === "match" && result && (
          <MatchScreen result={result} mode={mode} onRestart={() => setPhase("setup")} />
        )}
        {phase === "draft" && <DraftScreen onExit={() => setPhase("setup")} />}
      </main>

      <footer className="footer">
        Gerçek futbolcular · FIFA tarzı özellikler · Ücretsiz hayran yapımı, resmî değildir.
      </footer>
    </div>
  );
}
