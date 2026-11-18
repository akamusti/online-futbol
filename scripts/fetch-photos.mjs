// Gerçek futbolcu fotoğraflarını TheSportsDB'den indirip standart PNG'e dönüştürür.
// Çalıştır: node scripts/fetch-photos.mjs
// Not: API, Node fetch isteklerini 429 ile reddettiği için curl kullanılır.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const ROWS_FILE = path.join(ROOT, "src/data/rows.ts");
const OUT_DIR = path.join(ROOT, "public/photos");
const TMP_DIR = "/tmp/opencode/rawphotos";
const API = "https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

const src = fs.readFileSync(ROWS_FILE, "utf8");
const names = [...src.matchAll(/^  \["([^"]+)"/gm)].map((m) => m[1]);

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

const slugify = (s) => norm(s).replace(/ /g, "-");

function score(query, candidate) {
  const a = norm(query).split(" ");
  const b = norm(candidate).split(" ");
  let hits = 0;
  for (const t of a) if (b.some((x) => x === t || (t.length > 3 && x.startsWith(t)) || (x.length > 3 && t.startsWith(x)))) hits++;
  return hits / Math.max(a.length, b.length);
}

function curlText(url) {
  try {
    return execFileSync("curl", ["-sL", "--max-time", "18", "-A", "Mozilla/5.0", url], {
      encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
    });
  } catch { return null; }
}

function curlFile(url, dest) {
  try {
    execFileSync("curl", ["-sL", "--max-time", "25", "-A", "Mozilla/5.0", "-o", dest, url], {
      stdio: "ignore",
    });
    return fs.existsSync(dest) && fs.statSync(dest).size > 1000;
  } catch { return false; }
}

let ok = 0, skip = 0, fail = 0;
const skippedNames = [];

for (let i = 0; i < names.length; i++) {
  const name = names[i];
  const outPath = path.join(OUT_DIR, `${slugify(name)}.png`);
  if (fs.existsSync(outPath)) { ok++; continue; }

  const raw = curlText(API + encodeURIComponent(name));
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }

  const players = json?.player ?? [];
  let best = null, bestScore = 0;
  for (const p of players) {
    const s = score(name, p.strPlayer || "");
    if (s > bestScore) { bestScore = s; best = p; }
  }

  if (!best || bestScore < 0.6 || (!best.strCutout && !best.strThumb)) {
    skip++; skippedNames.push(name);
    continue;
  }

  const url = best.strCutout || best.strThumb;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const tmp = path.join(TMP_DIR, `${slugify(name)}.${ext}`);

  if (!curlFile(url, tmp)) {
    fail++;
    continue;
  }

  try {
    execFileSync("convert", [
      tmp, "-background", "none", "-resize", "300x330", "-gravity", "center",
      "-extent", "320x380", outPath,
    ], { stdio: "ignore" });
    ok++;
  } catch {
    try { fs.copyFileSync(tmp, outPath); ok++; } catch { fail++; }
  }

  if ((i + 1) % 25 === 0) console.log(`...${i + 1}/${names.length} (${ok} indirildi, ${skip} atlandı, ${fail} hata)`);
}

console.log(`\nBitti: ${ok} fotoğraf, ${skip} atlandı, ${fail} hata. Toplam ${names.length} oyuncu.`);
if (skippedNames.length) {
  console.log("\nFotoğraf bulunamayanlar (avatar kullanılacak):");
  console.log(skippedNames.join(", "));
}
