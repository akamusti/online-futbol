<div align="center">

# ⚽ Futbol Mezatı

**Gerçek futbolcularla açık artırma yap, kadronu kur, maçta rakibini yen.**

Efsaneler ve güncel yıldızlardan oluşan 300 futbolculuk havuzda teklif savaşına gir,
11 kişilik kadronu topla ve istatistik tabanlı maç simülasyonunda sonucu gör.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Sunucu gerekmez](https://img.shields.io/badge/sunucu-gerekmez-22c55e)

</div>

---

## 🚀 Hemen oyna

Kurulum gerekmez: **`index.html` dosyasına çift tıkla**, oyun tarayıcıda açılır.

JS ve CSS dosyanın içine gömülüdür; fotoğraflar yanındaki `photos/` klasöründen yüklenir.
Oyunu başka bir yere taşıyacaksan şu üçünü birlikte taşı:

```
index.html   photos/   favicon.svg
```

## 🎮 Nasıl oynanır

| Aşama | Ne oluyor? |
|---|---|
| **1 · Kurulum** | Oyun modunu, rakip zorluğunu ve kişi başı bütçeyi seç. |
| **2 · Mezat** | 30 lot boyunca her turda bir futbolcu açılır. Teklif ver ya da geç; en yüksek teklif kazanır. |
| **3 · Kadrolar** | İki takım kafa kafaya karşılaştırılır: hücum, orta saha, savunma, kaleci. |
| **4 · Maç** | Kadrolar 1 dakikadan kısa sürede simüle edilir: skor, xG, şutlar, maç akışı ve saha dizilişi. |

### Oyun modları

> Arkadaşlarınla farklı bir oyun için aşağıdaki [Görev Draftı](#-görev-draftı) moduna da bak.

- 🤖 **AI'ya karşı** — Kolay, Orta veya Zor rakiple tek başına oyna.
- 👥 **İki kişi** — Aynı ekranda sırayla teklif verin. Discord'da konuşurken arkadaşınla oynamak için ideal.

### Kurallar

- **Bütçe serbest:** ₺110M ile ₺20.000M arası istediğin değeri yaz, kaydırıcıyı kullan ya da hazır seçeneklerden birini seç.
- **Kadro:** Her takım 11 futbolcu alır.
- **Kategori garantisi:** Her takımda en az 1 kaleci, 1 defans, 1 orta saha ve 1 forvet olur.
  Mezat bittiğinde eksik kategori kalırsa, lot havuzundaki en düşük overall'lı uygun oyuncu otomatik eklenir
  ("kötü oyuncu da olur" mantığı). Bu oyuncular kartta **`OTOMATİK`** rozetiyle görünür.

### ⌨️ Mezat kısayolları

| Tuş | İşlem |
|---|---|
| `1` | +1M teklif |
| `2` | +3M teklif |
| `3` | +5M teklif |
| `P` | Geç |
| `Enter` | Özel teklif kutusundaki tutarı gönder |

## 🎯 Görev Draftı

Arkadaşlarla oynanan ikinci mod. Ana ekrandaki **GÖREV DRAFTI** butonuyla açılır.

1. **Görevi seç:** 📏 en uzun boylu takım, 🤏 en kısa boylu takım veya 🏆 en çok Dünya Kupası golü.
2. **Dizilişi seç:** `2 DF · 2 OS · 2 FV`, `1 KL · 2 DF · 2 OS · 1 FV`, tam 11 (`4-3-3`) ya da serbest 5.
3. **Kura:** Oyun, 2'si Türk takımı (Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor) olmak üzere 5 kulüp çeker. Beğenmezsen 🎲 ile yeniden çekebilirsin.
4. **Draft:** 2–4 kişi, yılan sırasıyla (1-2-3, 3-2-1, …) bu kulüplerde **tüm zamanlarda** oynamış futbolcular arasından seçer. Birinin aldığı futbolcuyu diğeri alamaz.
5. **Sonuç:** Takımlar göreve göre puanlanır, kazanan ilan edilir. **Rövanş** ile aynı ayarlarla yeni kura çekilir.

**Değerleri gizle** seçeneği açıkken boy ve gol sayıları draft bitene kadar görünmez. Bu durumda kimin futbolu daha iyi bildiği ortaya çıkar.

16 kulüp ve 300'ü aşkın futbolcu `src/data/draft.ts` dosyasında tutulur. Satır biçimi:

```ts
["İsim", "ÜL", "ST", 188, 3, ["GS", "INT"]],  // isim, ülke, mevki, boy (cm), DK golü, kulüpler
```

> Boy ve Dünya Kupası golü değerleri elle girilmiştir ve yaklaşık olabilir. Yanlış bir değer görürsen o satırı düzeltmen yeterli.

## ✨ Özellikler

- **300 gerçek futbolcu**, 39 farklı ülkeden; efsaneler ve güncel yıldızlar karışık
- **FIFA tarzı 6 özellik:** HIZ, ŞUT, PAS, TOP (dribbling), SAV (defans), FİZ
- Kartlarda futbolcunun **şu anki kulübü ve ligi** (ör. `🏟️ Inter Miami · MLS`)
- Mezat ekranında **sıradaki 3 lot**, kadrolardaki **mevki dağılımı** (KL / DF / OS / FV) ve canlı mezat kaydı
- Hazır butonların (+1 / +3 / +5M) yanında **istediğin tutarda özel teklif**
- Maç sonunda **istatistik karşılaştırması**, **dakika dakika maç akışı** ve gol atanların işaretlendiği **saha dizilişi**
- Gerçek futbolcu fotoğrafları; bulunamayanlar için baş harflerden oluşturulan renkli kart
- Telefonda da çalışan duyarlı tasarım

## 🛠️ Geliştirme

Gerekenler: [Node.js](https://nodejs.org/) 20.19 veya üstü.

```bash
npm install
npm run dev      # geliştirme sunucusu → http://localhost:5173/dev.html
npm run build    # çift tıklanabilir index.html + photos/ + dist/ yeniden üretilir
npm run preview  # dist/ önizlemesi
```

> `src/` içinde değişiklik yaptıysan, çift tıklanan `index.html`'e yansıması için `npm run build` çalıştır.

### Proje yapısı

```
src/
├── data/
│   ├── rows.ts          # ham futbolcu listesi (300 satır)
│   └── players.ts       # özellik/değer üretimi, ülke-bayrak ve kulüp-lig eşlemeleri
├── game/
│   ├── auction.ts       # mezat kuralları ve AI teklif mantığı
│   └── match.ts         # maç simülasyonu (xG, gol, penaltı, olaylar)
├── components/          # ekranlar (Kurulum, Mezat, Kadrolar, Maç) ve kart/saha bileşenleri
└── App.tsx              # oyun akışı: kurulum → mezat → kadrolar → maç
scripts/
├── build-standalone.mjs # tek dosyalık index.html üretir
└── fetch-photos*.mjs    # futbolcu fotoğraflarını indirir
```

### Yeni futbolcu ekleme

`src/data/rows.ts` dosyasına bir satır eklemen yeterli:

```ts
["İsim", "ÜL", "Kulüp", "ST", 26, 88],
```

Alanlar sırasıyla: **isim**, **ülke kodu** (3 harf), **kulüp**, **mevki** (`GK` `CB` `LB` `RB` `CDM` `CM` `CAM` `LW` `RW` `ST`), **yaş**, **overall**.

6 özellik, piyasa değeri ve kart görünümü overall, mevki ve yaşa göre otomatik üretilir.

- Lig, kulüp adından otomatik gelir. Yeni bir kulüp eklediysen `src/data/players.ts` içindeki `LEAGUES` eşlemesine de ekle; yoksa lig "Dünya" görünür.
- Emekli futbolcularda kulüp alanına `Efsane` yaz.

### Fotoğraf indirme

```bash
node scripts/fetch-photos.mjs        # TheSportsDB'den cutout fotoğraflar
node scripts/fetch-photos-wiki.mjs   # bulunamayanlar için Wikipedia
node scripts/fetch-photos-wiki2.mjs  # Wikipedia aramasıyla ikinci deneme
```

Fotoğraflar `public/photos/` altına PNG olarak kaydedilir; `npm run build` bunları `photos/` klasörüne kopyalar.

---

<sub>Ücretsiz bir hayran yapımıdır, resmî değildir. Futbolcu isimleri, fotoğrafları ve markalar hak sahiplerine aittir.</sub>
