# Zikirmatiğin öne alınması ve cam bölüm kapsülleri — tasarım

**Tarih:** 2026-08-18

## Amaç

İki ayrı ama aynı dosyaya (`index.html`) dokunan görsel düzenleme:

1. **İbadet sayfasının sırası.** Zikirmatik şu an sayfanın ortasında, dört
   bölümün altında duruyor. En çok kullanılan bileşen olduğu için sayfanın en
   üstüne, "Bugünkü namazlar"ın yerine alınıyor.
2. **Bölüm ayrımı.** Ekranlarda bölümler yalnızca küçük punto bir başlıkla
   ayrılıyor; uzun sayfalarda (Ayarlar 8, İbadet 8 bölüm) nerede bittiği belli
   olmuyor. Her bölüm — başlığıyla birlikte — yarı saydam bir kapsülün içine
   alınıyor.

## Kapsam dışı

- **Kıble pusulasının sapması.** Ayrıca çalışıldı, mevcut hâli yeterli
  bulunuyor. Bu tasarımda pusulaya, `A.sapma`'ya veya manyetik sapma
  düzeltmesine dokunulmuyor.
- **Açılışta GPS izni.** `baslat()` içindeki `if(A.otoKonum) konumBul();`
  (`index.html:3875`) olduğu gibi kalıyor. Şehirler arası yolculukta kıble
  açısı 200 km'de ~7° kaydığı için açılıştaki tazeleme bilinçli olarak
  korunuyor; her açılışta izin sorulması bunun kabul edilen bedeli.
- Yeni bir bölüm, yeni bir işlev veya renk paletinde değişiklik yok. Bu tasarım
  yalnızca mevcut içeriğin sırasını ve çerçevesini değiştiriyor.

## 1. İbadet sayfasının sırası

`index.html:606-639` arasındaki blok bir bütün olarak `<section id="sayfa-ibadet">`
etiketinin hemen altına taşınır. Blok şunları kapsar:

- `Zikirmatik` başlığı
- `#setModuBtn` (namaz sonrası tesbih seti)
- `.zikir-sec-sar` (zikir seçici + `#zikirEkleBtn`)
- `#zikirEkleForm`
- `#tesbihZikir`, `.tesbih-sar`, geri/sıfırla `.btn-satir`
- `#zikirIstBaslik` + `#zikirIstKart` (Çekilen zikirler)
- `#zikirGunluk`

Taşıma sonrası sıra:

```
Zikirmatik
Çekilen zikirler
Bugünkü namazlar
Son 30 gün ve istatistik
Kaza namazı sayacı
Nasûh Tövbesi
Esmâ-ül Hüsnâ
Mübarek gün duaları
```

Esmâ-ül Hüsnâ ve Mübarek gün duaları okuma amaçlı arşivler olduğu için yerinde
bırakılıyor; yukarı taşınan yalnızca sayaç ve onun sayımı.

### JavaScript etkisi

Yok. Bölümdeki her eleman JS tarafından `id` ile bulunuyor (`$('#tesbihBtn')`,
`$('#zikirIstKart')`, `$('#zikirSec')` …); hiçbir yerde `nextElementSibling`,
`children[n]` gibi sıraya bağlı erişim kullanılmıyor. Bu, uygulama sırasında
doğrulanacak bir varsayım değil, kontrol edilmiş bir gerçektir — yine de
taşımadan sonra sayfanın elle denenmesi gerekir.

## 2. Cam bölüm kapsülleri

### Kapsam

Dört sayfadaki 27 bölümün tamamı:

| Sayfa | Bölüm sayısı |
|---|---|
| Vakitler (`#sayfa-vakit`) | 7 |
| Kıble (`#sayfa-kible`) | 4 |
| İbadet (`#sayfa-ibadet`) | 8 |
| Ayarlar (`#sayfa-ayar`) | 8 |

`<header id="gokyuzu">` (geri sayım kahramanı) ve `#tabbar` kapsam dışı — onlar
zaten kendi görsel dillerine sahip.

### Biçim

Yeni bir `.bolum` sınıfı; her bölümün başlığını ve içeriğini sarar:

```html
<div class="bolum">
  <div class="baslik">Bugünkü namazlar</div>
  <div class="ozet">…</div>
  <div class="kart" id="takipListe">…</div>
  <p class="bilgi">…</p>
</div>
```

Katlanır bölümlerde başlık bir `<button class="baslik">`; sarmalayıcı hem
butonu hem `aria-controls` ile işaret ettiği kartı içine alır. `aria-expanded`
ve `aria-controls` ilişkisi bozulmadığı için erişilebilirlik davranışı aynı
kalır.

Kapsül biçimi:

```css
.bolum{
  background:var(--cam);
  border:1px solid var(--cam-cizgi);
  border-radius:20px;
  box-shadow:inset 0 1px 0 var(--cam-parlak), 0 8px 26px rgba(0,0,0,.30);
  padding:12px 12px 14px;
  margin-bottom:12px;
}
.bolum .baslik{margin:2px 0 10px;padding-left:2px}
.bolum .baslik:first-child{margin-top:2px}
```

Mevcut `.baslik{margin:26px 0 10px}` ve `.baslik:first-child{margin-top:14px}`
kuralları bölümler arası boşluğu üretiyordu; kapsül geldiğinde bu görev
`.bolum`'un `margin-bottom`'ına geçtiği için kapsül içindeki başlığın üst
boşluğu sıfırlanır.

Kapsül içindeki `.kart` hafifler — yoksa "kart içinde kart" katmanlaşması
oluşur:

```css
.bolum .kart,
.bolum .ozet-kutu{
  background:var(--cam-ic);
  border-color:var(--cam-ic-cizgi);
}
```

### Tema başına renkler

Tek bir rgba değeri üç temada da çalışmaz; `:root` ve iki tema bloğuna ayrı
tanımlanır.

| Değişken | Koyu (varsayılan) | Açık (`data-tema=acik`) | AMOLED (`data-tema=amoled`) |
|---|---|---|---|
| `--cam` | `rgba(242,238,226,.05)` | `rgba(255,255,255,.55)` | `transparent` |
| `--cam-cizgi` | `rgba(242,238,226,.13)` | `rgba(24,48,45,.10)` | `rgba(242,238,226,.14)` |
| `--cam-parlak` | `rgba(242,238,226,.10)` | `rgba(255,255,255,.85)` | `transparent` |
| `--cam-ic` | `rgba(242,238,226,.05)` | `rgba(255,255,255,.75)` | `#0A0A0A` |
| `--cam-ic-cizgi` | `rgba(242,238,226,.10)` | `rgba(24,48,45,.08)` | `rgba(242,238,226,.12)` |

AMOLED'in tek amacı pikselleri söndürmek olduğu için orada kapsüle zemin
verilmiyor; bölüm yalnızca ince bir çerçeveyle ayrılır. Aynı sebeple
`--cam-parlak` da şeffaf, yani `inset` parlaklık çizgisi görünmez.

Açık temada gölge koyu temadaki kadar sert olmamalı; `.bolum`'un dış gölgesi
açık temada `0 4px 14px rgba(24,48,45,.08)` olarak yumuşatılır.

### `backdrop-filter` bilinçli olarak kullanılmıyor

Görsel mockup'ta `backdrop-filter: blur(16px)` vardı, uygulamada olmayacak.
Gerekçe: bulanıklaştırılacak bir arka plan yok. `<main>` içeriğinin arkasında
düz `var(--gece)` zemin var; yıldız animasyonu (`#yildizlar`) yalnızca
`<header>` içinde, bölümlerin arkasında değil. Blur bu koşulda görüntüye hiçbir
şey katmaz, buna karşılık 27 panelde her kaydırma karesinde GPU maliyeti
çıkarır ve eski telefonlarda takılmaya yol açar. Yarı saydam katmanlar aynı
görüntüyü bedelsiz üretir.

Bu karar arka plan düz kaldığı sürece geçerlidir. İleride bölümlerin arkasına
doku, fotoğraf veya hareketli bir öge konursa `backdrop-filter` yeniden
değerlendirilmelidir.

### Yedek davranış

Yok, gerekmiyor. Kullanılan özellikler (`rgba` zemin, `border-radius`,
`box-shadow`, CSS değişkenleri) uygulamanın hâlihazırda her yerde kullandığı,
evrensel desteğe sahip özellikler. `@supports` sorgusuna ihtiyaç duyulmaz.

## Doğrulama

Otomatik test yok — `araclar/` altındaki iki test (`bildirim.test.cjs`,
`dualar.test.cjs`) saf hesap fonksiyonlarını sınar, DOM'a bakmaz. Bu değişiklik
tamamen görsel olduğu için doğrulama elle yapılır:

1. Dört sayfa da açılır; her bölümün kapsül içinde ve tam olarak bir kez
   göründüğü, hiçbir başlığın kapsül dışında kalmadığı görülür.
2. Üç tema (koyu, açık, AMOLED) tek tek denenir; her birinde kapsül sınırı
   okunabilir, metin kontrastı korunuyor olmalı.
3. Katlanır bölümlerin (`#imsakiyeBaslik`, `#diniBaslik`, `#haritaBaslik`,
   `#camiBaslik`, `#istatistikBaslik`, `#kazaBaslik`, `#tovbeBaslik`,
   `#zikirIstBaslik`, `#esmaBaslik`, `#duaArsivBaslik`) açılıp kapanması
   denenir; kapsül yüksekliği içerikle birlikte değişmeli.
4. İbadet sayfasında zikirmatiğin en üstte olduğu, sayacın arttığı, zikir
   seçicinin ve "Çekilen zikirler" listesinin çalıştığı denenir.
5. Vakitler sayfasında konumlar arası kaydırmalı geçişin kapsüllerden
   etkilenmediği denenir.
6. Kaydırma akıcılığı gerçek bir telefonda kontrol edilir.

## Riskler

- **`.baslik` boşluk kuralları.** `margin:26px 0 10px` ve `:first-child`
  kuralı bugün sayfa ritmini kuran şey. Kapsül gelince bu iki kural yeni
  bağlamda tekrar ayarlanmazsa boşluklar iki katına çıkar. Uygulamada
  bölümler arası dikey ritmin göz kontrolü şart.
- **27 bölümü elle sarmak.** Mekanik ama hacimli bir düzenleme; bir kapsülün
  yanlış yerde kapanması komşu bölümü içine alır. Sayfa sayfa ilerlenmeli ve
  her sayfadan sonra tarayıcıda bakılmalı.
