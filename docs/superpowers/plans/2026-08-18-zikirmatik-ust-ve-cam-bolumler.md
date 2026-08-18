# Zikirmatiğin öne alınması ve cam bölüm kapsülleri — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İbadet sayfasında zikirmatiği en üste taşımak ve dört sayfadaki 27 bölümü yarı saydam "cam" kapsüllerin içine almak.

**Architecture:** Tek dosyalık bir PWA (`index.html`, ~3900 satır) üzerinde saf HTML/CSS düzenlemesi. Yeni bir `.bolum` sarmalayıcı sınıfı ve tema başına tanımlanan beş CSS değişkeni ekleniyor; her bölümün başlığı ve içeriği bu sarmalayıcıya alınıyor. Zikirmatik bloğu JavaScript'e dokunulmadan HTML içinde yukarı taşınıyor. Görsel değişikliğin mekanik hatalarını yakalamak için `index.html`'i ayrıştıran bir yapı testi yazılıyor.

**Tech Stack:** Düz HTML/CSS/JS (derleme adımı yok), `node:test` (test koşucusu), Node.js.

---

## Ön bilgi — bu kod tabanı hakkında bilmen gerekenler

**Derleme adımı yok.** `index.html` tarayıcıda doğrudan açılan tek dosyadır. CSS `<style>` içinde (satır ~18-457), HTML `<body>` içinde (~460-870), JavaScript `<script>` içinde (~875-3885) yaşar. `npm install` yoktur, `package.json` yoktur.

**Testler:** `araclar/*.test.cjs`, Node'un yerleşik `node:test` modülüyle yazılır. Koşturma: `node --test araclar/`. Mevcut iki test (`bildirim.test.cjs`, `dualar.test.cjs`) `bildirim.js` ve `dualar.js` içindeki saf fonksiyonları sınar; DOM'a bakmazlar.

**Dil:** Kod, yorumlar, commit mesajları ve kullanıcıya görünen her metin Türkçedir. Commit mesajlarında Türkçe karakter kullanma (depo geçmişi ASCII'dir: "Coklu konum ve kaydirmali gecis").

**Sayfa yapısı.** `<main>` içinde dört `<section class="sayfa">` var: `#sayfa-vakit`, `#sayfa-kible`, `#sayfa-ibadet`, `#sayfa-ayar`. Sekme değişimi `sekmeAc()` fonksiyonunda bu bölümlere `.acik` sınıfı ekleyip çıkararak yapılır.

**Bölüm nedir.** Bir "bölüm" = bir `.baslik` (küçük punto, harfleri seyrek, büyük harf etiket) + hemen ardından gelen içeriği. Başlık iki biçimde olabilir:
- `<div class="baslik">Bugün</div>` — sabit başlık
- `<button class="baslik" id="…" aria-expanded="…" aria-controls="…">` — katlanır bölüm başlığı; tıklanınca `aria-controls`'un işaret ettiği kartın `.gizli` sınıfını kaldırır

**Satır sonları CRLF.** `index.html` Windows satır sonu kullanır (CR+LF). Metin çapası ararken satır sonu içeren bir dize kullanma; böyle bir çapa eşleşmez. Tek satır içinde kalan çapalar seç.

**Satır numaraları uyarısı.** Bu plandaki bütün satır numaraları değişiklik yapılmamış `index.html`'e aittir (commit `570780f`). Her düzenleme sonrası alttaki satırlar kayar. Bu yüzden her adımda satır numarası değil, **birebir metin çapası** (anchor) verilmiştir. Düzenleme yaparken çapa metnini ara, satır numarasına güvenme.

---

## Dosya yapısı

| Dosya | Durum | Sorumluluk |
|---|---|---|
| `index.html` | Değiştirilir | CSS değişkenleri, `.bolum` sınıfı, 27 sarmalayıcı, zikirmatik taşıması, `SURUM` |
| `araclar/bolum.test.cjs` | Oluşturulur | `index.html`'in bölüm yapısını doğrulayan yapı testi |
| `sw.js` | Değiştirilir | Önbellek sürümü (kullanıcılar yeni CSS'i alsın) |

Yeni bir JS modülü çıkarılmıyor. Bu değişiklik görsel yapıyla ilgili; `index.html`'in davranış mantığına dokunmuyor.

---

## Task 1: Bölüm yapısı testi (henüz başarısız)

Bu testi önce yazıyoruz çünkü asıl risk 27 sarmalayıcıyı elle eklerken birinin yanlış yerde kapanması. Test bunu her adımda yakalar.

**Files:**
- Create: `araclar/bolum.test.cjs`

- [ ] **Step 1: Testi yaz**

`araclar/bolum.test.cjs` dosyasını şu içerikle oluştur:

```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* <main>…</main> aralığı. Sayfa iceriginin tamami burada; <script> etiketleri
   bu araligin disinda kaldigi icin JS icindeki '<div' gibi metinler
   tarayiciyi yanlis yonlendirmez. */
function anaBolge() {
  const bas = HTML.indexOf('<main>');
  const son = HTML.indexOf('</main>');
  assert.ok(bas !== -1 && son > bas, 'index.html icinde <main>…</main> bulunamadi');
  return HTML.slice(bas, son);
}

/* Bir <section class="sayfa" id="…"> blogunun ic metnini dondurur.
   div derinligi sayarak degil, section etiketleri arasindan keserek bulur. */
function sayfa(id) {
  const govde = anaBolge();
  const bas = govde.indexOf('id="' + id + '"');
  assert.ok(bas !== -1, id + ' sayfasi bulunamadi');
  const acilis = govde.indexOf('>', bas) + 1;
  const kapanis = govde.indexOf('</section>', acilis);
  assert.ok(kapanis !== -1, id + ' sayfasi kapanmiyor');
  return govde.slice(acilis, kapanis);
}

/**
 * Bir sayfa govdesindeki her `class="baslik"` etiketinin, acik bir
 * `class="bolum"` sarmalayicisinin icinde olup olmadigini denetler.
 *
 * Yontem: govdeyi etiket etiket tarayip <div>/</div> derinligi tutar.
 * Bir `.bolum` acildiginda derinligi kaydeder; kapanan </div> o derinlige
 * dondugunde kapsul biter. Basliga rastlandiginda kapsul acik olmali.
 *
 * Donus: { toplamBaslik, kapsulsuzBaslik: [...metin], bolumSayisi }
 */
function bolumDenetle(govde) {
  const etiket = /<(\/?)(div|button|section)\b([^>]*)>/g;
  let m, derinlik = 0;
  const kapsulYigini = [];        // acik .bolum sarmalayicilarinin derinligi
  const kapsulsuz = [];
  let toplamBaslik = 0, bolumSayisi = 0;

  while ((m = etiket.exec(govde)) !== null) {
    const kapanis = m[1] === '/';
    const ad = m[2];
    const nitelik = m[3] || '';
    // <img>, <input> gibi void etiketler zaten yakalanmiyor; div/button ikisi de
    // kendiliginden kapanmaz, bu yuzden ayri bir kontrol gerekmez.
    if (ad === 'section') continue;

    if (!kapanis) {
      if (/class="[^"]*\bbolum\b[^"]*"/.test(nitelik)) {
        kapsulYigini.push(derinlik);
        bolumSayisi++;
      }
      if (/class="[^"]*\bbaslik\b[^"]*"/.test(nitelik)) {
        toplamBaslik++;
        if (kapsulYigini.length === 0) {
          const sonrasi = govde.slice(m.index, m.index + 140).replace(/\s+/g, ' ');
          kapsulsuz.push(sonrasi);
        }
      }
      derinlik++;
    } else {
      derinlik--;
      while (kapsulYigini.length && kapsulYigini[kapsulYigini.length - 1] === derinlik) {
        kapsulYigini.pop();
      }
    }
  }
  assert.strictEqual(derinlik, 0, 'div/button etiketleri dengeli kapanmiyor');
  return { toplamBaslik, kapsulsuz, bolumSayisi };
}

const SAYFALAR = [
  ['sayfa-vakit', 7],
  ['sayfa-kible', 4],
  ['sayfa-ibadet', 8],
  ['sayfa-ayar', 8]
];

for (const [id, beklenen] of SAYFALAR) {
  test(id + ' — her baslik bir .bolum kapsulunun icinde', () => {
    const { kapsulsuz } = bolumDenetle(sayfa(id));
    assert.deepStrictEqual(kapsulsuz, [],
      'kapsul disinda kalan baslik(lar):\n' + kapsulsuz.join('\n'));
  });

  test(id + ' — bolum sayisi ' + beklenen, () => {
    const { bolumSayisi } = bolumDenetle(sayfa(id));
    assert.strictEqual(bolumSayisi, beklenen);
  });
}

test('ibadet sayfasinin ilk bolumu Zikirmatik', () => {
  const govde = sayfa('sayfa-ibadet');
  const ilk = govde.indexOf('class="baslik"');
  assert.ok(ilk !== -1, 'ibadet sayfasinda baslik yok');
  const metin = govde.slice(ilk, ilk + 400);
  assert.match(metin, /Zikirmatik/,
    'ilk baslik Zikirmatik degil — zikirmatik blogu en uste tasinmali');
});

test('cekilen zikirler bolumu bugunku namazlardan once gelir', () => {
  const govde = sayfa('sayfa-ibadet');
  const zikirIst = govde.indexOf('id="zikirIstBaslik"');
  const namazlar = govde.indexOf('Bugünkü namazlar');
  assert.ok(zikirIst !== -1 && namazlar !== -1, 'beklenen capalar bulunamadi');
  assert.ok(zikirIst < namazlar,
    'Cekilen zikirler bolumu Bugunku namazlar bolumunun altinda kalmis');
});

test('cam degiskenleri uc temada da tanimli', () => {
  const DEGISKENLER = ['--cam', '--cam-cizgi', '--cam-parlak', '--cam-ic', '--cam-ic-cizgi'];
  const stil = HTML.slice(HTML.indexOf('<style>'), HTML.indexOf('</style>'));
  const bloklar = {
    koyu: stil.slice(stil.indexOf(':root{'), stil.indexOf(':root[data-tema=acik]')),
    acik: stil.slice(stil.indexOf(':root[data-tema=acik]'), stil.indexOf(':root[data-tema=amoled]')),
    amoled: stil.slice(stil.indexOf(':root[data-tema=amoled]'), stil.indexOf('*{box-sizing'))
  };
  for (const [ad, blok] of Object.entries(bloklar)) {
    assert.ok(blok.length > 0, ad + ' tema blogu bulunamadi');
    for (const d of DEGISKENLER) {
      assert.ok(new RegExp(d + '\\s*:').test(blok), ad + ' temasinda ' + d + ' tanimli degil');
    }
  }
});
```

- [ ] **Step 2: Testi koştur, başarısız olduğunu gör**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: BAŞARISIZ. Şu an hiçbir `.bolum` yok, `--cam` değişkenleri yok ve zikirmatik en üstte değil. Yani `bolum sayisi` testleri `0 !== 7` diye, `her baslik bir .bolum kapsulunun icinde` testleri kapsülsüz başlık listesiyle, `ibadet sayfasinin ilk bolumu Zikirmatik` testi "ilk başlık Zikirmatik değil" diye, `cam degiskenleri` testi "koyu temasinda --cam tanimli degil" diye düşer.

Diğer testlerin bozulmadığını da doğrula: `node --test araclar/` — `bildirim.test.cjs` ve `dualar.test.cjs` geçmeye devam etmeli.

- [ ] **Step 3: Commit**

```bash
git add araclar/bolum.test.cjs
git commit -m "Bolum yapisi testi (henuz basarisiz)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: CSS değişkenleri ve `.bolum` sınıfı

Görsel altyapı. Bu görevden sonra sayfa görünümü değişmez (hiçbir yerde `.bolum` kullanılmıyor), ama `cam degiskenleri` testi geçmeye başlar.

**Files:**
- Modify: `index.html` — `:root` bloğu (~satır 20-37), `:root[data-tema=acik]` (~42-56), `:root[data-tema=amoled]` (~57-64), ve `.baslik`/`.kart` kurallarının bulunduğu yer (~177-180)

- [ ] **Step 1: Koyu tema değişkenlerini ekle**

`index.html` içinde `--tabbar:rgba(10,14,28,.88);` satırını bul. Onun hemen **altına**, `}` kapanışından **önce** şunu ekle:

```css
  /* cam bolum kapsulleri — bkz. docs/superpowers/specs/2026-08-18-*.md */
  --cam:rgba(242,238,226,.05);
  --cam-cizgi:rgba(242,238,226,.13);
  --cam-parlak:rgba(242,238,226,.10);
  --cam-ic:rgba(242,238,226,.05);
  --cam-ic-cizgi:rgba(242,238,226,.10);
  --cam-golge:0 8px 26px rgba(0,0,0,.30);
```

- [ ] **Step 2: Açık tema değişkenlerini ekle**

`--tabbar:rgba(255,255,255,.90);` satırını bul (bu `:root[data-tema=acik]` bloğunun içindedir). Hemen altına ekle:

```css
  --cam:rgba(255,255,255,.55);
  --cam-cizgi:rgba(24,48,45,.10);
  --cam-parlak:rgba(255,255,255,.85);
  --cam-ic:rgba(255,255,255,.75);
  --cam-ic-cizgi:rgba(24,48,45,.08);
  --cam-golge:0 4px 14px rgba(24,48,45,.08);
```

Açık temada gölge kasıtlı olarak daha yumuşak — koyu temanın sert gölgesi açık zeminde kirli görünür.

- [ ] **Step 3: AMOLED tema değişkenlerini ekle**

`--tabbar:rgba(0,0,0,.92);` satırını bul. Hemen altına ekle:

```css
  --cam:transparent;
  --cam-cizgi:rgba(242,238,226,.14);
  --cam-parlak:transparent;
  --cam-ic:#0A0A0A;
  --cam-ic-cizgi:rgba(242,238,226,.12);
  --cam-golge:none;
```

AMOLED'in tek amacı pikselleri söndürmek. Kapsüle zemin ve gölge verilmez; bölüm yalnızca ince çerçeveyle ayrılır.

- [ ] **Step 4: `.bolum` sınıfını ve içerik kurallarını ekle**

`index.html` içinde şu iki satırı bul:

```css
.baslik:first-child{margin-top:14px}
.kart{background:var(--kat);border:1px solid var(--cizgi);border-radius:var(--r);overflow:hidden}
```

`.kart{…}` satırının hemen **altına** şunu ekle:

```css
/* ---------- cam bolum kapsulu ----------
   Her bolum (baslik + icerigi) bu sarmalayicinin icine girer. Bolumler arasi
   dikey ritmi artik .baslik'in ust bosluklari degil, kapsulun margin-bottom'u
   kurar; bu yuzden kapsul icindeki basligin ust bosluklari sifirlanir.

   backdrop-filter kasitli olarak kullanilmiyor: <main> arkasinda duz
   var(--gece) zemin var, bulaniklastirilacak bir sey yok. Blur goruntuye
   hicbir sey katmadan 27 panelde GPU maliyeti cikarirdi. Arka plana ileride
   doku/fotograf/hareket eklenirse bu karar yeniden degerlendirilmeli. */
.bolum{
  background:var(--cam);
  border:1px solid var(--cam-cizgi);
  border-radius:20px;
  box-shadow:inset 0 1px 0 var(--cam-parlak), var(--cam-golge);
  padding:12px 12px 14px;
  margin-bottom:12px;
}
.bolum .baslik{margin:2px 0 10px;padding-left:2px}
.bolum .baslik:first-child{margin-top:2px}
/* kart icinde kart katmanlasmasini onler */
.bolum .kart,
.bolum .ozet-kutu{background:var(--cam-ic);border-color:var(--cam-ic-cizgi)}
/* kapsulun son cocugunun alt boslugu kapsulun padding'iyle cift olmasin */
.bolum > :last-child{margin-bottom:0}
```

`box-shadow`'da AMOLED için `var(--cam-golge)` `none` olur; `inset 0 1px 0 transparent` de görünmez. Yani AMOLED'de gölge tamamen kaybolur, istenen budur.

- [ ] **Step 5: Testi koştur**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: `cam degiskenleri uc temada da tanimli` testi artık GEÇER. Diğer testler hâlâ düşer (henüz `.bolum` kullanılmıyor, zikirmatik taşınmadı) — bu doğru.

- [ ] **Step 6: Tarayıcıda hiçbir şeyin bozulmadığını doğrula**

`index.html`'i tarayıcıda aç. Dört sayfayı da gez. Görünüm **birebir eskisi gibi** olmalı — `.bolum` henüz hiçbir elemana uygulanmadı, sadece tanımlandı. Bir fark görüyorsan bir yazım hatası yapmışsındır.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Cam kapsul degiskenleri ve .bolum sinifi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: İbadet sayfasında zikirmatiği en üste taşı

**Files:**
- Modify: `index.html` — `#sayfa-ibadet` gövdesi (değişiklik öncesi satır 577-651)

- [ ] **Step 1: Taşınacak bloğu kes**

`<section class="sayfa" id="sayfa-ibadet">` etiketini bul. Gövdesinde şu blok var — `<div class="baslik">Zikirmatik</div>` satırından başlayıp `<p class="bilgi" id="zikirGunluk"></p>` satırında biten kesintisiz aralık (değişiklik öncesi satır 606-639). Bu bloğun tamamı:

```html
    <div class="baslik">Zikirmatik</div>
    <button class="tesbih-set-btn" id="setModuBtn">Namaz sonrası tesbih seti
      <em>Sübhânallâh 33 · Elhamdülillâh 33 · Allâhüekber 34 — hedefe ulaşınca otomatik geçer</em></button>
    <div class="zikir-sec-sar">
      <div class="zikir-sec" id="zikirSec"></div>
      <button id="zikirEkleBtn" aria-label="Yeni zikir ekle">+</button>
    </div>
    <div class="kart katlanir gizli" id="zikirEkleForm">
      <div class="alan"><label>Zikir adı</label><input type="text" id="ozelZikirAd" maxlength="40" placeholder="ör. Yâ Latîf"></div>
      <div class="alan"><label>Hedef <em>0 = serbest sayaç</em></label><input type="number" id="ozelZikirHedef" value="33" min="0" max="9999" style="width:80px;text-align:right"></div>
      <div class="btn-satir" style="padding:0 16px 14px">
        <button class="btn ikincil" id="ozelZikirVazgec">Vazgeç</button>
        <button class="btn" id="ozelZikirKaydet">Ekle</button>
      </div>
    </div>
    <div class="tesbih-zikir" id="tesbihZikir"></div>
    <div class="tesbih-sar">
      <button id="tesbihBtn" aria-label="Zikir sayacı — dokunarak arttır">
        <div>
          <div class="tesbih-sayi" id="tesbihSayi">0</div>
          <div class="tesbih-hedef" id="tesbihHedef">hedef 33</div>
        </div>
      </button>
    </div>
    <div class="btn-satir">
      <button class="btn ikincil" id="tesbihGeri">Bir geri</button>
      <button class="btn ikincil" id="tesbihSifirla">Sıfırla</button>
    </div>

    <button class="baslik" id="zikirIstBaslik" aria-expanded="true" aria-controls="zikirIstKart">
      Çekilen zikirler <span class="ok" aria-hidden="true">⌃</span>
    </button>
    <div class="kart katlanir" id="zikirIstKart"></div>
    <p class="bilgi" id="zikirGunluk"></p>
```

Bu bloğu bulunduğu yerden **sil** ve `<section class="sayfa" id="sayfa-ibadet">` satırının hemen **altına**, yani `<div class="baslik">Bugünkü namazlar</div>` satırından **önce** yapıştır.

Taşıma sonrası `#sayfa-ibadet` gövdesinin sırası şöyle olmalı:

```
Zikirmatik (baslik + setModuBtn + zikir-sec-sar + zikirEkleForm + tesbihZikir + tesbih-sar + btn-satir)
Çekilen zikirler (zikirIstBaslik + zikirIstKart + zikirGunluk)
Bugünkü namazlar (baslik + ozet + takipListe + bilgi)
Son 30 gün ve istatistik (istatistikBaslik + istatistikKart)
Kaza namazı sayacı (kazaBaslik + kazaKart)
Nasûh Tövbesi (tovbeBaslik + tovbeKart)
Esmâ-ül Hüsnâ (esmaBaslik + esmaKart)
Mübarek gün duaları (duaArsivBaslik + duaArsivKart + duaKaynakNotu)
```

**JavaScript'e dokunma.** Bölümdeki her eleman `id` ile bulunuyor (`$('#tesbihBtn')`, `$('#zikirIstKart')`, `$('#zikirSec')` …); kod hiçbir yerde kardeş/sıra tabanlı DOM erişimi kullanmıyor. Bu taşıma tek başına hiçbir fonksiyonu bozmaz.

- [ ] **Step 2: Sıralama testlerini koştur**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: `ibadet sayfasinin ilk bolumu Zikirmatik` ve `cekilen zikirler bolumu bugunku namazlardan once gelir` testleri artık GEÇER. `.bolum` testleri hâlâ düşer (henüz sarmalayıcı yok).

- [ ] **Step 3: Tarayıcıda dene**

`index.html`'i aç, İbadet sekmesine geç. Doğrula:
- Zikirmatik en üstte, hemen altında "Çekilen zikirler"
- Tesbih dairesine dokununca sayı artıyor
- "Bir geri" ve "Sıfırla" çalışıyor
- Zikir seçicideki düğmelere basınca seçili zikir değişiyor
- `+` düğmesi ekleme formunu açıyor
- "Çekilen zikirler" başlığına dokununca liste katlanıp açılıyor
- Aşağıda "Bugünkü namazlar" ve namaz kutucukları çalışıyor

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Zikirmatik ibadet sayfasinin en ustune alindi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: İbadet sayfasının 8 bölümünü kapsülle

İlk sarmalama sayfası bu; kapsülün gerçekte nasıl durduğunu burada görüp gerekirse dolgu/boşluk değerlerini ayarlayacağız. Sonraki sayfalar bu ayarlanmış hâli tekrarlar.

**Files:**
- Modify: `index.html` — `#sayfa-ibadet` gövdesi

- [ ] **Step 1: Sekiz bölümü sar**

`#sayfa-ibadet` içindeki her bölümü `<div class="bolum">` … `</div>` arasına al. İçerideki satırların girintisini iki boşluk artır. Sonuç tam olarak şöyle olmalı (Task 3'teki taşımanın üzerine):

```html
  <section class="sayfa" id="sayfa-ibadet">
    <div class="bolum">
      <div class="baslik">Zikirmatik</div>
      … setModuBtn'den btn-satir'a kadar Task 3'te listelenen içerik …
    </div>

    <div class="bolum">
      <button class="baslik" id="zikirIstBaslik" …>…</button>
      <div class="kart katlanir" id="zikirIstKart"></div>
      <p class="bilgi" id="zikirGunluk"></p>
    </div>

    <div class="bolum">
      <div class="baslik">Bugünkü namazlar</div>
      <div class="ozet">…</div>
      <div class="kart" id="takipListe" style="margin-top:10px"></div>
      <p class="bilgi">Kaydın yalnızca bu cihazda tutulur; …</p>
    </div>

    <div class="bolum">
      <button class="baslik" id="istatistikBaslik" …>…</button>
      <div class="kart katlanir gizli" id="istatistikKart">…</div>
    </div>

    <div class="bolum">
      <button class="baslik" id="kazaBaslik" …>…</button>
      <div class="kart katlanir gizli" id="kazaKart"></div>
    </div>

    <div class="bolum">
      <button class="baslik" id="tovbeBaslik" …>…</button>
      <div class="kart katlanir gizli" id="tovbeKart"></div>
    </div>

    <div class="bolum">
      <button class="baslik" id="esmaBaslik" …>…</button>
      <div class="kart katlanir gizli" id="esmaKart"></div>
    </div>

    <div class="bolum">
      <button class="baslik" id="duaArsivBaslik" …>…</button>
      <div class="kart katlanir gizli" id="duaArsivKart"></div>
      <p class="bilgi" id="duaKaynakNotu">Kaynak: Ramazanoğlu Mahmud Sâmi, …</p>
    </div>
  </section>
```

Yukarıdaki `…` yerlerine mevcut içeriği **olduğu gibi** bırak; hiçbir nitelik, id, metin veya `aria-*` değeri değişmiyor. Tek yapılan sarmak ve girintilemek.

Dikkat edilecek nokta: `aria-controls` ile işaret edilen kart, başlığıyla **aynı** kapsülün içinde kalmalı. Katlanır kartı bir sonraki kapsüle bırakırsan başlığa dokunma davranışı görsel olarak bozulur.

- [ ] **Step 2: Testi koştur**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: `sayfa-ibadet — her baslik bir .bolum kapsulunun icinde` ve `sayfa-ibadet — bolum sayisi 8` testleri GEÇER. Diğer üç sayfanın testleri hâlâ düşer.

Test "div/button etiketleri dengeli kapanmiyor" derse bir `</div>` eksik veya fazladır; sarmaladığın son bölüme bak.

- [ ] **Step 3: Tarayıcıda üç temada da bak**

`index.html`'i aç, İbadet sekmesi. Ayarlar → "Bildirim ve görünüm" altındaki tema seçiciyle koyu / açık / AMOLED arasında geçip her birinde İbadet sayfasına dön. Her temada:
- Sekiz bölümün her biri kendi kapsülünde ve sınırı seçilebiliyor
- Metin okunaklı, kontrast kaybı yok
- Kapsüller arası boşluk dengeli — üst üste binen veya iki katına çıkmış boşluk yok
- Katlanır başlıklara dokununca kapsül yüksekliği içerikle birlikte değişiyor

Boşluklar bozuksa `index.html`'deki `.bolum` kuralında `padding` ve `margin-bottom` değerlerini ayarla; `.baslik{margin:26px 0 10px}` genel kuralına **dokunma**, o hâlâ kapsülsüz yerler için geçerli.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Ibadet sayfasinin 8 bolumu cam kapsullere alindi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Vakitler sayfasının 7 bölümünü kapsülle

Bu sayfanın dört bölümü zaten sarmalayıcı bir `<div>` içinde (`#ramazanKutu`, `#cumaKutu`, `#duaKutu`, `#kerahatKutu` — JS bunların `style.display`'ini açıp kapatıyor). Onlara yeni bir katman eklemek yerine mevcut div'e `class="bolum"` ekliyoruz.

**Files:**
- Modify: `index.html` — `#sayfa-vakit` gövdesi (değişiklik öncesi satır 483-520)

- [ ] **Step 1: Mevcut dört kutuya `class="bolum"` ekle**

Şu dört satırı bul ve değiştir:

| Bul | Yerine yaz |
|---|---|
| `<div id="ramazanKutu" style="display:none">` | `<div class="bolum" id="ramazanKutu" style="display:none">` |
| `<div id="cumaKutu" style="display:none">` | `<div class="bolum" id="cumaKutu" style="display:none">` |
| `<div id="duaKutu" style="display:none">` | `<div class="bolum" id="duaKutu" style="display:none">` |
| `<div id="kerahatKutu">` | `<div class="bolum" id="kerahatKutu">` |

`style="display:none"` `.bolum`'un `background`/`padding`'ini ezmez — `display:none` elemanı tamamen gizler, JS onu görünür yapınca kapsül biçimiyle birlikte gelir. Bu dördünün `display`'ini yöneten JS'e dokunma.

- [ ] **Step 2: Kalan üç bölümü sar**

`#sayfa-vakit` içinde kalan üç bölümü `<div class="bolum">` ile sar:

```html
    <div class="bolum">
      <div class="baslik">Bugün</div>
      <div class="kart" id="vakitListe"></div>
      <p class="bilgi" id="kaynakNotu" style="display:none"></p>
    </div>
```

```html
    <div class="bolum">
      <button class="baslik" id="imsakiyeBaslik" aria-expanded="true" aria-controls="imsakiyeKart">
        … mevcut içerik …
      </button>
      <div class="kart katlanir" id="imsakiyeKart" style="padding:0 10px">
        … mevcut içerik …
      </div>
    </div>
```

```html
    <div class="bolum">
      <button class="baslik" id="diniBaslik" aria-expanded="false" aria-controls="diniKart">
        … mevcut içerik …
      </button>
      <div class="kart katlanir gizli" id="diniKart"></div>
    </div>
```

- [ ] **Step 3: Testi koştur**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: `sayfa-vakit — her baslik bir .bolum kapsulunun icinde` ve `sayfa-vakit — bolum sayisi 7` GEÇER.

- [ ] **Step 4: Tarayıcıda dene**

Vakitler sekmesi. Doğrula:
- "Bugün", imsakiye ve dini günler bölümleri kapsüllerinde
- İmsakiye ve dini günler başlıklarına dokununca katlanıyor
- Kerahat vakitleri kutusu kapsülünde görünüyor
- Üstteki geri sayım başlığı (`<header id="gokyuzu">`) **değişmemiş** — o kapsam dışı
- Birden fazla konum tanımlıysa sağa/sola kaydırmalı konum geçişi hâlâ çalışıyor ve kapsüller geçişte bozulmuyor

Ramazan/Cuma/dua kutuları bugün görünmeyebilir (tarihe bağlı gösteriliyorlar). Görünüyorlarsa kapsülde olduklarını doğrula; görünmüyorlarsa sorun değil, testi bu yüzden yazdık.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Vakitler sayfasinin 7 bolumu cam kapsullere alindi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Kıble sayfasının 4 bölümünü kapsülle

Bu sayfanın ilk bölümünün başlığı yok — pusulanın kendisi, durum yazısı ve butonları tek bir kapsül olur. Test yalnızca `.baslik`'ların kapsülde olmasını denetler, ama bölüm sayısı 4 beklendiği için başlıksız kapsülü de eklemen gerekir.

**Files:**
- Modify: `index.html` — `#sayfa-kible` gövdesi (değişiklik öncesi satır 523-574)

- [ ] **Step 1: Dört bölümü sar**

```html
  <section class="sayfa" id="sayfa-kible">
    <div class="bolum">
      <div class="pusula-sar">…</div>
      <div class="pusula-durum">…</div>
      <div style="margin-top:14px"><button class="btn" id="pusulaBtn">Pusulayı başlat</button></div>
      <div class="btn-satir">…</div>
      <p class="bilgi">…</p>
    </div>

    <div class="bolum">
      <div class="baslik">Güneşe göre kıble</div>
      <div class="kart"><div id="gunesKart"></div></div>
      <p class="bilgi" style="margin-bottom:10px">…</p>
      <div class="btn-satir">…</div>
      <div id="olcumSonuc"></div>
    </div>

    <div class="bolum">
      <button class="baslik" id="haritaBaslik" aria-expanded="false" aria-controls="haritaKart">…</button>
      <div class="katlanir gizli" id="haritaKart">…</div>
    </div>

    <div class="bolum">
      <button class="baslik" id="camiBaslik" aria-expanded="false" aria-controls="camiKart">…</button>
      <div class="katlanir gizli" id="camiKart">…</div>
    </div>
  </section>
```

`…` yerlerine mevcut içeriği olduğu gibi bırak.

- [ ] **Step 2: Testi koştur**

Çalıştır: `node --test araclar/bolum.test.cjs`

Beklenen: `sayfa-kible` testlerinin ikisi de GEÇER.

- [ ] **Step 3: Tarayıcıda dene**

Kıble sekmesi. Doğrula:
- Pusula çemberi kapsülün içine sığıyor, kenarlardan taşmıyor
- "Pusulayı başlat" çalışıyor (masaüstünde veri gelmeyebilir, o normal — hata mesajı görünmeli)
- "Uydu haritası" başlığına dokununca harita açılıyor ve **doğru boyutta** çiziliyor

Harita bozuk çiziliyorsa: Leaflet, kapsayıcısının ölçüsünü açılış anında okur. `haritaKur()` fonksiyonu `sekmeAc()` içinden çağrılıyor (`index.html:3776` civarı). Kapsül `padding`'i haritanın genişliğini değiştirdiği için `harita.invalidateSize()` çağrısı gerekebilir. Böyle bir sorun görürsen `haritaKur()` içinde haritanın oluşturulduğu yerin sonuna `setTimeout(()=> harita.invalidateSize(), 0);` ekle.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Kible sayfasinin 4 bolumu cam kapsullere alindi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Ayarlar sayfasının 8 bölümünü kapsülle

En uzun sayfa; "Bildirim ve görünüm" bölümü tek başına ~95 satır. Dikkatli git.

**Files:**
- Modify: `index.html` — `#sayfa-ayar` gövdesi (değişiklik öncesi satır 655-858)

- [ ] **Step 1: Sekiz bölümü sar**

Sekiz bölüm ve sınırları (başlık satırından, bir sonraki başlıktan önceki son satıra kadar):

| # | Başlık | Kapsanan içerik |
|---|---|---|
| 1 | `Konumlarım` | `#konumlarKart` + ardındaki `<p class="bilgi">Bildirimler yalnızca…</p>` |
| 2 | `Konum` | şehir/enlem/boylam/rakım alanlarını ve `#gpsBtn`'yi içeren `.kart` |
| 3 | `Diyanet takvimi` | `.kart` + ardındaki `<p class="bilgi">Vakitler Diyanet takviminden…</p>` |
| 4 | `Hesaplama` | öndeki `<p class="bilgi" style="margin:-4px 0 10px">` + `.kart` + arkadaki `<p class="bilgi">Diyanet yöntemi seçiliyken…</p>` |
| 5 | `Dakika düzeltmesi` | `#duzeltmeler` + ardındaki `<p class="bilgi">Mahalle caminle…</p>` |
| 6 | `Bildirim ve görünüm` | tek büyük `.kart` (~95 satır) |
| 7 | `Pusula` | sapma düzeltmesini içeren `.kart` |
| 8 | `Hakkında` | `.hakkinda` içeren `.kart` |

Her birini şu kalıpla sar:

```html
    <div class="bolum">
      <div class="baslik">Konumlarım</div>
      … mevcut içerik …
    </div>
```

**Sayfanın en sonundaki** `<p class="bilgi" style="margin:14px 0 40px;text-align:center">` (kaynak kodu / OpenStreetMap notu) bir bölüme ait değil — sayfa altbilgisi. Onu **kapsül dışında**, `</section>`'dan hemen önce olduğu gibi bırak.

4. bölümde dikkat: `Hesaplama` başlığının **altındaki** açıklama satırı (`style="margin:-4px 0 10px"`) o bölüme aittir, kapsülün içinde kalmalı.

- [ ] **Step 2: Testi koştur**

Çalıştır: `node --test araclar/`

Beklenen: **bütün** testler GEÇER — `bolum.test.cjs`'teki dokuz test dahil, `bildirim.test.cjs` ve `dualar.test.cjs` de dahil.

- [ ] **Step 3: Tarayıcıda dene**

Ayarlar sekmesi. Doğrula:
- Sekiz bölümün her biri kapsülünde, en alttaki kaynak notu kapsülsüz
- Şehir seçici, enlem/boylam/rakım alanları yazılabiliyor
- "Konumumu bul" düğmesi çalışıyor
- Anahtarlar (`.svic`) açılıp kapanıyor
- Tema seçici üç temada da çalışıyor ve **her temada dört sayfayı da gez**
- Konum ekleme/silme çalışıyor

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Ayarlar sayfasinin 8 bolumu cam kapsullere alindi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Sürüm yükselt ve son doğrulama

Kullanıcıların yeni CSS'i alması için service worker önbelleği tazelenmeli; aksi hâlde eski `index.html` önbellekten servis edilir.

**Files:**
- Modify: `index.html:879` — `const SURUM = '0.15.0';`
- Modify: `sw.js:6` — `const SURUM = 'besvakit-v10';`

- [ ] **Step 1: Uygulama sürümünü yükselt**

`index.html` içinde `const SURUM = '0.15.0';` satırını bul ve şununla değiştir:

```js
const SURUM = '0.16.0';
```

- [ ] **Step 2: Önbellek sürümünü yükselt**

`sw.js` içinde `const SURUM = 'besvakit-v10';` satırını bul ve şununla değiştir:

```js
const SURUM = 'besvakit-v11';
```

`sw.js:17`'deki `activate` işleyicisi bu ad değişince eski önbelleği siler, kullanıcı yeni dosyaları alır.

- [ ] **Step 3: Bütün testleri koştur**

Çalıştır: `node --test araclar/`

Beklenen: hepsi PASS. Çıktının sonunda `# fail 0` görmelisin.

- [ ] **Step 4: Son elle doğrulama**

`index.html`'i tarayıcıda aç ve şu listeyi baştan sona geç:

1. Dört sayfayı da gez — her bölüm kapsülde, kapsül dışında başlık kalmamış
2. Üç temayı (koyu / açık / AMOLED) tek tek seç; her birinde dört sayfaya da bak
3. On katlanır başlığın hepsini aç ve kapat: `#imsakiyeBaslik`, `#diniBaslik`, `#haritaBaslik`, `#camiBaslik`, `#zikirIstBaslik`, `#istatistikBaslik`, `#kazaBaslik`, `#tovbeBaslik`, `#esmaBaslik`, `#duaArsivBaslik`
4. İbadet sayfasında zikirmatik en üstte; sayaç artıyor, geri/sıfırla ve zikir seçici çalışıyor
5. Ayarlar → Hakkında bölümünde sürüm **0.16.0** yazıyor
6. Kaydırma akıcılığını gerçek bir telefonda dene — takılma olmamalı

Bir telefon tarayıcısında denemek için: bilgisayarda `python -m http.server 8000` çalıştır ve telefondan `http://<bilgisayarın-yerel-ip>:8000` adresine gir. (Pusula için HTTPS gerekir; pusula bu değişiklikte kapsam dışı olduğundan HTTP üzerinden denemek yeterli.)

- [ ] **Step 5: Commit**

```bash
git add index.html sw.js
git commit -m "Surum 0.16.0 — zikirmatik one alindi, bolumler cam kapsullere girdi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Kapsam dışı — bu planda yapılmayacaklar

- **Kıble pusulasının sapması.** Daha önce ayrıca çalışıldı, mevcut hâli yeterli. `A.sapma`, manyetik sapma düzeltmesi ve `yonOlayi()` fonksiyonuna dokunma.
- **Açılışta GPS izni.** `baslat()` içindeki `if(A.otoKonum) konumBul();` (`index.html:3875`) olduğu gibi kalacak. Bilinçli bir karardır; kaldırma.
- **`backdrop-filter`.** Task 2'deki yorumda gerekçesi yazılı. Ekleme.
- **`<header id="gokyuzu">` ve `#tabbar`.** Kapsül almazlar.
