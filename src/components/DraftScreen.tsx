import { useMemo, useState } from "react";
import type { Player } from "../types";
import { CLUB_BY_ID, type Club, type ClubId, type DraftPlayer } from "../data/draft";
import { broadOf, flagOf, slugify } from "../data/players";
import {
  FORMATIONS, FORMATION_BY_ID, LINES, LINE_SHORT, TASKS, TASK_BY_ID,
  drawClubs, fits, lineOf, poolFor, squadSize, standings, turnOf,
  type Formation, type FormationId, type Task, type TaskId,
} from "../game/draft";
import PlayerPortrait from "./PlayerPortrait";

const COLORS = ["#22c55e", "#60a5fa", "#f5b942", "#f472b6"];
const MEDALS = ["🥇", "🥈", "🥉", "4."];

/** Draft oyuncusunu portre bileşeninin beklediği biçime çevirir. */
function asPortrait(p: DraftPlayer): Player {
  return {
    id: p.id, name: p.name, nation: p.nation, club: p.clubs.join(""), league: "",
    position: p.position, broad: broadOf(p.position), age: 0, ovr: 0,
    attrs: { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 }, value: 0,
    photo: `${import.meta.env.BASE_URL}photos/${slugify(p.name)}.png`,
  };
}

function ClubBadge({ club, small = false }: { club: Club; small?: boolean }) {
  return (
    <span
      className={`club-badge ${small ? "club-badge--sm" : ""}`}
      style={{ "--c1": club.colors[0], "--c2": club.colors[1] } as React.CSSProperties}
    >
      <i />{club.name}
    </span>
  );
}

interface Config {
  names: string[];
  task: TaskId;
  formation: FormationId;
  hide: boolean;
  clubs: Club[];
}

export default function DraftScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"setup" | "pick" | "result">("setup");
  const [cfg, setCfg] = useState<Config>(() => ({
    names: ["Oyuncu 1", "Oyuncu 2"],
    task: "uzun",
    formation: "222",
    hide: true,
    clubs: drawClubs(FORMATION_BY_ID.get("222")!, 2),
  }));
  const [picks, setPicks] = useState<{ player: DraftPlayer; by: number }[]>([]);

  const startDraft = () => { setPicks([]); setPhase("pick"); };
  const rematch = () => {
    setCfg((c) => ({ ...c, clubs: drawClubs(FORMATION_BY_ID.get(c.formation)!, c.names.length) }));
    setPicks([]);
    setPhase("pick");
  };

  if (phase === "setup") return <DraftSetup cfg={cfg} setCfg={setCfg} onStart={startDraft} />;
  if (phase === "pick") {
    return (
      <DraftPick
        cfg={cfg} picks={picks} setPicks={setPicks}
        onDone={() => setPhase("result")} onBack={() => setPhase("setup")}
      />
    );
  }
  return <DraftResult cfg={cfg} picks={picks} onRematch={rematch} onSetup={() => setPhase("setup")} onExit={onExit} />;
}

// ── Kurulum ─────────────────────────────────────────────────
function DraftSetup({ cfg, setCfg, onStart }: {
  cfg: Config; setCfg: React.Dispatch<React.SetStateAction<Config>>; onStart: () => void;
}) {
  const formation = FORMATION_BY_ID.get(cfg.formation)!;
  const pool = useMemo(() => poolFor(cfg.clubs.map((c) => c.id)), [cfg.clubs]);

  const setCount = (n: number) => setCfg((c) => {
    const names = Array.from({ length: n }, (_, i) => c.names[i] ?? `Oyuncu ${i + 1}`);
    return { ...c, names, clubs: drawClubs(FORMATION_BY_ID.get(c.formation)!, n) };
  });
  const setFormation = (id: FormationId) =>
    setCfg((c) => ({ ...c, formation: id, clubs: drawClubs(FORMATION_BY_ID.get(id)!, c.names.length) }));
  const reroll = () => setCfg((c) => ({ ...c, clubs: drawClubs(FORMATION_BY_ID.get(c.formation)!, c.names.length) }));

  return (
    <div className="screen draft-setup">
      <div className="hero hero--compact">
        <div className="hero__kicker">ARKADAŞLARINLA · SIRAYLA SEÇ</div>
        <h1 className="hero__title">GÖREV <span>DRAFTI</span></h1>
        <p className="hero__sub">
          Oyun 5 kulüp çeker (2'si Türk). Bu kulüplerde tüm zamanlarda oynamış futbolcular arasından sırayla
          seçim yapın. Göreve en uygun takımı kuran kazanır.
        </p>
      </div>

      <div className="setup-grid">
        <section className="panel">
          <h2 className="panel__title">GÖREV</h2>
          <div className="diffs">
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
              <small>Boy ve gol sayıları draft bitene kadar görünmez; kim daha iyi biliyor görelim.</small>
            </span>
          </label>
        </section>

        <section className="panel">
          <h2 className="panel__title">OYUNCULAR</h2>
          <div className="budget-presets">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={`chip ${cfg.names.length === n ? "chip--active" : ""}`}
                onClick={() => setCount(n)}
              >
                {n} kişi
              </button>
            ))}
          </div>
          <div className="name-list">
            {cfg.names.map((name, i) => (
              <label className="name-field" key={i} style={{ "--pc": COLORS[i] } as React.CSSProperties}>
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

          <div className="setting-label">Kulüpler</div>
          <div className="club-row">
            {cfg.clubs.map((c) => <ClubBadge club={c} key={c.id} />)}
          </div>
          <div className="club-row__foot">
            <span>{pool.length} futbolcu · kişi başı {squadSize(formation)} seçim</span>
            <button className="btn btn--ghost" onClick={reroll}>🎲 Yeniden çek</button>
          </div>
        </section>
      </div>

      <div className="draft-start">
        <button
          className="btn btn--primary btn--hero"
          disabled={cfg.names.some((n) => !n.trim())}
          onClick={onStart}
        >
          DRAFTI BAŞLAT <span>→</span>
        </button>
      </div>
    </div>
  );
}

// ── Seçim ───────────────────────────────────────────────────
function DraftPick({ cfg, picks, setPicks, onDone, onBack }: {
  cfg: Config;
  picks: { player: DraftPlayer; by: number }[];
  setPicks: React.Dispatch<React.SetStateAction<{ player: DraftPlayer; by: number }[]>>;
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
  const squads = useMemo(
    () => cfg.names.map((_, i) => picks.filter((p) => p.by === i).map((p) => p.player)),
    [picks, cfg.names],
  );
  const pickedBy = useMemo(() => new Map(picks.map((p) => [p.player.id, p.by])), [picks]);

  const done = picks.length >= total;
  const turn = done ? -1 : turnOf(picks.length, n);
  const mySquad = turn >= 0 ? squads[turn] : [];

  const norm = (s: string) => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = norm(query.trim());
  const list = pool
    .filter((p) => formation.any || (formation.slots[lineOf(p)] ?? 0) > 0)
    .filter((p) => tab === "all" || p.clubs.includes(tab))
    .filter((p) => !q || norm(p.name).includes(q))
    .sort((a, b) => LINES.indexOf(lineOf(a)) - LINES.indexOf(lineOf(b)) || a.name.localeCompare(b.name, "tr"));

  const pick = (p: DraftPlayer) => {
    if (done || pickedBy.has(p.id) || !fits(formation, mySquad, p)) return;
    setPicks((ps) => [...ps, { player: p, by: turn }]);
  };

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
              <div className="draft-turn" style={{ "--pc": COLORS[turn] } as React.CSSProperties}>
                <span className="draft-turn__dot" />
                <span>Sıra <b>{cfg.names[turn]}</b>'de · {size - mySquad.length} seçimi kaldı</span>
                {!formation.any && (
                  <span className="draft-turn__need">
                    {LINES.filter((l) => formation.slots[l]).map((l) => {
                      const left = (formation.slots[l] ?? 0) - mySquad.filter((p) => lineOf(p) === l).length;
                      return <span key={l} className={left ? "" : "is-full"}>{LINE_SHORT[l]} {left}</span>;
                    })}
                  </span>
                )}
              </div>

              <div className="draft-filters">
                <div className="draft-tabs">
                  <button className={`chip ${tab === "all" ? "chip--active" : ""}`} onClick={() => setTab("all")}>Tümü</button>
                  {cfg.clubs.map((c) => (
                    <button key={c.id} className={`chip ${tab === c.id ? "chip--active" : ""}`} onClick={() => setTab(c.id)}>
                      {c.name}
                    </button>
                  ))}
                </div>
                <input
                  className="draft-search"
                  placeholder="Futbolcu ara…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
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
                      style={owner !== undefined ? ({ "--pc": COLORS[owner] } as React.CSSProperties) : undefined}
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
                        <span className="draft-item__val">{task.formatValue(task.value(p))}</span>
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
              key={i} name={name} color={COLORS[i]} squad={squads[i]} active={i === turn}
              slots={formation} hide={cfg.hide} task={task}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}

function SquadBoard({ name, color, squad, active, slots, hide, task }: {
  name: string; color: string; squad: DraftPlayer[]; active: boolean;
  slots: Formation; hide: boolean; task: Task;
}) {
  const groups: { label: string; players: DraftPlayer[]; cap: number }[] = slots.any
    ? [{ label: "SERBEST", players: squad, cap: slots.any }]
    : LINES.filter((l) => slots.slots[l]).map((l) => ({
      label: LINE_SHORT[l], players: squad.filter((p) => lineOf(p) === l), cap: slots.slots[l] ?? 0,
    }));
  return (
    <div className={`panel squad-board ${active ? "is-active" : ""}`} style={{ "--pc": color } as React.CSSProperties}>
      <div className="squad-board__head">
        <b>{name}</b>
        {!hide && squad.length > 0 && <span>{task.format(task.score(squad))}</span>}
      </div>
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

// ── Sonuç ───────────────────────────────────────────────────
function DraftResult({ cfg, picks, onRematch, onSetup, onExit }: {
  cfg: Config; picks: { player: DraftPlayer; by: number }[];
  onRematch: () => void; onSetup: () => void; onExit: () => void;
}) {
  const task = TASK_BY_ID.get(cfg.task)!;
  const squads = cfg.names.map((_, i) => picks.filter((p) => p.by === i).map((p) => p.player));
  const table = standings(task, squads);
  const winners = table.filter((r) => r.rank === 1).map((r) => cfg.names[r.index]);

  return (
    <div className="screen draft-result">
      <div className="match-head">
        <span className="eyebrow">{task.icon} {task.label.toUpperCase()}</span>
        <h1>{winners.length > 1 ? `Berabere: ${winners.join(" & ")}` : `${winners[0]} kazandı!`}</h1>
      </div>

      <div className="result-list">
        {table.map((r) => (
          <section
            key={r.index}
            className={`panel result-team ${r.rank === 1 ? "is-winner" : ""}`}
            style={{ "--pc": COLORS[r.index] } as React.CSSProperties}
          >
            <div className="result-team__head">
              <span className="result-team__medal">{MEDALS[r.rank - 1]}</span>
              <b>{cfg.names[r.index]}</b>
              <span className="result-team__score">{task.format(r.score)}</span>
            </div>
            <div className="result-team__players">
              {[...squads[r.index]]
                .sort((a, b) => LINES.indexOf(lineOf(a)) - LINES.indexOf(lineOf(b)))
                .map((p) => (
                  <div className="result-player" key={p.id}>
                    <PlayerPortrait player={asPortrait(p)} size="sm" showBadge={false} />
                    <span className="result-player__name">
                      <b>{p.name}</b>
                      <small><span className={`pos-tag pos-tag--${lineOf(p)}`}>{p.position}</span></small>
                    </span>
                    <span className="result-player__val">{task.formatValue(task.value(p))}</span>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      <div className="match-footer draft-actions">
        <button className="btn btn--primary btn--hero" onClick={onRematch}>RÖVANŞ · YENİ KURA <span>🎲</span></button>
        <button className="btn" onClick={onSetup}>Ayarları değiştir</button>
        <button className="btn" onClick={onExit}>Ana menü</button>
      </div>
      <p className="draft-note">Boy ve Dünya Kupası golü değerleri yaklaşıktır; yanlış gördüğünüz bir değer olursa haber verin.</p>
    </div>
  );
}
