import { useEffect, useRef, useState } from "react";
import type { Player } from "../types";
import type { Club, DraftPlayer } from "../data/draft";
import { broadOf, slugify } from "../data/players";
import {
  LINES, LINE_SHORT, lineOf,
  type Formation, type FormationId, type PickMode, type Task, type TaskId, type TimerSec,
} from "../game/draft";

export const COLORS = ["#22c55e", "#60a5fa", "#f5b942", "#f472b6"];

export interface Config {
  names: string[];
  task: TaskId;
  formation: FormationId;
  hide: boolean;
  clubs: Club[];
  mode: PickMode;
  timer: TimerSec;
  budget: number;
}

export interface Pick {
  player: DraftPlayer;
  by: number;
  /** Mezatta ödenen tutar. */
  price?: number;
  /** Süre dolduğunda ya da mezat sonunda otomatik atandı. */
  auto?: boolean;
}

export const squadsOf = (picks: Pick[], n: number) =>
  Array.from({ length: n }, (_, i) => picks.filter((p) => p.by === i).map((p) => p.player));

/** Draft oyuncusunu portre bileşeninin beklediği biçime çevirir. */
export function asPortrait(p: DraftPlayer): Player {
  return {
    id: p.id, name: p.name, nation: p.nation, club: p.clubs.join(""), league: "",
    position: p.position, broad: broadOf(p.position), age: 0, ovr: 0,
    attrs: { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 }, value: 0,
    photo: `${import.meta.env.BASE_URL}photos/${slugify(p.name)}.png`,
  };
}

export function ClubBadge({ club, small = false }: { club: Club; small?: boolean }) {
  return (
    <span
      className={`club-badge ${small ? "club-badge--sm" : ""}`}
      style={{ "--c1": club.colors[0], "--c2": club.colors[1] } as React.CSSProperties}
    >
      <i />{club.name}
    </span>
  );
}

export const pc = (i: number) => ({ "--pc": COLORS[i] } as React.CSSProperties);

/**
 * Geri sayım: `resetKey` değiştikçe baştan başlar, süre dolunca `onExpire` bir kez çağrılır.
 * `seconds` 0 ise kapalıdır.
 */
export function useCountdown(seconds: number, resetKey: unknown, onExpire: () => void, paused = false) {
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (!seconds || paused) return;
    const deadline = Date.now() + seconds * 1000;
    let fired = false;
    setLeft(seconds);
    const t = setInterval(() => {
      const ms = deadline - Date.now();
      setLeft(Math.max(0, ms / 1000));
      if (ms <= 0 && !fired) {
        fired = true;
        clearInterval(t);
        expire.current();
      }
    }, 100);
    return () => clearInterval(t);
  }, [seconds, resetKey, paused]);

  return left;
}

export function TimerBar({ left, total }: { left: number; total: number }) {
  if (!total) return null;
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className={`timer ${left <= 5 ? "timer--low" : ""}`}>
      <span className="timer__num">{Math.ceil(left)}</span>
      <div className="timer__track"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function SquadBoard({ name, index, squad, active, formation, hide, task, extra }: {
  name: string; index: number; squad: DraftPlayer[]; active: boolean;
  formation: Formation; hide: boolean; task: Task; extra?: React.ReactNode;
}) {
  const groups = formation.any
    ? [{ label: "SERBEST", players: squad, cap: formation.any }]
    : LINES.filter((l) => formation.slots[l]).map((l) => ({
      label: LINE_SHORT[l], players: squad.filter((p) => lineOf(p) === l), cap: formation.slots[l] ?? 0,
    }));
  return (
    <div className={`panel squad-board ${active ? "is-active" : ""}`} style={pc(index)}>
      <div className="squad-board__head">
        <b>{name}</b>
        {!hide && squad.length > 0 && <span>{task.format(task.score(squad))}</span>}
      </div>
      {extra}
      {groups.map((g) => (
        <div className="squad-board__line" key={g.label}>
          <span className="squad-board__label">{g.label}</span>
          <div className="squad-board__slots">
            {Array.from({ length: g.cap }).map((_, k) => {
              const p = g.players[k];
              return p ? (
                <span className="squad-board__slot" key={p.id} title={p.name}>{p.name.split(" ").slice(-1)[0]}</span>
              ) : (
                <span className="squad-board__slot is-empty" key={k}>—</span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
