import { useEffect, useReducer, useRef, useState } from "react";
import type { Broad, Mode, Player } from "../types";
import { PLAYERS } from "../data/players";
import {
  SQUAD_SIZE, LOT_COUNT, CATEGORIES, CATEGORY_NAMES, aiDecision, createLots, ensureCategoryCoverage, openingBid,
  type Difficulty,
} from "../game/auction";
import PlayerCard from "./PlayerCard";
import PlayerPortrait from "./PlayerPortrait";

type Side = "you" | "ai";
interface Names { you: string; ai: string }
interface LogEntry { id: number; text: string; side?: Side | "sys" }
interface LotWinner { player: Player; who: Side | null; price: number }

interface State {
  names: Names;
  lots: Player[];
  lotIndex: number;
  currentBid: number;
  leader: Side | null;
  turn: Side;
  passedYou: boolean;
  passedAi: boolean;
  youSquad: Player[];
  aiSquad: Player[];
  youBudget: number;
  aiBudget: number;
  log: LogEntry[];
  lotWinner: LotWinner | null;
  finished: boolean;
  logId: number;
}

type Action =
  | { type: "BID"; side: Side; amount: number }
  | { type: "PASS"; side: Side }
  | { type: "ADVANCE" };

const other = (s: Side): Side => (s === "you" ? "ai" : "you");
const nameOf = (s: State, side: Side) => s.names[side];
const squadOf = (s: State, side: Side) => (side === "you" ? s.youSquad : s.aiSquad);
const budgetOf = (s: State, side: Side) => (side === "you" ? s.youBudget : s.aiBudget);

function addLog(s: State, text: string, side?: Side | "sys"): LogEntry[] {
  return [...s.log, { id: s.logId, text, side }].slice(-40);
}

function setPassed(s: State, side: Side, value: boolean) {
  return side === "you" ? { ...s, passedYou: value } : { ...s, passedAi: value };
}

function resolveLot(s: State, who: Side | null): State {
  const player = s.lots[s.lotIndex];
  if (!who) {
    return {
      ...s, logId: s.logId + 1,
      log: addLog(s, `${player.name} teklif almadı — satılmadı.`, "sys"),
      lotWinner: { player, who: null, price: 0 },
    };
  }
  const price = s.currentBid;
  const isYou = who === "you";
  return {
    ...s,
    logId: s.logId + 1,
    youSquad: isYou ? [...s.youSquad, player] : s.youSquad,
    aiSquad: isYou ? s.aiSquad : [...s.aiSquad, player],
    youBudget: isYou ? s.youBudget - price : s.youBudget,
    aiBudget: isYou ? s.aiBudget : s.aiBudget - price,
    log: addLog(s, `${nameOf(s, who)} ${player.name} oyuncusunu ₺${price}M karşılığında aldı.`, who),
    lotWinner: { player, who, price },
  };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "BID": {
      const side = a.side;
      if (s.lotWinner || s.finished || s.turn !== side) return s;
      if (squadOf(s, side).length >= SQUAD_SIZE) return s;
      const amount = Math.round(a.amount);
      if (amount <= s.currentBid || amount > budgetOf(s, side)) return s;
      const next = setPassed(s, side, false);
      return {
        ...next, currentBid: amount, leader: side, turn: other(side),
        logId: s.logId + 1,
        log: addLog(s, `${nameOf(s, side)} ₺${amount}M teklif verdi.`, side),
      };
    }
    case "PASS": {
      const side = a.side;
      if (s.lotWinner || s.finished || s.turn !== side) return s;
      const rival = other(side);

      // Rakip liderse, geçen taraf lotu kaybeder.
      if (s.leader === rival) return resolveLot(s, rival);

      // Lider yoksa ve rakip de geçmişse lot satılmaz.
      if (s.leader === null) {
        const rivalPassed = rival === "you" ? s.passedYou : s.passedAi;
        if (rivalPassed) return resolveLot(s, null);
      }

      return {
        ...setPassed(s, side, true), turn: rival, logId: s.logId + 1,
        log: addLog(s, `${nameOf(s, side)} geçti.`, side),
      };
    }
    case "ADVANCE": {
      if (s.finished) return s;
      const next = s.lotIndex + 1;
      if (next >= s.lots.length || (s.youSquad.length >= SQUAD_SIZE && s.aiSquad.length >= SQUAD_SIZE)) {
        return { ...s, finished: true, lotWinner: null };
      }
      const player = s.lots[next];
      const youFull = s.youSquad.length >= SQUAD_SIZE;
      return {
        ...s,
        lotIndex: next,
        currentBid: openingBid(player),
        leader: null,
        turn: youFull ? "ai" : "you",
        passedYou: youFull,
        passedAi: false,
        lotWinner: null,
      };
    }
    default:
      return s;
  }
}

function initState(names: Names, budget: number): State {
  const lots = createLots(PLAYERS);
  return {
    names, lots, lotIndex: 0, currentBid: openingBid(lots[0]), leader: null,
    turn: "you", passedYou: false, passedAi: false,
    youSquad: [], aiSquad: [], youBudget: budget, aiBudget: budget,
    log: [{ id: 0, text: `Mezat başladı · ${names.you} ve ${names.ai} · ₺${budget}M bütçe`, side: "sys" }],
    lotWinner: null, finished: false, logId: 1,
  };
}

interface Props {
  mode: Mode;
  difficulty: Difficulty;
  budget: number;
  onFinish: (you: Player[], ai: Player[], youBudget: number, aiBudget: number) => void;
}

export default function AuctionScreen({ mode, difficulty, budget, onFinish }: Props) {
  const names: Names = mode === "local"
    ? { you: "Oyuncu 1", ai: "Oyuncu 2" }
    : { you: "Sen", ai: "Rakip" };

  const [s, dispatch] = useReducer(reducer, undefined, () => initState(names, budget));
  const [customBid, setCustomBid] = useState("");
  const latest = useRef(s);
  latest.current = s;

  useEffect(() => {
    setCustomBid(String(s.currentBid + 1));
  }, [s.currentBid, s.lotIndex]);

  const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");

  // AI sırası: sadece AI modunda, kısa düşünme süresiyle karar verir.
  useEffect(() => {
    if (mode !== "ai") return;
    if (s.turn !== "ai" || s.lotWinner || s.finished) return;
    const t = setTimeout(() => {
      const c = latest.current;
      const decision = aiDecision({
        player: c.lots[c.lotIndex],
        squad: c.aiSquad,
        budgetLeft: c.aiBudget,
        slotsLeft: SQUAD_SIZE - c.aiSquad.length,
        currentBid: c.currentBid,
        leader: c.leader,
        difficulty,
      });
      dispatch(decision.action === "raise"
        ? { type: "BID", side: "ai", amount: decision.amount }
        : { type: "PASS", side: "ai" });
    }, 650);
    return () => clearTimeout(t);
  }, [mode, s.turn, s.lotIndex, s.lotWinner, s.finished, difficulty]);

  // Kadrosu dolan taraf otomatik geçer.
  useEffect(() => {
    if (s.finished || s.lotWinner) return;
    const side = s.turn;
    if (squadOf(s, side).length < SQUAD_SIZE) return;
    if (mode === "ai" && side === "ai") return; // AI kendi kararını verir.
    const t = setTimeout(() => dispatch({ type: "PASS", side }), 400);
    return () => clearTimeout(t);
  }, [mode, s.turn, s.youSquad.length, s.aiSquad.length, s.lotWinner, s.finished]);

  useEffect(() => {
    if (!s.lotWinner) return;
    const t = setTimeout(() => dispatch({ type: "ADVANCE" }), 1700);
    return () => clearTimeout(t);
  }, [s.lotWinner]);

  useEffect(() => {
    if (!s.finished) return;
    const usedIds = new Set([...s.youSquad, ...s.aiSquad].map((p) => p.id));
    const youFinal = ensureCategoryCoverage(s.youSquad, s.lots, usedIds);
    const aiFinal = ensureCategoryCoverage(s.aiSquad, s.lots, usedIds);
    onFinish(youFinal, aiFinal, s.youBudget, s.aiBudget);
  }, [s.finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const player = s.lots[s.lotIndex];
  const upcoming = s.lots.slice(s.lotIndex + 1, s.lotIndex + 4);
  const activeSide = s.turn;
  const aiThinking = mode === "ai" && activeSide === "ai" && !s.lotWinner && !s.finished;
  const activeName = nameOf(s, activeSide);
  const canAct = !s.lotWinner && !s.finished && (mode === "local" || activeSide === "you");
  const squadFull = squadOf(s, activeSide).length >= SQUAD_SIZE;
  const activeBudget = budgetOf(s, activeSide);
  const customAmount = Number(customBid);
  const customValid =
    Number.isFinite(customAmount) &&
    Number.isInteger(customAmount) &&
    customAmount > s.currentBid &&
    customAmount <= activeBudget;

  // Klavye kısayolları: 1/2/3 → +1/+3/+5M, P → geç.
  const keyState = useRef({ canAct, squadFull, activeSide, activeBudget, currentBid: s.currentBid });
  keyState.current = { canAct, squadFull, activeSide, activeBudget, currentBid: s.currentBid };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = keyState.current;
      if (!k.canAct) return;
      const inc = ({ "1": 1, "2": 3, "3": 5 } as Record<string, number>)[e.key];
      if (inc) {
        const amount = k.currentBid + inc;
        if (!k.squadFull && amount <= k.activeBudget) dispatch({ type: "BID", side: k.activeSide, amount });
        e.preventDefault();
      } else if (e.key === "p" || e.key === "P") {
        dispatch({ type: "PASS", side: k.activeSide });
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="screen auction">
      <div className="auction-top">
        <div className="auction-progress">
          <span className="eyebrow">{mode === "local" ? "YEREL 2 OYUNCU" : "AI'YA KARŞI"}</span>
          <span className="lot-counter">LOT {Math.min(s.lotIndex + 1, LOT_COUNT)} / {LOT_COUNT}</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${((s.lotIndex + (s.lotWinner ? 1 : 0)) / LOT_COUNT) * 100}%` }} />
        </div>
      </div>

      <div className="auction-layout">
        <div className="auction-main">
          <div className="lot-stage">
            <div className="lot-stage__glow" />
            <PlayerCard
              player={player}
              highlight={!s.lotWinner}
              footer={
                <div className="player-card__price">
                  <span className="price-label">PİYASA DEĞERİ</span>
                  <span className="price-value">₺{player.value}M</span>
                </div>
              }
            />

            {s.lotWinner && (
              <div className={`lot-banner lot-banner--${s.lotWinner.who ?? "none"}`}>
                <span className="lot-banner__icon">{s.lotWinner.who === "you" ? "🎉" : s.lotWinner.who === "ai" ? "🤝" : "•"}</span>
                <div>
                  <b>{s.lotWinner.who ? `${nameOf(s, s.lotWinner.who)} aldı!` : "Satılmadı"}</b>
                  <span>{s.lotWinner.who ? `${player.name} · ₺${s.lotWinner.price}M` : `${player.name} · teklif yok`}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bid-panel">
            <div className="bid-status">
              <span className={`turn-pill ${activeSide === "you" ? "turn-pill--you" : "turn-pill--ai"} ${aiThinking ? "turn-pill--thinking" : ""}`}>
                {s.lotWinner
                  ? "LOT SONUÇLANDI"
                  : aiThinking
                    ? <>{activeName.toUpperCase()} DÜŞÜNÜYOR<span className="dots"><i /><i /><i /></span></>
                    : `SIRASI: ${activeName.toUpperCase()}`}
              </span>
              <div className="current-bid">
                <span className="current-bid__label">GÜNCEL TEKLİF</span>
                <span className="current-bid__value" key={`${s.lotIndex}-${s.currentBid}`}>₺{fmt(s.currentBid)}<small>M</small></span>
                <span className={`current-bid__leader ${s.leader === "you" ? "is-you" : s.leader === "ai" ? "is-ai" : ""}`}>
                  {s.leader ? `Teklif: ${nameOf(s, s.leader)}` : "Açılış teklifi"}
                </span>
              </div>
            </div>

            <div className="bid-actions">
              {[1, 3, 5].map((inc) => {
                const amount = s.currentBid + inc;
                return (
                  <button
                    key={inc}
                    className="btn btn--bid"
                    disabled={!canAct || squadFull || amount > activeBudget}
                    onClick={() => dispatch({ type: "BID", side: activeSide, amount })}
                  >
                    +{inc}M <small>₺{fmt(amount)}M</small>
                    <kbd className="kbd">{inc === 1 ? 1 : inc === 3 ? 2 : 3}</kbd>
                  </button>
                );
              })}
              <button
                className="btn btn--pass"
                disabled={!canAct}
                onClick={() => dispatch({ type: "PASS", side: activeSide })}
              >
                GEÇ
                <kbd className="kbd">P</kbd>
              </button>
            </div>
            <div className="custom-bid">
              <span className="custom-bid__label">ÖZEL TEKLİF</span>
              <div className="custom-bid__field">
                <span>₺</span>
                <input
                  type="number"
                  min={s.currentBid + 1}
                  max={activeBudget}
                  step={1}
                  value={customBid}
                  onChange={(e) => setCustomBid(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAct && customValid && !squadFull) {
                      dispatch({ type: "BID", side: activeSide, amount: customAmount });
                    }
                  }}
                  aria-label="Özel teklif tutarı"
                  disabled={!canAct || squadFull}
                />
                <span>M</span>
              </div>
              <button
                className="btn btn--bid-custom"
                disabled={!canAct || squadFull || !customValid}
                onClick={() => dispatch({ type: "BID", side: activeSide, amount: customAmount })}
              >
                TEKLİF VER
              </button>
              <span className="custom-bid__range">
                ₺{fmt(s.currentBid + 1)} – ₺{fmt(activeBudget)}M
              </span>
            </div>

            {mode === "local" && !s.lotWinner && (
              <div className="bid-hint bid-hint--handoff">
                Sıra <b>{activeName}</b>'de · ekranı ona ver, teklifini buradan girsin.
              </div>
            )}
            <div className="bid-hint">
              {activeName} — kalan bütçe <b>₺{fmt(activeBudget)}M</b> · kadro <b>{squadOf(s, activeSide).length}/{SQUAD_SIZE}</b>
            </div>
          </div>

          {upcoming.length > 0 && (
            <div className="panel upcoming">
              <h3 className="panel__title">SIRADAKİ LOTLAR</h3>
              <div className="upcoming__list">
                {upcoming.map((p, i) => (
                  <div className="upcoming__item" key={p.id}>
                    <span className="upcoming__no">#{s.lotIndex + i + 2}</span>
                    <PlayerPortrait player={p} size="sm" showBadge={false} />
                    <div className="upcoming__info">
                      <b>{p.name}</b>
                      <span>{p.position} · ₺{p.value}M</span>
                    </div>
                    <span className="upcoming__ovr">{p.ovr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="auction-side">
          <SquadMini title={`${names.you.toUpperCase()} KADROSU`} side="you" players={s.youSquad} budget={s.youBudget} />
          <SquadMini title={`${names.ai.toUpperCase()} KADROSU`} side="ai" players={s.aiSquad} budget={s.aiBudget} />

          <div className="panel log-panel">
            <h3 className="panel__title">MEZAT KAYDI</h3>
            <div className="log-list">
              {[...s.log].reverse().map((e) => (
                <div key={e.id} className={`log-item log-item--${e.side ?? "sys"}`}>{e.text}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const CAT_SHORT: Record<Broad, string> = { GK: "KL", DF: "DF", MF: "OS", FW: "FV" };

function SquadMini({ title, side, players, budget }: { title: string; side: Side; players: Player[]; budget: number }) {
  const ovr = players.length ? Math.round(players.reduce((a, p) => a + p.ovr, 0) / players.length) : 0;
  const counts = { GK: 0, DF: 0, MF: 0, FW: 0 } as Record<Broad, number>;
  for (const p of players) counts[p.broad]++;
  return (
    <div className={`panel squad-mini squad-mini--${side}`}>
      <div className="squad-mini__head">
        <h3 className="panel__title">{title}</h3>
        <span className="squad-mini__ovr">{players.length ? `OVR ${ovr}` : "—"}</span>
      </div>
      <div className="squad-mini__players">
        {Array.from({ length: SQUAD_SIZE }).map((_, i) => {
          const p = players[i];
          return p ? (
            <div className="squad-chip" key={p.id} title={`${p.name} · ${p.club} (${p.league}) · ₺${p.value}M`}>
              <PlayerPortrait player={p} size="sm" showBadge={false} />
              <span className="squad-chip__name">{p.name.split(" ").slice(-1)[0]}</span>
              <span className="squad-chip__ovr">{p.ovr}</span>
            </div>
          ) : (
            <div className="squad-chip squad-chip--empty" key={i}>+</div>
          );
        })}
      </div>
      <div className="squad-mini__cats">
        {CATEGORIES.map((c) => {
          const n = counts[c];
          return (
            <span key={c} className={`cat-pill ${n ? "" : "cat-pill--missing"}`} title={`${CATEGORY_NAMES[c]}: ${n}`}>
              {CAT_SHORT[c]} <b>{n}</b>
            </span>
          );
        })}
      </div>
      <div className="squad-mini__budget">Kalan bütçe <b>₺{budget}M</b></div>
    </div>
  );
}
