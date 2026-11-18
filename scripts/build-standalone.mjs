// Çift tıklanarak (file://) çalışan tek dosyalık index.html üretir.
// JSIIFE + gömülü CSS kullanır; ES modülü/CORS sorunu olmaz.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const result = await build({
  entryPoints: [path.join(ROOT, "src/main.tsx")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  define: { "import.meta.env.BASE_URL": '"./"' },
  loader: { ".css": "empty" },
  outdir: path.join(ROOT, "out"),
  logLevel: "warning",
});

const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text
  .replace(/<\/script/gi, "<\\/script");
const css = fs.readFileSync(path.join(ROOT, "src/index.css"), "utf8");

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#0b0d12" />
<meta name="description" content="Futbol Mezatı — gerçek futbolcularla 11'e 11 açık artırma ve maç simülasyonu." />
<link rel="icon" type="image/svg+xml" href="./favicon.svg" />
<title>Futbol Mezatı</title>
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "index.html"), html);

// Fotoğrafları index.html'in yanına kopyala (göreli yollar file://'de çalışır).
fs.cpSync(path.join(ROOT, "public/photos"), path.join(ROOT, "photos"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "public/favicon.svg"), path.join(ROOT, "favicon.svg"));

// Barındırma için dist/'a da aynı çıktıyı koy.
fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "dist/index.html"), html);
fs.cpSync(path.join(ROOT, "public/photos"), path.join(ROOT, "dist/photos"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "public/favicon.svg"), path.join(ROOT, "dist/favicon.svg"));

console.log(`Hazır: index.html (${(html.length / 1024).toFixed(0)} KB), ${fs.readdirSync(path.join(ROOT, "photos")).length} fotoğraf.`);
