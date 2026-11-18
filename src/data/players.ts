import type { Broad, Player, PlayerRow, Position } from "../types";
import { ROWS } from "./rows";

/** Ülke kodunu bayrak emoji'sine çevirir. */
const FLAGS: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", FRA: "🇫🇷", GER: "🇩🇪", ESP: "🇪🇸", ITA: "🇮🇹", ENG: "🏴",
  NED: "🇳🇱", POR: "🇵🇹", BEL: "🇧🇪", CRO: "🇭🇷", SUI: "🇨🇭", DEN: "🇩🇰", CZE: "🇨🇿",
  USA: "🇺🇸", SWE: "🇸🇪", NOR: "🇳🇴", POL: "🇵🇱", EGY: "🇪🇬", KOR: "🇰🇷", JPN: "🇯🇵",
  URU: "🇺🇾", COL: "🇨🇴", MEX: "🇲🇽", CAN: "🇨🇦", SCO: "🏴", IRL: "🇮🇪", MAR: "🇲🇦",
  CIV: "🇨🇮", CMR: "🇨🇲", NGA: "🇳🇬", SEN: "🇸🇳", GHA: "🇬🇭", ALG: "🇩🇿", TUN: "🇹🇳",
  COD: "🇨🇩", GEO: "🇬🇪", SRB: "🇷🇸", HUN: "🇭🇺", TUR: "🇹🇷", SVN: "🇸🇮", ECU: "🇪🇨",
  GUI: "🇬🇳",
  BIH: "🇧🇦", SVK: "🇸🇰", WAL: "🏴", BUL: "🇧🇬", MNE: "🇲🇪", CRC: "🇨🇷", FIN: "🇫🇮", NIR: "🇬🇧",
  CHI: "🇨🇱", PAR: "🇵🇾", PER: "🇵🇪", GRE: "🇬🇷", ROU: "🇷🇴", UKR: "🇺🇦", AUT: "🇦🇹",
};
export const flagOf = (code: string) => FLAGS[code] ?? "⚽";

/** Mevki -> geniş grup. */
export function broadOf(pos: Position): Broad {
  if (pos === "GK") return "GK";
  if (pos === "CB" || pos === "LB" || pos === "RB") return "DF";
  if (pos === "CM" || pos === "CDM" || pos === "CAM") return "MF";
  return "FW";
}

/** Her mevki için referans yetenek dağılımı (85 overall civarı). */
type Profile = Record<"pac" | "sho" | "pas" | "dri" | "def" | "phy", number>;
const PROFILES: Record<Position, Profile> = {
  GK: { pac: 55, sho: 24, pas: 64, dri: 36, def: 86, phy: 83 },
  CB: { pac: 71, sho: 50, pas: 68, dri: 62, def: 88, phy: 86 },
  LB: { pac: 84, sho: 60, pas: 79, dri: 76, def: 76, phy: 77 },
  RB: { pac: 84, sho: 60, pas: 79, dri: 76, def: 76, phy: 77 },
  CDM: { pac: 69, sho: 62, pas: 82, dri: 72, def: 86, phy: 85 },
  CM: { pac: 75, sho: 73, pas: 84, dri: 80, def: 72, phy: 78 },
  CAM: { pac: 79, sho: 84, pas: 86, dri: 86, def: 50, phy: 66 },
  LW: { pac: 89, sho: 81, pas: 78, dri: 87, def: 45, phy: 68 },
  RW: { pac: 89, sho: 81, pas: 78, dri: 87, def: 45, phy: 68 },
  ST: { pac: 84, sho: 88, pas: 70, dri: 81, def: 44, phy: 80 },
};

/** İsimden deterministik küçük sapma üretir (aynı oyuncu her zaman aynı çıkar). */
function jitter(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h % 7) - 3; // -3..+3
}

const clamp = (n: number, lo = 20, hi = 99) => Math.max(lo, Math.min(hi, Math.round(n)));

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Kulüp -> lig eşlemesi. Yeni kulüp eklenirse buraya da ekle. */
const LEAGUES: Record<string, string> = {
  Efsane: "Efsane",
  Bayern: "Bundesliga", Dortmund: "Bundesliga", Leverkusen: "Bundesliga", "RB Leipzig": "Bundesliga",
  Liverpool: "Premier Lig", "Man City": "Premier Lig", Chelsea: "Premier Lig", "Man Utd": "Premier Lig",
  Arsenal: "Premier Lig", Tottenham: "Premier Lig", "Aston Villa": "Premier Lig", Newcastle: "Premier Lig",
  Everton: "Premier Lig", Brentford: "Premier Lig", Nottingham: "Premier Lig", "Crystal Palace": "Premier Lig",
  "Real Madrid": "La Liga", Barcelona: "La Liga", Atletico: "La Liga", Athletic: "La Liga",
  PSG: "Ligue 1",
  "AC Milan": "Serie A", Inter: "Serie A", Juventus: "Serie A", Napoli: "Serie A",
  Porto: "Primeira Liga", Sporting: "Primeira Liga",
  Fenerbahce: "Süper Lig",
  "Al-Nassr": "Suudi Pro Lig", "Al-Hilal": "Suudi Pro Lig", "Al-Ittihad": "Suudi Pro Lig", "Al-Ahli": "Suudi Pro Lig",
  "Inter Miami": "MLS",
  Roma: "Serie A", Atalanta: "Serie A",
  Galatasaray: "Süper Lig",
  "West Ham": "Premier Lig",
  PSV: "Eredivisie",
  Benfica: "Primeira Liga",
  Stuttgart: "Bundesliga",
  Monaco: "Ligue 1",
};
export const leagueOf = (club: string): string => LEAGUES[club] ?? "Dünya";

function buildPlayer(row: PlayerRow, index: number): Player {
  const [name, nation, club, position, age, ovr] = row;
  const profile = PROFILES[position];
  const scale = ovr - 85;
  const j = (salt: number) => jitter(name, salt);
  const attrs = {
    pac: clamp(profile.pac + scale + j(1)),
    sho: clamp(profile.sho + scale + j(2)),
    pas: clamp(profile.pas + scale + j(3)),
    dri: clamp(profile.dri + scale + j(4)),
    def: clamp(profile.def + scale + j(5)),
    phy: clamp(profile.phy + scale + j(6)),
  };

  const ageFactor = age <= 23 ? 1.3 : age >= 33 ? 0.55 : 1;
  const value = Math.max(2, Math.round(Math.pow(ovr - 60, 2) * 0.045 * ageFactor));

  return {
    id: `p${index}`,
    name,
    nation,
    club,
    league: leagueOf(club),
    position,
    broad: broadOf(position),
    age,
    ovr,
    attrs,
    value,
    photo: `${import.meta.env.BASE_URL}photos/${slugify(name)}.png`,
  };
}

export const PLAYERS: Player[] = ROWS.map(buildPlayer);
export const PLAYER_BY_ID = new Map(PLAYERS.map((p) => [p.id, p]));

export const NATION_NAMES: Record<string, string> = {
  ARG: "Arjantin", BRA: "Brezilya", FRA: "Fransa", GER: "Almanya", ESP: "İspanya",
  ITA: "İtalya", ENG: "İngiltere", NED: "Hollanda", POR: "Portekiz", BEL: "Belçika",
  CRO: "Hırvatistan", SUI: "İsviçre", DEN: "Danimarka", CZE: "Çekya", USA: "ABD",
  SWE: "İsveç", NOR: "Norveç", POL: "Polonya", EGY: "Mısır", KOR: "Güney Kore",
  URU: "Uruguay", COL: "Kolombiya", MAR: "Fas", CIV: "Fildişi Sahili", CMR: "Kamerun",
  NGA: "Nijerya", COD: "Kongo DC", GEO: "Gürcistan", SRB: "Sırbistan", HUN: "Macaristan",
  TUR: "Türkiye", SVN: "Slovenya", ECU: "Ekvador", ALG: "Cezayir", SCO: "İskoçya",
  IRL: "İrlanda", CAN: "Kanada", JPN: "Japonya", GRE: "Yunanistan", UKR: "Ukrayna",
  GUI: "Gine",
};
