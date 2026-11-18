import type { Broad, Player } from "../types";

export interface Squad {
  name: string;
  players: Player[];
  budgetLeft: number;
}

export interface TeamRatings {
  attack: number;
  midfield: number;
  defense: number;
  gk: number;
  chem: number;
  overall: number;
}

export interface MatchEvent {
  minute: number;
  text: string;
  kind: "goal" | "chance" | "save" | "info";
  team?: "home" | "away";
}

export interface MatchResult {
  home: Squad;
  away: Squad;
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
  homeShots: number;
  awayShots: number;
  possessionHome: number;
  ratingsHome: TeamRatings;
  ratingsAway: TeamRatings;
  events: MatchEvent[];
  winner: "home" | "away" | "draw";
  scorersHome: string[];
  scorersAway: string[];
  penalty?: { home: number; away: number; winner: "home" | "away" };
}

/** Deterministik RNG — aynı tohum aynı maçı üretir. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rnd: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L && k < 20);
  return k - 1;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 60);
const round1 = (n: number) => Math.round(n * 10) / 10;

function group(p: Player): Broad { return p.broad; }

export function rateSquad(players: Player[]): TeamRatings {
  const gkPool = players.filter((p) => group(p) === "GK");
  const defPool = players.filter((p) => group(p) === "DF");
  const midPool = players.filter((p) => group(p) === "MF");
  const fwPool = players.filter((p) => group(p) === "FW");

  const atkStats = [...fwPool, ...midPool.filter((p) => p.position === "CAM")];
  const attack = atkStats.length
    ? avg(atkStats.map((p) => 0.32 * p.attrs.sho + 0.26 * p.attrs.dri + 0.24 * p.attrs.pas + 0.18 * p.attrs.pac))
    : avg(players.map((p) => 0.4 * p.attrs.sho + 0.35 * p.attrs.dri + 0.25 * p.attrs.pas)) * 0.8;

  const midStats = [...midPool, ...defPool.filter((p) => p.position === "CDM")];
  const midfield = midStats.length
    ? avg(midStats.map((p) => 0.45 * p.attrs.pas + 0.35 * p.attrs.dri + 0.2 * p.attrs.def))
    : avg(players.map((p) => 0.6 * p.attrs.pas + 0.4 * p.attrs.dri)) * 0.85;

  const defStats = [...defPool, ...midPool.filter((p) => p.position === "CDM")];
  const defense = defStats.length
    ? avg(defStats.map((p) => 0.4 * p.attrs.def + 0.32 * p.attrs.phy + 0.28 * p.attrs.pac))
    : avg(players.map((p) => 0.5 * p.attrs.def + 0.5 * p.attrs.phy)) * 0.8;

  const gk = gkPool.length
    ? avg(gkPool.map((p) => 0.4 * p.attrs.def + 0.35 * p.attrs.phy + 0.25 * p.attrs.pas))
    : 62;

  // Kimya: aynı kulüp / aynı ülke eşleşmeleri.
  let chem = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (players[i].club === players[j].club) chem += 1.6;
      else if (players[i].nation === players[j].nation) chem += 0.8;
    }
  }
  chem = Math.min(chem, 8);

  const overall = 0.34 * attack + 0.28 * midfield + 0.26 * defense + 0.12 * gk + chem;
  return {
    attack: Math.round(attack), midfield: Math.round(midfield),
    defense: Math.round(defense), gk: Math.round(gk),
    chem: round1(chem), overall: Math.round(overall),
  };
}

function pickScorer(players: Player[], rnd: () => number, fallback = "Yedek oyuncu"): string {
  const cand = players.filter((p) => group(p) !== "GK");
  const pool = cand.length ? cand : players;
  if (!pool.length) return fallback;
  const weights = pool.map((p) => Math.pow(p.attrs.sho, 2) + (group(p) === "FW" ? 400 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i].name;
  }
  return pool[pool.length - 1].name;
}

export function simulateMatch(home: Squad, away: Squad, seed = Date.now()): MatchResult {
  const rnd = mulberry32(seed);
  const rh = rateSquad(home.players);
  const ra = rateSquad(away.players);

  // Beklenen gol: kendi atak gücü + rakip savunma zayıflığı.
  const xgHome = Math.max(0.25, Math.min(4.5, 1.55 + (rh.attack - ra.defense) * 0.045 + (rnd() - 0.5) * 0.5));
  const xgAway = Math.max(0.25, Math.min(4.5, 1.55 + (ra.attack - rh.defense) * 0.045 + (rnd() - 0.5) * 0.5));

  let hg = poisson(xgHome, rnd);
  let ag = poisson(xgAway, rnd);
  const shotsH = Math.max(hg, Math.round(xgHome * (3.4 + rnd() * 1.8)));
  const shotsA = Math.max(ag, Math.round(xgAway * (3.4 + rnd() * 1.8)));
  const possH = Math.round(50 + (rh.midfield - ra.midfield) * 0.7 + (rnd() - 0.5) * 6);
  const possessionHome = Math.max(32, Math.min(68, possH));

  const events: MatchEvent[] = [];
  const scorersHome: string[] = [];
  const scorersAway: string[] = [];

  events.push({ minute: 1, kind: "info", text: "Maç başladı. 11'er kişilik kadrolar sahada." });

  // Dağıtılmış gol dakikaları.
  const goalMinutes = (n: number) => {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(4 + Math.floor(rnd() * 85));
    return arr.sort((a, b) => a - b);
  };
  const gh = goalMinutes(hg).map((m) => ({ m, side: "home" as const }));
  const ga = goalMinutes(ag).map((m) => ({ m, side: "away" as const }));
  const goals = [...gh, ...ga].sort((a, b) => a.m - b.m);

  // Birkaç gol kaçırma / kurtarış olayı.
  const chanceCount = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < chanceCount; i++) {
    const side = rnd() < 0.5 ? "home" : "away";
    const min = 6 + Math.floor(rnd() * 80);
    const team = side === "home" ? home : away;
    const shooter = pickScorer(team.players, rnd);
    const isSave = rnd() < 0.5;
    events.push({
      minute: min,
      kind: isSave ? "save" : "chance",
      team: side,
      text: isSave
        ? `${team.name} — ${shooter} şutu kaleci tarafından kurtarıldı.`
        : `${team.name} — ${shooter} iyi bir pozisyonu değerlendiremedi.`,
    });
  }

  for (const g of goals) {
    if (g.side === "home") {
      const s = pickScorer(home.players, rnd);
      scorersHome.push(s);
      events.push({ minute: g.m, kind: "goal", team: "home", text: `GOL! ${home.name} — ${s} ağları havalandırdı.` });
    } else {
      const s = pickScorer(away.players, rnd);
      scorersAway.push(s);
      events.push({ minute: g.m, kind: "goal", team: "away", text: `GOL! ${away.name} — ${s} ağları havalandırdı.` });
    }
  }
  events.sort((a, b) => a.minute - b.minute);
  events.push({ minute: 90, kind: "info", text: "Maç sona erdi." });

  let winner: "home" | "away" | "draw" = hg > ag ? "home" : ag > hg ? "away" : "draw";
  let penalty: MatchResult["penalty"];

  if (winner === "draw") {
    // Berabereyse kısa penaltı atışlarıyla kazanan belirlenir.
    const pH = Math.round(Math.max(1, Math.min(5, (rh.attack / 20) - 0.5 + rnd() * 2)));
    let pA = Math.round(Math.max(1, Math.min(5, (ra.attack / 20) - 0.5 + rnd() * 2)));
    if (pH === pA) pA = pH >= 5 ? pH - 1 : pH + 1;
    penalty = { home: pH, away: pA, winner: pH > pA ? "home" : "away" };
    winner = penalty.winner;
    events.push({
      minute: 90, kind: "info",
      text: `Penaltı atışları: ${home.name} ${pH}-${pA} ${away.name}. Kazanan: ${penalty.winner === "home" ? home.name : away.name}.`,
    });
  }

  return {
    home, away, homeGoals: hg, awayGoals: ag,
    homeXg: round1(xgHome), awayXg: round1(xgAway),
    homeShots: shotsH, awayShots: shotsA, possessionHome,
    ratingsHome: rh, ratingsAway: ra, events, winner,
    scorersHome, scorersAway, penalty,
  };
}
