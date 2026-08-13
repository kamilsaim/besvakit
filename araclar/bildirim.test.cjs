const test = require('node:test');
const assert = require('node:assert');
const { bildirimListesiUret, bvGunButcesi, bvZaman, bvSaatDk, bvSaatYaz } = require('../bildirim.js');

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
    dua: false,
    duaSaat: '09:00',
    duaGunleri: {},
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

test('güneş için önceden uyarı üretilir ve metni farklıdır', () => {
  const ayar = ayarKur();
  ayar.vakit.gunes.bildir = true;
  ayar.vakit.gunes.once = 15;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const once = liste.filter(b => b.kanal === 'once');

  assert.strictEqual(once.length, 2);   // tablodaki iki gün için birer tane
  // "Güneş vaktine kaldı" yanıltıcı olurdu: uyarılan şey vaktin başlaması
  // değil, sabah namazı vaktinin kapanması.
  assert.strictEqual(once[0].govde,
    'Güneş doğuşuna 15 dakika kaldı — sabah namazı vakti çıkıyor');
});

test('güneş öncesi uyarı doğuştan tam o kadar dakika önceye kurulur', () => {
  const ayar = ayarKur();
  ayar.vakit.gunes.bildir = true;
  ayar.vakit.gunes.once = 15;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const b = bildirimListesiUret(ayar, GUNLER, simdi)
    .find(x => x.kanal === 'once');

  // GUNLER'de 2026-08-11 güneş = 334 dk (05:34) -> 15 dk öncesi 05:19
  assert.strictEqual(b.zaman.getTime(),
    new Date(2026, 7, 11, 5, 19, 0).getTime());
});

test('önceden 0 ise uyarı üretilmez', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  ayar.vakit.ogle.once = 0;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);

  assert.strictEqual(liste.filter(b => b.kanal === 'once').length, 0);
});

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
  // 6 vakit + 6 önceden + 3 kerahat + 2 oruç = 17 -> 400/17 = 23
  assert.strictEqual(bvGunButcesi(ayar), 23);
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

// --- Fix 1: 0 dakika eksik vakit sayılmalı, bildirim üretmemeli ---

test('vakit 0 ise eksik sayılır, bildirim üretilmez', () => {
  const ayar = ayarKur();
  ayar.vakit.ikindi.bildir = true;
  ayar.vakit.ikindi.once = 15;
  const gunler = { '2026-08-12': [236, 334, 769, 0, 1195, 1285] };
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, gunler, simdi);

  assert.strictEqual(liste.filter(b => b.govde.startsWith('İkindi')).length, 0);
});

test('vakit 0 iken aynı gündeki diğer vakitler çalışmaya devam eder', () => {
  const ayar = ayarKur();
  ayar.vakit.ikindi.bildir = true;
  ayar.vakit.ogle.bildir = true;
  const gunler = { '2026-08-12': [236, 334, 769, 0, 1195, 1285] };
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, gunler, simdi);

  assert.strictEqual(liste.filter(b => b.govde === 'Öğle vakti girdi').length, 1);
});

// --- Fix 2: Cuma bloğu öğle değeri eksikse ek metni atlamalı ---

test('cuma metninde öğle değeri geçerliyken eskisi gibi kalır', () => {
  const ayar = ayarKur({ cuma: true, cumaSaat: '11:30' });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, HAFTA, simdi);
  const cuma = liste.find(b => b.govde.startsWith('Cuma namazı'));

  assert.strictEqual(cuma.govde, 'Cuma namazı vakti yaklaşıyor · öğle 12:49');
});

test('cuma günü öğle eksikse (boş dizi) ek metin atlanır', () => {
  const ayar = ayarKur({ cuma: true, cumaSaat: '11:30' });
  const gunler = { '2026-08-14': [] };
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, gunler, simdi);
  const cuma = liste.find(b => b.govde.startsWith('Cuma namazı'));

  assert.strictEqual(cuma.govde, 'Cuma namazı vakti yaklaşıyor');
  assert.ok(!cuma.govde.includes('NaN'));
});

test('cuma günü öğle 0 ise ek metin atlanır', () => {
  const ayar = ayarKur({ cuma: true, cumaSaat: '11:30' });
  const gunler = { '2026-08-14': [239, 337, 0, 998, 1192, 1282] };
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, gunler, simdi);
  const cuma = liste.find(b => b.govde.startsWith('Cuma namazı'));

  assert.strictEqual(cuma.govde, 'Cuma namazı vakti yaklaşıyor');
});

// --- Fix 3: geçmiş günler bütçeyi tüketmemeli ---

test('geçmiş günler bütçe dilimine girmez', () => {
  // Bütçe (tek vakit açıkken) 30 gün. 35 geçmiş + 5 gelecek gün veriyoruz;
  // geçmiş günler dilimi tüketirse gelecekten hiç bildirim çıkmaz.
  const uzun = {};
  for (let i = -35; i < 5; i++) {
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

  assert.ok(liste.length > 0, 'geçmiş günler bütçeyi tüketmemeli, gelecekten bildirim üretilmeli');
});

// --- Hardening 5: null/undefined gunler ---

test('gunler null ise boş liste döner, hata fırlatmaz', () => {
  const ayar = ayarKur();
  ayar.vakit.ogle.bildir = true;
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  assert.deepStrictEqual(bildirimListesiUret(ayar, null, simdi), []);
  assert.deepStrictEqual(bildirimListesiUret(ayar, undefined, simdi), []);
});

// --- Hardening 8: doğrudan yardımcı fonksiyon testleri ---

test('bvSaatDk boş metinde null döner', () => {
  assert.strictEqual(bvSaatDk(''), null);
});

test('bvSaatDk tek haneli değerleri de ayrıştırır', () => {
  assert.strictEqual(bvSaatDk('9:5'), 545);
});

test('bvSaatYaz negatif ve taşan dakikaları sarar', () => {
  assert.strictEqual(bvSaatYaz(-30), '23:30');
  assert.strictEqual(bvSaatYaz(1440 + 90), '01:30');
});

test('bvZaman negatif dakikayı bir önceki güne yuvarlar', () => {
  const d = bvZaman('2026-08-12', -70);
  assert.strictEqual(d.getDate(), 11);
  assert.strictEqual(d.getHours(), 22);
  assert.strictEqual(d.getMinutes(), 50);
});

// --- Reviewer ek test 9: türetilmiş dakikayla sessiz kanal kontrolü ---

test('önceden uyarı sessiz aralığa düşerse kanalı sessiz olur', () => {
  const ayar = ayarKur({ sessiz: { bas: '22:00', son: '06:00' } });
  ayar.vakit.imsak.bildir = true;
  ayar.vakit.imsak.once = 50;   // imsak 236 dk = 03:56, -50 = 03:06, hâlâ sessiz aralıkta
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const once = liste.find(b => b.kanal === 'once' || (b.govde.includes('kaldı') && b.govde.startsWith('İmsak')));

  assert.strictEqual(once.kanal, 'sessiz');
});

// --- Reviewer ek test 10: gece yarısını aşan sahur ---

test('gece yarısını aşan sahur önceki güne doğru saatte planlanır', () => {
  const ayar = ayarKur({ ramazanGunleri: ['2026-08-12'], sahurOnce: 90,
                          sessiz: { bas: '22:00', son: '06:00' } });
  const gunler = { '2026-08-12': [20, 334, 769, 999, 1195, 1285] };
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, gunler, simdi);
  const sahur = liste.find(b => b.govde.startsWith('Sahur'));

  // imsak 20 dk = 00:20; 90 dk öncesi = -70 dk -> önceki gün 22:50
  assert.strictEqual(sahur.zaman.getDate(), 11);
  assert.strictEqual(sahur.zaman.getHours(), 22);
  assert.strictEqual(sahur.zaman.getMinutes(), 50);
  assert.strictEqual(sahur.kanal, 'sessiz');
});

/* ---------- mübarek gün duaları ---------- */

test('dua günü için belirlenen saatte tek bildirim üretir', () => {
  const ayar = ayarKur({
    dua: true, duaSaat: '09:00',
    duaGunleri: { '2026-08-12': 'Receb ayı girdi — Receb duası okunur' }
  });
  const simdi = new Date(2026, 7, 11, 0, 0, 0);

  const liste = bildirimListesiUret(ayar, GUNLER, simdi);
  const dualar = liste.filter(b => b.govde.indexOf('Receb') >= 0);

  assert.strictEqual(dualar.length, 1);
  assert.strictEqual(dualar[0].zaman.getDate(), 12);
  assert.strictEqual(dualar[0].zaman.getHours(), 9);
  assert.strictEqual(dualar[0].kanal, 'ozel');
});

test('dua anahtarı kapalıyken dua bildirimi üretilmez', () => {
  const ayar = ayarKur({
    dua: false, duaGunleri: { '2026-08-12': 'Receb ayı girdi' }
  });
  const liste = bildirimListesiUret(ayar, GUNLER, new Date(2026, 7, 11, 0, 0, 0));
  assert.strictEqual(liste.length, 0);
});

test('dua bildirimi sessiz aralığa düşerse kanal sessiz olur', () => {
  const ayar = ayarKur({
    dua: true, duaSaat: '03:00',
    sessiz: { bas: '22:00', son: '06:00' },
    duaGunleri: { '2026-08-12': 'Kadir Gecesi' }
  });
  const liste = bildirimListesiUret(ayar, GUNLER, new Date(2026, 7, 11, 0, 0, 0));
  assert.strictEqual(liste.length, 1);
  assert.strictEqual(liste[0].kanal, 'sessiz');
});

test('yalnızca dua açıkken bütçe tavan gün olur', () => {
  assert.strictEqual(bvGunButcesi(ayarKur({ dua: true })), 30);
  assert.strictEqual(bvGunButcesi(ayarKur()), 0);
});
