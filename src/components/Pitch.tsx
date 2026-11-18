import type { Broad, Player } from "../types";
import PlayerPortrait from "./PlayerPortrait";

const LINES: Broad[] = ["GK", "DF", "MF", "FW"];

interface Team { name: string; players: Player[]; scorers: string[] }

function countGoals(scorers: string[], name: string) {
  return scorers.filter((s) => s === name).length;
}

function Half({ team, side }: { team: Team; side: "home" | "away" }) {
  // Ev sahibi aşağıda (kaleci en altta), deplasman yukarıda (kaleci en üstte).
  const order = side === "home" ? [...LINES].reverse() : LINES;
  return (
    <div className={`pitch__half pitch__half--${side}`}>
      {order.map((line) => {
        const ps = team.players.filter((p) => p.broad === line);
        if (!ps.length) return null;
        return (
          <div className="pitch__line" key={line}>
            {ps.map((p) => {
              const g = countGoals(team.scorers, p.name);
              return (
                <div className="pitch__player" key={p.id} title={`${p.name} · ${p.position} · OVR ${p.ovr} · ${p.club}`}>
                  <div className="pitch__token">
                    <PlayerPortrait player={p} size="sm" showBadge={false} />
                    <span className="pitch__ovr">{p.ovr}</span>
                    {g > 0 && <span className="pitch__goals">⚽{g > 1 ? `×${g}` : ""}</span>}
                  </div>
                  <span className="pitch__name">{p.name.split(" ").slice(-1)[0]}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Pitch({ home, away }: { home: Team; away: Team }) {
  return (
    <div className="pitch">
      <div className="pitch__label pitch__label--away">{away.name}</div>
      <div className="pitch__field">
        <div className="pitch__markings"><i className="pitch__circle" /><i className="pitch__box pitch__box--top" /><i className="pitch__box pitch__box--bottom" /></div>
        <Half team={away} side="away" />
        <Half team={home} side="home" />
      </div>
      <div className="pitch__label pitch__label--home">{home.name}</div>
    </div>
  );
}
