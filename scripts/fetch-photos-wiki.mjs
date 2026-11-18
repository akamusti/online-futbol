// TheSportsDB'de bulunamayan futbolcular için Wikipedia'den gerçek fotoğraf indirir.
// Çalıştır: node scripts/fetch-photos-wiki.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/photos");
fs.mkdirSync(OUT_DIR, { recursive: true });

const src = fs.readFileSync(path.join(ROOT, "src/data/rows.ts"), "utf8");
const names = [...src.matchAll(/^  \["([^"]+)"/gm)].map((m) => m[1]);

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const slugify = (s) => norm(s).replace(/ /g, "-");

function curl(url) {
  try {
    return execFileSync("curl", ["-sL", "--max-time", "18", "-A", "Mozilla/5.0 (FutbolMezati/1.0)", url], {
      encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
    });
  } catch { return null; }
}

function summary(name) {
  const raw = curl("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(name.replace(/ /g, "_")));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d.thumbnail?.source) return d.thumbnail.source;
  } catch { /* geç */ }
  return null;
}

function searchTitle(name) {
  const raw = curl("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
    + encodeURIComponent(name + " footballer") + "&format=json&srlimit=3");
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const hit = d.query?.search?.find((x) => norm(x.title).includes(norm(name).split(" ")[0]));
    return hit?.title ?? d.query?.search?.[0]?.title ?? null;
  } catch { return null; }
}

let ok = 0, miss = 0, fail = 0;
const missing = [];

for (let i = 0; i < names.length; i++) {
  const name = names[i];
  const out = path.join(OUT_DIR, `${slugify(name)}.png`);
  if (fs.existsSync(out)) continue;

  let thumb = summary(name);
  if (!thumb) {
    const title = searchTitle(name);
    if (title) thumb = summary(title);
  }
  if (!thumb) { miss++; missing.push(name); continue; }

  const tmp = "/tmp/opencode/wiki-photo.jpg";
  try {
    execFileSync("curl", ["-sL", "--max-time", "25", "-A", "Mozilla/5.0", "-o", tmp, thumb], { stdio: "ignore" });
    if (!fs.existsSync(tmp) || fs.statSync(tmp).size < 1000) { fail++; continue; }
    // Şeffaf şablon yerine bilinen dikdörtgen fotoğraf: üstten ortalı kırp.
    execFileSync("convert", [tmp, "-resize", "320x380^", "-gravity", "north", "-extent", "320x380", out], { stdio: "ignore" });
    ok++;
  } catch { fail++; }

  if ((i + 1) % 25 === 0) console.log(`...${i + 1}/${names.length} (${ok} eklendi, ${miss} bulunamadı, ${fail} hata)`);
}

console.log(`\nBitti: ${ok} Wikipedia fotoğrafı eklendi, ${miss} bulunamadı, ${fail} hata.`);
if (missing.length) console.log("Bulunamayanlar:\n" + missing.join(", "));
