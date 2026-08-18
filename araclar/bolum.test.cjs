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
/* class niteliginde tam sinif adi arar. /bolum/ yetmez: tire de kelime
   siniri sayildigi icin "bolum-dar" gibi bir sinifa da eslesirdi. */
function sinifVar(nitelik, ad) {
  const m = nitelik.match(/class="([^"]*)"/);
  return !!m && m[1].split(/\s+/).includes(ad);
}

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
  const DEGISKENLER = ['--cam', '--cam-cizgi', '--cam-parlak', '--cam-ic', '--cam-ic-cizgi', '--cam-golge'];
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

/**
 * Katlanir bir bolumde baslik butonu ile onun `aria-controls` ile isaret
 * ettigi kart AYNI kapsulun icinde olmali. Ayri kapsullere duserlerse
 * basliga dokunma davranisi gorsel olarak bozulur — ustelik `bolumDenetle`
 * bunu yakalamaz, cunku hem baslik sayimi hem kapsul sayisi dogru kalir.
 *
 * Her sayfanin govdesini kapsul kapsul parcalar; her kapsul icin o kapsulde
 * gecen aria-controls degerlerini ve tanimli id'leri karsilastirir.
 */
function kapsulleriAyikla(govde) {
  const etiket = /<(\/?)(div|button)\b([^>]*)>/g;
  let m, derinlik = 0, acik = null;
  const kapsuller = [];
  while ((m = etiket.exec(govde)) !== null) {
    if (m[1] !== '/') {
      if (sinifVar(m[3], 'bolum')) acik = { derinlik, nitelikler: [] };
      else if (acik) acik.nitelikler.push(m[3]);
      derinlik++;
    } else {
      derinlik--;
      if (acik && derinlik === acik.derinlik) { kapsuller.push(acik); acik = null; }
    }
  }
  return kapsuller;
}

for (const [id] of SAYFALAR) {
  test(id + ' — aria-controls hedefi basligiyla ayni kapsulde', () => {
    const kapsuller = kapsulleriAyikla(sayfa(id));
    const kopuk = [];
    for (const k of kapsuller) {
      const hedefler = k.nitelikler
        .map(n => (n.match(/aria-controls="([^"]+)"/) || [])[1])
        .filter(Boolean);
      for (const h of hedefler) {
        if (!k.nitelikler.some(n => n.includes('id="' + h + '"'))) kopuk.push(h);
      }
    }
    assert.deepStrictEqual(kopuk, [],
      'basligindan ayri kapsulde kalan kart(lar): ' + kopuk.join(', '));
  });
}
