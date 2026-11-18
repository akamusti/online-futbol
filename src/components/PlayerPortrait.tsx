import { useState } from "react";
import type { Player } from "../types";
import { flagOf } from "../data/players";

function hueOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

interface Props {
  player: Player;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

export default function PlayerPortrait({ player, size = "md", showBadge = true }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = player.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = hueOf(player.nation + player.club);

  return (
    <div className={`portrait portrait--${size}`}>
      {!failed && player.photo ? (
        <img src={player.photo} alt={player.name} onError={() => setFailed(true)} loading="lazy" />
      ) : (
        <div
          className="portrait__fallback"
          style={{
            background: `linear-gradient(155deg, hsl(${hue} 55% 30%), hsl(${(hue + 45) % 360} 60% 12%))`,
          }}
        >
          <span className="portrait__initials">{initials}</span>
          <span className="portrait__shine" />
        </div>
      )}
      <div className="portrait__fade" />
      {showBadge && <span className={`pos-badge pos-badge--${player.broad}`}>{player.position}</span>}
      <span className="portrait__flag" title={player.nation}>{flagOf(player.nation)}</span>
    </div>
  );
}
