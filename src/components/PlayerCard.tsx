import type { Attributes, Player } from "../types";
import { NATION_NAMES, flagOf } from "../data/players";
import PlayerPortrait from "./PlayerPortrait";

const STAT_LABELS: Record<keyof Attributes, string> = {
  pac: "HIZ", sho: "ŞUT", pas: "PAS", dri: "TOP", def: "SAV", phy: "FİZ",
};

interface Props {
  player: Player;
  compact?: boolean;
  footer?: React.ReactNode;
  highlight?: boolean;
}

export default function PlayerCard({ player, compact = false, footer, highlight = false }: Props) {
  return (
    <div className={`player-card ${compact ? "player-card--compact" : ""} ${highlight ? "player-card--highlight" : ""}`}>
      <div className="player-card__media">
        <PlayerPortrait player={player} size={compact ? "md" : "lg"} />
        <span className="player-card__ovr">{player.ovr}</span>
      </div>
      <div className="player-card__body">
        <div className="player-card__name">{player.name}</div>
        <div className="player-card__meta">
          <span>{flagOf(player.nation)} {NATION_NAMES[player.nation] ?? player.nation}</span>
          <span className="dot">·</span>
          <span>{player.age} yaş</span>
        </div>
        <div className="player-card__club" title={`Şu an: ${player.club} · ${player.league}`}>
          <span className="club-icon">🏟️</span>
          <span className="club-name">{player.club}</span>
          {player.league !== player.club && <span className="club-league">{player.league}</span>}
          {player.auto && (
            <span className="auto-badge" title="Eksik kategoriyi tamamlamak için otomatik eklendi">
              OTOMATİK
            </span>
          )}
        </div>

        {!compact && (
          <div className="stat-grid">
            {(Object.keys(STAT_LABELS) as (keyof Attributes)[]).map((k) => (
              <div className="stat" key={k}>
                <span className="stat__label">{STAT_LABELS[k]}</span>
                <span className="stat__bar">
                  <span
                    className="stat__fill"
                    style={{ width: `${player.attrs[k]}%` }}
                    data-level={player.attrs[k] >= 85 ? "elite" : player.attrs[k] >= 70 ? "good" : "normal"}
                  />
                </span>
                <span className="stat__value">{player.attrs[k]}</span>
              </div>
            ))}
          </div>
        )}

        {footer !== undefined ? (
          footer
        ) : (
          !compact && (
            <div className="player-card__price">
              <span className="price-label">PİYASA DEĞERİ</span>
              <span className="price-value">₺{player.value}M</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
