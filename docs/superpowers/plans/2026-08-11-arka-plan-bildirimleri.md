# Arka Plan Bildirimleri Uygulama Planı (Aşama 1)

> **Ajan çalışanlar için:** GEREKLİ ALT BECERİ: Bu planı görev görev uygulamak için
> superpowers:subagent-driven-development (önerilir) veya superpowers:executing-plans
> kullanın. Adımlar takip için onay kutusu (`- [ ]`) sözdizimi kullanır.

**Hedef:** Beş Vakit'in bildirimleri uygulama kapalıyken de çalışsın; her vaktin
kendi önceden uyarısı, sessiz saatler, kerahat/cuma/ramazan bildirimleri olsun.

**Mimari:** Beş Vakit bir kabuk APK'dır — içerik
`https://kamilsaim.github.io/besvakit/` adresinden yüklenir, bu yüzden mantık
`index.html` tarafında kalır. Bildirim üretimi saf bir fonksiyona
(`bildirimListesiUret`) ayrılıp ayrı bir dosyaya (`bildirim.js`) taşınır; böylece
Node ile eklentisiz test edilebilir. Kuyruğu kurma işi
(`bildirimKur`) `@capacitor/local-notifications` ile konuşan ince bir katmandır.

**Teknoloji:** Sade JavaScript (derleme adımı yok), `@capacitor/local-notifications`,
`@capacitor/haptics`, Android bildirim kanalları, `node --test`.

**Tasarım belgesi:** `docs/superpowers/specs/2026-08-11-bildirim-ve-saat-design.md`

**İki depo var, karıştırma:**
- Web deposu: `E:\ksaim\claude programlar\besvakit` (git burada)
- APK projesi: `C:\apk\besvakit-apk` (git yok, ayrı klasör)

---

## Dosya yapısı

| Dosya | Sorumluluk | Durum |
|---|---|---|
| `bildirim.js` | Saf bildirim listesi üretimi. DOM'a, eklentiye, `A` ayar nesnesine dokunmaz. | Yeni |
| `araclar/bildirim.test.cjs` | `bildirim.js` için `node --test` testleri | Yeni |
| `index.html` | Ayar şeması, arayüz, `bildirimKur()` — eklentiyle konuşan katman | Değişir |
| `sw.js` | `bildirim.js`'i kabuk önbelleğine ekle, sürümü yükselt | Değişir |
| `C:\apk\...\Cihaz.java` | `pilAyariAc()`, `kanalAyariAc()` yerel eklentisi | Yeni |
| `C:\apk\...\MainActivity.java` | `Cihaz` eklentisini kaydet | Değişir |
| `C:\apk\...\VakitWidget.java` | Ramazanda iftar geri sayımı | Değişir |
| `C:\apk\...\AndroidManifest.xml` | Yeni izinler, widget `exported` düzeltmesi | Değişir |
| `C:\apk\...\res\raw\ezan.ogg` | Kısa ezan sesi | Yeni |

`bildirim.js` neden ayrı dosya: `index.html` 154 KB'lık tek dosya ve içindeki
hiçbir şey test edilemiyor. Bildirim mantığı yanlış olursa kullanıcı namazı
kaçırır — bu, projedeki test edilmesi en kritik parça. Ayırmak testi mümkün
kılan tek yol.

---

## Görev 1: Eklentiler, ses dosyası ve izinler

**Dosyalar:**
- Değiştir: `C:\apk\besvakit-apk\package.json` (npm üzerinden)
- Değiştir: `C:\apk\besvakit-apk\android\app\src\main\AndroidManifest.xml`
- Oluştur: `C:\apk\besvakit-apk\android\app\src\main\res\raw\ezan.ogg`

- [ ] **Adım 1: Eklentileri kur**

```powershell
cd C:\apk\besvakit-apk
npm install @capacitor/local-notifications @capacitor/haptics
```

- [ ] **Adım 2: Kurulumu doğrula**

```powershell
cd C:\apk\besvakit-apk
node -e "const p=require('./package.json'); console.log(p.dependencies)"
```

Beklenen: çıktıda `@capacitor/local-notifications` ve `@capacitor/haptics`
anahtarları görünmeli.

- [ ] **Adım 3: Kısa ezan sesini bul ve yerleştir**

Telifsiz (CC0 / kamu malı) kısa bir ezan veya tekbir kaydı bul. Aranacak
kaynaklar: `freesound.org` (CC0 süzgeciyle), `archive.org` kamu malı koleksiyonları.
Ölçütler: 10–25 saniye, mono, 48 kbps OGG Vorbis, 300 KB'ın altında.

Dosyayı şuraya koy: `C:\apk\besvakit-apk\android\app\src\main\res\raw\ezan.ogg`

Dosya adı yalnızca küçük harf, rakam ve alt çizgi içerebilir — Android kaynak
adı kuralı budur, `ezan.ogg` uygundur.

**Uygun bir kayıt bulunamazsa:** dur ve kullanıcıya sor. Telifli bir kayıt
kullanma. Geçici çözüm olarak dosyayı atlayıp `vakit` kanalını sistem
bildirim sesiyle oluşturabilirsin — Görev 10'daki kanal tanımı buna göre
`sound` alanı olmadan yazılır.

- [ ] **Adım 4: Dosyanın yerinde ve boyutunun makul olduğunu doğrula**

```powershell
Get-Item C:\apk\besvakit-apk\android\app\src\main\res\raw\ezan.ogg | Select-Object Name, Length
```

Beklenen: dosya var, `Length` 300000'den küçük.

- [ ] **Adım 5: Manifest izinlerini ekle**

`C:\apk\besvakit-apk\android\app\src\main\AndroidManifest.xml` içinde mevcut
`<uses-permission android:name="android.permission.VIBRATE" />` satırının hemen
altına ekle:

```xml
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

`USE_EXACT_ALARM` Android 13+ için kullanıcı onayı gerektirmez ve namaz vakti
uygulamaları Play Store politikasında bu izne uygun kategoridedir.
`RECEIVE_BOOT_COMPLETED` telefon yeniden başladığında kuyruğun kaybolmaması
içindir — Capacitor eklentisi bunu kendi kendine kullanır.

- [ ] **Adım 6: Widget receiver `exported` hatasını düzelt**

Aynı dosyada, `<receiver android:name=".VakitWidget"` bloğundaki satırı değiştir:

```xml
            android:exported="false">
```

şu hale getir:

```xml
            android:exported="true">
```

Gerekçe: `TIME_SET`, `TIMEZONE_CHANGED`, `DATE_CHANGED` **örtük** sistem
yayınlarıdır ve `exported="false"` olan bir receiver'a hiç ulaşmazlar. Şu an
saat dilimi veya tarih değişince widget tazelenmiyor.

- [ ] **Adım 7: Senkronize et ve derlemenin bozulmadığını doğrula**

```powershell
cd C:\apk\besvakit-apk
npx cap sync android
cd android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`. Android Studio'da proje **açıkken bunu çalıştırma** —
ikisi aynı `build` klasörünü kilitler.

- [ ] **Adım 8: Commit**

APK projesi git deposu değil, commit edilecek bir şey yok. Bu görevde web
deposunda değişiklik yapılmadı. Bir sonraki göreve geç.

---

## Görev 2: `bildirim.js` iskeleti ve vakit bildirimleri

**Dosyalar:**
- Oluştur: `E:\ksaim\claude programlar\besvakit\bildirim.js`
- Test: `E:\ksaim\claude programlar\besvakit\araclar\bildirim.test.cjs`

- [ ] **Adım 1: Başarısız testi yaz**

`araclar/bildirim.test.cjs` dosyasını oluştur:

```js
const test = require('node:test');
const assert = require('node:assert');
const { bildirimListesiUret } = require('../bildirim.js');

/** Testlerde kullanılan sabit gün tablosu: iki gün, altı vakit (dakika). */
const GUNLER = {
  '2026-08-11': [236, 334, 769, 999, 1195, 1285],
  '2026-08-12': [237, 335, 769, 999, 1194, 1284]
};

/** Her testin kendi ayarını kurabilmesi için temel şablon. */
function ayarKur(fark) {
  const temel = {
    acik: true,
    vakit: {
      imsak:  { bildir: false, once: 0 },
      gunes:  { bildir: false, once: 0 },
      ogle:   { bildir: false, once: 0 },
      ikindi: { bildir: false, once: 0 },
      aksam:  { bildir: false, once: 0 },
      yatsi:  { bildir: false, once: 0 }
    },
    sessiz: { bas: '00:00', son: '00:00' },
    kerahat: false,
    kerahatAraliklari: [],
    cuma: false,
    cumaSaat: '11:30',
    ramazanGunleri: [],
    sahurOnce: 45
  };
  return Object.assign(temel, fark || {});
}

test('açık olan vakit için bildirim üretir', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  // 11 Ağustos 2026, saat 00:00 — öğle vakti (769 dk = 12:49) henüz gelmedi
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const ogleler = liste.filter(b => b.govde === 'Öğle vakti girdi');

  assert.strictEqual(ogleler.length, 2, 'iki gün için ikişer öğle bildirimi');
  assert.strictEqual(ogleler[0].zaman.getHours(), 12);
  assert.strictEqual(ogleler[0].zaman.getMinutes(), 49);
  assert.strictEqual(ogleler[0].kanal, 'vakit');
  assert.strictEqual(ogleler[0].baslik, 'Beş Vakit');
});

test('kapalı olan vakit için bildirim üretmez', () => {
  const ayar = ayarKur();          // hepsi kapalı
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  assert.deepStrictEqual(bildirimListesiUret(ayar, GUNLER, simdi), []);
});

test('geçmiş kalan bildirimleri atlar', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  // 11 Ağustos saat 18:00 — o günün öğlesi geçti, yalnızca 12 Ağustos kalmalı
  const simdi = new Date(2026, 7, 11, 18, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.length, 1);
  assert.strictEqual(liste[0].zaman.getDate(), 12);
});

test('ana anahtar kapalıysa hiçbir şey üretmez', () => {
  const ayar = ayarKur({ acik: false });
  ayar.vakit.ogle.bildir = true;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  assert.deepStrictEqual(bildirimListesiUret(ayar, GUNLER, simdi), []);
});

test('güneş vaktinin metni farklıdır', () => {
  const ayar = ayarKur();
  ayar.vakit.gunes.bildir = true;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste[0].govde, 'Güneş doğdu — sabah namazı vakti çıktı');
});

test('kimlikler benzersizdir', () => {
  const ayar = ayarKur();
  Object.keys(ayar.vakit).forEach(k => { ayar.vakit[k].bildir = true; });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const kimlikler = liste.map(b => b.id);

  assert.strictEqual(new Set(kimlikler).size, kimlikler.length);
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — `Cannot find module '../bildirim.js'`

- [ ] **Adım 3: En küçük uygulamayı yaz**

`bildirim.js` dosyasını oluştur:

```js
/* Beş Vakit — bildirim listesi üretimi
   Burası saf mantıktır: DOM'a, Capacitor eklentisine, localStorage'a dokunmaz.
   Tek işi ayarlar + vakit tablosundan "hangi bildirim, ne zaman, hangi kanalda"
   listesini üretmektir. Bu sayede Node ile eklentisiz test edilebilir.
   Kuyruğu asıl kuran katman index.html içindeki bildirimKur()'dur. */

const BV_BASLIK = 'Beş Vakit';

/* Vakit sırası bv_widget verisindeki dizi sırasıyla birebir aynı olmalı. */
const BV_VAKIT_SIRA = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
const BV_VAKIT_AD = {
  imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
  ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı'
};

/* Tür kodları. Kimlik = günSırası * 100 + türKodu, yani tür kodu 0-99 arasında
   kalmalı. Bu tablo asla değişmemeli: değişirse eski kuyruktaki bildirimler
   iptal edilemez hale gelir. */
const BV_TUR = {
  vakit: 0,        // 0-5   : altı vaktin girişi
  once: 10,        // 10-15 : vakitten önce uyarı
  sahur: 20,
  iftar: 21,
  cuma: 30,
  kerahat: 40      // 40-49 : kerahat aralıkları
};

/** 'YYYY-MM-DD' + gece yarısından itibaren dakika -> yerel saatli Date. */
function bvZaman(gunAnahtari, dk) {
  const p = gunAnahtari.split('-');
  const d = new Date(+p[0], +p[1] - 1, +p[2], 0, 0, 0, 0);
  return new Date(d.getTime() + Math.round(dk) * 60000);
}

/** 'HH:MM' -> dakika. Bozuksa null. */
function bvSaatDk(metin) {
  const p = String(metin || '').split(':');
  const dk = (+p[0]) * 60 + (+p[1]);
  return isNaN(dk) ? null : dk;
}

function bildirimListesiUret(ayar, gunler, simdi) {
  if (!ayar || !ayar.acik) return [];

  const anahtarlar = Object.keys(gunler).sort();
  const liste = [];

  anahtarlar.forEach((gun, gunSira) => {
    const vakitler = gunler[gun];
    if (!vakitler) return;

    BV_VAKIT_SIRA.forEach((k, i) => {
      const v = ayar.vakit && ayar.vakit[k];
      if (!v || !v.bildir) return;
      const dk = vakitler[i];
      if (!dk && dk !== 0) return;

      liste.push({
        id: gunSira * 100 + BV_TUR.vakit + i,
        kanal: 'vakit',
        baslik: BV_BASLIK,
        govde: k === 'gunes'
          ? 'Güneş doğdu — sabah namazı vakti çıktı'
          : BV_VAKIT_AD[k] + ' vakti girdi',
        zaman: bvZaman(gun, dk)
      });
    });
  });

  return liste.filter(b => b.zaman.getTime() > simdi.getTime());
}

/* Hem tarayıcıda (script etiketiyle) hem Node'da (require ile) çalışsın. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bildirimListesiUret, BV_TUR, BV_VAKIT_SIRA, bvZaman, bvSaatDk };
}
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 6`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim listesi uretimi: vakit bildirimleri"
```

---

## Görev 3: Vakit öncesi uyarı

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

- [ ] **Adım 1: Başarısız testi yaz**

`araclar/bildirim.test.cjs` dosyasının sonuna ekle:

```js
test('vakit öncesi uyarı üretir', () => {
  const ayar = ayarKur();
  ayar.vakit.ikindi.bildir = true;
  ayar.vakit.ikindi.once = 15;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const once = liste.filter(b => b.kanal === 'once');

  assert.strictEqual(once.length, 2);
  // ikindi 999 dk = 16:39; 15 dk öncesi 16:24
  assert.strictEqual(once[0].zaman.getHours(), 16);
  assert.strictEqual(once[0].zaman.getMinutes(), 24);
  assert.strictEqual(once[0].govde, 'İkindi vaktine 15 dakika kaldı');
});

test('her vaktin kendi önceden süresi olur', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;   ayar.vakit.ogle.once = 10;
  ayar.vakit.ikindi.bildir = true; ayar.vakit.ikindi.once = 30;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const metinler = liste.filter(b => b.kanal === 'once').map(b => b.govde);

  assert.ok(metinler.includes('Öğle vaktine 10 dakika kaldı'));
  assert.ok(metinler.includes('İkindi vaktine 30 dakika kaldı'));
});

test('güneş için önceden uyarı üretilmez', () => {
  const ayar = ayarKur();
  ayar.vakit.gunes.bildir = true;
  ayar.vakit.gunes.once = 15;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.filter(b => b.kanal === 'once').length, 0);
});

test('önceden 0 ise uyarı üretilmez', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  ayar.vakit.ogle.once = 0;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.filter(b => b.kanal === 'once').length, 0);
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — dört yeni test düşer, `once.length` 0 çıkar.

- [ ] **Adım 3: Uygulamayı yaz**

`bildirim.js` içinde vakit döngüsünün sonuna, `liste.push({ ... kanal:'vakit' ...})`
çağrısından **hemen sonra** ekle (aynı `BV_VAKIT_SIRA.forEach` gövdesinin içinde):

```js
      // Vakit öncesi hatırlatma — güneş doğuşu için anlamsız, atlanır.
      const once = +v.once || 0;
      if (once > 0 && k !== 'gunes') {
        liste.push({
          id: gunSira * 100 + BV_TUR.once + i,
          kanal: 'once',
          baslik: BV_BASLIK,
          govde: BV_VAKIT_AD[k] + ' vaktine ' + once + ' dakika kaldı',
          zaman: bvZaman(gun, dk - once)
        });
      }
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 10`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: vakit basina onceden uyari"
```

---

## Görev 4: Sessiz saatler

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

Sessiz saatler ayrı bir mekanizma değildir: bildirim kuyruğa alınırken saati
aralığa düşüyorsa kanalı `sessiz` yapılır. `sessiz` kanalı sessiz ve düşük
önemli olarak oluşturulur (Görev 10).

- [ ] **Adım 1: Başarısız testi yaz**

Test dosyasının sonuna ekle:

```js
test('sessiz aralığa düşen bildirimin kanalı sessiz olur', () => {
  const ayar = ayarKur({ sessiz: { bas: '22:00', son: '06:00' } });
  ayar.vakit.imsak.bildir = true;   // 236 dk = 03:56, aralığın içinde
  ayar.vakit.ogle.bildir = true;    // 769 dk = 12:49, aralığın dışında
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const imsak = liste.find(b => b.govde === 'İmsak vakti girdi');
  const ogle  = liste.find(b => b.govde === 'Öğle vakti girdi');

  assert.strictEqual(imsak.kanal, 'sessiz');
  assert.strictEqual(ogle.kanal, 'vakit');
});

test('gece yarısını aşmayan sessiz aralık da çalışır', () => {
  const ayar = ayarKur({ sessiz: { bas: '12:00', son: '14:00' } });
  ayar.vakit.ogle.bildir = true;    // 12:49, aralığın içinde
  ayar.vakit.ikindi.bildir = true;  // 16:39, aralığın dışında
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.find(b => b.govde === 'Öğle vakti girdi').kanal, 'sessiz');
  assert.strictEqual(liste.find(b => b.govde === 'İkindi vakti girdi').kanal, 'vakit');
});

test('başlangıç ve bitiş aynıysa sessiz saatler kapalıdır', () => {
  const ayar = ayarKur({ sessiz: { bas: '00:00', son: '00:00' } });
  ayar.vakit.imsak.bildir = true;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste[0].kanal, 'vakit');
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — ilk iki test düşer, kanal `vakit` çıkar.

- [ ] **Adım 3: Uygulamayı yaz**

`bildirim.js` içinde `bvSaatDk` fonksiyonunun altına ekle:

```js
/**
 * Verilen dakika sessiz aralığa düşüyor mu?
 * Aralık gece yarısını aşabilir (22:00–06:00). bas === son ise kapalı sayılır.
 */
function bvSessizMi(dk, sessiz) {
  if (!sessiz) return false;
  const bas = bvSaatDk(sessiz.bas), son = bvSaatDk(sessiz.son);
  if (bas === null || son === null || bas === son) return false;
  const d = ((Math.round(dk) % 1440) + 1440) % 1440;
  return bas < son ? (d >= bas && d < son) : (d >= bas || d < son);
}

/** Bildirim sessiz aralığa düşüyorsa kanalı 'sessiz' ile değiştirir. */
function bvKanal(kanal, dk, sessiz) {
  return bvSessizMi(dk, sessiz) ? 'sessiz' : kanal;
}
```

Sonra vakit döngüsünde iki `kanal:` satırını değiştir. Şunu:

```js
        kanal: 'vakit',
```

şununla değiştir:

```js
        kanal: bvKanal('vakit', dk, ayar.sessiz),
```

Ve şunu:

```js
          kanal: 'once',
```

şununla değiştir:

```js
          kanal: bvKanal('once', dk - once, ayar.sessiz),
```

Son olarak dosya sonundaki dışa aktarıma `bvSessizMi` ve `bvKanal` ekle:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bildirimListesiUret, BV_TUR, BV_VAKIT_SIRA,
    bvZaman, bvSaatDk, bvSessizMi, bvKanal
  };
}
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 13`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: sessiz saatler kanal yonlendirmesi"
```

---

## Görev 5: Kerahat uyarıları

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

Kerahat aralıklarının tanımı `index.html` içindeki `KERAHAT` sabitinde
(`index.html:1247` civarı). Çoğaltmamak için o dizi `ayar.kerahatAraliklari`
olarak dışarıdan verilir.

- [ ] **Adım 1: Başarısız testi yaz**

Test dosyasının sonuna ekle:

```js
/** index.html'deki KERAHAT sabitiyle aynı yapı. */
const KERAHAT_TEST = [
  { ad: 'İşrak',  bas: 'gunes', basEk: 0,   son: 'gunes', sonEk: 45 },
  { ad: 'İstiva', bas: 'ogle',  basEk: -10, son: 'ogle',  sonEk: 0 },
  { ad: 'Gurub',  bas: 'aksam', basEk: -45, son: 'aksam', sonEk: 0 }
];

test('kerahat açıkken üç uyarı üretir', () => {
  const ayar = ayarKur({ kerahat: true, kerahatAraliklari: KERAHAT_TEST });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const ker = liste.filter(b => b.kanal === 'ozel');

  assert.strictEqual(ker.length, 6, 'iki gün × üç aralık');
  // İşrak: gunes 334 dk = 05:34, süre 45 dk
  const israk = ker.find(b => b.govde.startsWith('İşrak'));
  assert.strictEqual(israk.zaman.getHours(), 5);
  assert.strictEqual(israk.zaman.getMinutes(), 34);
  assert.strictEqual(israk.govde, 'İşrak kerahat vakti başladı · 45 dk sürer');
});

test('kerahat kapalıyken uyarı üretmez', () => {
  const ayar = ayarKur({ kerahat: false, kerahatAraliklari: KERAHAT_TEST });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.length, 0);
});

test('İstiva kerahatı öğleden 10 dk önce başlar', () => {
  const ayar = ayarKur({ kerahat: true, kerahatAraliklari: KERAHAT_TEST });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const istiva = liste.find(b => b.govde.startsWith('İstiva'));

  // ogle 769 dk = 12:49; 10 dk öncesi 12:39
  assert.strictEqual(istiva.zaman.getHours(), 12);
  assert.strictEqual(istiva.zaman.getMinutes(), 39);
  assert.strictEqual(istiva.govde, 'İstiva kerahat vakti başladı · 10 dk sürer');
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — `ker.length` 0 çıkar.

- [ ] **Adım 3: Uygulamayı yaz**

`bildirim.js` içinde, gün döngüsünün içinde `BV_VAKIT_SIRA.forEach(...)`
bloğunun **hemen ardından** ekle:

```js
    // Kerahat aralıkları — tanım index.html'deki KERAHAT sabitinden gelir,
    // burada çoğaltılmaz.
    if (ayar.kerahat) {
      (ayar.kerahatAraliklari || []).forEach((ker, ki) => {
        const basDk = vakitler[BV_VAKIT_SIRA.indexOf(ker.bas)] + ker.basEk;
        const sonDk = vakitler[BV_VAKIT_SIRA.indexOf(ker.son)] + ker.sonEk;
        if (isNaN(basDk) || isNaN(sonDk)) return;

        liste.push({
          id: gunSira * 100 + BV_TUR.kerahat + ki,
          kanal: bvKanal('ozel', basDk, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: ker.ad + ' kerahat vakti başladı · ' +
                 Math.round(sonDk - basDk) + ' dk sürer',
          zaman: bvZaman(gun, basDk)
        });
      });
    }
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 16`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: kerahat uyarilari"
```

---

## Görev 6: Cuma bildirimi

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

- [ ] **Adım 1: Başarısız testi yaz**

Test dosyasının sonuna ekle:

```js
/** 14 Ağustos 2026 cuma gününü de içeren daha uzun bir tablo. */
const HAFTA = {
  '2026-08-11': [236, 334, 769, 999, 1195, 1285],  // salı
  '2026-08-12': [237, 335, 769, 999, 1194, 1284],  // çarşamba
  '2026-08-13': [238, 336, 769, 998, 1193, 1283],  // perşembe
  '2026-08-14': [239, 337, 769, 998, 1192, 1282]   // cuma
};

test('cuma bildirimi yalnızca cuma gününe düşer', () => {
  const ayar = ayarKur({ cuma: true, cumaSaat: '11:30' });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, HAFTA, simdi);
  const cumalar = liste.filter(b => b.govde.startsWith('Cuma namazı'));

  assert.strictEqual(cumalar.length, 1);
  assert.strictEqual(cumalar[0].zaman.getDate(), 14);
  assert.strictEqual(cumalar[0].zaman.getHours(), 11);
  assert.strictEqual(cumalar[0].zaman.getMinutes(), 30);
  assert.strictEqual(cumalar[0].kanal, 'ozel');
  assert.strictEqual(cumalar[0].govde, 'Cuma namazı vakti yaklaşıyor · öğle 12:49');
});

test('cuma kapalıyken bildirim üretilmez', () => {
  const ayar = ayarKur({ cuma: false });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, HAFTA, simdi);

  assert.strictEqual(liste.length, 0);
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — `cumalar.length` 0 çıkar.

- [ ] **Adım 3: Uygulamayı yaz**

Önce `bildirim.js` içinde `bvKanal` fonksiyonunun altına saat biçimleyici ekle
(`index.html`'deki `saatYaz` ile aynı biçim, ama burada saf tutulur):

```js
/** Dakika -> 'HH:MM'. index.html'deki saatYaz ile aynı biçim. */
function bvSaatYaz(dk) {
  const d = ((Math.round(dk) % 1440) + 1440) % 1440;
  const s = Math.floor(d / 60), m = d % 60;
  return (s < 10 ? '0' : '') + s + ':' + (m < 10 ? '0' : '') + m;
}
```

Sonra gün döngüsünde kerahat bloğunun ardına ekle:

```js
    // Cuma hatırlatması — haftada bir, kullanıcının belirlediği saatte.
    if (ayar.cuma) {
      const cumaDk = bvSaatDk(ayar.cumaSaat);
      const gunAdi = bvZaman(gun, 0).getDay();
      if (cumaDk !== null && gunAdi === 5) {
        liste.push({
          id: gunSira * 100 + BV_TUR.cuma,
          kanal: bvKanal('ozel', cumaDk, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: 'Cuma namazı vakti yaklaşıyor · öğle ' +
                 bvSaatYaz(vakitler[BV_VAKIT_SIRA.indexOf('ogle')]),
          zaman: bvZaman(gun, cumaDk)
        });
      }
    }
```

Dışa aktarıma `bvSaatYaz` ekle:

```js
  module.exports = {
    bildirimListesiUret, BV_TUR, BV_VAKIT_SIRA,
    bvZaman, bvSaatDk, bvSaatYaz, bvSessizMi, bvKanal
  };
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 18`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: cuma hatirlatmasi"
```

---

## Görev 7: Ramazan sahur ve iftar bildirimleri

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

Hicri takvim hesabı `index.html`'de kalır (`hicriParcala`, `ramazanBilgi`).
Buraya yalnızca ramazan olan günlerin anahtar listesi verilir — sınır böylece net.

- [ ] **Adım 1: Başarısız testi yaz**

Test dosyasının sonuna ekle:

```js
test('ramazan günlerinde sahur ve iftar bildirimi üretir', () => {
  const ayar = ayarKur({ ramazanGunleri: ['2026-08-12'], sahurOnce: 45 });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const oruc = liste.filter(b => b.kanal === 'oruc');

  assert.strictEqual(oruc.length, 2, 'yalnızca ramazan olan gün için');

  // 12 Ağustos imsak 237 dk = 03:57; 45 dk öncesi 03:12
  const sahur = oruc.find(b => b.govde.startsWith('Sahur'));
  assert.strictEqual(sahur.zaman.getDate(), 12);
  assert.strictEqual(sahur.zaman.getHours(), 3);
  assert.strictEqual(sahur.zaman.getMinutes(), 12);
  assert.strictEqual(sahur.govde, 'Sahura 45 dakika kaldı · imsak 03:57');

  // 12 Ağustos akşam 1194 dk = 19:54
  const iftar = oruc.find(b => b.govde.startsWith('İftar'));
  assert.strictEqual(iftar.zaman.getHours(), 19);
  assert.strictEqual(iftar.zaman.getMinutes(), 54);
  assert.strictEqual(iftar.govde, 'İftar vakti · akşam 19:54');
});

test('ramazan dışındaki günlerde oruç bildirimi üretmez', () => {
  const ayar = ayarKur({ ramazanGunleri: [] });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.filter(b => b.kanal === 'oruc').length, 0);
});

test('sahurOnce 0 ise sahur bildirimi üretilmez ama iftar üretilir', () => {
  const ayar = ayarKur({ ramazanGunleri: ['2026-08-12'], sahurOnce: 0 });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const oruc = liste.filter(b => b.kanal === 'oruc');

  assert.strictEqual(oruc.length, 1);
  assert.ok(oruc[0].govde.startsWith('İftar'));
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — `oruc.length` 0 çıkar.

- [ ] **Adım 3: Uygulamayı yaz**

Gün döngüsünde cuma bloğunun ardına ekle:

```js
    // Ramazan — hangi günlerin ramazan olduğu dışarıdan gelir, hicri hesap
    // index.html'de kalır.
    if ((ayar.ramazanGunleri || []).indexOf(gun) >= 0) {
      const imsakDk = vakitler[BV_VAKIT_SIRA.indexOf('imsak')];
      const aksamDk = vakitler[BV_VAKIT_SIRA.indexOf('aksam')];
      const sahurOnce = +ayar.sahurOnce || 0;

      if (sahurOnce > 0) {
        liste.push({
          id: gunSira * 100 + BV_TUR.sahur,
          kanal: bvKanal('oruc', imsakDk - sahurOnce, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: 'Sahura ' + sahurOnce + ' dakika kaldı · imsak ' + bvSaatYaz(imsakDk),
          zaman: bvZaman(gun, imsakDk - sahurOnce)
        });
      }

      liste.push({
        id: gunSira * 100 + BV_TUR.iftar,
        kanal: bvKanal('oruc', aksamDk, ayar.sessiz),
        baslik: BV_BASLIK,
        govde: 'İftar vakti · akşam ' + bvSaatYaz(aksamDk),
        zaman: bvZaman(gun, aksamDk)
      });
    }
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 21`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: ramazan sahur ve iftar"
```

---

## Görev 8: Gün bütçesi

**Dosyalar:**
- Değiştir: `bildirim.js`
- Test: `araclar/bildirim.test.cjs`

Android'de uygulama başına bekleyen alarm sayısı ~500 ile sınırlıdır. Her şey
açıkken günde ~17 bildirim üretilir; 30 gün 510 eder ve sınır aşılır. Bu yüzden
gün sayısı aktif tür sayısına göre daraltılır: hedef ~400 bildirim, taban 7 gün,
tavan 30 gün.

- [ ] **Adım 1: Başarısız testi yaz**

Test dosyasının başındaki `require` satırını değiştir:

```js
const { bildirimListesiUret, bvGunButcesi } = require('../bildirim.js');
```

Sonra dosyanın sonuna ekle:

```js
test('hiçbir şey açık değilse bütçe sıfırdır', () => {
  assert.strictEqual(bvGunButcesi(ayarKur()), 0);
});

test('az tür açıkken tavan 30 gündür', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;            // günde 1 bildirim
  assert.strictEqual(bvGunButcesi(ayar), 30);
});

test('çok tür açıkken gün sayısı daralır', () => {
  const ayar = ayarKur({ kerahat: true, kerahatAraliklari: KERAHAT_TEST,
                         ramazanGunleri: ['2026-08-12'] });
  Object.keys(ayar.vakit).forEach(k => {
    ayar.vakit[k].bildir = true;
    ayar.vakit[k].once = 15;
  });
  // 6 vakit + 5 önceden (güneş hariç) + 3 kerahat + 2 oruç = 16 -> 400/16 = 25
  assert.strictEqual(bvGunButcesi(ayar), 25);
});

test('bütçe hiçbir zaman 7 günün altına inmez', () => {
  const ayar = ayarKur({ kerahat: true });
  // yapay olarak çok fazla kerahat aralığı: 60 tür -> 400/60 = 6, taban 7'ye çıkar
  ayar.kerahatAraliklari = Array.from({ length: 60 }, (_, i) => ({
    ad: 'X' + i, bas: 'gunes', basEk: i, son: 'gunes', sonEk: i + 5
  }));
  assert.strictEqual(bvGunButcesi(ayar), 7);
});

test('bütçe üretilen gün sayısını sınırlar', () => {
  // 40 günlük tablo ver, tek vakit açık -> 30 günle sınırlanmalı
  const uzun = {};
  for (let i = 0; i < 40; i++) {
    const d = new Date(2026, 7, 11 + i);
    const a = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
    uzun[a] = [236, 334, 769, 999, 1195, 1285];
  }
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, uzun, simdi);

  assert.strictEqual(liste.length, 30);
});

test('toplam bildirim sayısı 400\'ü aşmaz', () => {
  const uzun = {};
  for (let i = 0; i < 40; i++) {
    const d = new Date(2026, 7, 11 + i);
    const a = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
    uzun[a] = [236, 334, 769, 999, 1195, 1285];
  }
  const ayar = ayarKur({ kerahat: true, kerahatAraliklari: KERAHAT_TEST,
                         cuma: true, ramazanGunleri: Object.keys(uzun) });
  Object.keys(ayar.vakit).forEach(k => {
    ayar.vakit[k].bildir = true;
    ayar.vakit[k].once = 15;
  });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, uzun, simdi);

  // 16 günlük tür × 25 gün = 400, üstüne bütçeye katılmayan cuma bildirimleri.
  // Asıl amaç Android'in ~500 sınırının altında kalmak.
  assert.ok(liste.length <= 450, 'üretilen: ' + liste.length);
});
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: BAŞARISIZ — `bvGunButcesi is not a function`

- [ ] **Adım 3: Uygulamayı yaz**

`bildirim.js` içinde `bvSaatYaz` fonksiyonunun altına ekle:

```js
/* Android'de uygulama başına bekleyen alarm sayısı ~500 ile sınırlıdır.
   Sınıra dayanmamak için hedefi 400'de tutup gün sayısını aktif tür sayısına
   göre daraltıyoruz. Kullanıcı bu sayıyı görmez ve ayarlayamaz. */
const BV_HEDEF_BILDIRIM = 400;
const BV_TABAN_GUN = 7;
const BV_TAVAN_GUN = 30;

/** Ayarlara göre kaç gün ileriye kuyruk kurulacağını hesaplar. */
function bvGunButcesi(ayar) {
  if (!ayar) return 0;
  let gunluk = 0;

  BV_VAKIT_SIRA.forEach(k => {
    const v = ayar.vakit && ayar.vakit[k];
    if (!v || !v.bildir) return;
    gunluk++;
    if ((+v.once || 0) > 0 && k !== 'gunes') gunluk++;
  });

  if (ayar.kerahat) gunluk += (ayar.kerahatAraliklari || []).length;
  if ((ayar.ramazanGunleri || []).length) gunluk += 2;

  // Cuma haftada bir, bütçeyi kayda değer etkilemez — sayıma katılmaz.
  if (gunluk <= 0) return ayar.cuma ? BV_TAVAN_GUN : 0;

  return Math.max(BV_TABAN_GUN,
         Math.min(BV_TAVAN_GUN, Math.floor(BV_HEDEF_BILDIRIM / gunluk)));
}
```

Sonra `bildirimListesiUret` içinde `anahtarlar` satırını değiştir. Şunu:

```js
  const anahtarlar = Object.keys(gunler).sort();
```

şununla değiştir:

```js
  const anahtarlar = Object.keys(gunler).sort().slice(0, bvGunButcesi(ayar));
```

Dışa aktarıma `bvGunButcesi` ekle:

```js
  module.exports = {
    bildirimListesiUret, bvGunButcesi, BV_TUR, BV_VAKIT_SIRA,
    bvZaman, bvSaatDk, bvSaatYaz, bvSessizMi, bvKanal
  };
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
node --test araclar/bildirim.test.cjs
```

Beklenen: `# pass 27`, `# fail 0`

- [ ] **Adım 5: Commit**

```powershell
git add bildirim.js araclar/bildirim.test.cjs
git commit -m "Bildirim: alarm sinirina karsi gun butcesi"
```

---

## Görev 9: Ayar şeması ve migrasyon

**Dosyalar:**
- Değiştir: `index.html:803-826` (VARSAYILAN ve `yukle`)

Eski şema: `A.bildirim = { imsak:true, ... }` (yalnızca aç/kapa) ve tek global
`A.onceden`. Yeni şema: `A.bildirim = { imsak:{bildir:true, once:0}, ... }`.

- [ ] **Adım 1: VARSAYILAN'ı güncelle**

`index.html` içinde bu satırları bul:

```js
  bildirim:{ imsak:true, gunes:false, ogle:true, ikindi:true, aksam:true, yatsi:true },
  bildirimAcik:false, ses:true, titresim:true, gokyuzu:true, uyanik:false,
  onceden:0, tema:'koyu', kerahat:true, ramazanMod:'oto',
```

Şununla değiştir:

```js
  bildirim:{ imsak:{bildir:true,  once:0}, gunes:{bildir:false, once:0},
             ogle: {bildir:true,  once:0}, ikindi:{bildir:true, once:0},
             aksam:{bildir:true,  once:0}, yatsi:{bildir:true,  once:0} },
  bildirimAcik:false, ses:true, titresim:true, gokyuzu:true, uyanik:false,
  sessizBas:'00:00', sessizSon:'00:00', sahurOnce:45,
  tema:'koyu', kerahat:true, ramazanMod:'oto',
```

`onceden` alanı kaldırıldı — artık her vaktin kendi `once` değeri var.

- [ ] **Adım 2: Migrasyonu yaz**

`yukle()` fonksiyonunu bul:

```js
function yukle(){
  try{
    const h = JSON.parse(localStorage.getItem('besvakit') || '{}');
    return Object.assign({}, VARSAYILAN, h,
      { duzeltme:Object.assign({}, VARSAYILAN.duzeltme, h.duzeltme||{}),
        bildirim:Object.assign({}, VARSAYILAN.bildirim, h.bildirim||{}) });
  }catch(e){ return JSON.parse(JSON.stringify(VARSAYILAN)); }
}
```

Şununla değiştir:

```js
function yukle(){
  try{
    const h = JSON.parse(localStorage.getItem('besvakit') || '{}');
    const a = Object.assign({}, VARSAYILAN, h,
      { duzeltme:Object.assign({}, VARSAYILAN.duzeltme, h.duzeltme||{}) });
    a.bildirim = bildirimSemasiniTasi(h.bildirim, h.onceden);
    delete a.onceden;
    return a;
  }catch(e){ return JSON.parse(JSON.stringify(VARSAYILAN)); }
}

/**
 * Eski şema vakit başına yalnızca aç/kapa (boolean) tutuyordu ve önceden uyarı
 * tek bir global değerdi. Yeni şemada her vaktin kendi {bildir, once} nesnesi var.
 * Eski global 'onceden' değeri tüm vakitlere kopyalanır — kullanıcı ayarını
 * kaybetmesin.
 */
function bildirimSemasiniTasi(eski, eskiOnceden){
  const yeni = {};
  VAKITLER.forEach(v=>{
    const d = VARSAYILAN.bildirim[v.k];
    const e = eski && eski[v.k];
    if(e && typeof e === 'object'){
      yeni[v.k] = { bildir: !!e.bildir, once: +e.once || 0 };
    }else if(typeof e === 'boolean'){
      // eski şema: güneş için önceden uyarı anlamsız, sıfır bırakılır
      yeni[v.k] = { bildir: e, once: v.k === 'gunes' ? 0 : (+eskiOnceden || 0) };
    }else{
      yeni[v.k] = { bildir: d.bildir, once: d.once };
    }
  });
  return yeni;
}
```

- [ ] **Adım 3: Migrasyonu tarayıcıda doğrula**

`index.html`'i tarayıcıda aç, geliştirici konsolunda çalıştır:

```js
localStorage.setItem('besvakit', JSON.stringify({ bildirim:{imsak:true, ogle:false}, onceden:15 }));
location.reload();
```

Sayfa yüklendikten sonra konsolda:

```js
console.log(JSON.stringify(A.bildirim), A.onceden);
```

Beklenen: `imsak` → `{"bildir":true,"once":15}`, `ogle` → `{"bildir":false,"once":15}`,
`gunes` → `{"bildir":false,"once":0}`, ve `A.onceden` → `undefined`.

Test bittikten sonra temizle:

```js
localStorage.removeItem('besvakit'); location.reload();
```

- [ ] **Adım 4: Eski `A.bildirim[v.k]` kullanımlarını düzelt**

`A.bildirim[...]` artık nesne döndürüyor, boolean değil. Şu iki yeri bul ve
düzelt.

`index.html:1366` civarındaki `vakitListesiCiz` içinde:

```js
      <button class="zil ${A.bildirim[v.k]?'acik':''}" data-zil="${v.k}"
        aria-label="${v.ad} bildirimi">${A.bildirim[v.k]?'🔔':'🔕'}</button>
```

Şununla değiştir:

```js
      <button class="zil ${A.bildirim[v.k].bildir?'acik':''}" data-zil="${v.k}"
        aria-label="${v.ad} bildirimi">${A.bildirim[v.k].bildir?'🔔':'🔕'}</button>
```

Hemen altındaki tıklama işleyicisinde:

```js
    const k=b.dataset.zil; A.bildirim[k] = !A.bildirim[k]; kaydet(); vakitListesiCiz();
    toast(VAKITLER.find(v=>v.k===k).ad + (A.bildirim[k]?' bildirimi açık':' bildirimi kapalı'));
```

Şununla değiştir:

```js
    const k=b.dataset.zil; A.bildirim[k].bildir = !A.bildirim[k].bildir;
    kaydet(); vakitListesiCiz();
    toast(VAKITLER.find(v=>v.k===k).ad +
          (A.bildirim[k].bildir?' bildirimi açık':' bildirimi kapalı'));
```

`index.html:1466` civarındaki `bildirimKontrol` içinde:

```js
    if(!A.bildirim[v.k]) return;
```

Şununla değiştir:

```js
    if(!A.bildirim[v.k].bildir) return;
```

Ve aynı fonksiyondaki:

```js
    const onceden = +A.onceden || 0;
```

Şununla değiştir:

```js
    const onceden = +A.bildirim[v.k].once || 0;
```

- [ ] **Adım 5: Tarayıcıda hata olmadığını doğrula**

`index.html`'i tarayıcıda aç. Konsolda hata olmamalı, vakit listesindeki zil
düğmeleri tıklanınca açılıp kapanmalı.

- [ ] **Adım 6: Commit**

```powershell
git add index.html
git commit -m "Ayarlar: vakit basina bildirim semasi ve migrasyon"
```

---

## Görev 10: `bildirimKur()` — kanallar ve kuyruk

**Dosyalar:**
- Değiştir: `index.html` (yeni bölüm, `widgetVeriYaz` fonksiyonundan hemen önce)
- Değiştir: `index.html:750` civarı (`bildirim.js` script etiketi)

- [ ] **Adım 1: `bildirim.js`'i sayfaya bağla**

`index.html` içinde `<script>` etiketini bul (`index.html:750`) ve **hemen
öncesine** ekle:

```html
<script src="bildirim.js"></script>
```

Bu dosya `module.exports` olmadığında hiçbir şey dışa aktarmaz, fonksiyonları
doğrudan genel kapsama tanımlar — tarayıcıda `bildirimListesiUret` böylece
erişilebilir olur.

- [ ] **Adım 2: `bildirimKur()` bölümünü ekle**

`index.html` içinde `let _widgetSonYazim = '';` satırını bul ve **hemen
öncesine** şu bölümü ekle:

```js
/* ==========================================================
   ARKA PLAN BİLDİRİMLERİ
   Web'deki setInterval yalnızca uygulama açıkken çalışır. APK içinde
   @capacitor/local-notifications ile 30 güne kadar bildirimi önceden kuyruğa
   alıyoruz; böylece uygulama kapalıyken de bildirim gelir.
   Ses ve titreşim seçimi Android'in kanal ayarına bırakıldı — kanal bir kez
   oluşturulduktan sonra kod ile değiştirilemez, yalnızca kullanıcı değiştirir.
   ========================================================== */
const BV_KANALLAR = [
  { id:'vakit',  name:'Namaz vakitleri', description:'Vakit girdiğinde',
    importance:5, sound:'ezan.ogg', vibration:true },
  { id:'once',   name:'Vakit öncesi uyarı', description:'Vakte az kala',
    importance:4, vibration:true },
  { id:'oruc',   name:'Sahur ve iftar', description:'Ramazan bildirimleri',
    importance:5, vibration:true },
  { id:'ozel',   name:'Cuma ve kerahat', description:'Diğer hatırlatmalar',
    importance:3, vibration:true },
  { id:'sessiz', name:'Sessiz saatler', description:'Sessiz aralığa düşen bildirimler',
    importance:2, vibration:false }
];

const bildirimEklentisi = ()=>
  (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) || null;

let _kanallarKuruldu = false;
async function bildirimKanallariKur(){
  const L = bildirimEklentisi();
  if(!L || _kanallarKuruldu) return;
  for(const k of BV_KANALLAR){
    try{ await L.createChannel(k); }catch(e){}
  }
  _kanallarKuruldu = true;
}

/** Önümüzdeki 30 günün hangileri ramazan — hicri hesap burada kalır. */
function ramazanGunleri(){
  if(A.ramazanMod === 'kapali') return [];
  const liste = [], bugun = new Date();
  for(let i=0; i<30; i++){
    const d = new Date(bugun); d.setDate(d.getDate() + i);
    try{
      const h = hicriParcala(d);
      if(h.month === 9) liste.push(gunAnahtar(d));
    }catch(e){}
  }
  // 'Her zaman açık' denemesinde bugünü ramazan say
  if(A.ramazanMod === 'acik' && !liste.length) liste.push(gunAnahtar(bugun));
  return liste;
}

/** bildirim.js'in beklediği saf ayar nesnesini üretir. */
function bildirimAyari(){
  const vakit = {};
  VAKITLER.forEach(v=>{
    vakit[v.k] = { bildir: !!A.bildirim[v.k].bildir, once: +A.bildirim[v.k].once || 0 };
  });
  return {
    acik: !!A.bildirimAcik,
    vakit,
    sessiz: { bas: A.sessizBas || '00:00', son: A.sessizSon || '00:00' },
    kerahat: !!A.kerahat,
    kerahatAraliklari: KERAHAT,
    cuma: !!A.cuma,
    cumaSaat: A.cumaSaat || '11:30',
    ramazanGunleri: ramazanGunleri(),
    sahurOnce: +A.sahurOnce || 0
  };
}

/** Önümüzdeki 30 günün vakit tablosu — widgetVeriYaz ile aynı biçim. */
function bildirimGunTablosu(){
  const gunler = {}, bugun = new Date();
  for(let i=0; i<30; i++){
    const d = new Date(bugun); d.setDate(d.getDate() + i);
    const v = vakitAl(d);
    gunler[gunAnahtar(d)] = VAKITLER.map(x => isNaN(v[x.k]) ? 0 : Math.round(v[x.k]));
  }
  return gunler;
}

/**
 * Kuyruğu baştan kurar: önce her şeyi iptal eder, sonra yeniden yazar.
 * Artımlı güncelleme yapılmıyor — ayar değişince hangi bildirimin
 * geçersizleştiğini izlemek kırılgan olurdu.
 */
async function bildirimKur(){
  const L = bildirimEklentisi();
  if(!L) return;                       // tarayıcı: eski setInterval yolu çalışır

  try{
    await bildirimKanallariKur();

    const bekleyen = await L.getPending();
    if(bekleyen && bekleyen.notifications && bekleyen.notifications.length){
      await L.cancel({ notifications: bekleyen.notifications.map(n=>({ id:n.id })) });
    }

    if(!A.bildirimAcik) return;

    const liste = bildirimListesiUret(bildirimAyari(), bildirimGunTablosu(), new Date());
    if(!liste.length) return;

    await L.schedule({ notifications: liste.map(b=>({
      id: b.id,
      title: b.baslik,
      body: b.govde,
      channelId: b.kanal,
      schedule: { at: b.zaman, allowWhileIdle: true },
      smallIcon: 'ic_stat_besvakit'
    })) });
  }catch(e){
    toast('Bildirimler kurulamadı — sonraki açılışta yeniden denenecek');
  }
}
```

- [ ] **Adım 3: `gunuTazele` içinden çağır**

`index.html` içinde `gunuTazele` fonksiyonunda `widgetVeriYaz();` çağrısını bul
ve hemen altına ekle:

```js
  bildirimKur();
```

Bulamazsan `gunuTazele` gövdesinin sonuna, `kerahatCiz();` satırından sonra
her ikisini de ekle:

```js
  widgetVeriYaz();
  bildirimKur();
```

- [ ] **Adım 4: Bildirim simgesini ekle**

`smallIcon` olarak `ic_stat_besvakit` verildi; bu kaynak yoksa Android
uygulama simgesini kullanır ama uyarı basar. Şimdilik kaynak eklenmeyecek —
Görev 17'deki cihaz doğrulamasında bildirim simgesinin nasıl göründüğüne
bakılacak ve gerekirse tek renkli bir `ic_stat_besvakit.png` eklenecek.

- [ ] **Adım 5: Tarayıcıda kırılmadığını doğrula**

`index.html`'i tarayıcıda aç. Eklenti olmadığı için `bildirimKur()` ilk satırda
dönmeli. Konsolda hata olmamalı. Konsolda doğrula:

```js
bildirimListesiUret(bildirimAyari(), bildirimGunTablosu(), new Date()).length
```

Beklenen: `A.bildirimAcik` kapalıyken `0`. Konsolda `A.bildirimAcik = true`
yapıp tekrar çalıştır — sıfırdan büyük bir sayı çıkmalı.

- [ ] **Adım 6: Commit**

```powershell
git add index.html
git commit -m "Bildirim kuyrugu: kanallar ve bildirimKur()"
```

---

## Görev 11: Vakit satırında önceden uyarı düğmesi

**Dosyalar:**
- Değiştir: `index.html` (`vakitListesiCiz`, `index.html:1358` civarı)
- Değiştir: `index.html` (CSS, `.zil` kuralının yanına)

- [ ] **Adım 1: CSS ekle**

`index.html` içinde `.zil` sınıfının tanımını bul ve hemen altına ekle:

```css
.once{background:none;border:0;color:var(--hayalet);font-size:11px;
  font-variant-numeric:tabular-nums;padding:4px 6px;border-radius:8px;cursor:pointer;
  letter-spacing:.02em}
.once.acik{color:var(--pirinc)}
```

- [ ] **Adım 2: `vakitListesiCiz`'i güncelle**

Fonksiyonun tamamını şununla değiştir:

```js
/* Önceden uyarı seçenekleri — düğmeye her dokunuşta sıradakine geçer. */
const ONCE_SECENEK = [0, 5, 10, 15, 20, 30, 45];

function vakitListesiCiz(){
  const simdi = simdiDk();
  const aktif = aktifVakit(simdi);
  $('#vakitListe').innerHTML = VAKITLER.map(v=>{
    const b = A.bildirim[v.k];
    // Güneş doğuşu için "önceden uyarı" anlamsız — düğme gösterilmez.
    const onceDugme = v.k === 'gunes' ? '' :
      `<button class="once ${b.once?'acik':''}" data-once="${v.k}"
        aria-label="${v.ad} öncesi uyarı">${b.once ? '⏱ '+b.once+' dk' : '⏱ —'}</button>`;
    return `
    <div class="vakit-satir ${aktif===v.k?'simdi':''}">
      <div class="vakit-ikon">${v.ikon}</div>
      <div class="vakit-ad">${v.ad}<em>${v.alt}</em></div>
      <div class="vakit-saat">${saatYaz(bugunVakit[v.k])}</div>
      ${onceDugme}
      <button class="zil ${b.bildir?'acik':''}" data-zil="${v.k}"
        aria-label="${v.ad} bildirimi">${b.bildir?'🔔':'🔕'}</button>
    </div>`;
  }).join('');

  $$('[data-zil]').forEach(b=> b.onclick = ()=>{
    const k=b.dataset.zil; A.bildirim[k].bildir = !A.bildirim[k].bildir;
    kaydet(); vakitListesiCiz(); bildirimKur();
    toast(VAKITLER.find(v=>v.k===k).ad +
          (A.bildirim[k].bildir?' bildirimi açık':' bildirimi kapalı'));
  });

  $$('[data-once]').forEach(b=> b.onclick = ()=>{
    const k = b.dataset.once;
    const i = ONCE_SECENEK.indexOf(+A.bildirim[k].once || 0);
    A.bildirim[k].once = ONCE_SECENEK[(i + 1) % ONCE_SECENEK.length];
    kaydet(); vakitListesiCiz(); bildirimKur();
    const ad = VAKITLER.find(v=>v.k===k).ad;
    toast(A.bildirim[k].once
      ? ad + ' vaktinden ' + A.bildirim[k].once + ' dk önce uyarır'
      : ad + ' için önceden uyarı kapalı');
  });
}
```

- [ ] **Adım 3: Tarayıcıda doğrula**

`index.html`'i tarayıcıda aç:
- Her vakit satırında zilin solunda `⏱ —` düğmesi görünmeli
- Güneş satırında bu düğme **olmamalı**
- Düğmeye arka arkaya dokununca `⏱ 5 dk` → `10` → `15` → `20` → `30` → `45` →
  `⏱ —` sırasıyla dönmeli, her dokunuşta toast çıkmalı
- Sayfayı yenile — seçilen değer korunmalı

- [ ] **Adım 4: Commit**

```powershell
git add index.html
git commit -m "Arayuz: vakit satirinda onceden uyari dugmesi"
```

---

## Görev 12: Ayarlar bölümü

**Dosyalar:**
- Değiştir: `index.html:646-700` (Bildirim ve görünüm kartı)
- Değiştir: `index.html:2745-2755` (ayar bağlama)

- [ ] **Adım 1: HTML'i güncelle**

`index.html` içinde şu bloğu bul:

```html
      <div class="alan">
        <label>Vakit bildirimi<em>Uygulama açıkken çalışır</em></label>
        <button class="svic" id="bildirimSvic" role="switch"></button>
      </div>
      <div class="alan">
        <label>Vakit öncesi hatırlatma<em>Hazırlanmak için erken uyarı</em></label>
        <select id="onceden">
          <option value="0">Kapalı</option>
          <option value="5">5 dk önce</option>
          <option value="10">10 dk önce</option>
          <option value="15">15 dk önce</option>
          <option value="30">30 dk önce</option>
          <option value="45">45 dk önce</option>
        </select>
      </div>
```

Şununla değiştir:

```html
      <div class="alan">
        <label>Bildirimler<em>Tümünü açar veya kapatır</em></label>
        <button class="svic" id="bildirimSvic" role="switch"></button>
      </div>
      <div class="alan">
        <label>Sessiz saatler başlangıcı<em>Bu aralıkta sessiz bildirim gelir</em></label>
        <input type="time" id="sessizBas">
      </div>
      <div class="alan">
        <label>Sessiz saatler bitişi<em>Başlangıçla aynıysa kapalı</em></label>
        <input type="time" id="sessizSon">
      </div>
      <div class="alan">
        <label>Sahur uyarısı<em>İmsaktan kaç dakika önce</em></label>
        <select id="sahurOnce">
          <option value="0">Kapalı</option>
          <option value="30">30 dk önce</option>
          <option value="45">45 dk önce</option>
          <option value="60">1 saat önce</option>
          <option value="90">1,5 saat önce</option>
        </select>
      </div>
```

Vakit öncesi hatırlatma buradan kalktı — artık her vaktin kendi düğmesi ana
ekranda.

- [ ] **Adım 2: Ses ve pil kartını ekle**

Aynı kartın **sonuna**, `</div>` ile kapanmadan hemen önce ekle:

```html
      <div class="alan" id="sesAyarAlani" style="display:none">
        <label>Bildirim sesleri<em>Her tür için ayrı ses ve titreşim</em></label>
        <select id="sesKanal">
          <option value="">Seç…</option>
          <option value="vakit">Namaz vakitleri</option>
          <option value="once">Vakit öncesi uyarı</option>
          <option value="oruc">Sahur ve iftar</option>
          <option value="ozel">Cuma ve kerahat</option>
          <option value="sessiz">Sessiz saatler</option>
        </select>
      </div>
      <div class="alan" id="pilAlani" style="display:none">
        <label>Bildirimler gecikiyor mu?<em>Pil ayarından uygulamayı serbest bırak</em></label>
        <button class="svic" id="pilDugme" role="button">Aç</button>
      </div>
```

`sesAyarAlani` ve `pilAlani` yalnızca APK içinde görünür — tarayıcıda anlamları
yok. Görünürlükleri Adım 3'te ayarlanır.

- [ ] **Adım 3: Ayar bağlamayı güncelle**

`index.html` içinde şu satırları bul:

```js
  $('#onceden').value = A.onceden;
  $('#onceden').onchange = e => { A.onceden = +e.target.value; kaydet(); };
```

Şununla değiştir:

```js
  $('#sessizBas').value = A.sessizBas || '00:00';
  $('#sessizBas').onchange = e => { A.sessizBas = e.target.value; kaydet(); bildirimKur(); };
  $('#sessizSon').value = A.sessizSon || '00:00';
  $('#sessizSon').onchange = e => { A.sessizSon = e.target.value; kaydet(); bildirimKur(); };

  $('#sahurOnce').value = A.sahurOnce;
  $('#sahurOnce').onchange = e => { A.sahurOnce = +e.target.value; kaydet(); bildirimKur(); };

  // Ses ve pil ayarları yalnızca APK içinde anlamlı
  const C = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Cihaz;
  if(C){
    $('#sesAyarAlani').style.display = '';
    $('#pilAlani').style.display = '';
    $('#sesKanal').onchange = e => {
      if(!e.target.value) return;
      C.kanalAyariAc({ kanal: e.target.value }).catch(()=>{});
      e.target.value = '';
    };
    $('#pilDugme').onclick = ()=> C.pilAyariAc().catch(()=>{});
  }
```

- [ ] **Adım 4: Ana anahtarı kuyruğa bağla**

`index.html` içinde şu bloğu bul (`index.html:2745` civarı):

```js
  svicKur('#bildirimSvic', 'bildirimAcik', async v=>{
```

Bu geri çağrının gövdesini oku. İzin isteyip `true`/`false` döndürüyor. Gövdenin
**sonuna**, `return` ifadesinden önce bir şey ekleyemeyeceğimiz için, `svicKur`
çağrısının hemen **altına** ekle:

```js
  // Ana anahtar değişince kuyruk baştan kurulur (kapatılınca boşaltılır).
  (function(){
    const el = $('#bildirimSvic');
    const eski = el.onclick;
    el.onclick = async (e)=>{ await eski(e); bildirimKur(); };
  })();
```

- [ ] **Adım 5: Diğer ayarları da kuyruğa bağla**

Kerahat, cuma, cuma saati ve ramazan modu değişince de kuyruk yenilenmeli.
`svicKur('#kerahatSvic'`, `svicKur('#cumaSvic'`, `$('#cumaSaat')` ve
`$('#ramazanMod')` bağlamalarını bul; her birinin `kaydet()` çağrısından sonra
`bildirimKur();` ekle. `svicKur` ile kurulanlar için Adım 4'teki sarmalama
yöntemini kullan:

```js
  ['#kerahatSvic', '#cumaSvic'].forEach(sel=>{
    const el = $(sel), eski = el.onclick;
    el.onclick = async (e)=>{ await eski(e); bildirimKur(); };
  });
```

Bunu Adım 4'teki bloğun altına ekle.

- [ ] **Adım 6: Tarayıcıda doğrula**

`index.html`'i tarayıcıda aç, Ayarlar sekmesine geç:
- "Bildirimler" anahtarı, iki sessiz saat alanı ve sahur seçimi görünmeli
- "Vakit öncesi hatırlatma" seçimi **görünmemeli**
- "Bildirim sesleri" ve "Bildirimler gecikiyor mu?" alanları tarayıcıda
  **görünmemeli** (yalnızca APK'da)
- Sessiz saatleri değiştir, sayfayı yenile — değerler korunmalı
- Konsolda hata olmamalı

- [ ] **Adım 7: Commit**

```powershell
git add index.html
git commit -m "Arayuz: sessiz saatler, sahur ve kanal ses kisayollari"
```

---

## Görev 13: `Cihaz` yerel eklentisi

**Dosyalar:**
- Oluştur: `C:\apk\besvakit-apk\android\app\src\main\java\com\kamilsaim\besvakit\Cihaz.java`
- Değiştir: `C:\apk\besvakit-apk\android\app\src\main\java\com\kamilsaim\besvakit\MainActivity.java`

- [ ] **Adım 1: Eklentiyi yaz**

`Cihaz.java` dosyasını oluştur:

```java
package com.kamilsaim.besvakit;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * İki küçük iş için yerel köprü:
 *  - pilAyariAc()  : bazı markalar kuyruktaki bildirimleri pil tasarrufu diye
 *                    öldürüyor; kullanıcıyı doğrudan o ayara götürür.
 *  - kanalAyariAc(): bildirim sesi ve titreşimi Android'in kanal ayarından
 *                    seçilir; uygulama içinde ses seçici yazmamak için
 *                    doğrudan o ekranı açarız.
 */
@CapacitorPlugin(name = "Cihaz")
public class Cihaz extends Plugin {

    @PluginMethod
    public void pilAyariAc(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            // Ayar ekranı yoksa uygulama ayrıntılarına düş
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
            } catch (Exception e2) {
                call.reject("Pil ayarı açılamadı");
            }
        }
    }

    @PluginMethod
    public void kanalAyariAc(PluginCall call) {
        String kanal = call.getString("kanal");
        if (kanal == null) { call.reject("kanal gerekli"); return; }

        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= 26) {
                i = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
                i.putExtra(Settings.EXTRA_CHANNEL_ID, kanal);
            } else {
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Kanal ayarı açılamadı");
        }
    }
}
```

- [ ] **Adım 2: Eklentiyi kaydet**

`MainActivity.java` içinde `onCreate` metodunu bul. `super.onCreate(...)`
çağrısından **önce** eklenti kaydını ekle:

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(Cihaz.class);
        super.onCreate(savedInstanceState);
        Window window = getWindow();
```

Capacitor eklentileri köprü kurulmadan önce kaydedilmelidir; `super.onCreate`
köprüyü kurar.

- [ ] **Adım 3: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`

- [ ] **Adım 4: Commit**

APK projesi git deposu değil. Web deposunda değişiklik yok, commit atlanır.

---

## Görev 14: Haptics ve titreşim etiketinin daraltılması

**Dosyalar:**
- Değiştir: `index.html` (yeni `titret` yardımcısı ve tüm `navigator.vibrate` kullanımları)
- Değiştir: `index.html` (Titreşim ayarının etiketi)

- [ ] **Adım 1: `titret` yardımcısını ekle**

`index.html` içinde `function toast(msg){` satırını bul ve **hemen öncesine**
ekle:

```js
/**
 * Dokunsal geri bildirim. APK içinde @capacitor/haptics kullanılır —
 * navigator.vibrate WebView'da bazı cihazlarda çalışmıyor. Eklenti yoksa
 * tarayıcı API'sine düşer.
 *
 * Not: bu yalnızca UYGULAMA İÇİ titreşimdir. Bildirim titreşimi Android'in
 * kanal ayarından yönetilir, buradan değil.
 */
function titret(sure){
  if(!A.titresim) return;
  const H = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
  if(H){
    const s = Array.isArray(sure) ? sure.reduce((t,x)=>t+x, 0) : sure;
    try{
      if(s >= 300) H.impact({ style:'HEAVY' });
      else if(s >= 60) H.impact({ style:'MEDIUM' });
      else H.impact({ style:'LIGHT' });
      return;
    }catch(e){}
  }
  if(navigator.vibrate) navigator.vibrate(sure);
}
```

- [ ] **Adım 2: Tüm `navigator.vibrate` çağrılarını değiştir**

Şu dokuz yeri bul ve değiştir. Her birinde `if(A.titresim && navigator.vibrate)`
koşulu kalkar — `titret` zaten `A.titresim`'i kontrol ediyor.

| Konum | Eski | Yeni |
|---|---|---|
| kerahat uyarısı | `if(A.titresim && navigator.vibrate) navigator.vibrate([120,80,120]);` | `titret([120,80,120]);` |
| ramazan kartı | `if(A.titresim && navigator.vibrate) navigator.vibrate(25);` | `titret(25);` |
| önceden uyarı | `if(A.titresim && navigator.vibrate) navigator.vibrate(180);` | `titret(180);` |
| vakit bildirimi | `if(A.titresim && navigator.vibrate) navigator.vibrate([400,150,400]);` | `titret([400,150,400]);` |
| zikir seçimi | `if(A.titresim && navigator.vibrate) navigator.vibrate(25);` | `titret(25);` |
| tesbih sayımı | `if(A.titresim && navigator.vibrate) navigator.vibrate(tamam ? [60,60,60] : 12);` | `titret(tamam ? [60,60,60] : 12);` |
| cuma uyarısı | `if(A.titresim && navigator.vibrate) navigator.vibrate([200,100,200]);` | `titret([200,100,200]);` |
| kıble hizası | `sonTitresim = Date.now(); navigator.vibrate(60);` | `sonTitresim = Date.now(); titret(60);` |

Kıble satırındaki dış koşulda `A.titresim && navigator.vibrate` geçiyorsa
(`index.html:2321`) o koşuldan da `navigator.vibrate &&` kısmını çıkar; `A.titresim`
kontrolü kalabilir, zararı yok ama `navigator.vibrate` kontrolü eklentili
cihazlarda yanlış negatif üretir:

```js
  if(hizali && pusulaAcik && A.titresim && Date.now()-sonTitresim > 4000){
```

- [ ] **Adım 3: Titreşim etiketini daralt**

`index.html` içinde şunu bul:

```html
        <label>Titreşim<em>Kıble hizalanınca da titrer</em></label>
```

Şununla değiştir:

```html
        <label>Titreşim<em>Tesbih ve kıble için. Bildirim titreşimi Android ayarından.</em></label>
```

- [ ] **Adım 4: Kalan kullanım olmadığını doğrula**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node -e "const s=require('fs').readFileSync('index.html','utf8'); const m=s.match(/navigator\.vibrate/g); console.log(m ? m.length : 0)"
```

Beklenen: `1` — yalnızca `titret` fonksiyonunun içindeki geri düşüş kalmalı.

- [ ] **Adım 5: Tarayıcıda doğrula**

`index.html`'i tarayıcıda aç, İbadet sekmesindeki tesbihe dokun. Konsolda hata
olmamalı. Titreşim ayarını kapat, tekrar dokun — hata çıkmamalı.

- [ ] **Adım 6: Commit**

```powershell
git add index.html
git commit -m "Haptics: uygulama ici titresim native eklentiye tasindi"
```

---

## Görev 15: Eski `setInterval` yolunu APK'da devre dışı bırak

**Dosyalar:**
- Değiştir: `index.html` (`bildirimKontrol`, `kerahatUyari`, `cumaUyari`)

APK içinde bildirimler artık kuyruktan geliyor. Eski `setInterval` yolu açık
kalırsa aynı bildirim iki kez gelir.

- [ ] **Adım 1: Kuyruk kullanılıyor mu yardımcısını ekle**

`index.html` içinde `bildirimEklentisi` tanımının hemen altına ekle:

```js
/** Kuyruk kullanılabiliyorsa uygulama açıkken çalışan eski yol susar —
    yoksa aynı bildirim iki kez gelir. */
const kuyrukVar = ()=> !!bildirimEklentisi();
```

- [ ] **Adım 2: Üç fonksiyonun başına koruma ekle**

`bildirimKontrol` fonksiyonunun ilk satırını değiştir:

```js
function bildirimKontrol(dk){
  if(kuyrukVar()) return;          // APK: bildirimler kuyruktan gelir
  if(!A.bildirimAcik) return;
```

`kerahatUyari` fonksiyonunun ilk satırını değiştir:

```js
function kerahatUyari(dk){
  if(kuyrukVar()) return;          // APK: bildirimler kuyruktan gelir
  if(!A.kerahat || !A.bildirimAcik) return;
```

`cumaUyari` fonksiyonunun ilk satırını değiştir:

```js
function cumaUyari(dk){
  if(kuyrukVar()) return;          // APK: bildirimler kuyruktan gelir
  if(!A.cuma || !A.bildirimAcik) return;
```

- [ ] **Adım 3: Tarayıcıda eski yolun hâlâ çalıştığını doğrula**

`index.html`'i tarayıcıda aç. Konsolda:

```js
kuyrukVar()
```

Beklenen: `false` — tarayıcıda eklenti yok, eski yol çalışmaya devam etmeli.

- [ ] **Adım 4: Commit**

```powershell
git add index.html
git commit -m "APK'da eski setInterval bildirim yolunu sustur"
```

---

## Görev 16: Widget'ta iftar geri sayımı

**Dosyalar:**
- Değiştir: `index.html` (`widgetVeriYaz`)
- Değiştir: `C:\apk\besvakit-apk\android\app\src\main\java\com\kamilsaim\besvakit\VakitWidget.java`

- [ ] **Adım 1: Ramazan günlerini widget verisine ekle**

`index.html` içinde `widgetVeriYaz` fonksiyonundaki yazma çağrısını bul:

```js
    await P.set({ key:'bv_widget', value: JSON.stringify({
      sehir: A.sehir, yazan: gunAnahtar(bugun), gunler
    })});
```

Şununla değiştir:

```js
    await P.set({ key:'bv_widget', value: JSON.stringify({
      sehir: A.sehir, yazan: gunAnahtar(bugun), gunler,
      ramazan: ramazanGunleri()
    })});
```

Aynı fonksiyondaki `imza` satırına da ramazan modunu ekle ki mod değişince
veri yeniden yazılsın:

```js
  const imza = gunAnahtar(bugun) + '|' + A.sehir + '|' + A.lat.toFixed(4) + ',' + A.lng.toFixed(4) +
               '|' + A.rakim + '|' + A.yontem + '|' + A.mezhep + '|' + (A.temkin?1:0) +
               '|' + A.ramazanMod +
               '|' + VAKITLER.map(v=>A.duzeltme[v.k]).join(',');
```

- [ ] **Adım 2: Java tarafında ramazan listesini oku**

`VakitWidget.java` içindeki `Gun` iç sınıfını bul (`VakitWidget.java:189`
civarı) ve yeni bir alan ekle:

```java
    private static class Gun {
        String sehir = "Beş Vakit";
        int[] vakit = new int[6];      // gece yarısından dakika
        int[] yarinVakit;              // yatsı geçtiyse yarının imsakı için
        boolean ramazan = false;       // bugün ramazan mı — iftar geri sayımı için
    }
```

Sonra `bugununVakitleri` metodunda şu satırı bul
(`VakitWidget.java:231` civarı):

```java
            g.sehir = kok.optString("sehir", "Beş Vakit");
```

Hemen **altına** ekle:

```java
            // Hangi günlerin ramazan olduğunu web tarafı yazar; hicri hesabı
            // widget yapmaz.
            JSONArray ram = kok.optJSONArray("ramazan");
            if (ram != null) {
                for (int i = 0; i < ram.length(); i++) {
                    if (bugun.equals(ram.optString(i))) { g.ramazan = true; break; }
                }
            }
```

`bugun` değişkeni bu metotta zaten var (`String bugun = anahtar(c);`) ve o günün
`YYYY-MM-DD` anahtarını tutar. `JSONArray` bu dosyada zaten içe aktarılmış.

- [ ] **Adım 3: Ramazanda iftar geri sayımını göster**

`VakitWidget.java` içinde geniş düzeni dolduran bölümü bul
(`rv.setTextViewText(R.id.wVakit, s.ad);` satırı, `VakitWidget.java:138`
civarı). Bu satırı şununla değiştir:

```java
            // Ramazanda akşam vakti "İftar" olarak öne çıkar — orucu bekleyen
            // için en anlamlı bilgi budur. Ad yerine indeks karşılaştırılıyor:
            // ADLAR dizisi değişirse metin karşılaştırması sessizce bozulurdu.
            boolean iftarMi = gun.ramazan && s.indeks == 4 && !s.yarin;
            rv.setTextViewText(R.id.wVakit, iftarMi ? "İftar" : s.ad);
```

Ve hemen altındaki kalan süre satırını (`rv.setTextViewText(R.id.wKalan, ...)`)
şununla değiştir:

```java
            rv.setTextViewText(R.id.wKalan,
                (iftarMi ? "İftara " : "") + kalanYazi(s.kalan) + (s.yarin ? " (yarın)" : ""));
```

Kompakt düzende de aynı değişikliği yap (`R.id.wkVakit` ve `R.id.wkKalan`
kullanan bölüm).

- [ ] **Adım 4: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`

- [ ] **Adım 5: Commit**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
git add index.html
git commit -m "Widget: ramazanda iftar geri sayimi"
```

---

## Görev 17: Sürüm, servis işçisi ve cihaz doğrulaması

**Dosyalar:**
- Değiştir: `sw.js`
- Değiştir: `index.html` (`SURUM` sabiti)
- Değiştir: `C:\apk\besvakit-apk\android\app\build.gradle`
- Değiştir: `C:\apk\besvakit-apk\capacitor.config.json` (gerekirse)
- Değiştir: `C:\apk\besvakit-apk\OKUBENI.md`

- [ ] **Adım 1: Servis işçisini güncelle**

`sw.js` içinde iki satırı değiştir:

```js
const SURUM = 'besvakit-v6';
const KABUK = ['./', './index.html', './bildirim.js', './logos.png', './logo-beyaz.png'];
```

`bildirim.js` kabuğa eklenmezse çevrimdışı açılışta bildirim mantığı yüklenmez.

- [ ] **Adım 2: Web sürümünü yükselt**

`index.html` içinde `SURUM = '0.10.0';` satırını bul ve değiştir:

```js
const SURUM = '0.11.0';
```

- [ ] **Adım 3: APK sürümünü yükselt**

`C:\apk\besvakit-apk\android\app\build.gradle` içinde:

```gradle
        versionCode 2
        versionName "0.11.0"
```

Eski değerler `versionCode 1` / `versionName "0.7.2"` idi.

- [ ] **Adım 4: Testlerin hepsinin geçtiğini doğrula**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

Beklenen: `# fail 0`

- [ ] **Adım 5: Web'i yayına al**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
git add sw.js index.html
git commit -m "Surumu 0.11.0'a yukselt, bildirim.js'i kabuk onbellegine ekle"
git push
```

GitHub Pages'in yayına alması birkaç dakika sürer. APK uzaktan yüklediği için
**web tarafı yayında olmadan APK'da test edemezsin.**

- [ ] **Adım 6: APK'yı derle**

```powershell
cd C:\apk\besvakit-apk
npx cap sync android
cd android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Çıktı: `android\app\build\outputs\apk\debug\app-debug.apk`

- [ ] **Adım 7: Cihazda doğrula**

APK'yı telefona kur ve tek tek bak:

- [ ] Uygulama açılıyor, GitHub Pages'ten 0.11.0 yükleniyor
- [ ] Android 13+ ise bildirim izni soruluyor
- [ ] Ayarlar → Bildirimler anahtarı açılıyor
- [ ] Ana ekranda her vakit satırında `⏱` düğmesi var, güneşte yok, dokununca dönüyor
- [ ] Ayarlar → "Bildirim sesleri" seçiminden bir kanal seç — Android'in kanal
      ayar ekranı açılıyor, orada ses seçilebiliyor
- [ ] `vakit` kanalının varsayılan sesi ezan sesi
- [ ] "Bildirimler gecikiyor mu?" düğmesi pil ayarını açıyor
- [ ] **Uygulamayı tamamen kapat**, yaklaşan bir vakti bekle — bildirim geliyor
- [ ] Sessiz saatleri şimdiki saati kapsayacak şekilde ayarla, uygulamayı
      kapat, bir bildirim bekle — sessiz geliyor
- [ ] Tesbihe dokun — titreşim daha keskin (Haptics çalışıyor)
- [ ] Widget hâlâ doğru çalışıyor
- [ ] Bildirim simgesi düzgün görünüyor — bozuksa `ic_stat_besvakit.png` ekle
      (tek renkli, beyaz, saydam zemin, 24×24 dp; `res/drawable-*dpi` altına)

- [ ] **Adım 8: OKUBENI.md'yi güncelle**

`C:\apk\besvakit-apk\OKUBENI.md` içinde iki bölümü güncelle:

§5 tablosundaki sürüm satırını:

```
| versionCode / versionName | `2` / `0.11.0` |
```

§6 "Bilinen eksik" bölümünün tamamını sil ve yerine yaz:

```markdown
## 6. Bildirimler

Uygulama kapalıyken de çalışır. 30 güne kadar bildirim
`@capacitor/local-notifications` ile önceden kuyruğa alınır; mantık web
tarafındaki `bildirim.js` dosyasında (`bildirimListesiUret`) ve
`index.html`'deki `bildirimKur()` içindedir.

Ses ve titreşim seçimi Android'in **bildirim kanalı** ayarına bırakıldı —
uygulama içinde ses seçici yok. Beş kanal var: `vakit`, `once`, `oruc`,
`ozel`, `sessiz`. Kanal bir kez oluşturulduktan sonra sesi kod ile
değiştirilemez; kanal id'leri asla değiştirilmemeli.

Android'de uygulama başına bekleyen alarm sayısı ~500 ile sınırlı. Bu yüzden
kuyruk uzunluğu aktif bildirim türü sayısına göre 7-30 gün arasında kendini
ayarlar (`bvGunButcesi`).

Bildirim mantığı test edilebilir:

```powershell
cd "E:\ksaim\claude programlar\besvakit"
node --test araclar/bildirim.test.cjs
```

**Sıradaki iş:** Wear OS modülü — ayrı bir tasarım belgesi var
(`docs/superpowers/specs/2026-08-11-bildirim-ve-saat-design.md` §Aşama 2).
```

- [ ] **Adım 9: Son commit**

```powershell
cd "E:\ksaim\claude programlar\besvakit"
git add -A
git commit -m "Arka plan bildirimleri tamamlandi"
git push
```

---

## Doğrulama özeti

Bu plan bitince şunlar doğrulanmış olmalı:

| Ne | Nasıl |
|---|---|
| Bildirim üretim mantığı | `node --test araclar/bildirim.test.cjs` — 27 test |
| Ayar migrasyonu | Görev 9 Adım 3, tarayıcı konsolu |
| Arayüz | Görev 11 Adım 3, Görev 12 Adım 6, tarayıcı |
| Derleme | `gradlew.bat assembleDebug` → `BUILD SUCCESSFUL` |
| Kapalıyken bildirim | Görev 17 Adım 7, gerçek cihaz |

Gerçek cihaz doğrulaması yapılmadan bu iş **bitti sayılmaz** — kuyruk mantığının
tek gerçek sınavı odur.
