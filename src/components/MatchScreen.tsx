import type { Mode } from "../types";
import type { MatchResult } from "../game/match";
import CompareBar from "./CompareBar";
import Pitch from "./Pitch";

interface Props {
  result: MatchResult;
  mode: Mode;
  onRestart: () => void;
}

export default function MatchScreen({ result, mode, onRestart }: Props) {
  const { home, away, ratingsHome: rh, ratingsAway: ra } = result;
  const homeWin = result.winner === "home";
  const title = mode === "local"
    ? `${homeWin ? home.name : away.name} Kazandı!`
    : homeWin ? "Kazandın!" : "Maçı kaybettin";

  return (
    <div className="screen match">
      <div className="match-head">
        <span className="eyebrow">MAÇ SONUCU · 11'e 11</span>
        <h1>{title}</h1>
      </div>

      <div className="scoreboard">
        <div className={`scoreboard__team ${homeWin ? "is-winner" : ""}`}>
          <div className="scoreboard__crest">{home.name.slice(0, 1)}</div>
          <div className="scoreboard__name">{home.name}</div>
          <div className="scoreboard__tag">{mode === "local" ? "OYUNCU 1" : "SEN"}</div>
        </div>
        <div className="scoreboard__center">
          <div className="scoreboard__score">
            <span className={homeWin ? "win" : ""}>{result.homeGoals}</span>
            <i>:</i>
            <span className={!homeWin ? "win" : ""}>{result.awayGoals}</span>
          </div>
          {result.penalty && (
            <div className="scoreboard__pen">PEN {result.penalty.home}-{result.penalty.away}</div>
          )}
          <div className="scoreboard__full">MAÇ TAMAMLANDI</div>
        </div>
        <div className={`scoreboard__team ${!homeWin ? "is-winner" : ""}`}>
          <div className="scoreboard__crest scoreboard__crest--ai">{away.name.slice(0, 1)}</div>
          <div className="scoreboard__name">{away.name}</div>
          <div className="scoreboard__tag">{mode === "local" ? "OYUNCU 2" : "RAKİP"}</div>
        </div>
      </div>

      <div className="match-grid">
        <section className="panel match-stats">
          <h2 className="panel__title">MAÇ İSTATİSTİKLERİ</h2>
          <CompareBar label="Genel güç" home={rh.overall} away={ra.overall} />
          <CompareBar label="Hücum" home={rh.attack} away={ra.attack} />
          <CompareBar label="Orta saha" home={rh.midfield} away={ra.midfield} />
          <CompareBar label="Savunma" home={rh.defense} away={ra.defense} />
          <CompareBar label="Kaleci" home={rh.gk} away={ra.gk} />
          <CompareBar label="Beklenen gol (xG)" home={result.homeXg} away={result.awayXg} />
          <CompareBar label="Şut" home={result.homeShots} away={result.awayShots} />
          <CompareBar label="Topla oynama %" home={result.possessionHome} away={100 - result.possessionHome} suffix="%" />

          <div className="scorers">
            <div>
              <b>{home.name}</b>
              {result.scorersHome.length ? result.scorersHome.map((n, i) => <span key={i}>⚽ {n}</span>) : <span className="muted">Gol yok</span>}
            </div>
            <div>
              <b>{away.name}</b>
              {result.scorersAway.length ? result.scorersAway.map((n, i) => <span key={i}>⚽ {n}</span>) : <span className="muted">Gol yok</span>}
            </div>
          </div>
        </section>

        <section className="panel match-events">
          <h2 className="panel__title">MAÇ AKIŞI</h2>
          <div className="event-list">
            {result.events.map((e, i) => (
              <div className={`event event--${e.kind} ${e.team ? `event--${e.team}` : ""}`} key={i}>
                <span className="event__min">{e.minute}'</span>
                <span className="event__text">{e.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel match-lineups">
        <h2 className="panel__title">SAHA DİZİLİŞİ</h2>
        <Pitch
          home={{ name: home.name, players: home.players, scorers: result.scorersHome }}
          away={{ name: away.name, players: away.players, scorers: result.scorersAway }}
        />
      </section>

      <div className="match-footer">
        <button className="btn btn--primary btn--hero" onClick={onRestart}>YENİ MEZAT <span>↻</span></button>
      </div>
    </div>
  );
}
