import type { Player } from "../types";
import { rateSquad } from "../game/match";
import PlayerCard from "./PlayerCard";
import CompareBar from "./CompareBar";

const LINE_ORDER = { GK: 0, DF: 1, MF: 2, FW: 3 } as const;
const byLine = (ps: Player[]) => [...ps].sort((a, b) => LINE_ORDER[a.broad] - LINE_ORDER[b.broad] || b.ovr - a.ovr);

interface Props {
  you: Player[];
  ai: Player[];
  youBudget: number;
  aiBudget: number;
  names: { you: string; ai: string };
  onStart: () => void;
}

export default function ReadyScreen({ you, ai, youBudget, aiBudget, names, onStart }: Props) {
  const rh = rateSquad(you);
  const ra = rateSquad(ai);

  return (
    <div className="screen ready">
      <div className="ready-head">
        <span className="eyebrow">MEZAT TAMAMLANDI</span>
        <h1>Kadrolar hazır</h1>
        <p>Maç, futbolcuların FIFA tarzı özelliklerine göre saniyeler içinde simüle edilir.</p>
        {(you.some((p) => p.auto) || ai.some((p) => p.auto)) && (
          <div className="coverage-note">
            ⚠️ Eksik kategoriler en uygun oyuncuyla otomatik tamamlandı (kartlarda <b>OTOMATİK</b> rozeti).
          </div>
        )}
        <button className="btn btn--primary btn--hero" onClick={onStart}>
          MAÇI BAŞLAT <span>⚽</span>
        </button>
      </div>

      <section className="panel h2h">
        <div className="h2h__head">
          <span className="h2h__team h2h__team--you">{names.you}</span>
          <h2 className="panel__title">KAFA KAFAYA</h2>
          <span className="h2h__team h2h__team--ai">{names.ai}</span>
        </div>
        <CompareBar label="Genel" home={rh.overall} away={ra.overall} />
        <CompareBar label="Hücum" home={rh.attack} away={ra.attack} />
        <CompareBar label="Orta saha" home={rh.midfield} away={ra.midfield} />
        <CompareBar label="Savunma" home={rh.defense} away={ra.defense} />
        <CompareBar label="Kaleci" home={rh.gk} away={ra.gk} />
      </section>

      <div className="ready-grid">
        {[
          { label: `${names.you.toUpperCase()} KADROSU`, players: you, rating: rh, budget: youBudget, side: "you" },
          { label: `${names.ai.toUpperCase()} KADROSU`, players: ai, rating: ra, budget: aiBudget, side: "ai" },
        ].map((t) => (
          <section className={`panel ready-team ready-team--${t.side}`} key={t.label}>
            <div className="ready-team__head">
              <h2 className="panel__title">{t.label}</h2>
              <div className="ready-team__score">
                <span>GENEL</span>
                <b>{t.rating.overall}</b>
              </div>
            </div>
            <div className="ready-team__stats">
              <span>Hücum <b>{t.rating.attack}</b></span>
              <span>Orta <b>{t.rating.midfield}</b></span>
              <span>Savunma <b>{t.rating.defense}</b></span>
              <span>Kaleci <b>{t.rating.gk}</b></span>
              <span>Kimya <b>+{t.rating.chem}</b></span>
              <span>Bütçe <b>₺{t.budget}M</b></span>
            </div>
            <div className="ready-team__cards">
              {byLine(t.players).map((p) => (
                <PlayerCard key={p.id} player={p} compact />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
