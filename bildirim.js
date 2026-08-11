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
