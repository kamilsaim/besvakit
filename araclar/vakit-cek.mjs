/**
 * Diyanet namaz vakitlerini çekip depoya statik JSON olarak yazar.
 *
 * Neden böyle: uygulama doğrudan API'ye bağlanmıyor. GitHub Actions ayda bir
 * çalışıp veriyi depoya commit'liyor, GitHub Pages de statik dosya olarak
 * servis ediyor. Sonuç:
 *   - tarayıcıda anahtar/CORS/oran sınırı derdi yok
 *   - kaynak bir gün kapansa bile elimizdeki veri çalışmaya devam eder
 *   - kullanıcı başına istek yok, ayda bir toplu çekim var
 *
 * Kaynağı değiştirmek istersen yalnızca `kaynakVakitleri` fonksiyonunu
 * değiştirmen yeterli; gerisi aynı kalır.
 *
 * Kullanım:
 *   node araclar/vakit-cek.mjs            # tüm dünya
 *   node araclar/vakit-cek.mjs --ulke 2   # yalnızca Türkiye
 *   node araclar/vakit-cek.mjs --sinirli  # yalnızca Türkiye il merkezleri (hızlı deneme)
 */
import fs from 'fs/promises';
import path from 'path';

const KOK    = 'https://ezanvakti.emushaf.net';
const HEDEF  = 'vakitler';
/**
 * Kaynak HTTP 429 ile oran sınırlaması yapıyor ve `Retry-After` başlığı gönderiyor.
 * Ölçtüm: eş zamanlı 3 istekle 81 ilin 15'i düşüyor (75 kez 429). Sıralı ve
 * 1100 ms aralıkla 25/25 başarılı, hiç 429 yok. Bu yüzden bilinçli olarak
 * tek kanaldan ve yavaş çekiyoruz — bir kereye mahsus iş, acelesi yok.
 */
const ESZAMAN = 1;
const BEKLE   = 1100;                  // her istek arası ms
const AJAN   = 'besvakit/1.0 (+https://github.com/kamilsaim/besvakit)';

const arg = process.argv.slice(2);
const secUlke   = arg.includes('--ulke') ? arg[arg.indexOf('--ulke') + 1] : null;
const sinirliMi = arg.includes('--sinirli');

/* ---------------------------------------------------------------- yardımcılar */

/**
 * Boş dizi de başarısızlık sayılır: kaynak yoğunlukta 200 + [] döndürebiliyor.
 * Bunu geçerli kabul edersek bir il sessizce listeden düşer — ilk denemede
 * 81 ilin 51'i gelmesinin sebebi buydu.
 */
const uyu = ms => new Promise(r => setTimeout(r, ms));

async function al(yol, { bosGecerli = false, deneme = 8 } = {}) {
  for (let i = 0; i < deneme; i++) {
    try {
      const r = await fetch(KOK + yol, { headers: { 'User-Agent': AJAN } });

      if (r.status === 429) {
        // Sunucunun söylediği süreye uy; söylemediyse artan bekleme.
        const sn = parseInt(r.headers.get('retry-after') || '', 10);
        await uyu(Number.isFinite(sn) ? (sn + 1) * 1000 : 3000 * (i + 1));
        continue;
      }
      if (r.status === 404) return null;          // gerçekten yok, ısrar etme
      if (r.ok) {
        const veri = await r.json();
        if (bosGecerli || (Array.isArray(veri) && veri.length)) return veri;
      }
    } catch (e) { /* ağ hatası — yeniden dene */ }
    await uyu(1500 * (i + 1));
  }
  return null;
}

/** Eş zamanlı ama sınırlı: aynı anda en fazla `sinir` iş yürür. */
async function havuz(liste, sinir, is) {
  const sonuc = new Array(liste.length);
  let sira = 0;
  await Promise.all(Array.from({ length: Math.min(sinir, liste.length) }, async () => {
    while (sira < liste.length) {
      const i = sira++;
      sonuc[i] = await is(liste[i], i);
      if (BEKLE) await new Promise(r => setTimeout(r, BEKLE));
    }
  }));
  return sonuc;
}

const dk = s => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s || '').trim());
  return m ? (+m[1]) * 60 + (+m[2]) : null;
};
const isoTarih = s => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const gunFarki = (a, b) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

/* ---------------------------------------------------------------- kaynak */

/** Tek bir ilçenin ~1 aylık vakitlerini kaynaktan alır. Kaynağı değiştirmek için burayı değiştir. */
async function kaynakVakitleri(ilceId) {
  const ham = await al('/vakitler/' + ilceId);
  if (!Array.isArray(ham) || !ham.length) return null;

  const satirlar = [];
  for (const g of ham) {
    const t = isoTarih(g.MiladiTarihKisa);
    const v = [g.Imsak, g.Gunes, g.Ogle, g.Ikindi, g.Aksam, g.Yatsi].map(dk);
    if (!t || v.some(x => x === null)) continue;
    satirlar.push({ t, v });
  }
  if (!satirlar.length) return null;
  satirlar.sort((a, b) => a.t.localeCompare(b.t));

  // Günler ardışık olmalı; değilse boşluğu atlamak yerine kayıt bozuk sayılır.
  const bas = satirlar[0].t;
  const v = [];
  for (const s of satirlar) {
    const i = gunFarki(bas, s.t);
    if (i < 0 || i > 400) continue;
    v[i] = s.v;
  }
  for (let i = 0; i < v.length; i++) if (!v[i]) return { bas, v: v.slice(0, i) };
  return { bas, v };
}

/* ---------------------------------------------------------------- ana akış */

async function main() {
  await fs.mkdir(HEDEF, { recursive: true });
  const baslangic = Date.now();

  console.log('ülkeler alınıyor…');
  let ulkeler = (await al('/ulkeler')) || [];
  if (secUlke) ulkeler = ulkeler.filter(u => String(u.UlkeID) === String(secUlke));
  if (sinirliMi) ulkeler = ulkeler.filter(u => String(u.UlkeID) === '2');
  console.log('ülke sayısı:', ulkeler.length);

  console.log('şehirler alınıyor…');
  const sehirBloklari = await havuz(ulkeler, ESZAMAN, async u => ({
    ulke: u, sehirler: (await al('/sehirler/' + u.UlkeID)) || []
  }));

  // Şehir → ilçe listesi
  const sehirDuz = [];
  for (const b of sehirBloklari)
    for (const s of b.sehirler) sehirDuz.push({ ulke: b.ulke, sehir: s });
  console.log('şehir sayısı:', sehirDuz.length);

  console.log('ilçeler alınıyor…');
  const ilceBloklari = await havuz(sehirDuz, ESZAMAN, async x => ({
    ...x, ilceler: (await al('/ilceler/' + x.sehir.SehirID)) || []
  }));

  const ilcesizSehirler = ilceBloklari.filter(b => !b.ilceler.length);
  if (ilcesizSehirler.length)
    console.warn('ilce listesi alinamayan sehir:', ilcesizSehirler.length,
                 ilcesizSehirler.slice(0, 10).map(b => b.sehir.SehirAdi).join(', '));

  let hedefIlceler = [];
  for (const b of ilceBloklari)
    for (const i of b.ilceler)
      hedefIlceler.push({ ulke: b.ulke, sehir: b.sehir, ilce: i });

  if (sinirliMi) {
    // il merkezleri: adı ile aynı olan ilçe, yoksa ilki
    const esle = s => s.replace(/İ/g, 'I').replace(/ı/g, 'i').toUpperCase();
    const secili = [];
    for (const b of ilceBloklari) {
      const m = b.ilceler.find(i => esle(i.IlceAdi) === esle(b.sehir.SehirAdi)) || b.ilceler[0];
      if (m) secili.push({ ulke: b.ulke, sehir: b.sehir, ilce: m });
    }
    hedefIlceler = secili;
  }
  console.log('çekilecek ilçe sayısı:', hedefIlceler.length);

  /* --- yerler dizini: ülke → şehir → ilçe ağacı (uygulama şehir seçimi için) --- */
  const yerler = sehirBloklari.map(b => ({
    id: b.ulke.UlkeID, ad: b.ulke.UlkeAdi, adEn: b.ulke.UlkeAdiEn,
    sehirler: b.sehirler.map(s => {
      const blok = ilceBloklari.find(x => x.sehir.SehirID === s.SehirID);
      return {
        id: s.SehirID, ad: s.SehirAdi,
        ilceler: (blok ? blok.ilceler : []).map(i => ({ id: i.IlceID, ad: i.IlceAdi }))
      };
    })
  }));
  await fs.writeFile(path.join(HEDEF, 'yerler.json'), JSON.stringify(yerler));
  console.log('yerler.json yazıldı');

  /* --- vakitler --- */
  let basarili = 0, bos = 0;
  const basarisizlar = [];
  const dizin = {};
  await havuz(hedefIlceler, ESZAMAN, async (x, i) => {
    const v = await kaynakVakitleri(x.ilce.IlceID);
    if (!v || !v.v.length) { bos++; basarisizlar.push(x.ilce.IlceAdi + ' (' + x.ilce.IlceID + ')'); return; }
    const kayit = {
      ilce: x.ilce.IlceID, ad: x.ilce.IlceAdi,
      il: x.sehir.SehirAdi, ulke: x.ulke.UlkeAdi,
      cekim: new Date().toISOString().slice(0, 10),
      bas: v.bas, v: v.v
    };
    await fs.writeFile(path.join(HEDEF, x.ilce.IlceID + '.json'), JSON.stringify(kayit));
    dizin[x.ilce.IlceID] = { ad: x.ilce.IlceAdi, il: x.sehir.SehirAdi, ulke: x.ulke.UlkeAdi,
                             bas: v.bas, n: v.v.length };
    basarili++;
    if (basarili % 200 === 0) console.log('  …', basarili, '/', hedefIlceler.length);
  });

  await fs.writeFile(path.join(HEDEF, 'dizin.json'), JSON.stringify({
    cekim: new Date().toISOString(),
    kaynak: KOK,
    ilceSayisi: basarili,
    ilceler: dizin
  }));

  const sn = ((Date.now() - baslangic) / 1000).toFixed(0);
  console.log(`\nbitti: ${basarili} ilçe yazıldı, ${bos} boş döndü, ${sn} sn`);
  if (basarili === 0) { console.error('HİÇ VERİ ALINAMADI — çıkış kodu 1'); process.exit(1); }
}

main().catch(e => { console.error('hata:', e); process.exit(1); });
