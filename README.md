<div align="center">

<img src="logos.png" alt="Beş Vakit" width="128">

# Beş Vakit

**Reklamsız, ücretsiz, internetsiz çalışan namaz vakti ve kıble uygulaması.**

[**→ Uygulamayı aç**](https://kamilsaim.github.io/besvakit/)

![sürüm](https://img.shields.io/badge/sürüm-0.16.0-22B2AE?style=flat-square)
![bağımlılık](https://img.shields.io/badge/bağımlılık-yok-D8A93C?style=flat-square)
![tek dosya](https://img.shields.io/badge/tek%20dosya-HTML-080C18?style=flat-square)

</div>

---

## Ne yapar

Namaz vakitleri Diyanet takviminden gelir, ama uygulama **çalışırken hiçbir servise
bağlanmaz**: veri depoda hazır durur, bir kez indirilip cihazda saklanır. Veri olmayan
bir gün ya da konum için uygulama kendi astronomik hesabına düşer — yani internet
olmadan da, kaynak kapansa da çalışır. Anahtar yok, hesap yok, veri dışarı çıkmaz.

| | |
|---|---|
| **Vakitler** | Altı vakit, canlı geri sayım, gün şeridi, aylık imsakiye, kerahat vakitleri |
| **Ramazan** | İftar ve sahur geri sayımı, gün sayacı, oruç takibi |
| **Dini günler** | Kandiller, bayramlar, üç aylar, ay evresi + doğuş/batış saatleri — hicri takvimden otomatik |
| **Kıble** | Sekmeye girince başlayan pusula, kalibrasyon, uydu haritasında kıble hattı |
| **İbadet** | Namaz takibi, seri gün, aylık istatistik, kaza sayacı, zikirmatik (tesbih seti, özel zikir), Esmâ-ül Hüsnâ, Nasûh Tövbesi takibi |
| **Cuma** | Cuma hatırlatması, Kehf Suresi uyarısı, salâvat sayacı |
| **Mübarek gün duaları** | Muharrem, Aşûre, Safer, Receb, Regaib, Mirac, Berat, Kadir, iftar, arefe, bayram gecesi, senenin sonu, cuma — o zaman girince kendiliğinden çıkar ve hatırlatır |
| **Camiler** | 3 km çevrendeki camiler, yön ve yürüme mesafesiyle |
| **Bildirim** | APK'da uygulama kapalıyken de çalışır: her vakit, her vaktin kendi önceden uyarısı, kerahat, cuma, mübarek gün duaları, sahur/iftar, sessiz saatler |
| **Çevrimdışı** | Servis işçisiyle uygulama kabuğu; vakitler önbellekte, hesap yedekte |

## Nasıl hesaplıyor

PrayTimes ile aynı astronomik model, sıfırdan yazıldı, **bağımlılık yok**:

- Güneş konumu: ortalama anomali → görünen boylam → deklinasyon + zaman denklemi
- Ufuk açısı rakıma göre düzeltilir (`0.833 + 0.0347·√rakım`) — 1000 m'de ~4 dakika fark
- Varsayılan yöntem Diyanet (imsak 18°, yatsı 17°); MWL, ISNA, Mısır, Karaçi da var
- İkindi için Şâfiî/Diyanet ve Hanefî seçeneği

### Diyanet takvimi (varsayılan)

Vakitler Diyanet'in kendi takviminden alınır. Uygulama **çalışırken hiçbir servise
bağlanmaz**: GitHub Actions ayın 1'i ve 15'inde veriyi çekip depoya `vakitler/<ilçe>.json`
olarak commit'ler, GitHub Pages statik dosya olarak servis eder, uygulama bir kez indirip
`localStorage`'a önbellekler. Anahtar yok, CORS yok, kullanıcı başına istek yok — kaynak
bir gün kapansa bile elimizdeki veri çalışmaya devam eder.

Türkiye'nin **868 ilçesi** kapsanıyor. Kapsam dışı bir gün veya konum olursa uygulama
sessizce kendi astronomik hesabına düşer; yani veri olmadan da çalışır.

### Astronomik hesap (yedek)

**Temkin payı.** Diyanet takvimi astronomik değerin üzerine sabit bir ihtiyat payı ekler.
7 günlük karşılaştırmada öğle farkının her gün tam +5 dakika çıkması bunu kanıtladı:

```
imsak 0 · güneş −1 · öğle +5 · ikindi +4 · akşam +2 · yatsı +1
```

Bu tablo Kayseri'de vakit başına ortalama farkı **0.15 dakikaya** düşürüyor (%85 tam isabet).
Ancak tablo Kayseri'den türetildiği için her ilde aynı ölçüde tutmuyor: İstanbul, Antalya ve
Trabzon'da güneş ve akşam vakitleri ±5 dakikaya kadar sapıyor — bu, Diyanet'in kullandığı
rakım değerlerinin bizimkinden farklı olmasından. Resmi takvim tam da bu yüzden var.

Mahalle caminle hâlâ fark varsa Ayarlar → Dakika düzeltmesi'nden vakit başına ±30 dk hizalanır.

## Kıble

Büyük daire başlangıç açısı: `atan2(sin Δλ, cos φ₁·tan φ₂ − sin φ₁·cos Δλ)`
Kâbe `21.4224779, 39.8261722`. Kayseri → 166.6°, İstanbul → 151.6°.

**Güneşe göre kıble.** Telefon pusulaları metalden, kılıftan ve manyetik alandan
etkilenir. Bu yüzden pusuladan bağımsız bir yol var: güneşin azimutu yalnızca saat ve
koordinattan hesaplanır, hiçbir sensöre ihtiyaç duymaz. Uygulama güneşin o anki yönünü
söyler ("güneşe dön, 96° sola dön"), günün **kıble saatini** verir — o anda güneşe
döndüğünde tam kıbleye bakıyorsun — ve pusula kadranına güneş işareti koyar.
Telefonu güneşe doğrultup tek dokunuşla pusulayı kalibre edebilirsin.

Manyetik sapma için WMM katsayı tablosu gömmek yerine kullanıcıya bir kere ölçtürüyoruz:
haritadan doğrula, **"Şu an kıbleye bakıyorum"**a bas, uygulama telefonunun sapmasını
kalıcı olarak düzeltsin. Bu yaklaşım telefonun kendi manyetometre hatasını da kapsıyor.

## Gizlilik

- Konum cihazdan çıkmaz, hesap tarayıcıda yapılır
- Ayarlar yalnızca `localStorage`'da tutulur
- Sunucu, hesap, takip, analitik, reklam — hiçbiri yok
- Yalnızca **isteğe bağlı** olarak dışarı bağlanılan yerler: harita karoları (Esri / OpenStreetMap),
  cami araması (Overpass API), yazı tipleri (Google Fonts). Üçü de kapalıyken uygulama çalışmaya devam eder.

Tam metin: [**Gizlilik Politikası**](https://kamilsaim.github.io/besvakit/gizlilik.html)

## Sürüm geçmişi

### 0.16.0
- **Zikirmatik İbadet sayfasının en üstüne alındı.** En sık dokunulan şey en
  aşağıdaydı; her açılışta kaydırmak gerekiyordu. Artık sayfa açılır açılmaz
  sayaç elin altında.
- **Bölümler cam kapsüllere girdi.** Dört sayfadaki 27 bölüm — Vakitler 7,
  İbadet 8, Kıble 4, Ayarlar 8 — aynı yarı saydam kapsül diline oturdu. Önceden
  her sayfa kendi ayrım biçimini kullanıyordu; başlıklar, katlanma davranışı ve
  boşluklar sayfadan sayfaya değişiyordu. Kapsüller tek bir `.bolum` sınıfı ve
  ortak değişkenler üzerinden çiziliyor, yani üç temada da tutarlı.
- **AMOLED temada bölüm gölgesi geri geldi.** `--cam-golge` değeri `none` idi;
  `box-shadow` listesinde geçersiz olduğu için tarayıcı bildirimin tamamını
  düşürüyordu. Siyah zeminde kapsüllerin kenarı hiç görünmüyordu.
- **Hicri tarih bazı cihazlarda yanlış yazılıyordu.** Ay adı sistemin takvim
  verisinden alınıyordu; o veride ümmülkura takviminin Türkçe ay adları
  bulunmayan cihazlarda Gregoryen ay adı ve yanlış çağ etiketi çıkıyordu —
  widget'ta "MÖ 05 Mart 1448" gibi. Ay adı artık uygulamanın kendi listesinden
  yazılıyor.

### 0.15.0
- **Çoklu konum.** Ayarlar sayfasına **Konumlarım** kartı geldi: en fazla beş
  şehir eklenebiliyor, sıraları ↑/↓ ile değiştirilebiliyor, satıra dokununca o
  konum aktif oluyor. GPS ile bulunan konum listede her zaman 📍 ile en üstte
  sabit duruyor.
- **Kaydırarak konum değiştirme.** Vakitler sayfasında sağa/sola kaydırınca
  eklenen konumlar arasında geçiliyor; başlığın altındaki noktalar hangi
  konumda olunduğunu gösteriyor. Dikey kaydırma etkilenmiyor — yalnızca
  belirgin yatay hareket konum değiştiriyor.
- **Bildirimler ana konuma bağlı.** Başka bir konuma kaydırılmış olsa da
  bildirim kuyruğu her zaman listenin en üstündeki konuma göre kuruluyor.
- Eski tek konumlu kayıtlar açılışta otomatik olarak yeni listeye taşınıyor;
  ayar kaybı olmuyor.

### 0.14.0
- **Mübarek gün ve gece duaları.** Hicri takvimde belirli ay, gün ve gecelere
  mahsus dualar var; uygulama hicri tarihi zaten biliyordu ama okunacak metni
  göstermiyordu. Artık o zamana girilince Vakitler sayfasında **“Bugünün
  duaları”** kutusu çıkıyor: Muharrem'in ilk on günü, Aşûre, Safer ayı ve
  çarşambaları, Receb, Leyle-i Regâib, Mi'rac, Berât, Leyle-i Kadir, iftar,
  arefe, bayram gecesi, senenin sonu, cuma ve hilâl. Satıra dokununca İbadet
  sayfasındaki **Mübarek gün duaları** bölümü açılıyor: Arapça metin, Türkçe
  meal, okunuş tarifi ve kaynak sayfası. Bölüm hep orada — arefe duasını
  arefeyi beklemeden de okuyabilirsin.
- **O ay veya gece girince hatırlatır.** Ayarlardaki *Mübarek gün duaları*
  anahtarı ve *Dua hatırlatma saati* ile: vesile başladığı gün, seçilen saatte
  tek bildirim. Receb ayı boyunca her gün tekrarlamaz — yalnızca ilk günde
  uyarır. APK'da uygulama kapalıyken de gelir.
- **Cuma anahtarı bildirim kuyruğunu tazeliyor.** Cuma modu açılıp
  kapatıldığında kuyruk yeniden kurulmuyordu; ayar değişmiş görünse de bir
  sonraki tetikleyiciye kadar eski kuyruk geçerli kalıyordu.

Kaynak: Ramazanoğlu Mahmud Sâmi, *Dualar ve Zikirler*, Erkam Yayınları. Her
duanın altında kitaptaki sayfası yazılı.

### 0.13.0
- **Güneş doğuşu için önceden uyarı.** Sabah namazını kaçırmamak için asıl gereken
  uyarı buydu: "Güneş doğuşuna 15 dakika kaldı — sabah namazı vakti çıkıyor".
  Önceden güneş satırında ⏱ düğmesi hiç gösterilmiyordu, çünkü "vakit öncesi
  hatırlatma" güneş için anlamsız sayılmıştı. Oysa güneş bir vaktin başlangıcı
  değil, sabah namazının **bitişi** — uyarılması en kritik an.
- **Bildirim izni kaybolursa artık görünür.** İzin yalnızca ana anahtar açılırken
  bir kez isteniyordu. Kullanıcı izni sistem ayarından kapatırsa ya da Android
  "uzun süredir kullanılmayan uygulama" iznini kendiliğinden geri alırsa, anahtar
  açık görünmeye devam ediyor ve bildirimler sessizce düşüyordu. Artık her kuyruk
  kurulumunda izin denetleniyor; yoksa Ayarlar'da uyarı satırı ve tek dokunuşla
  düzelten bir düğme çıkıyor.
- **Sessiz tuzak kapatıldı.** Vakit bildirimi kapalıyken "önceden uyarı" süresi
  seçmek hiçbir şey üretmiyordu. Artık süre seçilince o vaktin zili birlikte
  açılıyor ve bu kullanıcıya söyleniyor.

### 0.12.0
- **Titreşim gerçekten hissediliyor.** `@capacitor/haptics`'in `impact()` çağrısı
  Android'de süreye bakmıyor: LIGHT de HEAVY de 43–60 ms'lik tek bir blip üretiyor.
  Uygulamadaki her titreşim — tesbihin kısa dokunuşu da, kıble hizalandığındaki
  uzun deseni de — aynı, çoğu telefonda fark edilmeyen tıkırtıya dönüşüyordu.
  Artık `vibrate()` ile istenen süre boyunca titriyor, desenler de parça parça
  çalınıyor.
- **Büyük widget yeniden tasarlandı.** Konum satırı, miladi ve hicri tarih,
  sağ üstte sıradaki vaktin geri sayım rozeti; altı vakit ayrı kutucuklarda ve
  sıradaki vakit dolu altın zeminle vurgulu (renk farkı küçük ekranda seçilmiyordu).
- **Yeni geri sayım widget'ı.** Zemini yok — duvar kâğıdının üstünde tek satır
  konum + vakit adı, altında büyük punto kalan süre. Punto widget'ın genişliğine
  göre ayarlanıyor.
- **Widget'ın kalan süresi bayatlamıyor.** Tazeleme 30 dakikada bir yerine vakte
  yaklaştıkça sıklaşıyor (1 saatten uzaksa 10 dk, 10–60 dk arası 5 dk, son 10
  dakikada dakika başı).

### 0.11.0
- **Bildirimler uygulama kapalıyken de çalışıyor** (APK). Eskiden bildirimler
  `setInterval` ile üretiliyordu, yani yalnızca uygulama açıkken geliyordu — bir
  namaz vakti uygulamasının en temel işlevi eksikti. Artık 30 güne kadar bildirim
  `@capacitor/local-notifications` ile önceden kuyruğa alınıyor.
- **Her vaktin kendi önceden uyarısı.** Tek global "X dakika önce" ayarı kalktı;
  ana ekranda her vakit satırında kendi ⏱ düğmesi var (kapalı/5/10/15/20/30/45).
  Eski ayar korunuyor, tüm vakitlere kopyalanıyor.
- **Kerahat, cuma, sahur ve iftar bildirimleri** de kuyruğa alınıyor — hepsi
  uygulama kapalıyken çalışır.
- **Sessiz saatler.** Belirlediğin aralığa düşen bildirimler sessiz gelir.
  Android'de kanal sesi sonradan kod ile değiştirilemediği için bu, ayrı bir
  "sessiz" bildirim kanalına yönlendirme olarak yapıldı.
- **Ses ve titreşim Android'in kanal ayarından seçiliyor.** Uygulama içinde ses
  seçici yok: beş kanal var (vakit, önceden, oruç, cuma/kerahat, sessiz) ve
  Ayarlar'daki kısayol doğrudan o kanalın sistem ekranını açıyor. Böylece
  istediğin zil sesini seçebiliyorsun, APK da şişmiyor.
- **"Bildirimler gecikiyor mu?" kartı.** Bazı markalar kuyruktaki alarmları pil
  tasarrufu diye öldürüyor; düğme doğrudan pil optimizasyonu ayarına götürüyor.
- **Uygulama içi titreşim native oldu** (`@capacitor/haptics`) — `navigator.vibrate`
  WebView'da bazı cihazlarda çalışmıyordu. Ayarlardaki "Titreşim" anahtarı artık
  yalnızca tesbih ve kıble için; bildirim titreşimi kanal ayarından geliyor.
- **Widget'ta iftar geri sayımı.** Ramazanda akşam vakti "İftar" olarak öne çıkıyor.
- Bildirim üretimi ayrı bir dosyaya (`bildirim.js`) çıkarıldı ve 40 testle
  kaplandı — `index.html` tek parça olduğu için bu mantık daha önce hiç test
  edilemiyordu.
- Widget'ın saat dilimi/tarih değişimlerini dinleyen alıcısı `exported="false"`
  olduğu için o sistem yayınlarını hiç almıyordu; düzeltildi.

### 0.10.0
- **Ay doğuş/batış saatleri.** Dini günler kartındaki ay durumu satırına eklendi;
  ayın günlük ~50 dk gecikmesi yüzünden bazı günlerde doğuş ya da batış hiç
  olmayabilir, o alan sessizce atlanır.
- **Zikirmatik'e namaz sonrası tesbih seti.** Sübhânallâh 33 · Elhamdülillâh 33 ·
  Allâhüekber 34 arasında hedefe ulaşınca otomatik geçiyor, tamamlanınca başa dönüyor.
- **Kullanıcı kendi zikrini ekleyebiliyor** — ad ve hedef sayı ile; seçiliyken
  tekrar dokununca silinir.
- **Esmâ-ül Hüsnâ.** İbadet sekmesine, 99 ismi ve kısa anlamlarını listeleyen
  katlanır bir kart eklendi.
- **Nasûh Tövbesi takibi.** Tam metin + günlük okuma sayacı (kaç kez okundu),
  kullanıcının belirlediği hedef gün sayısına göre ilerleme ve geri sayım,
  başlangıç/bitiş tarihi, gün atlanırsa uyarı.
- Gökyüzündeki ay artık hicri tarih yazısının sağ kenarıyla tam hizalı — SVG'ye
  eksik olan `width`/`height` eklenince (önceden tarayıcı varsayılan 300×150px
  kutuya sığdırıyordu) hem yıldızlar hem ay doğru genişlikte konumlanıyor.

### 0.9.0
- **Ay durumu.** Gece gökyüzünde ayın o geceki gerçek evresi çizilir; dini günler
  kartının başında hicri ayın neresinde olunduğu ve ayın aydınlık oranı yazar.
- Hicri ayın 29'unda bilgilendirme: ayın 29'da mı biteceği yoksa 30'a mı uzayacağı
  Diyanet'in ilanıyla belli olur — **uygulama ay başlangıcı ilan etmez**
- Hesap hicri günle yarım günden iyi örtüşüyor (Ramazan 1447 → 8 Şubat 2027, ay yaşı 1.6 gün)

### 0.8.3
- **Diyanet takvimi artık varsayılan olarak etkin.** Önceden ilçe seçilmediği için
  herkes yedek astronomik hesabı görüyordu; bu da Diyanet'e göre günlerin üçte ikisinde
  ±1 dakika sapıyordu. Varsayılan ilçe, uygulamanın varsayılan şehriyle (Kayseri) hizalandı.
- Konum bulununca ilçe kendiliğinden eşleşiyor — ayarlara girmeye gerek yok
- Yedek hesap devredeyse artık bu görünür yazıyor; sessizce düşmüyor

### 0.8.2
- Yeni logo. Kaynak beyaz zeminliydi; köşelerden taşma dolgusuyla şeffaflaştırıldı
  (düz eşik kemerin iç boşluğunu da açardı), kırpılıp kareye oturtuldu.
  Uygulama simgeleri, açılış ekranı ve favicon yeniden üretildi.

### 0.8.1
- Temkin ayarı kaldırıldı — resmi takvim geldiğinden beri yalnızca yedek hesapta
  anlamı vardı ve orada da hep açık olmalı; tablo duruyor, anahtar gitti
- Pusula tanılama paneli kaldırıldı; içindeki ölçüm, iki ayrı kalibrasyon
  düğmesinin yerine geçen tek bir akışta toplandı
- Sapma değeri artık yuvarlanmış gösteriliyor (19.962001623055244° değil 20°)

### 0.8.0
- **Diyanet takvimi.** Vakitler artık Diyanet'in kendi takviminden okunuyor.
  Türkiye'nin 868 ilçesi için veri depoda; Ayarlar → Diyanet takvimi'nden il/ilçe seçilir.
- GitHub Actions ayın 1'i ve 15'inde veriyi tazeleyip depoya commit'liyor
- Veri yoksa (kapsam dışı tarih, liste dışı konum, çevrimdışı ilk açılış)
  sessizce astronomik hesaba düşülüyor
- **Saat başı çökme hatası düzeltildi** — `tikTak` ile `gunuTazele` birbirini
  çağırıyordu; saat tam `xx:00:00` iken sonsuz özyinelemeye girip yığını taşırıyordu
- Pusula tanılamasında sapma artık işaretli gösteriliyor (357° yerine −3°)

### 0.7.2
- **Android widget köprüsü.** Uygulama 30 günlük vakti `@capacitor/preferences` ile
  cihazın `SharedPreferences` dosyasına yazar; ana ekran widget'ı oradan okur.
  Hesap mantığı tek yerde kalır — widget kendi hesabını yapmaz, uygulama günlerce
  açılmasa da doğru çalışmaya devam eder.

### 0.7.1
- **Tek dokunuşla sapma ölçümü.** Telefon güneşin yatay yönüne çevrilmişken pusulanın
  söylediği yön ile hesaplanan güneş azimutu karşılaştırılır; fark doğrudan telefonun
  manyetik sapmasıdır. Ölçüm anında telefon 20°'den fazla eğikse uyarır, çünkü
  iOS pusulası eğik tutulunca zaten sapar.
- Sonuç yorumlanıp gösteriliyor ve tek düğmeyle kalıcı düzeltmeye çevrilebiliyor

> **iOS notu:** Safari'de `deviceorientationabsolute` olayı yoktur ve `e.absolute`
> her zaman `false` gelir; buna rağmen `webkitCompassHeading` gerçek kuzeye göredir.
> Yani iPhone'da bu iki değerin "yanlış" görünmesi normaldir, hata göstergesi değildir.

### 0.7.0
- **Cuma modu** — cuma günü kartı ve hatırlatma, perşembe akşamı Kehf Suresi uyarısı,
  tek dokunuşla salâvat sayacına geçiş. Hatırlatma saati ayarlanabilir.
- **Zikirler ayrı ayrı toplanıyor** — her zikrin bugünkü ve tüm zamanlar toplamı
- **Pusula tanılama paneli** — ham sensör değerleri (olay türü, alpha/beta/gamma,
  `e.absolute`, hesaplanan yön) ve güneş referansıyla sapma ölçümü

### 0.6.0
- **Diyanet temkin payı.** 7 günlük karşılaştırmada öğle farkının her gün tam +5 çıkması,
  bunun hesap hatası değil Diyanet'in sabit ihtiyat payı olduğunu gösterdi. Tablo
  uygulanınca fark vakit başına ortalama 0.24 dakikaya düştü. Ayarlardan kapatılabilir.
- **Güneşe göre kıble.** Güneşin azimutu yalnızca saat ve koordinattan hesaplanır;
  manyetik alandan etkilenmez. Canlı açı farkı, kıble saati, gölge saati ve
  pusula kadranında güneş işareti.
- Güneşe doğrultarak tek dokunuşla pusula kalibrasyonu
- Açık temada alt menü rengi düzeltildi

### 0.5.0
- Kerahat vakitleri — üç aralık, gün şeridinde bant, girince uyarı
- Açık tema ve AMOLED siyah tema
- Ramazan modu — iftar/sahur geri sayımı, gün sayacı, oruç takibi

### 0.4.0
- **Pusula sapması düzeltildi.** Android'de mutlak ve bağıl yön olayları aynı anda
  dinleniyordu; bağıl olan pusula için anlamsız olduğundan ibre iki okuma arasında
  salınıyordu. Artık mutlak geldiyse bağıl tamamen yok sayılıyor.
- Telefon eğikse ve pusula hassasiyeti düşükse kullanıcıya uyarı
- Harita ve cami listesi Kıble sekmesine taşındı, alt menü 4 sekmeye döndü

### 0.3.0
- İbadet sekmesi: namaz takibi, seri gün, 30 günlük ızgara, aylık istatistik
- Kaza namazı sayacı ve zikirmatik
- Servis işçisiyle çevrimdışı kabuk
- Vakit öncesi hatırlatma (5–45 dk)
- Cami sonuçları 24 saat önbellekli

### 0.2.0
- Dini günler ve geceler — kandiller, bayramlar, üç aylar
- İmsakiye katlanabilir hale geldi
- Kıble sekmesine girince pusula kendiliğinden başlıyor
- Logo, favicon ve manifest ikonu

### 0.1.0
- İlk sürüm: altı vakit, geri sayım, gün şeridi, imsakiye
- Kıble pusulası ve kalibrasyon, uydu haritasında kıble hattı
- Yakındaki camiler, vakit bildirimleri

## Yol haritası

- [x] Namaz takibi, kaza sayacı, zikirmatik
- [x] Dini günler takvimi
- [x] Çevrimdışı kabuk, vakit öncesi hatırlatma
- [x] Android ana ekran widget'ları — büyük (vakitler + hicri tarih) ve yalnızca geri sayım
- [x] Capacitor kabuk (APK) — uygulama kapalıyken de bildirim
- [ ] Gerçek ezan sesi — kanal sistem sesiyle kuruldu; ezan dosyası eklenecek
- [ ] Wear OS — kadran üzeri complication ve kaydır-eriş kartı (planı hazır)
- [x] Açık tema ve AMOLED tema
- [x] Ramazan modu — iftar/sahur geri sayımı
- [x] Kerahat vakitleri uyarısı
- [x] Cuma modu — salâvat sayacı, Kehf hatırlatması
- [x] Mübarek gün ve gece duaları — o vakit girince gösterir ve hatırlatır
- [ ] Duaların Latin harfli okunuşu — şimdilik Arapça asıl metin ve Türkçe meal var
- [x] Vakitleri Diyanet takvimiyle birebir hizalayan temkin tablosu
- [x] Güneşe göre kıble — pusulasız yöntem
- [ ] Ayarları ve kayıtları dışa aktar / geri yükle
- [ ] Cami temalı yeni logo — büyük boy taslak hazır, 22px favicon için sade varyant bekliyor

## Lisans

Henüz belirlenmedi.

Cami ve harita verisi © OpenStreetMap katkıcıları (ODbL) · Uydu görüntüsü Esri.
