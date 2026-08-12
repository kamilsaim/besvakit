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
  // kerahat + ki: ki 0'dan başlar ve üst sınır index.html'deki KERAHAT
  // sabitinin uzunluğu kadardır (bugün 3). Kod bunu sınırlamaz — ki'nin
  // 60'ın altında kalması çağıranın sorumluluğudur, aksi halde kimlikler
  // bir sonraki günün 0-99 bloğuna taşıp çakışır.
  kerahat: 40
};

/** 'YYYY-MM-DD' + gece yarısından itibaren dakika -> yerel saatli Date.
 *  Kasıtlı olarak mutlak epoch aritmetiği kullanır: negatif dk değeri
 *  Date.getTime() üzerinden doğru şekilde bir önceki güne taşar (sahur gibi
 *  gece yarısını aşan durumlar için gerekli). Türkiye'de 2016'dan beri yaz
 *  saati uygulaması olmadığından DST sınırında saat kayması burada bir
 *  sorun teşkil etmez; bu davranış kasıtlıdır, değiştirilmemelidir. */
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

/** Dakika -> 'HH:MM'. index.html'deki saatYaz ile aynı biçim. */
function bvSaatYaz(dk) {
  const d = ((Math.round(dk) % 1440) + 1440) % 1440;
  const s = Math.floor(d / 60), m = d % 60;
  return (s < 10 ? '0' : '') + s + ':' + (m < 10 ? '0' : '') + m;
}

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
    if ((+v.once || 0) > 0) gunluk++;
  });

  if (ayar.kerahat) gunluk += (ayar.kerahatAraliklari || []).length;
  if ((ayar.ramazanGunleri || []).length) gunluk += 2;

  // Cuma haftada bir, bütçeyi kayda değer etkilemez — sayıma katılmaz.
  if (gunluk <= 0) return ayar.cuma ? BV_TAVAN_GUN : 0;

  return Math.max(BV_TABAN_GUN,
         Math.min(BV_TAVAN_GUN, Math.floor(BV_HEDEF_BILDIRIM / gunluk)));
}

function bildirimListesiUret(ayar, gunler, simdi) {
  if (!ayar || !ayar.acik || !gunler) return [];

  // Sözlük sıralaması yalnızca anahtarlar sıfır dolgulu 'YYYY-MM-DD' biçiminde
  // olduğu için tarih sırasıyla örtüşür.
  // Bugünün takvim gününden önceki günleri dilime girmeden eleriz, yoksa
  // geçmiş günler bütçeyi tüketip gelecekteki günlerden yer çalar.
  const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
  const anahtarlar = Object.keys(gunler).sort()
    .filter(gun => bvZaman(gun, 0).getTime() >= bugun.getTime())
    .slice(0, bvGunButcesi(ayar));
  const liste = [];

  anahtarlar.forEach((gun, gunSira) => {
    const vakitler = gunler[gun];
    if (!vakitler) return;

    BV_VAKIT_SIRA.forEach((k, i) => {
      const v = ayar.vakit && ayar.vakit[k];
      if (!v || !v.bildir) return;
      // 0, hesaplanamayan vakitler için widgetVeriYaz/bildirimGunTablosu'nun
      // yazdığı "eksik" işaretidir (bkz. index.html), gerçek gece yarısı değil.
      // Bu yüzden 0 da eksik sayılıp atlanmalı, aksi halde gece yarısı için
      // sahte bir bildirim planlanır.
      const dk = vakitler[i];
      if (!dk) return;

      liste.push({
        id: gunSira * 100 + BV_TUR.vakit + i,
        kanal: bvKanal('vakit', dk, ayar.sessiz),
        baslik: BV_BASLIK,
        govde: k === 'gunes'
          ? 'Güneş doğdu — sabah namazı vakti çıktı'
          : BV_VAKIT_AD[k] + ' vakti girdi',
        zaman: bvZaman(gun, dk)
      });

      // Vakit öncesi hatırlatma. Güneş için metin farklıdır: doğuş bir vaktin
      // başlangıcı değil, sabah namazı vaktinin son bulmasıdır — "güneş
      // vaktine kaldı" demek yanıltıcı olurdu.
      const once = +v.once || 0;
      if (once > 0) {
        liste.push({
          id: gunSira * 100 + BV_TUR.once + i,
          kanal: bvKanal('once', dk - once, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: k === 'gunes'
            ? 'Güneş doğuşuna ' + once + ' dakika kaldı — sabah namazı vakti çıkıyor'
            : BV_VAKIT_AD[k] + ' vaktine ' + once + ' dakika kaldı',
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

    // Cuma hatırlatması — haftada bir, kullanıcının belirlediği saatte.
    if (ayar.cuma) {
      const cumaDk = bvSaatDk(ayar.cumaSaat);
      const gunAdi = bvZaman(gun, 0).getDay();
      if (cumaDk !== null && gunAdi === 5) {
        // Öğle değeri eksikse (0/NaN/tanımsız) saat ekini metne katma —
        // hatırlatma yine de faydalı, ama uydurma bir saat göstermeyelim.
        const ogleDk = vakitler[BV_VAKIT_SIRA.indexOf('ogle')];
        liste.push({
          id: gunSira * 100 + BV_TUR.cuma,
          kanal: bvKanal('ozel', cumaDk, ayar.sessiz),
          baslik: BV_BASLIK,
          govde: 'Cuma namazı vakti yaklaşıyor' +
                 (ogleDk ? ' · öğle ' + bvSaatYaz(ogleDk) : ''),
          zaman: bvZaman(gun, cumaDk)
        });
      }
    }

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
  });

  return liste.filter(b => b.zaman.getTime() > simdi.getTime());
}

/* Hem tarayıcıda (script etiketiyle) hem Node'da (require ile) çalışsın. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bildirimListesiUret, bvGunButcesi, BV_TUR, BV_VAKIT_SIRA,
    bvZaman, bvSaatDk, bvSaatYaz, bvSessizMi, bvKanal
  };
}
