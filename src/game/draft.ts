import type { Broad } from "../types";
import { broadOf } from "../data/players";
import { CLUBS, DRAFT_PLAYERS, type Club, type ClubId, type DraftPlayer } from "../data/draft";

// ── Görevler ────────────────────────────────────────────────
export type TaskId = "uzun" | "kisa" | "dkgol";

export interface Task {
  id: TaskId;
  label: string;
  desc: string;
  icon: string;
  /** Takım puanı. */
  score: (ps: DraftPlayer[]) => number;
  /** Tek oyuncunun bu görevdeki değeri (listede gösterilir). */
  value: (p: DraftPlayer) => number;
  format: (n: number) => string;
  /** Tek oyuncunun değerini yazar. */
  formatValue: (n: number) => string;
  higherWins: boolean;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const TASKS: Task[] = [
  {
    id: "uzun", label: "En uzun boylu takım", icon: "📏",
    desc: "Takımın boy ortalaması en yüksek olan kazanır.",
    score: (ps) => avg(ps.map((p) => p.height)),
    value: (p) => p.height,
    format: (n) => `${n.toFixed(1).replace(".", ",")} cm`,
    formatValue: (n) => `${n} cm`,
    higherWins: true,
  },
  {
    id: "kisa", label: "En kısa boylu takım", icon: "🤏",
    desc: "Takımın boy ortalaması en düşük olan kazanır.",
    score: (ps) => avg(ps.map((p) => p.height)),
    value: (p) => p.height,
    format: (n) => `${n.toFixed(1).replace(".", ",")} cm`,
    formatValue: (n) => `${n} cm`,
    higherWins: false,
  },
  {
    id: "dkgol", label: "En çok Dünya Kupası golü", icon: "🏆",
    desc: "Oyuncuların Dünya Kupası'nda attığı toplam gol en fazla olan kazanır.",
    score: (ps) => ps.reduce((a, p) => a + p.wcGoals, 0),
    value: (p) => p.wcGoals,
    format: (n) => `${n} gol`,
    formatValue: (n) => `${n} gol`,
    higherWins: true,
  },
];

export const TASK_BY_ID = new Map(TASKS.map((t) => [t.id, t]));

// ── Dizilişler ──────────────────────────────────────────────
export type FormationId = "222" | "1221" | "433" | "free5";

export interface Formation {
  id: FormationId;
  label: string;
  desc: string;
  /** Mevki başına kontenjan. `any` doluysa mevki serbesttir. */
  slots: Partial<Record<Broad, number>>;
  any?: number;
}

export const FORMATIONS: Formation[] = [
  { id: "222", label: "2 DF · 2 OS · 2 FV", desc: "6 kişi, kalecisiz", slots: { DF: 2, MF: 2, FW: 2 } },
  { id: "1221", label: "1 KL · 2 DF · 2 OS · 1 FV", desc: "6 kişi, kaleciyle", slots: { GK: 1, DF: 2, MF: 2, FW: 1 } },
  { id: "433", label: "1 KL · 4 DF · 3 OS · 3 FV", desc: "Tam 11 · 4-3-3", slots: { GK: 1, DF: 4, MF: 3, FW: 3 } },
  { id: "free5", label: "Serbest 5", desc: "Mevki sınırı yok", slots: {}, any: 5 },
];

export const FORMATION_BY_ID = new Map(FORMATIONS.map((f) => [f.id, f]));

export const LINES: Broad[] = ["GK", "DF", "MF", "FW"];
export const LINE_SHORT: Record<Broad, string> = { GK: "KL", DF: "DF", MF: "OS", FW: "FV" };

export const squadSize = (f: Formation) =>
  f.any ?? LINES.reduce((a, l) => a + (f.slots[l] ?? 0), 0);

export const lineOf = (p: DraftPlayer): Broad => broadOf(p.position);

/** Oyuncu bu kadroya bu dizilişte eklenebilir mi? */
export function fits(f: Formation, squad: DraftPlayer[], p: DraftPlayer): boolean {
  if (squad.length >= squadSize(f)) return false;
  if (f.any) return true;
  const line = lineOf(p);
  const cap = f.slots[line] ?? 0;
  return squad.filter((x) => lineOf(x) === line).length < cap;
}

// ── Kulüp kurası ────────────────────────────────────────────
export const CLUB_COUNT = 5;
export const TURKISH_IN_DRAW = 2;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function poolFor(clubIds: ClubId[]): DraftPlayer[] {
  const set = new Set(clubIds);
  return DRAFT_PLAYERS.filter((p) => p.clubs.some((c) => set.has(c)));
}

/** Seçilen kulüplerin havuzu, herkesin kadrosunu doldurmaya yetiyor mu? */
export function poolSuffices(pool: DraftPlayer[], f: Formation, players: number): boolean {
  if (f.any) return pool.length >= f.any * players;
  return LINES.every((l) => pool.filter((p) => lineOf(p) === l).length >= (f.slots[l] ?? 0) * players);
}

/** 2 Türk + 3 yabancı kulüp çeker; havuz yetmezse yeniden çeker. */
export function drawClubs(f: Formation, players: number): Club[] {
  const tr = CLUBS.filter((c) => c.turkish);
  const other = CLUBS.filter((c) => !c.turkish);
  let pick: Club[] = [];
  for (let i = 0; i < 100; i++) {
    pick = [...shuffle(tr).slice(0, TURKISH_IN_DRAW), ...shuffle(other).slice(0, CLUB_COUNT - TURKISH_IN_DRAW)];
    if (poolSuffices(poolFor(pick.map((c) => c.id)), f, players)) break;
  }
  return pick;
}

// ── Sıra (yılan draft) ─────────────────────────────────────
/** pickIndex. seçimde sıranın kimde olduğunu döner: 1-2-3, 3-2-1, 1-2-3 ... */
export function turnOf(pickIndex: number, players: number): number {
  const round = Math.floor(pickIndex / players);
  const pos = pickIndex % players;
  return round % 2 === 0 ? pos : players - 1 - pos;
}

// ── Sonuç ───────────────────────────────────────────────────
export interface Standing { index: number; score: number; rank: number }

export function standings(task: Task, squads: DraftPlayer[][]): Standing[] {
  const rows = squads.map((sq, index) => ({ index, score: task.score(sq), rank: 0 }));
  const key = (n: number) => Math.round(n * 100);
  rows.sort((a, b) => (task.higherWins ? b.score - a.score : a.score - b.score));
  rows.forEach((r, i) => {
    r.rank = i > 0 && key(r.score) === key(rows[i - 1].score) ? rows[i - 1].rank : i + 1;
  });
  return rows;
}
