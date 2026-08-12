# Arka plan bildirimleri ve Wear OS desteği — tasarım

Tarih: 2026-08-11
Durum: onaylandı, plana hazır

## Sorun

Beş Vakit'in bildirimleri web tarafında `setInterval` ile çalışıyor
(`index.html:1466` vakit, `:1266` kerahat, `:2181` cuma). Bu yüzden **yalnızca
uygulama açıkken** bildirim geliyor — bir namaz vakti uygulamasının en temel
işlevi eksik. Ayrıca:

- Önceden uyarı tek bir global değer (`A.onceden`, `index.html:1472`); vakit
  başına ayarlanamıyor.
- Ramazan iftar/sahur için hiç bildirim yok, sadece ekranda geri sayım var.
- Bildirim titreşimi `navigator.vibrate` ile yapılıyor, o da uygulama kapalıyken
  çalışmıyor.
- Akıllı saat desteği yok.

## Kapsam

İki aşama. Aşama 1 tek başına yayınlanabilir; Aşama 2 ona bağlıdır.

**Aşama 1 (telefon):** arka planda çalışan bildirimler, vakit başına önceden
uyarı, sessiz saatler, kerahat/cuma/ramazan bildirimleri, native haptics,
widget'ta iftar geri sayımı.

**Aşama 2 (saat):** Wear OS modülü — complication, tile, tam uygulama.

**Kapsam dışı:** widget'a şehir adı eklemek; APK simgelerinin yenilenmesi
(kullanıcı Android Studio'da kendisi yapacak).

---

## Aşama 1 — telefon

### Mimari

Beş Vakit bir **kabuk APK**: içerik `https://kamilsaim.github.io/besvakit/`
adresinden yüklenir. Bu yüzden **tüm zamanlama mantığı `index.html`'de kalır** —
web'e push atınca bütün telefonlar güncellenir. APK'ya yalnızca bir kez eklenip
bir daha dokunulmayacak parçalar girer.

APK'ya eklenecekler:

- `@capacitor/local-notifications`, `@capacitor/haptics` eklentileri
- `android/app/src/main/res/raw/ezan.ogg` — kısa ezan sesi (telifsiz/CC0
  kaynaktan bulunacak; bulunamazsa kullanıcıya sorulur)
- `MainActivity.java` içinde küçük bir yerel Capacitor eklentisi (`Cihaz`):
  - `pilAyariAc()` — pil optimizasyonu ayar ekranını açar
  - `kanalAyariAc(kanalId)` — Android'in bildirim kanalı ayar ekranını açar
- Manifest izinleri: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`,
  `RECEIVE_BOOT_COMPLETED`

Web tarafında yeni modül. Sorumluluk ikiye ayrılır ki test edilebilsin:

| Birim | Girdi | Çıktı | Bağımlılık |
|---|---|---|---|
| `bildirimListesiUret(ayarlar, vakitler, simdi)` | saf veri | bildirim nesneleri dizisi | yok — saf fonksiyon |
| `bildirimKur()` | — | kuyruğu kurar | eklenti, `bildirimListesiUret` |

`bildirimKur()` şu anlarda çağrılır: uygulama açılışı, bildirim ayarı değişimi,
şehir/takvim değişimi. Her çağrıda kuyruk **baştan** kurulur (önce `cancel`,
sonra `schedule`) — artımlı güncelleme yapılmaz, çünkü ayar değişimlerinde
hangi bildirimin geçersizleştiğini izlemek kırılgan olur.

Eski `setInterval` tabanlı bildirim kodu APK'da devre dışı kalır; tarayıcıda
(eklenti yokken) çalışmaya devam eder.

### Bildirim kanalları

Beş kanal. Ses ve titreşim seçimi **Android'in kendi kanal ayarına** bırakılır —
uygulama içinde ses seçici yazılmaz, APK şişmez.

| Kanal id | Varsayılan ses | Kullanım |
|---|---|---|
| `vakit` | `ezan.ogg` | Vakit girdi |
| `once` | sistem bildirimi | "X vaktine N dk kaldı" |
| `oruc` | sistem bildirimi | Sahur / iftar |
| `ozel` | sistem bildirimi | Cuma, kerahat |
| `sessiz` | ses yok, önem düşük | Sessiz saatlere denk gelen her şey |

**Sessiz saatler** ayrı bir mekanizma değildir: bildirim kuyruğa alınırken saati
kullanıcının belirlediği aralığa düşüyorsa kanalı `sessiz` yapılır.

Android'de bir kanal oluşturulduktan sonra sesi/titreşimi kod ile
değiştirilemez; yalnızca kullanıcı değiştirebilir. Bu yüzden kanallar bir kez
oluşturulur ve id'leri asla değişmez.

### Kuyruk bütçesi

Android'de uygulama başına bekleyen alarm sayısı sınırlıdır (~500). Her şey
açıkken günde ~17 bildirim üretilir; 30 gün = 510, sınırı aşar.

`bildirimListesiUret` aktif bildirim türlerini sayar ve gün sayısını kendi
hesaplar: **hedef ~400 bildirim, taban 7 gün, tavan 30 gün.** Az tür açıksa 30
güne kadar ileri kurar, hepsi açıksa ~20 güne düşer. Kullanıcı bunu görmez ve
ayarlayamaz.

ID şeması sabit ve çakışmasız: `günSırası * 100 + türKodu`. Tür kodları
(imsak/güneş/öğle/ikindi/akşam/yatsı × vakit/önceden, sahur, iftar, cuma,
kerahat×3) sabit bir tabloda tutulur.

### Ayarlar arayüzü

**Ana ekran vakit listesi** (`index.html:1366` civarı): her satırdaki zil
düğmesi kalır (vakit bildirimi aç/kapa), yanına **"⏱ N dk"** düğmesi eklenir.
Dokununca kapalı / 5 / 10 / 15 / 20 / 30 / 45 arasında döner. Böylece her
vaktin kendi önceden uyarısı olur.

Global `A.onceden` kaldırılır. Migrasyon: ayarlar yüklenirken eski `onceden`
değeri varsa tüm vakitlere kopyalanır, sonra alan silinir.

**Ayarlar → Bildirimler** bölümü:

- En üstte **tek ana anahtar** — kapatınca kuyruk tamamen boşaltılır
- Sessiz saatler (başlangıç / bitiş)
- Kerahat uyarıları aç/kapa
- Sahur önceden (dakika)
- Ses ayarı kısayolları — her kanal için Android ayar ekranını açan düğme
- "Bildirimler gecikiyor mu?" kartı — pil optimizasyonu ayarına götürür
  (Xiaomi/Samsung/Huawei gibi cihazlarda kuyruktaki bildirimler öldürülebiliyor)

**Titreşim anahtarının anlamı daralır.** Artık yalnızca uygulama içi dokunsal
geri bildirimi yönetir (tesbih `index.html:2082`, kıble `:2321`, düğmeler).
Bildirim titreşimi kanal ayarına gider. Etiket buna göre güncellenir:
*"Titreşim — tesbih ve kıble için. Bildirim titreşimi Android ayarından."*

### Haptics

`navigator.vibrate` WebView'da bazı cihazlarda güvenilmez. `@capacitor/haptics`
eklenir ve uygulama içi titreşimler bunun üzerinden yapılır; eklenti yoksa
`navigator.vibrate`'e düşer. Tesbih sayımı native `impact` geri bildirimi alır.

### Widget — iftar geri sayımı

Ramazan modu açıkken widget sıradaki vakit yerine **iftara kalan süreyi** öne
çıkarır. Widget'ın kendi hesabı yoktur; `bv_widget` verisine ramazan bayrağı
eklenir ve `VakitWidget.java` çizim anında hangi başlığı yazacağına karar verir.

### Hata durumları

| Durum | Davranış |
|---|---|
| Eklenti yok (tarayıcı) | Sessizce eski `setInterval` yoluna düşer |
| Bildirim izni reddedildi | Ana anahtar açılmaz, ayarlara yönlendiren uyarı |
| Vakit tablosu eksik/kısa | Elde kaç gün varsa o kadarı kurulur |
| Kuyruk kurulurken hata | Toast gösterilir, ayar geri alınmaz; bir sonraki açılışta tekrar denenir |

### Test

`bildirimListesiUret` saf fonksiyon olduğu için eklenti olmadan, tarayıcı
konsolunda test edilir:

- Sessiz saatlere denk gelen bildirimin kanalı `sessiz` mi
- Gün bütçesi aktif tür sayısına göre doğru daralıyor mu, toplam 400'ü aşıyor mu
- ID'ler çakışıyor mu
- Ramazan modu kapalıyken sahur/iftar bildirimi üretilmiyor mu
- Kapalı bir vakit için ne vakit ne önceden bildirimi üretilmiyor mu
- Cuma bildirimi yalnızca cuma günlerine düşüyor mu

---

## Aşama 2 — Wear OS

> **Uygulamaya geçerken kapsam daraldı (2026-08-11).** Compose for Wear OS
> Kotlin zorunlu kılıyor; proje tamamen Java ve Gradle 9.6.1 + AGP 9.3.1 +
> Java 25 kombinasyonu çok yeni (Aşama 1'de bunun Capacitor'ın varsayılan
> Gradle'ını kırdığını gördük). Kotlin araç zincirini eklemek ayrı bir sürüm
> riski. Complication ve tile ise saf Java ile yazılabiliyor ve en çok bakılan
> iki yüzey bunlar.
>
> Bu yüzden **tam saat uygulaması (vakitler, kıble, tesbih) ertelendi.**
> Uygulanacak kapsam: Data Layer senkronu + complication + tile, hepsi Java.
> Planı: `docs/superpowers/plans/2026-08-11-wear-os-complication-tile.md`
>
> Plan ayrıca "sıradaki vakit hangisi" mantığını `:ortak` adlı paylaşılan bir
> Java modülüne çıkarıyor — bugün `VakitWidget.java` içinde gömülü ve saat de
> aynı hesaba ihtiyaç duyuyor. İki kopya zamanla ayrışırdı; ayrıca ortak modül
> JUnit ile test edilebiliyor.

### Bilinen risk

Test cihazı henüz yok. Emülatör arayüzü, tile'ı ve complication'ı doğrular;
**pusulayı (manyetometre), pil davranışını ve telefon-saat senkron gecikmesini
doğrulayamaz.** Bu üçü planda ayrı bir doğrulama adımı olarak durur ve cihaz
geldiğinde yapılır.

### Yapı

`android/wear/` ayrı bir Gradle modülü. Telefon uygulamasıyla **aynı
`applicationId` ve aynı imza** — Play Store saat sürümünü telefon uygulamasıyla
birlikte dağıtabilsin diye. Capacitor saatte çalışmaz; saf **Kotlin + Compose
for Wear OS**.

### Veri akışı

Vakit hesabı tek yerde (web tarafındaki `vakitAl`) kalır. Telefon zaten 30
günlük vakti `bv_widget` anahtarına yazıyor (`index.html:2226`).
`MainActivity`'ye ekleme: aynı JSON `DataClient` ile `/vakit` yoluna da yazılır.

Saat bu veriyi alıp kendi yerel deposuna kaydeder. Böylece **saat telefondan
uzaktayken de** son senkronla doğru çalışır. Saat kendi vakit hesabını asla
yapmaz.

### Üç yüzey

- **Complication** — kadran üzerinde. İki tip sağlanır: `SHORT_TEXT`
  (ör. "İkindi · 16:39") ve `RANGED_VALUE` (kalan süreyi yay olarak gösterir).
  En sık bakılan yer, en ucuz iş — önce bu yapılır.
- **Tile** — kadranın yanından kaydırınca gelen kart. Üstte sıradaki vakit ve
  kalan süre, altında günün altı vakti; ramazan modunda iftar geri sayımı öne
  çıkar. ProtoLayout ile çizilir.
- **Uygulama** — üç ekran: **Vakitler** (altı vakit + kalan süre), **Kıble**
  (manyetometre; yoksa güneşe göre yöntem), **Tesbih** (döner çerçeve veya
  dokunma ile sayım, her sayımda haptic).

Bildirimler için saat tarafında ek iş yoktur — Wear OS eşlenmiş telefonun
bildirimlerini otomatik gösterir, yani Aşama 1 bitince vakit bildirimleri
saatte de görünür.

---

## Uygulama sırası

**Aşama 1**

1. `@capacitor/local-notifications` + `@capacitor/haptics` kurulumu, `ezan.ogg`
2. `bildirimListesiUret()` saf fonksiyon + testleri
3. `bildirimKur()` — kanallar, kuyruk, gün bütçesi
4. Arayüz: vakit başına önceden uyarı, ana anahtar, sessiz saatler, ses
   kısayolları, pil kartı; `A.onceden` migrasyonu
5. Yerel eklenti: `pilAyariAc()`, `kanalAyariAc()`
6. Haptics geçişi ve titreşim anahtarının anlamının daraltılması
7. Widget'ta iftar geri sayımı; widget receiver `exported="true"` düzeltmesi —
   şu an `TIME_SET`, `TIMEZONE_CHANGED`, `DATE_CHANGED` örtük yayınları
   receiver'a hiç ulaşmıyor (`AndroidManifest.xml:31`)
8. Sürüm yükseltme (`versionCode`, `versionName` → 0.10.0+), derleme, cihazda
   doğrulama

**Aşama 2**

9. `wear/` modülü iskeleti, ortak imza
10. Data Layer senkronu (telefon yazar, saat okur ve saklar)
11. Complication (iki tip)
12. Tile
13. Uygulama: Vakitler → Kıble → Tesbih
14. Emülatörde doğrulama; cihaz gelince pusula, pil ve senkron doğrulaması

## Bu tasarımın kapsamadığı işler

- APK simgelerinin yeni logodan yenilenmesi — kullanıcı Android Studio'da
  kendisi yapacak
- Widget'a şehir adı eklemek
