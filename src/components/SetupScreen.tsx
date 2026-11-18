import type { Difficulty } from "../game/auction";
import {
  DEFAULT_BUDGET, LOT_COUNT, MAX_BUDGET, MIN_BUDGET, SQUAD_SIZE, clampBudget,
} from "../game/auction";
import type { Mode } from "../types";
import { PLAYERS } from "../data/players";

interface Props {
  mode: Mode;
  onMode: (m: Mode) => void;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  budget: number;
  onBudget: (n: number) => void;
  onStart: () => void;
}

const DIFFS: { key: Difficulty; label: string; desc: string }[] = [
  { key: "kolay", label: "Kolay", desc: "Rakip temkinli teklif verir" },
  { key: "orta", label: "Orta", desc: "Dengeli ve rekabetçi" },
  { key: "zor", label: "Zor", desc: "Rakip değerinin üzerine çıkar" },
];

const PRESETS = [150, 300, 500, 800, 1200, 2000];

export default function SetupScreen({
  mode, onMode, difficulty, onDifficulty, budget, onBudget, onStart,
}: Props) {
  return (
    <div className="screen setup">
      <div className="hero">
        <div className="hero__kicker">FUTBOL · AÇIK ARTIRMA · MAÇ</div>
        <h1 className="hero__title">
          FUTBOL <span>MEZATI</span>
        </h1>
        <p className="hero__sub">
          {PLAYERS.length} gerçek futbolcu, efsaneler ve yıldızlar karışık. Açık artırmada kadronu kur,
          sonra 11'e 11 maçta rakibini yen.
        </p>
        <button className="btn btn--primary btn--hero" onClick={onStart}>
          MEZATI BAŞLAT <span>→</span>
        </button>
        <div className="setup-summary">
          <span>{mode === "ai" ? "🤖 AI'ya karşı" : "👥 İki kişi"}</span>
          {mode === "ai" && <span>Zorluk: <b>{DIFFS.find((d) => d.key === difficulty)?.label}</b></span>}
          <span>Bütçe: <b>₺{budget.toLocaleString("tr-TR")}M</b></span>
          <span>{LOT_COUNT} lot · {SQUAD_SIZE} oyuncu</span>
        </div>
      </div>

      <div className="setup-grid">
        <section className="panel">
          <h2 className="panel__title">NASIL OYNANIR</h2>
          <ol className="rules">
            <li><b>Açık artırma:</b> Her tur bir futbolcu açılır. Teklif ver veya geç.</li>
            <li><b>Bütçe:</b> Belirlediğin bütçeyle {SQUAD_SIZE} futbolcu al. En yüksek teklif kazanır.</li>
            <li><b>Kadro:</b> Kaleci, defans, orta saha ve forvet dengesi önemli. Her kategoriden en az bir oyuncu garanti; eksik kalırsa otomatik tamamlanır.</li>
            <li><b>Maç:</b> {LOT_COUNT} lot sonunda kadrolar, FIFA tarzı özelliklere göre saniyeler içinde karşılaşır.</li>
            <li><b>İki kişi modu:</b> Aynı ekranda sırayla teklif verin; Discord'da konuşarak arkadaşına söyleyebilirsin.</li>
          </ol>
          <div className="setup-note">
            <span className="setup-note__icon">⚽</span>
            Fotoğraflar bulunabildiğinde gösterilir; bulunamayan futbolcular için otomatik kart oluşturulur.
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__title">OYUN AYARLARI</h2>

          <div className="setting-label">Oyun modu</div>
          <div className="mode-picker">
            <button
              className={`mode ${mode === "ai" ? "mode--active" : ""}`}
              onClick={() => onMode("ai")}
            >
              <span className="mode__icon">🤖</span>
              <span><b>AI'ya Karşı</b><small>Bilgisayara karşı tek başına oyna</small></span>
            </button>
            <button
              className={`mode ${mode === "local" ? "mode--active" : ""}`}
              onClick={() => onMode("local")}
            >
              <span className="mode__icon">👥</span>
              <span><b>İki Kişi</b><small>Aynı ekranda sırayla oyna</small></span>
            </button>
          </div>

          {mode === "ai" && (
            <>
              <div className="setting-label">Rakip zorluğu</div>
              <div className="diffs">
                {DIFFS.map((d) => (
                  <button
                    key={d.key}
                    className={`diff ${difficulty === d.key ? "diff--active" : ""}`}
                    onClick={() => onDifficulty(d.key)}
                  >
                    <span className="diff__label">{d.label}</span>
                    <span className="diff__desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="setting-label">Kişi başı bütçe</div>
          <div className="budget-value">
            <span>₺</span>
            <input
              type="number"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={1}
              value={budget}
              onChange={(e) => onBudget(clampBudget(Number(e.target.value) || DEFAULT_BUDGET))}
              aria-label="Bütçe"
            />
            <span>M</span>
          </div>
          <input
            className="budget-range"
            type="range"
            min={MIN_BUDGET}
            max={3000}
            step={10}
            value={Math.min(budget, 3000)}
            onChange={(e) => onBudget(clampBudget(Number(e.target.value)))}
            aria-label="Bütçe kaydırıcısı"
          />
          <div className="budget-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`chip ${budget === p ? "chip--active" : ""}`}
                onClick={() => onBudget(p)}
              >
                ₺{p}M
              </button>
            ))}
          </div>
          <div className="budget-hint">
            {budget <= 250 ? "Kıt bütçe — 11 futbolcuya zor yetecek." :
              budget <= 800 ? "Dengeli bir pazarlık." :
                "Yüksek bütçe — yıldız kadrolar mümkün."}
          </div>
        </section>
      </div>
    </div>
  );
}
