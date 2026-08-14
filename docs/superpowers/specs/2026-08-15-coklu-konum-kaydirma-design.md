# Çoklu konum ve kaydırmalı geçiş — tasarım

**Tarih:** 2026-08-15

## Amaç

Şu an uygulamada tek bir aktif konum var: `A` objesi üzerinde `sehir, lat, lng,
rakim, otoKonum, resmi, resmiIl, ilce` doğrudan tekil alanlar olarak duruyor.
Kullanıcı birden fazla şehir/konum ekleyip (ör. yaşadığı şehir + memleketi +
sık gittiği bir yer) vakitler sayfasında sağa/sola kaydırarak bu konumlar
arasında geçiş yapabilmek istiyor.

## Kapsam dışı

- Her konum için ayrı bildirim/ezan uyarısı — bildirim ve widget her zaman
  listedeki ilk konuma (GPS açıksa GPS, değilse ilk eklenen şehir) göre çalışır.
- Sınırsız konum sayısı — üst sınır 5.
- Konum bazlı widget seçimi.

## Veri modeli

Konuma özel 6 alan (`sehir, lat, lng, rakim, otoKonum, resmi, resmiIl, ilce`)
`A` üzerinden çıkıp bir diziye taşınıyor:

```js
A.konumlar = [
  { sehir, lat, lng, rakim, otoKonum, resmi, resmiIl, ilce },
  ...
];
A.aktifKonum = 0; // vakitler sayfasında şu an gösterilen index
```

Konumdan bağımsız tüm diğer `A` alanları (tema, yöntem, mezhep, bildirim
saatleri, `dua`, `ramazanMod` vb.) değişmeden `A` kökünde kalır.

**Göç (migration):** `yukle()` içinde, `A.konumlar` yoksa mevcut tekil
alanlardan (`A.sehir` vb.) tek elemanlı bir `A.konumlar` dizisi kurulur,
`A.aktifKonum = 0` atanır, eski tekil alanlar `A` kökünden silinir. Eski
kullanıcılar hiçbir veri kaybı yaşamadan otomatik geçer.

**Aktif konum erişimi:** Konuma bağlı her yerde `A.sehir` yerine
`A.konumlar[A.aktifKonum].sehir` (vb.) okunur/yazılır. Bunu tekilleştirmek için
küçük bir yardımcı eklenir:

```js
function aktifKonum(){ return A.konumlar[A.aktifKonum]; }
```

Mevcut hesaplama fonksiyonları (`gunuTazele`, `alanlariDoldur`,
`vakitListesiCiz`, güneş/ay/kerahat hesapları, `RESMI` fetch mantığı) `aktifKonum()`
üzerinden okuma yapacak şekilde güncellenir; hesap mantığının kendisi
değişmez.

**Bildirim/widget:** `bildirim.js` ve widget veri üretimi her zaman
`A.konumlar[0]`'ı kullanır — `A.aktifKonum` sadece görüntülemeyi etkiler,
zamanlanmış bildirimleri etkilemez.

## Kaydırma etkileşimi

`#gokyuzu` (hero: konum adı, geri sayım, şerit) ve `#sayfa-vakit` (vakit
listesi, imsakiye, dini günler, ramazan/cuma/dua kutuları, kerahat) birlikte
tek bir yatay kaydırma alanı oluşturur.

- `touchstart/touchmove/touchend` ile yatay sürükleme mesafesi ve yönü
  ölçülür (dikey kaydırmayla — sayfanın kendi scroll'uyla — çakışmaması için
  ilk hareketin açısına bakılır: yatay hareket dikeyden belirgin şekilde
  büyükse kaydırma olarak kabul edilir, aksi halde sayfa normal scroll eder).
- Eşik aşılınca `A.aktifKonum` bir sonraki/önceki geçerli index'e döner
  (döngüsel değil — ilk/son konumda sınırda hafif geri tepme/elastik his
  yeterli, bir sonrakine geçmez).
- Konum değişince `kaydet()` + `alanlariDoldur()` + `gunuTazele()` +
  `vakitListesiCiz()` çağrılır (yeni konumun ilçe kodu farklıysa `RESMI`
  yeniden `vakitler/<ilce>.json`'dan okunur — bu dosyalar uygulamayla birlikte
  gelen yerel varlıklar, ağ gerektirmez).
- **Sayfa göstergesi:** `#gokyuzu` içinde, `konumlar.length > 1` olduğunda
  görünen küçük nokta dizisi (mevcut aktif index vurgulu). Tek konumla hiçbir
  şey görünmez, kaydırma dinleyicisi de eklenmez — mevcut davranış aynen
  korunur.

## Konum yönetimi (Ayarlar)

Ayarlar sayfasında, mevcut il/ilçe ve enlem/boylam seçim bloğunun üstüne
"Konumlarım" bölümü eklenir:

- Ekli konumların listesi: şehir adı + sil ikonu. GPS/"Konumumu kullan"
  girdisi varsa listenin başında sabit durur, silinemez (sil ikonu yok);
  GPS kapatılırsa `A.otoKonum=false` olur ve o girdi normal bir konuma döner
  ya da kaldırılabilir hale gelir.
- Sıra değiştirme: sürükle-bırak (dokunmatik).
- "Konum ekle" butonu: mevcut il/ilçe seçim akışı (`yerleriKur`,
  `ilceleriDoldur`) yeniden kullanılır, seçim yapılınca `A.konumlar`'a yeni
  eleman eklenir. 5 konuma ulaşıldığında buton pasif olur, kısa açıklama
  gösterilir.
- Silme: en az 1 konum kalmak zorunda — sonuncu konum silinemez.
- Bir konuma dokununca o konum aktif olur (Ayarlar'dan da hızlı geçiş).

## Sınırlar

- **Bildirim tek konuma bağlı.** Diğer konumlar sadece görüntüleme; kullanıcı
  ikinci bir şehrin ezan vaktini kaçırabileceğini bilmeli — Ayarlar'daki
  "Konumlarım" açıklamasında bu belirtilir.
- **5 konum üst sınırı.** Kaydırma deneyimini ve state karmaşıklığını basit
  tutmak için.
- **Aktif konum kalıcı.** Uygulama kapanıp açıldığında en son bakılan konum
  değil, her zaman `A.aktifKonum` neyse o gösterilir (mevcut `kaydet()`
  mekanizmasıyla zaten localStorage'a yazılıyor).

## Test

Mevcut `araclar/*.test.cjs` dosyalarında konuma bağlı saf mantık yok (hesap
fonksiyonları `index.html` içinde, DOM'a bağlı) — bu iş için yeni bir saf
mantık dosyası açılmıyor. Manuel doğrulama: tek konumdan çoklu konuma göç,
5 konum sınırı, GPS'in sabit ilk sırada kalması, ilk/son konumda kaydırmanın
döngüye girmemesi, bildirimin ikinci konum aktifken bile ilk konuma göre
tetiklenmesi.
