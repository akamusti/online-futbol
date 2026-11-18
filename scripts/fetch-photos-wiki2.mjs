// Eksik fotoğraflar için Wikipedia arama + pageimages API ile ikinci geçiş.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/photos");
const src = fs.readFileSync(path.join(ROOT, "src/data/rows.ts"), "utf8");
const names = [...src.matchAll(/^  \["([^"]+)"/gm)].map((m) => m[1]);

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const slugify = (s) => norm(s).replace(/ /g, "-");

function curl(url) {
  try {
    return execFileSync("curl", ["-sL", "--max-time", "18", "-A", "Mozilla/5.0", url], {
      encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
    });
  } catch { return null; }
}

function score(query, title) {
  const a = norm(query).split(" ");
  const b = norm(title);
  const hits = a.filter((t) => t.length > 1 && b.includes(t)).length;
  return hits / a.length;
}

let ok = 0, miss = 0, fail = 0;
const missing = [];

for (const name of names) {
  const out = path.join(OUT_DIR, `${slugify(name)}.png`);
  if (fs.existsSync(out)) continue;

  const url = "https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="
    + encodeURIComponent(name) + "&gsrlimit=6&prop=pageimages&pithumbsize=500&format=json&redirects=1";
  const raw = curl(url);
  let pages = [];
  try { pages = Object.values(JSON.parse(raw).query?.pages ?? {}); } catch { /* geç */ }

  let best = null, bestScore = 0;
  for (const p of pages) {
    if (!p.thumbnail?.source) continue;
    const s = score(name, p.title ?? "");
    if (s > bestScore) { bestScore = s; best = p; }
  }

  if (!best || bestScore < 0.6) { miss++; missing.push(name); continue; }

  const tmp = "/tmp/opencode/wiki2-photo.jpg";
  try {
    execFileSync("curl", ["-sL", "--max-time", "25", "-A", "Mozilla/5.0", "-o", tmp, best.thumbnail.source], { stdio: "ignore" });
    if (!fs.existsSync(tmp) || fs.statSync(tmp).size < 1000) { fail++; continue; }
    execFileSync("convert", [tmp, "-resize", "320x380^", "-gravity", "north", "-extent", "320x380", out], { stdio: "ignore" });
    ok++;
  } catch { fail++; }
}

console.log(`Bitti: ${ok} eklendi, ${miss} bulunamadı, ${fail} hata.`);
if (missing.length) console.log("Bulunamayanlar:\n" + missing.join(", "));
