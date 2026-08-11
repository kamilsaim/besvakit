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
        kanal: bvKanal('vakit', dk, ayar.sessiz),
        baslik: BV_BASLIK,
        govde: k === 'gunes'
          ? 'Güneş doğdu — sabah namazı vakti çıktı'
          : BV_VAKIT_AD[k] + ' vakti girdi',
        zaman: bvZaman(gun, dk)
      });

      // Vakit öncesi hatırlatma — güneş doğuşu için anlamsız, atlanır.
      const once = +v.once || 0;
      if (once > 0 && k !== 'gunes') {
        liste.push({
          id: gunSira * 100 + BV_TUR.once + i,
          kanal: bvKanal('once', dk - once, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: BV_VAKIT_AD[k] + ' vaktine ' + once + ' dakika kaldı',
          zaman: bvZaman(gun, dk - once)
        });
      }
    });

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
  });

  return liste.filter(b => b.zaman.getTime() > simdi.getTime());
}

/* Hem tarayıcıda (script etiketiyle) hem Node'da (require ile) çalışsın. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bildirimListesiUret, BV_TUR, BV_VAKIT_SIRA,
    bvZaman, bvSaatDk, bvSessizMi, bvKanal
  };
}
