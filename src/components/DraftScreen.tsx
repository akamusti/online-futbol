import { useMemo, useState } from "react";
import { CLUB_BY_ID, type ClubId, type DraftPlayer } from "../data/draft";
import { flagOf } from "../data/players";
import {
  FORMATIONS, FORMATION_BY_ID, LINES, LINE_SHORT, MEZAT_BUDGETS, TASKS, TASK_BY_ID, TIMERS,
  drawClubs, fits, lineOf, poolFor, squadSize, standings, turnOf,
  type FormationId,
} from "../game/draft";
import PlayerPortrait from "./PlayerPortrait";
import DraftAuction from "./DraftAuction";
import {
  ClubBadge, SquadBoard, TimerBar, asPortrait, pc, squadsOf, useCountdown,
  type Config, type Pick,
} from "./draftShared";

const MEDALS = ["🥇", "🥈", "🥉", "4."];

export default function DraftScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"setup" | "pick" | "result">("setup");
  const [cfg, setCfg] = useState<Config>(() => ({
    names: ["Oyuncu 1", "Oyuncu 2"],
    task: "uzun",
    formation: "222",
    hide: true,
    clubs: drawClubs(FORMATION_BY_ID.get("222")!, 2),
    mode: "sira",
    timer: 0,
    budget: 100,
  }));
  const [picks, setPicks] = useState<Pick[]>([]);
  const [round, setRound] = useState(0);

  const start = () => { setPicks([]); setRound((r) => r + 1); setPhase("pick"); };
  const rematch = () => {
    setCfg((c) => ({ ...c, clubs: drawClubs(FORMATION_BY_ID.get(c.formation)!, c.names.length) }));
    start();
  };

  if (phase === "setup") return <DraftSetup cfg={cfg} setCfg={setCfg} onStart={start} />;
  if (phase === "pick") {
    const props = { cfg, picks, setPicks, onDone: () => setPhase("result"), onBack: () => setPhase("setup") };
    return cfg.mode === "mezat" ? <DraftAuction key={round} {...props} /> : <DraftPick key={round} {...props} />;
  }
  return <DraftResult cfg={cfg} picks={picks} onRematch={rematch} onSetup={() => setPhase("setup")} onExit={onExit} />;
}

// ── Kurulum ─────────────────────────────────────────────────
function DraftSetup({ cfg, setCfg, onStart }: {
  cfg: Config; setCfg: React.Dispatch<React.SetStateAction<Config>>; onStart: () => void;
}) {
  const formation = FORMATION_BY_ID.get(cfg.formation)!;
  const pool = useMemo(() => poolFor(cfg.clubs.map((c) => c.id)), [cfg.clubs]);

  const redraw = (c: Config): Config => ({ ...c, clubs: drawClubs(FORMATION_BY_ID.get(c.formation)!, c.names.length) });
  const setCount = (n: number) => setCfg((c) =>
    redraw({ ...c, names: Array.from({ length: n }, (_, i) => c.names[i] ?? `Oyuncu ${i + 1}`) }));
  const setFormation = (id: FormationId) => setCfg((c) => redraw({ ...c, formation: id }));

  return (
    <div className="screen draft-setup">
      <div className="hero hero--compact">
        <div className="hero__kicker">ARKADAŞLARINLA · SIRAYLA SEÇ</div>
        <h1 className="hero__title">GÖREV <span>DRAFTI</span></h1>
        <p className="hero__sub">
          Oyun 5 kulüp çeker (2'si Türk). Bu kulüplerde tüm zamanlarda oynamış futbolculardan
          sırayla seçin ya da mezatta kapışın. Göreve en uygun takımı kuran kazanır.
        </p>
      </div>

      <div className="setup-grid">
        <section className="panel">
          <h2 className="panel__title">GÖREV</h2>
          <div className="task-grid">
            {TASKS.map((t) => (
              <button
                key={t.id}
                className={`diff ${cfg.task === t.id ? "diff--active" : ""}`}
                onClick={() => setCfg((c) => ({ ...c, task: t.id }))}
              >
                <span className="diff__label">{t.icon} {t.label}</span>
                <span className="diff__desc">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="setting-label">Diziliş</div>
          <div className="formation-grid">
            {FORMATIONS.map((f) => (
              <button
                key={f.id}
                className={`diff ${cfg.formation === f.id ? "diff--active" : ""}`}
                onClick={() => setFormation(f.id)}
              >
                <span className="diff__label">{f.label}</span>
                <span className="diff__desc">{f.desc}</span>
              </button>
            ))}
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={cfg.hide}
              onChange={(e) => setCfg((c) => ({ ...c, hide: e.target.checked }))}
            />
            <span>
              <b>Değerleri gizle</b>
              <small>Boy, gol ve doğum yılları draft bitene kadar görünmez. Kim daha iyi biliyor, görelim.</small>
            </span>
          </label>
        </section>

        <section className="panel">
          <h2 className="panel__title">OYUNCULAR</h2>
          <div className="budget-presets">
            {[2, 3, 4].map((n) => (
              <button key={n} className={`chip ${cfg.names.length === n ? "chip--active" : ""}`} onClick={() => setCount(n)}>
                {n} kişi
              </button>
            ))}
          </div>
          <div className="name-list">
            {cfg.names.map((name, i) => (
              <label className="name-field" key={i} style={pc(i)}>
                <i />
                <input
                  value={name}
                  maxLength={16}
                  onChange={(e) => setCfg((c) => {
                    const names = [...c.names];
                    names[i] = e.target.value;
                    return { ...c, names };
                  })}
                  aria-label={`${i + 1}. oyuncunun adı`}
                />
              </label>
            ))}
          </div>

          <div className="setting-label">Seçim şekli</div>
          <div className="mode-picker">
            <button className={`mode ${cfg.mode === "sira" ? "mode--active" : ""}`} onClick={() => setCfg((c) => ({ ...c, mode: "sira" }))}>
              <span className="mode__icon">🔁</span>
              <span><b>Sırayla seç</b><small>1-2-3, 3-2-1 yılan sırası</small></span>
            </button>
            <button className={`mode ${cfg.mode === "mezat" ? "mode--active" : ""}`} onClick={() => setCfg((c) => ({ ...c, mode: "mezat" }))}>
              <span className="mode__icon">🔨</span>
              <span><b>Mezat</b><small>Bütçeyle teklif verin, en yüksek alır</small></span>
            </button>
          </div>

          {cfg.mode === "mezat" && (
            <>
              <div className="setting-label">Kişi başı bütçe</div>
              <div className="budget-presets">
                {MEZAT_BUDGETS.map((b) => (
                  <button key={b} className={`chip ${cfg.budget === b ? "chip--active" : ""}`} onClick={() => setCfg((c) => ({ ...c, budget: b }))}>
                    ₺{b}M
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="setting-label">{cfg.mode === "mezat" ? "Lot süresi (her teklifte sıfırlanır)" : "Seçim süresi"}</div>
          <div className="budget-presets">
            {TIMERS.map((t) => (
              <button key={t} className={`chip ${cfg.timer === t ? "chip--active" : ""}`} onClick={() => setCfg((c) => ({ ...c, timer: t }))}>
                {t ? `${t} sn` : "Süresiz"}
              </button>
            ))}
          </div>
          {cfg.timer > 0 && cfg.mode === "sira" && (
            <div className="budget-hint">Süre dolarsa oyun sıradaki kişi için rastgele bir futbolcu seçer.</div>
          )}

          <div className="setting-label">Kulüpler</div>
          <div className="club-row">
            {cfg.clubs.map((c) => <ClubBadge club={c} key={c.id} />)}
          </div>
          <div className="club-row__foot">
            <span>{pool.length} futbolcu · kişi başı {squadSize(formation)} oyuncu</span>
            <button className="btn btn--ghost" onClick={() => setCfg(redraw)}>🎲 Yeniden çek</button>
          </div>
        </section>
      </div>

      <div className="draft-start">
        <button className="btn btn--primary btn--hero" disabled={cfg.names.some((n) => !n.trim())} onClick={onStart}>
          {cfg.mode === "mezat" ? "MEZATI BAŞLAT" : "DRAFTI BAŞLAT"} <span>→</span>
        </button>
      </div>
    </div>
  );
}

// ── Sırayla seçim ───────────────────────────────────────────
function DraftPick({ cfg, picks, setPicks, onDone, onBack }: {
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
  const total = size * n;
  const clubIds = cfg.clubs.map((c) => c.id);

  const [tab, setTab] = useState<ClubId | "all">("all");
  const [query, setQuery] = useState("");

  const pool = useMemo(() => poolFor(clubIds), [cfg.clubs]); // eslint-disable-line react-hooks/exhaustive-deps
  const squads = useMemo(() => squadsOf(picks, n), [picks, n]);
  const pickedBy = useMemo(() => new Map(picks.map((p) => [p.player.id, p.by])), [picks]);

  const done = picks.length >= total;
  const turn = done ? -1 : turnOf(picks.length, n);
  const mySquad = turn >= 0 ? squads[turn] : [];

  const pick = (p: DraftPlayer, auto = false) => {
    if (done || pickedBy.has(p.id) || !fits(formation, mySquad, p)) return;
    setPicks((ps) => [...ps, { player: p, by: turn, auto }]);
  };

  const left = useCountdown(cfg.timer, picks.length, () => {
    const opts = pool.filter((p) => !pickedBy.has(p.id) && fits(formation, mySquad, p));
    if (opts.length) pick(opts[Math.floor(Math.random() * opts.length)], true);
  }, done);

  const norm = (s: string) => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = norm(query.trim());
  const list = pool
    .filter((p) => formation.any || (formation.slots[lineOf(p)] ?? 0) > 0)
    .filter((p) => tab === "all" || p.clubs.includes(tab))
    .filter((p) => !q || norm(p.name).includes(q))
    .sort((a, b) => LINES.indexOf(lineOf(a)) - LINES.indexOf(lineOf(b)) || a.name.localeCompare(b.name, "tr"));

  return (
    <div className="screen draft">
      <div className="draft-head">
        <div>
          <span className="eyebrow">{task.icon} {task.label.toUpperCase()} · {formation.label}</span>
          <div className="draft-head__clubs">
            {cfg.clubs.map((c) => <ClubBadge club={c} small key={c.id} />)}
          </div>
        </div>
        <div className="draft-head__right">
          <span className="lot-counter">SEÇİM {Math.min(picks.length + 1, total)} / {total}</span>
          <button className="btn btn--ghost" disabled={!picks.length} onClick={() => setPicks((ps) => ps.slice(0, -1))}>↶ Geri al</button>
          <button className="btn btn--ghost" onClick={onBack}>Ayarlar</button>
        </div>
      </div>
      <div className="progress-track"><span style={{ width: `${(picks.length / total) * 100}%` }} /></div>

      <div className="draft-layout">
        <section className="panel draft-pool">
          {done ? (
            <div className="draft-done">
              <h2>Draft tamamlandı!</h2>
              <p>Herkesin kadrosu hazır. Sonuçları görmeye hazır mısınız?</p>
              <button className="btn btn--primary btn--hero" onClick={onDone}>SONUÇLARI GÖSTER <span>🏁</span></button>
            </div>
          ) : (
            <>
              <div className="draft-turn" style={pc(turn)}>
                <span className="draft-turn__dot" />
                <span>Sıra <b>{cfg.names[turn]}</b>'de · {size - mySquad.length} seçimi kaldı</span>
                {!formation.any && (
                  <span className="draft-turn__need">
                    {LINES.filter((l) => formation.slots[l]).map((l) => {
                      const rest = (formation.slots[l] ?? 0) - mySquad.filter((p) => lineOf(p) === l).length;
                      return <span key={l} className={rest ? "" : "is-full"}>{LINE_SHORT[l]} {rest}</span>;
                    })}
                  </span>
                )}
              </div>
              <TimerBar left={left} total={cfg.timer} />

              <div className="draft-filters">
                <div className="draft-tabs">
                  <button className={`chip ${tab === "all" ? "chip--active" : ""}`} onClick={() => setTab("all")}>Tümü</button>
                  {cfg.clubs.map((c) => (
                    <button key={c.id} className={`chip ${tab === c.id ? "chip--active" : ""}`} onClick={() => setTab(c.id)}>
                      {c.name}
                    </button>
                  ))}
                </div>
                <input className="draft-search" placeholder="Futbolcu ara…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>

              <div className="draft-list">
                {list.map((p) => {
                  const owner = pickedBy.get(p.id);
                  const ok = owner === undefined && fits(formation, mySquad, p);
                  return (
                    <button
                      key={p.id}
                      className={`draft-item ${owner !== undefined ? "is-taken" : ""}`}
                      disabled={!ok}
                      onClick={() => pick(p)}
                      style={owner !== undefined ? pc(owner) : undefined}
                    >
                      <PlayerPortrait player={asPortrait(p)} size="sm" showBadge={false} />
                      <span className="draft-item__main">
                        <b>{p.name}</b>
                        <small>
                          {flagOf(p.nation)} <span className={`pos-tag pos-tag--${lineOf(p)}`}>{p.position}</span>
                          {" "}{p.clubs.filter((c) => clubIds.includes(c)).map((c) => CLUB_BY_ID.get(c)!.name).join(" · ")}
                        </small>
                      </span>
                      {owner !== undefined ? (
                        <span className="draft-item__owner">{cfg.names[owner]}</span>
                      ) : !cfg.hide ? (
                        <span className="draft-item__val">{task.show(p)}</span>
                      ) : null}
                    </button>
                  );
                })}
                {!list.length && <div className="draft-empty">Bu filtreyle futbolcu yok.</div>}
              </div>
            </>
          )}
        </section>

        <aside className="draft-teams">
          {cfg.names.map((name, i) => (
            <SquadBoard
              key={i} name={name} index={i} squad={squads[i]} active={i === turn}
              formation={formation} hide={cfg.hide} task={task}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}

// ── Sonuç ───────────────────────────────────────────────────
function DraftResult({ cfg, picks, onRematch, onSetup, onExit }: {
  cfg: Config; picks: Pick[];
  onRematch: () => void; onSetup: () => void; onExit: () => void;
}) {
  const task = TASK_BY_ID.get(cfg.task)!;
  const squads = squadsOf(picks, cfg.names.length);
  const table = standings(task, squads);
  const winners = table.filter((r) => r.rank === 1).map((r) => cfg.names[r.index]);
  const pickOf = new Map(picks.map((p) => [p.player.id, p]));
  const mezat = cfg.mode === "mezat";

  return (
    <div className="screen draft-result">
      <div className="match-head">
        <span className="eyebrow">{mezat ? "🔨 MEZAT · " : ""}{task.icon} {task.label.toUpperCase()}</span>
        <h1>{winners.length > 1 ? `Berabere: ${winners.join(" & ")}` : `${winners[0]} kazandı!`}</h1>
      </div>

      <div className="result-list">
        {table.map((r) => (
          <section key={r.index} className={`panel result-team ${r.rank === 1 ? "is-winner" : ""}`} style={pc(r.index)}>
            <div className="result-team__head">
              <span className="result-team__medal">{MEDALS[r.rank - 1]}</span>
              <b>{cfg.names[r.index]}</b>
              <span className="result-team__score">{task.format(r.score)}</span>
            </div>
            {mezat && (
              <div className="result-team__spent">
                Harcanan ₺{picks.filter((p) => p.by === r.index).reduce((a, p) => a + (p.price ?? 0), 0)}M / ₺{cfg.budget}M
              </div>
            )}
            <div className="result-team__players">
              {[...squads[r.index]]
                .sort((a, b) => LINES.indexOf(lineOf(a)) - LINES.indexOf(lineOf(b)))
                .map((p) => {
                  const info = pickOf.get(p.id);
                  return (
                    <div className="result-player" key={p.id}>
                      <PlayerPortrait player={asPortrait(p)} size="sm" showBadge={false} />
                      <span className="result-player__name">
                        <b>{p.name}</b>
                        <small>
                          <span className={`pos-tag pos-tag--${lineOf(p)}`}>{p.position}</span>
                          {mezat && !info?.auto && <> · ₺{info?.price ?? 0}M</>}
                          {info?.auto && <span className="auto-tag">OTOMATİK</span>}
                        </small>
                      </span>
                      <span className="result-player__val">{task.show(p)}</span>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <div className="match-footer draft-actions">
        <button className="btn btn--primary btn--hero" onClick={onRematch}>RÖVANŞ · YENİ KURA <span>🎲</span></button>
        <button className="btn" onClick={onSetup}>Ayarları değiştir</button>
        <button className="btn" onClick={onExit}>Ana menü</button>
      </div>
      <p className="draft-note">Boy, Dünya Kupası golü ve doğum yılı değerleri yaklaşıktır; yanlış gördüğünüz bir değer olursa haber verin.</p>
    </div>
  );
}
