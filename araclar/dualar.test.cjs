const test = require('node:test');
const assert = require('node:assert');
const { BV_DUALAR, bvDuaKuralUyar, bvDuaListesi, bvDuaIlkGunMu } = require('../dualar.js');

/** Gün bağlamı kısayolu. hafta: 0 pazar … 5 cuma, 6 cumartesi. */
function ctx(ay, gun, hafta, yarinAy, yarinGun) {
  return {
    ay, gun, hafta,
    yarinAy: yarinAy === undefined ? ay : yarinAy,
    yarinGun: yarinGun === undefined ? gun + 1 : yarinGun
  };
}
const dua = id => BV_DUALAR.find(d => d.id === id);
const idler = c => bvDuaListesi(c).map(d => d.id);

/* ---------- kural tipleri ---------- */

test('ay kuralı o ay boyunca tutar', () => {
  assert.ok(bvDuaKuralUyar({ t: 'ay', ay: 7 }, ctx(7, 1, 1)));
  assert.ok(bvDuaKuralUyar({ t: 'ay', ay: 7 }, ctx(7, 29, 1)));
  assert.ok(!bvDuaKuralUyar({ t: 'ay', ay: 7 }, ctx(8, 1, 1)));
});

test('gun kuralı yalnızca o günde tutar', () => {
  assert.ok(bvDuaKuralUyar({ t: 'gun', ay: 1, gun: 10 }, ctx(1, 10, 2)));
  assert.ok(!bvDuaKuralUyar({ t: 'gun', ay: 1, gun: 10 }, ctx(1, 9, 1)));
  assert.ok(!bvDuaKuralUyar({ t: 'gun', ay: 1, gun: 10 }, ctx(2, 10, 2)));
});

test('aralik kuralı sınırlar dahil tutar', () => {
  const k = { t: 'aralik', ay: 1, bas: 1, son: 10 };
  assert.ok(bvDuaKuralUyar(k, ctx(1, 1, 0)));
  assert.ok(bvDuaKuralUyar(k, ctx(1, 10, 0)));
  assert.ok(!bvDuaKuralUyar(k, ctx(1, 11, 0)));
});

test('aralik kuralında ay 0 her ayı kapsar', () => {
  const k = { t: 'aralik', ay: 0, bas: 29, son: 30 };
  assert.ok(bvDuaKuralUyar(k, ctx(3, 29, 0)));
  assert.ok(bvDuaKuralUyar(k, ctx(11, 30, 0)));
  assert.ok(!bvDuaKuralUyar(k, ctx(11, 15, 0)));
});

test('gece kuralı hem o günde hem bir gün öncesinde tutar', () => {
  const k = { t: 'gece', ay: 9, gun: 27 };
  // 27 Ramazan'ın kendisi
  assert.ok(bvDuaKuralUyar(k, ctx(9, 27, 1)));
  // 26 Ramazan akşamı — yarın 27'si
  assert.ok(bvDuaKuralUyar(k, ctx(9, 26, 0, 9, 27)));
  // 25'inde tutmaz
  assert.ok(!bvDuaKuralUyar(k, ctx(9, 25, 6, 9, 26)));
  // ay sonu taşması: 30 Şaban'da yarın 1 Ramazan ise 27 Ramazan tutmamalı
  assert.ok(!bvDuaKuralUyar(k, ctx(8, 30, 3, 9, 1)));
});

test('hafta kuralı haftanın gününe bakar', () => {
  assert.ok(bvDuaKuralUyar({ t: 'hafta', gun: 5 }, ctx(4, 12, 5)));
  assert.ok(!bvDuaKuralUyar({ t: 'hafta', gun: 5 }, ctx(4, 11, 4)));
});

/* ---------- özel kurallar ---------- */

test('regaib perşembe akşamını ve cuma gününü tutar', () => {
  // Perşembe, yarın 3 Receb cuma → Regaib gecesi
  assert.ok(bvDuaKuralUyar({ t: 'regaib' }, ctx(7, 2, 4, 7, 3)));
  // Cuma, 3 Receb → gündüzü de tutar
  assert.ok(bvDuaKuralUyar({ t: 'regaib' }, ctx(7, 3, 5)));
  // Receb'in ikinci cuması (10'u) tutmaz
  assert.ok(!bvDuaKuralUyar({ t: 'regaib' }, ctx(7, 10, 5)));
  // Şaban'ın ilk cuması tutmaz
  assert.ok(!bvDuaKuralUyar({ t: 'regaib' }, ctx(8, 3, 5)));
  // Receb'in ilk cumasından önceki çarşamba tutmaz
  assert.ok(!bvDuaKuralUyar({ t: 'regaib' }, ctx(7, 1, 3, 7, 2)));
});

test('safer çarşambası ilk ve son haftada tutar', () => {
  assert.ok(bvDuaKuralUyar({ t: 'saferCarsamba' }, ctx(2, 4, 3)));
  assert.ok(bvDuaKuralUyar({ t: 'saferCarsamba' }, ctx(2, 25, 3)));
  assert.ok(!bvDuaKuralUyar({ t: 'saferCarsamba' }, ctx(2, 15, 3)), 'ayın ortası');
  assert.ok(!bvDuaKuralUyar({ t: 'saferCarsamba' }, ctx(2, 4, 2)), 'salı');
  assert.ok(!bvDuaKuralUyar({ t: 'saferCarsamba' }, ctx(3, 4, 3)), 'Safer değil');
});

/* ---------- liste ---------- */

test('1 Muharrem üç duayı birden getirir', () => {
  const liste = idler(ctx(1, 1, 1));
  assert.ok(liste.includes('muharrem-1'));
  assert.ok(liste.includes('muharrem-on'));
  assert.ok(liste.includes('hilal'), 'ayın ilk günü hilâl duası');
  assert.ok(!liste.includes('asure'));
});

test('Aşûre günü Aşûre duasını getirir', () => {
  const liste = idler(ctx(1, 10, 4));
  assert.ok(liste.includes('asure'));
  assert.ok(liste.includes('muharrem-on'));
});

test('Ramazan boyunca iftar duası düşer, Kadir gecesi eklenir', () => {
  assert.ok(idler(ctx(9, 5, 1)).includes('iftar'));
  const kadir = idler(ctx(9, 27, 3));
  assert.ok(kadir.includes('iftar'));
  assert.ok(kadir.includes('kadir'));
});

test('Ramazan sonu hem arefe hem senenin bitmediği için sene-sonu değil', () => {
  const liste = idler(ctx(9, 29, 6));
  assert.ok(liste.includes('arefe'), 'Ramazan bayramı arefesi');
  assert.ok(!liste.includes('sene-sonu'), 'sene sonu yalnızca Zilhicce’de');
});

test('Zilhicce’nin sonu senenin sonu duasını getirir', () => {
  assert.ok(idler(ctx(12, 30, 2)).includes('sene-sonu'));
});

test('Kurban bayramı gecesi bayram duasını getirir', () => {
  // 9 Zilhicce akşamı, yarın 10 Zilhicce → bayram gecesi + arefe
  const liste = idler(ctx(12, 9, 2, 12, 10));
  assert.ok(liste.includes('bayram-gecesi'));
  assert.ok(liste.includes('arefe'));
});

test('cuma günü cuma duası düşer, başka gün düşmez', () => {
  assert.ok(idler(ctx(4, 12, 5)).includes('cuma'));
  assert.ok(!idler(ctx(4, 11, 4)).includes('cuma'));
});

test('kuralı olmayan dua hiçbir güne düşmez', () => {
  for (let ay = 1; ay <= 12; ay++) {
    for (let gun = 1; gun <= 30; gun++) {
      for (let hafta = 0; hafta <= 6; hafta++) {
        assert.ok(!idler(ctx(ay, gun, hafta)).includes('salat-i-munciye'));
      }
    }
  }
});

test('bağlam yoksa boş liste döner', () => {
  assert.deepStrictEqual(bvDuaListesi(null), []);
  assert.ok(!bvDuaKuralUyar(null, ctx(1, 1, 1)));
  assert.ok(!bvDuaKuralUyar({ t: 'yok' }, ctx(1, 1, 1)));
});

/* ---------- ilk gün ---------- */

test('ay boyu süren dua yalnızca ayın ilk gününde ilk gün sayılır', () => {
  const recep = dua('recep');
  assert.ok(bvDuaIlkGunMu(recep, ctx(7, 1, 1), ctx(6, 30, 0)));
  assert.ok(!bvDuaIlkGunMu(recep, ctx(7, 2, 2), ctx(7, 1, 1)));
});

test('dün bağlamı verilmezse gün ilk gün sayılır', () => {
  assert.ok(bvDuaIlkGunMu(dua('recep'), ctx(7, 15, 1), null));
});

test('o güne düşmeyen dua ilk gün olamaz', () => {
  assert.ok(!bvDuaIlkGunMu(dua('recep'), ctx(8, 1, 1), ctx(7, 30, 0)));
});

/* ---------- veri sağlığı ---------- */

test('her duanın zorunlu alanları dolu', () => {
  const gorulen = new Set();
  BV_DUALAR.forEach(d => {
    assert.ok(d.id && !gorulen.has(d.id), 'id tekil olmalı: ' + d.id);
    gorulen.add(d.id);
    assert.ok(d.ad, d.id + ': ad');
    assert.ok(d.alt, d.id + ': alt');
    assert.ok(d.ikon, d.id + ': ikon');
    assert.ok(typeof d.sayfa === 'number' && d.sayfa > 0, d.id + ': sayfa');
    assert.ok(Array.isArray(d.ne), d.id + ': ne dizi olmalı');
    assert.ok(Array.isArray(d.metin) && d.metin.length, d.id + ': metin');
    assert.ok(Array.isArray(d.tarif), d.id + ': tarif dizi olmalı');
    // Her blokta meal şart; Arapça metin bazı bloklarda (yalnızca hadis olanlarda) olmayabilir.
    d.metin.forEach((b, i) => assert.ok(b.meal, d.id + ' blok ' + i + ': meal'));
  });
});

test('bildirim verecek duanın uyarı metni var', () => {
  BV_DUALAR.forEach(d => {
    if (d.bildir) assert.ok(d.uyari, d.id + ': uyari');
  });
});
