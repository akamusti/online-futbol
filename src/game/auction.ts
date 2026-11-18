import type { Broad, Player } from "../types";

export const DEFAULT_BUDGET = 500; // milyon ₺ (11 kişilik kadro)
export const MIN_BUDGET = 110;
export const MAX_BUDGET = 20000;
export const SQUAD_SIZE = 11;
export const LOT_COUNT = 30;

export const clampBudget = (n: number) =>
  Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, Math.round(n)));

export type Difficulty = "kolay" | "orta" | "zor";
export const DIFFICULTY_VALUES: Record<Difficulty, number> = { kolay: 0.15, orta: 0.5, zor: 0.9 };

/** decisions sonucu: teklif yükselt veya geç. */
export interface AiDecision {
  action: "raise" | "pass";
  amount: number;
}

export function openingBid(player: Player): number {
  return Math.max(2, Math.round(player.value * 0.35));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CATEGORIES: Broad[] = ["GK", "DF", "MF", "FW"];
export const CATEGORY_NAMES: Record<Broad, string> = {
  GK: "Kaleci", DF: "Defans", MF: "Orta Saha", FW: "Forvet",
};

// Lot havuzunda her kategoriden en az bu kadar oyuncu bulunur.
const MIN_PER_CATEGORY: Record<Broad, number> = { GK: 4, DF: 7, MF: 7, FW: 7 };

/** Lot havuzu: rastgele ama her kategoriden bolca oyuncu içerir. */
export function createLots(players: Player[], count = LOT_COUNT): Player[] {
  const picked: Player[] = [];
  const used = new Set<string>();

  for (const cat of CATEGORIES) {
    const candidates = shuffle(players.filter((p) => p.broad === cat && !used.has(p.id)));
    for (const p of candidates.slice(0, MIN_PER_CATEGORY[cat])) {
      picked.push(p);
      used.add(p.id);
    }
  }

  const rest = shuffle(players.filter((p) => !used.has(p.id)));
  while (picked.length < count && rest.length) {
    const p = rest.pop()!;
    picked.push(p);
    used.add(p.id);
  }
  return shuffle(picked);
}

/** Eksik kategorileri en zayıf uygun oyuncuyla tamamlar (her takım için). */
export function ensureCategoryCoverage(squad: Player[], pool: Player[], usedIds: Set<string>): Player[] {
  let result = [...squad];

  for (const cat of CATEGORIES) {
    if (result.some((p) => p.broad === cat)) continue;

    const candidates = pool.filter(
      (p) => p.broad === cat && !usedIds.has(p.id) && !result.some((r) => r.id === p.id)
    );
    if (!candidates.length) continue;

    // "Kötü oyuncu da olur" — en düşük overall'lı olanı seç.
    const pick = candidates.reduce((a, b) => (b.ovr < a.ovr ? b : a));

    if (result.length >= SQUAD_SIZE) {
      // Kadroyu 11'de tutmak için en kalabalık gruptan en zayıfını çıkar.
      const counts: Record<string, number> = {};
      for (const p of result) counts[p.broad] = (counts[p.broad] ?? 0) + 1;
      const crowded = Object.keys(counts)
        .filter((k) => counts[k] > 1)
        .sort((a, b) => counts[b] - counts[a])[0];
      if (crowded) {
        const weakestIdx = result.reduce(
          (best, p, i) => (p.broad === crowded && p.ovr < result[best].ovr ? i : best),
          0
        );
        result.splice(weakestIdx, 1);
      }
    }

    result = [...result, { ...pick, auto: true }];
    usedIds.add(pick.id);
  }

  return result;
}

function needMultiplier(broad: Broad, squad: Player[]): number {
  const count = squad.filter((p) => p.broad === broad).length;
  if (count === 0) return 1.28;
  if (count === 1) return 1.08;
  if (count === 2) return 0.88;
  return 0.6;
}

export interface AiContext {
  player: Player;
  squad: Player[];
  budgetLeft: number;
  slotsLeft: number;
  currentBid: number;
  leader: "you" | "ai" | null;
  difficulty: Difficulty;
}

/** AI, mevcut teklife göre yükseltir ya da geçer. */
export function aiDecision(ctx: AiContext): AiDecision {
  if (ctx.slotsLeft <= 0) return { action: "pass", amount: 0 };

  const d = DIFFICULTY_VALUES[ctx.difficulty];
  const need = needMultiplier(ctx.player.broad, ctx.squad);
  const oppStrength = ctx.squad.length
    ? ctx.squad.reduce((a, p) => a + p.ovr, 0) / ctx.squad.length
    : 70;
  const quality = ctx.player.ovr > oppStrength + 4 ? 1.1 : 1;

  // Kalan slotlar için en az 4M bırak.
  const reserve = ctx.slotsLeft > 1 ? (ctx.slotsLeft - 1) * 4 : 0;
  const affordable = Math.max(0, ctx.budgetLeft - reserve);

  let willing = ctx.player.value * (0.78 + d * 0.3) * need * quality;
  willing = Math.min(willing, affordable);
  willing = Math.max(willing, openingBid(ctx.player));
  willing = Math.round(willing);

  const open = openingBid(ctx.player);
  const current = ctx.leader === null ? open : ctx.currentBid;

  if (current >= willing) return { action: "pass", amount: 0 };

  const room = willing - current;
  const step = Math.max(1, Math.min(5, 1 + Math.floor(room / 9) + Math.floor(d * 2)));
  const amount = Math.round(Math.min(willing, current + step));
  if (amount <= current) return { action: "pass", amount: 0 };
  return { action: "raise", amount };
}
