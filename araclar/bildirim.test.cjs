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
