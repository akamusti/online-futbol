import type { Player } from "../types";
import { rateSquad } from "../game/match";
import PlayerCard from "./PlayerCard";

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
              {t.players.map((p) => (
                <PlayerCard key={p.id} player={p} compact />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
