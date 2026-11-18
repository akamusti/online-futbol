import { useEffect, useMemo, useState } from "react";
import type { DraftPlayer } from "../data/draft";
import { CLUB_BY_ID } from "../data/draft";
import { flagOf } from "../data/players";
import { FORMATION_BY_ID, TASK_BY_ID, fits, lineOf, poolFor, squadSize } from "../game/draft";
import PlayerPortrait from "./PlayerPortrait";
import {
  ClubBadge, SquadBoard, TimerBar, asPortrait, pc, squadsOf, useCountdown,
  type Config, type Pick,
} from "./draftShared";

interface Lot {
  player: DraftPlayer;
  bid: number;            // 0 = henüz teklif yok
  leader: number | null;
  passed: boolean[];
  bidCount: number;       // süreyi sıfırlamak için
}

const pickRandom = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Bütçe ile kadro mezatı: her futbolcu sırayla açık artırmaya çıkar. */
export default function DraftAuction({ cfg, picks, setPicks, onDone, onBack }: {
  cfg: Config;
  picks: Pick[];
  setPicks: React.Dispatch<React.SetStateAction<Pick[]>>;
  onDone: () => void;
  onBack: () => void;
}) {
  const task = TASK_BY_ID.get(cfg.task)!;
  const formation = FORMATION_BY_ID.get(cfg.formation)!;
  const n = cfg.names.length;
  const size = squadSize(formation);
  const clubIds = cfg.clubs.map((c) => c.id);
  const pool = useMemo(() => poolFor(clubIds), [cfg.clubs]); // eslint-disable-line react-hooks/exhaustive-deps

  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [lot, setLot] = useState<Lot | null>(null);
  const [outcome, setOutcome] = useState<{ who: number | null; price: number } | null>(null);
  const [lotNo, setLotNo] = useState(0);

  const squads = squadsOf(picks, n);
  const spent = squads.map((_, i) => picks.filter((p) => p.by === i).reduce((a, p) => a + (p.price ?? 0), 0));
  const budgets = spent.map((s) => cfg.budget - s);
  const slotsLeft = squads.map((sq) => size - sq.length);
  /** Sonraki boş yerler için kişi başı 1M ayrılır. */
  const maxBid = (i: number) => budgets[i] - Math.max(0, slotsLeft[i] - 1);
  const canUse = (i: number, p: DraftPlayer) => fits(formation, squads[i], p);
  const allFull = slotsLeft.every((x) => x === 0);

  // ── Sıradaki lotu aç ya da mezatı bitir ──
  const openNext = (currentPicks: Pick[], currentSeen: Set<string>) => {
    const sqs = squadsOf(currentPicks, n);
    const taken = new Set(currentPicks.map((p) => p.player.id));
    const spentNow = sqs.map((_, i) => currentPicks.filter((p) => p.by === i).reduce((a, p) => a + (p.price ?? 0), 0));
    const mb = (i: number) => cfg.budget - spentNow[i] - Math.max(0, size - sqs[i].length - 1);
    const candidates = pool.filter((p) =>
      !taken.has(p.id) && !currentSeen.has(p.id) &&
      sqs.some((sq, i) => fits(formation, sq, p) && mb(i) >= 1));

    if (candidates.length) {
      const player = pickRandom(candidates);
      setSeen(new Set([...currentSeen, player.id]));
      setLot({ player, bid: 0, leader: null, passed: Array(n).fill(false), bidCount: 0 });
      setLotNo((x) => x + 1);
      return;
    }

    // Kimse alamıyorsa eksik kadrolar otomatik tamamlanır (ücretsiz).
    const auto: Pick[] = [];
    const used = new Set(taken);
    sqs.forEach((sq, i) => {
      const squad = [...sq];
      while (squad.length < size) {
        const opts = pool.filter((p) => !used.has(p.id) && fits(formation, squad, p));
        if (!opts.length) break;
        const p = pickRandom(opts);
        used.add(p.id); squad.push(p);
        auto.push({ player: p, by: i, price: 0, auto: true });
      }
    });
    if (auto.length) setPicks((ps) => [...ps, ...auto]);
    setLot(null);
  };

  useEffect(() => { if (!lot && !outcome && !allFull) openNext(picks, seen); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lot kapanınca sonucu göster, kısa süre sonra sıradakine geç.
  useEffect(() => {
    if (!outcome) return;
    const t = setTimeout(() => {
      setOutcome(null);
      openNext(picks, seen);
    }, 1300);
    return () => clearTimeout(t);
  }, [outcome]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (l: Lot) => {
    if (l.leader !== null) {
      setPicks((ps) => [...ps, { player: l.player, by: l.leader!, price: l.bid }]);
      setOutcome({ who: l.leader, price: l.bid });
    } else {
      setOutcome({ who: null, price: 0 });
    }
    setLot(l);
  };

  /** Teklif verebilecek, henüz pas geçmemiş ve lider olmayan biri kaldı mı? */
  const stillBidding = (l: Lot) =>
    cfg.names.some((_, i) => i !== l.leader && !l.passed[i] && canUse(i, l.player) && maxBid(i) > l.bid);

  const bid = (i: number, amount: number) => {
    if (!lot || outcome) return;
    const next: Lot = { ...lot, bid: amount, leader: i, bidCount: lot.bidCount + 1, passed: lot.passed.map((p, k) => (k === i ? false : p)) };
    if (!stillBidding(next)) close(next); else setLot(next);
  };
  const pass = (i: number) => {
    if (!lot || outcome) return;
    const next: Lot = { ...lot, passed: lot.passed.map((p, k) => (k === i ? true : p)) };
    if (!stillBidding(next)) close(next); else setLot(next);
  };

  const left = useCountdown(cfg.timer, `${lotNo}-${lot?.bidCount ?? 0}`, () => { if (lot && !outcome) close(lot); }, !lot || !!outcome);

  const done = !lot && !outcome && allFull;
  const p = lot?.player;

  return (
    <div className="screen draft">
      <div className="draft-head">
        <div>
          <span className="eyebrow">🔨 MEZAT · {task.icon} {task.label.toUpperCase()} · {formation.label}</span>
          <div className="draft-head__clubs">
            {cfg.clubs.map((c) => <ClubBadge club={c} small key={c.id} />)}
          </div>
        </div>
        <div className="draft-head__right">
          <span className="lot-counter">LOT {lotNo} · {picks.length} / {size * n} OYUNCU</span>
          <button className="btn btn--ghost" onClick={onBack}>Ayarlar</button>
        </div>
      </div>
      <div className="progress-track"><span style={{ width: `${(picks.length / (size * n)) * 100}%` }} /></div>

      <div className="draft-layout">
        <section className="panel draft-pool">
          {done ? (
            <div className="draft-done">
              <h2>Mezat bitti!</h2>
              <p>Bütün kadrolar doldu. Sonuçları görmeye hazır mısınız?</p>
              <button className="btn btn--primary btn--hero" onClick={onDone}>SONUÇLARI GÖSTER <span>🏁</span></button>
            </div>
          ) : p && lot ? (
            <>
              <div className="dlot">
                <PlayerPortrait player={asPortrait(p)} size="md" />
                <div className="dlot__info">
                  <b className="dlot__name">{p.name}</b>
                  <span className="dlot__meta">
                    {flagOf(p.nation)} <span className={`pos-tag pos-tag--${lineOf(p)}`}>{p.position}</span>{" "}
                    {p.clubs.filter((c) => clubIds.includes(c)).map((c) => CLUB_BY_ID.get(c)!.name).join(" · ")}
                  </span>
                  {!cfg.hide && <span className="dlot__val">{task.show(p)}</span>}
                </div>
                <div className="dlot__bid">
                  <span className="current-bid__label">GÜNCEL TEKLİF</span>
                  <span className="current-bid__value" key={lot.bidCount}>₺{lot.bid}<small>M</small></span>
                  <span className="dlot__leader" style={lot.leader !== null ? pc(lot.leader) : undefined}>
                    {lot.leader !== null ? cfg.names[lot.leader] : "Teklif yok"}
                  </span>
                </div>
              </div>
              <TimerBar left={left} total={cfg.timer} />

              {outcome ? (
                <div className={`lot-banner dlot-banner ${outcome.who === null ? "lot-banner--none" : ""}`} style={outcome.who !== null ? { borderColor: `var(--pc)`, ...pc(outcome.who) } : undefined}>
                  <span className="lot-banner__icon">{outcome.who === null ? "•" : "🔨"}</span>
                  <div>
                    <b>{outcome.who === null ? "Satılmadı" : `${cfg.names[outcome.who]} aldı!`}</b>
                    <span>{p.name}{outcome.who !== null ? ` · ₺${outcome.price}M` : " · kimse teklif vermedi"}</span>
                  </div>
                </div>
              ) : (
                <div className="bidders">
                  {cfg.names.map((name, i) => {
                    const usable = canUse(i, p);
                    const mb = maxBid(i);
                    const isLeader = lot.leader === i;
                    const out = !usable || mb <= lot.bid || lot.passed[i];
                    const why = !usable ? (slotsLeft[i] ? "Bu mevki dolu" : "Kadro dolu")
                      : lot.passed[i] ? "Pas geçti" : mb <= lot.bid && !isLeader ? "Bütçe yetmiyor" : null;
                    return (
                      <div className={`bidder ${isLeader ? "is-leader" : ""} ${out && !isLeader ? "is-out" : ""}`} key={i} style={pc(i)}>
                        <div className="bidder__who">
                          <b>{name}</b>
                          <small>₺{budgets[i]}M · {slotsLeft[i]} yer</small>
                        </div>
                        {isLeader ? (
                          <span className="bidder__note">Önde 👑</span>
                        ) : why ? (
                          <span className="bidder__note">{why}</span>
                        ) : (
                          <div className="bidder__btns">
                            {[1, 5, 10].map((inc) => (
                              <button key={inc} className="btn btn--bid" disabled={lot.bid + inc > mb} onClick={() => bid(i, lot.bid + inc)}>
                                +{inc}
                              </button>
                            ))}
                            <button className="btn btn--pass" onClick={() => pass(i)}>PAS</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="bid-hint">
                Her yeni lot ₺0'dan açılır. Herkes pas geçince ya da süre dolunca en yüksek teklif alır.
                Boş kalan her yer için ₺1M ayrılır.
              </p>
            </>
          ) : (
            <div className="draft-done"><p>Sıradaki lot hazırlanıyor…</p></div>
          )}
        </section>

        <aside className="draft-teams">
          {cfg.names.map((name, i) => (
            <SquadBoard
              key={i} name={name} index={i} squad={squads[i]} active={lot?.leader === i}
              formation={formation} hide={cfg.hide} task={task}
              extra={<div className="squad-board__budget">Bütçe <b>₺{budgets[i]}M</b> · harcanan ₺{spent[i]}M</div>}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
