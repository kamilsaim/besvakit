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
