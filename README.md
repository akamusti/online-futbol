# ⚽ Futbol Mezatı

[mezat.online](https://mezat.online/) tarzında, **gerçek futbolcularla** oynanan bir açık artırma + maç simülasyonu oyunu.

- **300 gerçek futbolcu** veritabanı (efsaneler + güncel yıldızlar karışık)
- FIFA tarzı 6 özellik: HIZ, ŞUT, PAS, TOP (dribbling), SAV (defans), FİZ
- **İki oyun modu:** AI'ya karşı (3 zorluk seviyesi) veya aynı ekranda 2 kişi (Discord'da konuşurken sırayla oynamak için)
- **Serbest bütçe:** ₺110M–₺20000M arası istediğin değeri yazabilir, kaydırıcı veya hazır seçeneklerle de belirleyebilirsin
- **Serbest teklif:** mezatta +1/+3/+5M butonlarının yanında istediğin tutarı yazıp **TEKLİF VER** diyebilirsin (Enter ile de olur)
- **İlk 11** kadro kurulumu (30 lot, her takım 11 futbolcu)
- **Kategori garantisi:** her takım en az 1 kaleci, 1 defans, 1 orta saha ve 1 forvet alır. Mezatta eksik kategori kalırsa lot havuzundaki en düşük overall'lı uygun oyuncu otomatik eklenir ("kötü oyuncu da olur" mantığı). Bu oyuncular kartta `OTOMATİK` rozetiyle işaretlenir.
- Mezat bitince kadrolar **1 dakikadan kısa**, hareketsiz, istatistik tabanlı bir maçta karşılaşır
- Gerçek futbolcu fotoğrafları (bulunabilenler için) + otomatik yedek kartlar

## Oynama — en kolay yol

**Proje klasöründeki `index.html` dosyasına çift tıkla.** Tarayıcıda doğrudan açılır, sunucu gerekmez.
JS ve CSS dosyanın içine gömülüdür; fotoğraflar yanındaki `photos/` klasöründen yüklenir.
Dosyayı taşıyacaksan `index.html`, `photos/` ve `favicon.svg` üçünü birlikte taşı.

## Geliştirme / yeniden derleme

```bash
npm install
npm run build    # index.html + photos/ + dist/ yeniden üretilir
npm run dev      # Vite geliştirme sunucusu (http://localhost:5173/dev.html)
npm run preview  # dist/ önizleme
```

`src/` içinde bir şey değiştirirsen değişikliğin çift tıklanabilir dosyaya yansıması için `npm run build` çalıştır.

## Yeni futbolcu ekleme

`src/data/rows.ts` dosyasına tek bir satır eklemen yeterli:

```ts
["İsim", "ÜL", "Kulüp", "ST", 26, 88],
```

Alanlar: `isim, ülke kodu(3 harf), kulüp, mevki(GK/CB/LB/RB/CDM/CM/CAM/LW/RW/ST), yaş, overall`.

Kartlarda futbolcunun **şu anki kulübü ve ligi** ayrı bir rozette gösterilir (ör. `🏟️ Inter Miami · MLS`, `🏟️ Al-Nassr · Suudi Pro Lig`). Kulüp adını değiştirmek için satırdaki kulüp alanını düzenlemen yeterli; lig otomatik gelir. Yeni bir kulüp eklediysen `src/data/players.ts` içindeki `LEAGUES` eşlemesine de ekle, aksi halde "Dünya" olarak görünür. Emekli futbolcularda kulüp `Efsane` olarak yazılır.

Özellikler (6 istatistik), piyasa değeri ve kart görünümü overall + mevki + yaşa göre otomatik üretilir.

## Yeni futbolcu fotoğrafı indirme

```bash
node scripts/fetch-photos.mjs
```

Betik TheSportsDB üzerinden gerçek cutout fotoğrafları indirir, `public/photos/` altına standart PNG olarak kaydeder. Bulunamayan oyuncular otomatik olarak isim baş harflerinden oluşturulan renkli karta düşer.

## Yapı

```
src/
  data/rows.ts        -> ham futbolcu listesi (200 satır)
  data/players.ts     -> özellik/değer üretimi, ülke ve bayrak eşlemeleri
  game/auction.ts     -> mezat kuralları ve AI teklif mantığı
  game/match.ts       -> maç simülasyonu (xG, gol, penaltı, olaylar)
  components/         -> ekranlar ve kart bileşenleri
  App.tsx             -> oyun akışı (kurulum → mezat → kadrolar → maç)
```

Ücretsiz hayran yapımıdır; resmî değildir. Futbolcular ve görseller hak sahiplerine aittir.
# online-futbol
