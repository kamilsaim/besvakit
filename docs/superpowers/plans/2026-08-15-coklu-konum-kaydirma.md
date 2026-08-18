# Çoklu Konum ve Kaydırmalı Geçiş Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcının birden fazla konum (şehir) ekleyip vakitler sayfasında sağa/sola kaydırarak bu konumlar arasında geçiş yapabilmesi.

**Architecture:** Tek dosyalı vanilla JS uygulaması (`index.html`). Konuma özel alanlar (`sehir, lat, lng, rakim, otoKonum, resmi, resmiIl, ilce`) `A` kökünde **aynı isimlerle, "aktif konumun aynası" olarak kalır** — bütün mevcut hesap/harita/kıble/RESMI kodu değişmeden çalışmaya devam eder. Yeni eklenen `A.konumlar` (dizi) ve `A.aktifKonum` (index) bu aynanın kaynağıdır; `kaydet()` her çağrıldığında aynayı aktif dizinin elemanına yazar. Konum değiştirmek (kaydırma veya Ayarlar'dan seçme) aynayı dizinin başka bir elemanından tazeler ve mevcut `gunuTazele()` boru hattını yeniden çalıştırır.

**Tech Stack:** Vanilla JS, CSS, localStorage. Yeni bağımlılık yok.

**Test yaklaşımı:** Bu dosyada DOM'a bağlı olmayan, `node --test` ile izole edilebilir bir katman yok (`araclar/*.test.cjs` yalnızca `dualar.js`/`bildirim.js` gibi ayrı, saf modülleri test ediyor — konum mantığı `index.html` içinde DOM ve `localStorage`'a bağlı). Bu yüzden her görev otomatik test yerine **tarayıcıda manuel doğrulama adımı** içerir: `npx serve` (veya `python -m http.server`) ile yerel sunucu açılır, `http://localhost:PORT` tarayıcıda gezilir, DevTools konsolunda ara durumlar `A` objesi üzerinden kontrol edilir.

---

### Task 1: Veri modeli — `A.konumlar` dizisi, göç ve senkron yardımcıları

**Files:**
- Modify: `index.html:895-948` (VARSAYILAN, yukle, kaydet)

- [ ] **Step 1: `VARSAYILAN`'a yeni alanları ekle**

`index.html:906` civarındaki satırın hemen altına (`resmi:true, ilce:'9620', resmiIl:'546',` satırından sonra) ekle:

```js
  resmi:true, ilce:'9620', resmiIl:'546',   // varsayılan şehir Kayseri ile tutarlı
  konumlar:null, aktifKonum:0,
```

- [ ] **Step 2: Göç ve senkron yardımcılarını ekle**

`index.html:914-923` bloğunu (mevcut `let A = yukle();` ve `function yukle(){...}`) şu şekilde değiştir:

```js
let A = yukle();
function yukle(){
  try{
    const h = JSON.parse(localStorage.getItem('besvakit') || '{}');
    const a = Object.assign({}, VARSAYILAN, h,
      { duzeltme:Object.assign({}, VARSAYILAN.duzeltme, h.duzeltme||{}) });
    a.bildirim = bildirimSemasiniTasi(h.bildirim, h.onceden);
    delete a.onceden;
    konumlariGoc(a);
    return a;
  }catch(e){
    const a = JSON.parse(JSON.stringify(VARSAYILAN));
    konumlariGoc(a);
    return a;
  }
}

/* Eski şemada konum tek elemandı (A.sehir/lat/lng/...). Yeni şemada
   A.konumlar dizisi kaynak; yoksa eski tekil alanlardan tek elemanlı
   dizi kurulur, kullanıcı veri kaybetmez. */
const KONUM_ALANLARI = ['sehir','lat','lng','rakim','otoKonum','resmi','resmiIl','ilce'];
function konumlariGoc(a){
  if(Array.isArray(a.konumlar) && a.konumlar.length) return;
  const k = {};
  KONUM_ALANLARI.forEach(f => k[f] = a[f]);
  a.konumlar = [k];
  a.aktifKonum = 0;
}
/* A.sehir/lat/lng/... "aktif konumun aynası": tüm mevcut hesap/harita/
   kıble kodu bu alanları okumaya devam eder, değişmez. kaydet() her
   çağrıldığında ayna aktif diziye yazılır. */
function konumSenkronla(){
  const k = A.konumlar[A.aktifKonum];
  if(!k) return;
  KONUM_ALANLARI.forEach(f => k[f] = A[f]);
}
/* Aynayı dizinin idx'inci elemanından tazeler — A.aktifKonum de günceller.
   kaydet() ÇAĞIRMAZ, çağıran taraf çağırmalı. */
function konumSec(idx){
  const k = A.konumlar[idx];
  if(!k) return;
  A.aktifKonum = idx;
  KONUM_ALANLARI.forEach(f => A[f] = k[f]);
}
```

- [ ] **Step 3: `kaydet()`'i aynayı senkronlayacak şekilde güncelle**

`index.html:948` satırını değiştir:

```js
function kaydet(){ try{ localStorage.setItem('besvakit', JSON.stringify(A)); }catch(e){} }
```

şu şekilde olsun:

```js
function kaydet(){ konumSenkronla(); try{ localStorage.setItem('besvakit', JSON.stringify(A)); }catch(e){} }
```

- [ ] **Step 4: Manuel doğrulama — göç**

Yerel sunucuyu başlat ve tarayıcıda aç:

```bash
npx serve "E:/Diğer bilgisayarlar/Bilgisayarım/claude programlar/besvakit" -l 8080
```

DevTools konsolunda çalıştır:

```js
localStorage.setItem('besvakit', JSON.stringify({sehir:'İzmir', lat:38.42, lng:27.14, rakim:25, otoKonum:false, resmi:true, ilce:'9620', resmiIl:'546', tema:'koyu'}));
location.reload();
```

Sayfa yeniden yüklendikten sonra konsolda:

```js
A.konumlar
```

Beklenen: `[{sehir:'İzmir', lat:38.42, lng:27.14, rakim:25, otoKonum:false, resmi:true, ilce:'9620', resmiIl:'546'}]`, `A.aktifKonum === 0`, ve vakitler sayfası hâlâ İzmir için doğru gösteriyor (regresyon yok).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Konum verisi icin A.konumlar dizisi, gocu ve senkron yardimcilari"
```

---

### Task 2: GPS her zaman 0. sırada sabit kalsın

**Files:**
- Modify: `index.html:3519-3534` (`konumBul`)

- [ ] **Step 1: `konumBul`'u güncelle**

Mevcut:

```js
function konumBul(){
  if(!navigator.geolocation){ toast('Cihaz konum desteklemiyor'); return; }
  toast('Konum alınıyor…');
  navigator.geolocation.getCurrentPosition(p=>{
    A.lat = +p.coords.latitude.toFixed(5);
    A.lng = +p.coords.longitude.toFixed(5);
    if(p.coords.altitude != null) A.rakim = Math.max(0, Math.round(p.coords.altitude));
    A.otoKonum = true; A.sehir = 'Konumum';
    const y = SEHIRLER.slice(1).map(s=>[s[0], mesafeKm(A.lat,A.lng,s[1],s[2])]).sort((a,b)=>a[1]-b[1])[0];
    if(y && y[1] < 60) A.sehir = y[0];
    kaydet(); alanlariDoldur(); gunuTazele(); toast(A.sehir + ' · konum güncellendi');
    ilceEslestir(A.sehir);
  }, err=>{
    toast('Konum alınamadı — şehri elle seçebilirsin');
  }, { enableHighAccuracy:true, timeout:12000, maximumAge:60000 });
}
```

Yerine:

```js
/* GPS konumu her zaman A.konumlar[0]'da durur — tasarım gereği "sabit ana
   konum". 0. sırada zaten GPS yoksa oraya yeni bir eleman eklenir (5 sınırı
   aşılırsa son eleman düşer); varsa yerinde güncellenir. */
function gpsYuvasiniHazirla(){
  if(A.konumlar[0] && A.konumlar[0].otoKonum) return;
  A.konumlar.unshift({ sehir:'Konumum', lat:A.lat, lng:A.lng, rakim:A.rakim,
                        otoKonum:true, resmi:A.resmi, resmiIl:null, ilce:null });
  if(A.konumlar.length > 5) A.konumlar.pop();
}
function konumBul(){
  if(!navigator.geolocation){ toast('Cihaz konum desteklemiyor'); return; }
  toast('Konum alınıyor…');
  navigator.geolocation.getCurrentPosition(p=>{
    gpsYuvasiniHazirla();
    A.aktifKonum = 0;
    A.lat = +p.coords.latitude.toFixed(5);
    A.lng = +p.coords.longitude.toFixed(5);
    if(p.coords.altitude != null) A.rakim = Math.max(0, Math.round(p.coords.altitude));
    A.otoKonum = true; A.sehir = 'Konumum';
    const y = SEHIRLER.slice(1).map(s=>[s[0], mesafeKm(A.lat,A.lng,s[1],s[2])]).sort((a,b)=>a[1]-b[1])[0];
    if(y && y[1] < 60) A.sehir = y[0];
    kaydet(); alanlariDoldur(); gunuTazele(); toast(A.sehir + ' · konum güncellendi');
    ilceEslestir(A.sehir);
    if(typeof konumlariCiz === 'function') konumlariCiz();
  }, err=>{
    toast('Konum alınamadı — şehri elle seçebilirsin');
  }, { enableHighAccuracy:true, timeout:12000, maximumAge:60000 });
}
```

(`konumlariCiz` Task 3'te tanımlanacak; `typeof` kontrolü tanım sırası
bağımsız çalışsın diye.)

- [ ] **Step 2: Manuel doğrulama**

Tarayıcıda konum izni ver (veya DevTools > Sensors > Location ile sahte
konum ver), Ayarlar > Konum > "Konumumu bul" butonuna bas. Konsolda:

```js
A.konumlar[0].otoKonum   // true
A.aktifKonum              // 0
A.konumlar.length         // önceki uzunluk + (GPS yeni eklendiyse 1, yoksa aynı)
```

Tekrar basınca `A.konumlar.length` artmamalı (yerinde güncellenmeli).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "GPS konumu her zaman konumlar dizisinin 0. sirasinda sabit tutulur"
```

---

### Task 3: Ayarlar — "Konumlarım" kartı (ekle / sil / sırala / seç)

**Files:**
- Modify: `index.html:634-636` (HTML — yeni kart, mevcut "Konum" kartından önce)
- Modify: `index.html` `<style>` bloğu (yeni CSS — `.konum-satir` vb., `.ozet` kuralının hemen üstüne eklenecek, satır ~262 civarı)
- Modify: `index.html:3289-3313` (`ayarlariKur` — yeni kartı kur çağrısı)
- Modify: `index.html:3455-3479` (`ilceEslestir` — davranış değişmiyor, referans için)

- [ ] **Step 1: HTML — yeni kart**

`index.html:634-636`:

```html
  <!-- AYARLAR -->
  <section class="sayfa" id="sayfa-ayar">
    <div class="baslik">Konum</div>
```

şu şekilde olsun (yeni kart araya girer):

```html
  <!-- AYARLAR -->
  <section class="sayfa" id="sayfa-ayar">
    <div class="baslik">Konumlarım</div>
    <div class="kart" id="konumlarKart">
      <div id="konumListe"></div>
      <div class="alan">
        <label>Konum ekle<em>En fazla 5 konum</em></label>
        <select id="konumEkleSec"><option value="">Seç…</option></select>
      </div>
    </div>
    <p class="bilgi">Bildirimler yalnızca en üstteki konuma göre gelir. Diğer
      konumlar vakitler sayfasında kaydırarak bakmak içindir.</p>

    <div class="baslik">Konum</div>
```

- [ ] **Step 2: CSS — satır görünümü**

`index.html` içindeki `.ozet{display:grid;...}` kuralının hemen üstüne (bkz.
`/* ---------- ibadet: namaz takibi ---------- */` başlığından önce) ekle:

```css
/* konumlarım listesi */
.konum-satir{display:flex;align-items:center;gap:8px;padding:12px 16px;
  border-bottom:1px solid var(--cizgi);cursor:pointer}
.konum-satir:last-child{border-bottom:0}
.konum-satir.aktif{background:linear-gradient(90deg,rgba(216,169,60,.14),transparent)}
.konum-satir-ad{flex:1;font-weight:600;font-size:14px;letter-spacing:.01em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.konum-satir.aktif .konum-satir-ad{color:var(--pirinc)}
.konum-satir-ok{display:flex;gap:4px;flex:none}
.konum-satir-ok button{width:28px;height:28px;border-radius:8px;font-size:13px;
  color:var(--hayalet);background:var(--kat2)}
.konum-satir-ok button:disabled{opacity:.3}
.konum-satir-ok .konum-sil{color:var(--gul)}
```

- [ ] **Step 3: JS — liste çizimi, ekleme, silme, sıralama, seçme**

`index.html:3405` civarına (`ayarlariKur` fonksiyonundan hemen sonra, `/*
---------- il / ilçe seçimi ---------- */` başlığından önce) yeni fonksiyonları
ekle:

```js
/* ---------- konumlarım ---------- */
function konumlariCiz(){
  const el = $('#konumListe');
  if(!el) return;
  el.innerHTML = A.konumlar.map((k,i)=>`
    <div class="konum-satir ${i===A.aktifKonum?'aktif':''}" data-i="${i}">
      <span class="konum-satir-ad">${k.otoKonum ? '📍 ' : ''}${k.sehir}</span>
      <div class="konum-satir-ok">
        <button class="konum-yon" data-yon="-1" data-i="${i}" ${i===0?'disabled':''} aria-label="Yukarı taşı">↑</button>
        <button class="konum-yon" data-yon="1" data-i="${i}" ${i===A.konumlar.length-1?'disabled':''} aria-label="Aşağı taşı">↓</button>
        ${!k.otoKonum && A.konumlar.length>1 ? `<button class="konum-sil" data-i="${i}" aria-label="Sil">✕</button>` : ''}
      </div>
    </div>`).join('');
  $$('.konum-satir').forEach(satir => satir.onclick = e=>{
    if(e.target.closest('button')) return;
    konumAktifYap(+satir.dataset.i);
  });
  $$('.konum-yon').forEach(b => b.onclick = e=>{
    e.stopPropagation(); konumTasi(+b.dataset.i, +b.dataset.yon);
  });
  $$('.konum-sil').forEach(b => b.onclick = e=>{
    e.stopPropagation(); konumSil(+b.dataset.i);
  });

  const sec = $('#konumEkleSec');
  if(sec){
    sec.innerHTML = '<option value="">Seç…</option>' +
      SEHIRLER.slice(1).map(s=>`<option value="${s[0]}">${s[0]}</option>`).join('');
    sec.disabled = A.konumlar.length >= 5;
    sec.onchange = ()=>{ if(sec.value){ konumEkle(sec.value); sec.value=''; } };
  }
  konumNoktalariCiz();
}
function konumEkle(sehirAdi){
  if(A.konumlar.length >= 5){ toast('En fazla 5 konum eklenebilir'); return; }
  const s = SEHIRLER.find(x=>x[0]===sehirAdi);
  if(!s || !s[1]) return;
  A.konumlar.push({ sehir:s[0], lat:s[1], lng:s[2], rakim:s[3],
                     otoKonum:false, resmi:A.resmi, resmiIl:null, ilce:null });
  konumAktifYap(A.konumlar.length - 1);
  ilceEslestir(s[0]);
  toast(s[0] + ' eklendi');
}
function konumSil(idx){
  if(A.konumlar.length <= 1) return;
  if(A.konumlar[idx].otoKonum) return;
  A.konumlar.splice(idx, 1);
  if(A.aktifKonum >= A.konumlar.length) A.aktifKonum = A.konumlar.length - 1;
  else if(A.aktifKonum > idx) A.aktifKonum--;
  konumSec(A.aktifKonum);
  kaydet();
  RESMI = null;
  resmiYukle().then(()=>{ alanlariDoldur(); gunuTazele(); konumlariCiz(); });
}
function konumTasi(idx, yon){
  const j = idx + yon;
  if(j < 0 || j >= A.konumlar.length) return;
  [A.konumlar[idx], A.konumlar[j]] = [A.konumlar[j], A.konumlar[idx]];
  if(A.aktifKonum === idx) A.aktifKonum = j;
  else if(A.aktifKonum === j) A.aktifKonum = idx;
  kaydet();
  konumlariCiz();
}
async function konumAktifYap(idx){
  if(idx === A.aktifKonum || !A.konumlar[idx]) return;
  konumSec(idx);
  kaydet();
  RESMI = null;
  await resmiYukle();
  alanlariDoldur();
  gunuTazele();
  konumlariCiz();
}
```

- [ ] **Step 4: `ayarlariKur()` içinde listeyi kur**

`index.html:3403` satırındaki (`ayarlariKur` fonksiyonunun sonu):

```js
  alanlariDoldur();
}
```

şu şekilde olsun:

```js
  alanlariDoldur();
  konumlariCiz();
}
```

- [ ] **Step 5: Manuel doğrulama**

Tarayıcıda Ayarlar sekmesini aç. Kontrol listesi:
- Tek konumla: "Konumlarım" kartında tek satır var, sil butonu yok, ↑/↓ pasif.
- "Konum ekle"den bir şehir seç → yeni satır eklenir, o satır otomatik aktif
  olur (`aktif` sınıfı, altın renk), vakitler sayfası o şehre geçer.
- 5 konuma ulaşınca "Konum ekle" seçtirilemez hale gelir (`disabled`).
- Bir satıra dokununca (buton dışına) o konum aktif olur, vakitler sayfası
  güncellenir.
- ↑/↓ ile sıra değişir, aktif konum takip eder (yanlış satır aktif kalmaz).
- ✕ ile silme: en az 1 konum kalana kadar çalışır, son konum silinemez, GPS
  satırında ✕ hiç görünmez.
- GPS ile konum bulunca (Task 2) "Konumlarım" listesi otomatik güncellenir
  ve 📍 ikonuyla en üstte görünür.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Ayarlar sayfasina Konumlarim karti: ekle, sil, sirala, sec"
```

---

### Task 4: Vakitler sayfasında kaydırmalı geçiş ve nokta göstergesi

**Files:**
- Modify: `index.html:454-458` (HTML — `#gokyuzu` içine nokta göstergesi)
- Modify: `index.html` `<style>` bloğu (yeni CSS — `.serit-kerahat` kuralının hemen altına, satır ~136 civarı)
- Modify: `index.html:2815-2834` (`gunuTazele` — nokta göstergesini tazele)
- Modify: `index.html:3560-3565` (`baslat` — kaydırma dinleyicisini kur)

- [ ] **Step 1: HTML — nokta göstergesi**

`index.html:454-458`:

```html
  <div class="serit" id="serit">
    <div class="serit-hat"></div>
    <div class="serit-gecen" id="seritGecen"></div>
    <div class="serit-simdi" id="seritSimdi"></div>
  </div>
</header>
```

şu şekilde olsun:

```html
  <div class="serit" id="serit">
    <div class="serit-hat"></div>
    <div class="serit-gecen" id="seritGecen"></div>
    <div class="serit-simdi" id="seritSimdi"></div>
  </div>
  <div class="konum-noktalar gizli" id="konumNoktalar"></div>
</header>
```

- [ ] **Step 2: CSS — nokta göstergesi**

`.serit-kerahat{...}` kuralının hemen altına ekle (satır ~136):

```css
.konum-noktalar{position:relative;z-index:2;display:flex;justify-content:center;
  gap:6px;margin-top:14px}
.konum-noktalar.gizli{display:none}
.konum-noktalar i{width:6px;height:6px;border-radius:50%;background:var(--hayalet);
  transition:background .25s,transform .25s}
.konum-noktalar i.aktif{background:var(--pirinc);transform:scale(1.3)}
```

- [ ] **Step 3: JS — nokta göstergesini çizen fonksiyon ve kaydırma dinleyicisi**

`index.html:3405` civarında Task 3'te eklenen `konumlariCiz()`'in hemen
üstüne (veya altına) ekle:

```js
function konumNoktalariCiz(){
  const el = $('#konumNoktalar');
  if(!el) return;
  if(A.konumlar.length <= 1){ el.classList.add('gizli'); el.innerHTML=''; return; }
  el.classList.remove('gizli');
  el.innerHTML = A.konumlar.map((_,i)=>`<i class="${i===A.aktifKonum?'aktif':''}"></i>`).join('');
}

/* Vakitler sayfasında (#gokyuzu + #sayfa-vakit) yatay kaydırma ile konum
   değiştirme. Dikey scroll ile çakışmasın diye ilk hareketin açısına
   bakılır: yatay hareket dikeyden belirgin büyükse kaydırma kabul edilir. */
function kaydirmaKur(){
  let x0=0, y0=0, dx=0, yatay=false, aktifDokunma=false;
  function baslasin(e){
    if(A.konumlar.length <= 1) return;
    if(!$('#sayfa-vakit').classList.contains('acik')) return;
    const t = e.touches[0];
    x0 = t.clientX; y0 = t.clientY; dx = 0; yatay = false; aktifDokunma = true;
  }
  function devam(e){
    if(!aktifDokunma) return;
    const t = e.touches[0];
    dx = t.clientX - x0;
    const dy = t.clientY - y0;
    if(!yatay && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) yatay = true;
    if(yatay) e.preventDefault();
  }
  function bitsin(){
    if(!aktifDokunma) return;
    aktifDokunma = false;
    if(!yatay) return;
    const ESIK = 60;
    if(dx <= -ESIK && A.aktifKonum < A.konumlar.length - 1) konumAktifYap(A.aktifKonum + 1);
    else if(dx >= ESIK && A.aktifKonum > 0) konumAktifYap(A.aktifKonum - 1);
  }
  ['gokyuzu','sayfa-vakit'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('touchstart', baslasin, {passive:true});
    el.addEventListener('touchmove', devam, {passive:false});
    el.addEventListener('touchend', bitsin);
    el.addEventListener('touchcancel', ()=>{ aktifDokunma = false; });
  });
}
```

- [ ] **Step 4: `gunuTazele()` içinde nokta göstergesini tazele**

`index.html:2819` satırı:

```js
  $('#konumAd').textContent = A.sehir;
```

şu şekilde olsun:

```js
  $('#konumAd').textContent = A.sehir;
  konumNoktalariCiz();
```

- [ ] **Step 5: `baslat()` içinde kaydırmayı kur**

`index.html:3565` satırındaki (`ayarlariKur();`'dan hemen sonra):

```js
  ayarlariKur();
```

şu şekilde olsun:

```js
  ayarlariKur();
  kaydirmaKur();
```

- [ ] **Step 6: Manuel doğrulama — mobil görünüm**

Chrome DevTools'ta cihaz taklidi (Ctrl+Shift+M) ile dokunmatik girişi aç,
telefon boyutunda test et (gerçek cihazda da denenmeli — touch olayları
emülatörde tam birebir değil):

- Tek konumla: nokta göstergesi görünmez, kaydırma hiçbir şey yapmaz, dikey
  scroll (sayfanın kendi kaydırması) etkilenmez.
- 2+ konum eklenince: nokta göstergesi görünür, `#gokyuzu` veya
  `#sayfa-vakit` üzerinde sola kaydırınca sonraki konuma, sağa kaydırınca
  önceki konuma geçilir, aktif nokta değişir.
- İlk konumda sağa, son konumda sola kaydırma hiçbir şey yapmamalı (sınırda
  döngüye girmemeli).
- Dikey kaydırma (sayfayı yukarı/aşağı kaydırma) konum değiştirmemeli —
  yalnızca belirgin şekilde yatay hareket konum değiştirmeli.
- Konum değiştikten sonra geri sayım, vakit listesi, imsakiye, kerahat,
  ramazan/cuma/dua kutuları yeni konuma göre güncellenmiş olmalı.
- Kaydırma yalnızca "Vakitler" sekmesi açıkken çalışmalı; Kıble/İbadet/Ayarlar
  sekmelerinde `#gokyuzu` üzerinde yatay kaydırma bir şey yapmamalı.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Vakitler sayfasinda konumlar arasi kaydirmali gecis ve nokta gostergesi"
```

---

### Task 5: Uçtan uca manuel doğrulama ve sürüm notu

**Files:**
- Modify: `README.md` (sürüm notu — mevcut dosyanın üst kısmındaki sürüm
  geçmişi deseni takip edilir, önceki commit'lerdeki "0.14.0" gibi girdilere
  bakılarak yeni bir madde eklenir)

- [ ] **Step 1: Tam senaryo testi**

Yerel sunucuda, gerçek bir mobil tarayıcıda (veya DevTools cihaz taklidi +
gerçek dokunmatik ekranlı bir cihazda) baştan sona:

1. Uygulamayı temiz `localStorage` ile aç (DevTools > Application >
   Local Storage > sil), varsayılan tek konum (Kayseri) ile açılmalı.
2. GPS izni ver → `A.konumlar[0].otoKonum === true`, tek konum, kaydırma
   göstergesi yok.
3. Ayarlar > Konumlarım'dan 2 şehir daha ekle (toplam 3) → nokta göstergesi
   3 nokta gösterir.
4. Vakitler sayfasında sağa/sola kaydır → 3 konum arasında sırayla geçilir,
   her birinde vakitler/imsakiye/hicri tarih doğru şehre ait.
5. Ayarlar'dan sırayı değiştir (↑/↓), bir konumu sil → liste ve nokta
   göstergesi tutarlı kalır, aktif konum kaybolmaz.
6. Uygulamayı kapatıp yeniden aç (sayfayı yenile) → en son bakılan konum
   (`A.aktifKonum`) korunmuş olmalı.
7. Bildirimleri kontrol et (APK/Capacitor ortamı yoksa tarayıcı bildirim
   izniyle): hangi konumda olunursa olunsun sadece `A.konumlar[0]`'a göre
   zamanlanmalı — Ayarlar > Bildirim ayarlarını değiştirmeden, 2. veya 3.
   konumdayken de bunu doğrula (konsolda `bildirimKur` çağrısının hangi
   `A.lat/A.lng` ile çalıştığına bakmak yerine, aktif konumu 2. sıraya
   alıp `A.konumlar[0]` ile karşılaştır — ikisi farklıysa ve bildirim
   saatleri hâlâ 0. konumun vaktine göre hesaplanıyorsa doğru).
8. Ekranı aşağı doğru elastik kaydır (üstten fazladan çek) → boşluk
   oluşmamalı (önceki commit'teki düzeltme, regresyon kontrolü).

- [ ] **Step 2: Sürüm notunu güncelle**

`README.md`'deki sürüm tablosuna/geçmişine (dosyanın mevcut deseni neyse —
önce oku) yeni satırı ekle: çoklu konum ve kaydırmalı geçiş özelliği.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "README: coklu konum ve kaydirma ozelligi surum notu"
```
