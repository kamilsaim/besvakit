/**
 * Diyanet ilçelerinin koordinatlarını OpenStreetMap Nominatim'den bir kerelik çeker,
 * vakitler/ilce-konum.json'a yazar: { "<ilçe id>": [enlem, boylam], ... }
 *
 * Neden: yerler.json'da ilçe koordinatı yok. GPS konumu bu yüzden yalnızca 81 il
 * merkezine eşlenebiliyordu; Develi'deki kullanıcı Kayseri merkezin takvimini görüyordu.
 *
 * Ayrı dosya: vakit-cek.mjs yerler.json'u yeniden yazsa da koordinatlar kalır.
 * Nominatim kuralı saniyede en çok 1 istek → sıralı, 1100 ms aralıkla (~16 dk).
 * Önceki çıktı varsa bulunanlar atlanır; yarıda kesilirse kaldığı yerden sürer.
 *
 * Kullanım: node araclar/ilce-koordinat.mjs
 */
import fs from 'fs/promises';

const YERLER = 'vakitler/yerler.json';
const CIKTI  = 'vakitler/ilce-konum.json';
const BEKLE  = 1100;
const AJAN   = 'besvakit/1.0 (+https://github.com/kamilsaim/besvakit)';

const bekle = ms => new Promise(r => setTimeout(r, ms));
const kucuk = s => s.toLocaleLowerCase('tr');
const sade = s => kucuk(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
const mesafeKm = (a, b, c, d) => {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

async function ara(q){
  const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=tr&q=' +
            encodeURIComponent(q);
  for(let deneme = 0; deneme < 3; deneme++){
    const r = await fetch(u, { headers: { 'User-Agent': AJAN, 'Accept-Language': 'tr' } });
    if(r.ok) return r.json();
    await bekle(5000 * (deneme + 1));
  }
  return [];
}

/** Sonuçlardan ilin içinde olanı seçer (adres alanlarında il adı geçmeli). */
function ildeki(sonuclar, il){
  const h = sade(il);
  return sonuclar.find(s => {
    const a = s.address || {};
    return [a.province, a.state, a.city, a.town].filter(Boolean).some(v => sade(v) === h);
  });
}

const yerler = JSON.parse(await fs.readFile(YERLER, 'utf8'));
const tr = yerler.find(u => String(u.id) === '2');
let cikti = {};
try{ cikti = JSON.parse(await fs.readFile(CIKTI, 'utf8')); }catch(e){}

const bulunamayan = [];
for(const il of tr.sehirler){
  // İl merkezi: önce il adının kendisi aranır, ilçeler bunun 200 km çevresinde olmalı.
  // Merkez ilçe (adı il adıyla aynı) önce işlenir.
  let merkez = null;
  const sirali = il.ilceler.slice().sort((a, b) => (sade(b.ad) === sade(il.ad)) - (sade(a.ad) === sade(il.ad)));
  for(const ilce of sirali){
    const merkezIlce = sade(ilce.ad) === sade(il.ad);
    if(cikti[ilce.id]){ if(merkezIlce) merkez = cikti[ilce.id]; continue; }
    const sorgular = merkezIlce ? [`${kucuk(il.ad)}`] : [`${kucuk(ilce.ad)}, ${kucuk(il.ad)}`, `${kucuk(ilce.ad)}`];
    let s = null;
    for(const q of sorgular){
      await bekle(BEKLE);
      s = ildeki(await ara(q), il.ad);
      if(s) break;
    }
    if(s && merkezIlce) merkez = [+s.lat, +s.lon];
    if(s && merkez && !merkezIlce && mesafeKm(merkez[0], merkez[1], +s.lat, +s.lon) > 200) s = null;
    if(!s){ bulunamayan.push(`${il.ad}/${ilce.ad} (${ilce.id})`); continue; }
    cikti[ilce.id] = [+(+s.lat).toFixed(4), +(+s.lon).toFixed(4)];
    console.log(il.ad, '/', ilce.ad, cikti[ilce.id].join(','));
  }
  await fs.writeFile(CIKTI, JSON.stringify(cikti));
}

console.log(`\n${Object.keys(cikti).length} ilçe yazıldı → ${CIKTI}`);
if(bulunamayan.length) console.log('Bulunamayan:\n' + bulunamayan.join('\n'));
