# Beş Vakit — Proje Notları

Reklamsız, ücretsiz, internetsiz çalışan namaz vakti + kıble uygulaması.
Tek dosya HTML → GitHub Pages → Capacitor kabuk (APK/IPA) → widget.

**Durum:** v0.3.0 yayında → https://kamilsaim.github.io/besvakit/

---

## 1. Dosya ve kurulum

```
besvakit/
├── index.html          # uygulamanın tamamı
├── sw.js               # çevrimdışı kabuk (APK'da gereksiz)
├── logos.png           # favicon, manifest ikonu, marka
├── README.md           # GitHub vitrini
└── BESVAKIT.md         # bu dosya
```

```bash
git init
git add . && git commit -m "Beş Vakit v0.1"
git branch -M main
git remote add origin https://github.com/kamilsaim/besvakit.git
git push -u origin main
# GitHub → Settings → Pages → Source: main / root
```

**HTTPS zorunlu.** `file://` veya `http://` ile açılırsa pusula (DeviceOrientation),
konum (Geolocation) ve bildirim API'leri çalışmaz. GitHub Pages zaten HTTPS veriyor.

Yerel test için:
```bash
npx serve .            # http, pusula çalışmaz
npx local-ssl-proxy --source 8443 --target 3000   # veya ngrok/cloudflared ile https tünel
```

---

## 2. Mimari — dosya içindeki bölümler

Tek `<script>` bloğu, üç mantıksal katman:

| Bölüm | Ne yapar | Ana fonksiyonlar |
|---|---|---|
| Hesap motoru | Astronomik vakit + kıble | `julian`, `gunes`, `vakitleriHesapla`, `kibleAcisi` |
| Arayüz | Gökyüzü, geri sayım, liste, imsakiye | `gunuTazele`, `tikTak`, `seritCiz`, `gokyuzuCiz` |
| Dini günler | Hicri takvimden kandil/bayram | `hicriParcala`, `diniGunListesi`, `diniGunleriCiz` |
| İbadet | Namaz takibi, kaza, zikirmatik | `takipCiz`, `seriHesapla`, `istatistikCiz`, `tesbihArtir` |
| Donanım | Pusula, GPS, harita, Overpass | `pusulaBaslat`, `yonOlayi`, `haritaKur`, `camileriBul` |

**Global durum:** `A` (ayarlar), `TAKIP` (namaz/kaza), `ZIKIR`, `bugunVakit`, `kible`, `yon`.

**localStorage anahtarları:** `besvakit` (ayarlar), `besvakit_takip`, `besvakit_zikir`,
`besvakit_cami` (24 saatlik Overpass önbelleği). İbadet kayıtları ayarlardan ayrı tutuluyor —
zamanla büyüyen tek veri o, ayar okumasını yavaşlatmasın.

### Dini günler
Hicri tarihler `Intl.DateTimeFormat('...-u-ca-islamic-umalqura')` ile çözülür; bugünden
400 gün ileri taranıp tablodaki (ay, gün) çiftleri eşleştirilir, sonuç güne göre önbelleklenir.
Kandiller gece ibadeti olduğu için ilgili hicri günün **bir önceki akşamına** yazılır.
Regaib, Recep'in ilk cumasını bulup bir gün geri alarak hesaplanır.
Doğrulandı: Mevlid 24 Ağu 2026, Regaib 10 Ara 2026, Kurban Bayramı 16 May 2027.

> Ümmülkura ile Diyanet takvimi nadiren bir gün kayabilir; rasathane ilanı esastır.

### Vakit hesabı
PrayTimes ile aynı astronomik model, sıfırdan yazıldı, bağımlılık yok.

- Güneş konumu: ortalama anomali → görünen boylam → deklinasyon + zaman denklemi
- `aciZamani(jd, lat, açı, t, geri)` — güneşin belirli irtifaya geldiği saat
- `ikindiZamani(jd, lat, kat, t)` — gölge katsayısı 1 (Şâfiî/Diyanet) veya 2 (Hanefî)
- 3 tur iterasyon (1 tur yeterli, 3 tur kutup enlemlerinde daha stabil)
- Ufuk açısı: `0.833 + 0.0347·√rakım` — rakım Kayseri'de ~4 dk fark yaratıyor
- Diyanet = imsak 18°, yatsı 17°

**Doğrulama (3 Ağu 2026, Kayseri, 1050 m):**
`03:56 / 05:35 / 12:44 / 16:35 / 19:53 / 21:24` — Diyanet ile 1-3 dk içinde.

Fark kapatmak için Ayarlar → Dakika düzeltmesi (`A.duzeltme`, vakit başına ±30 dk).
Bu bilinçli bir tercih: hiçbir gayriresmi Diyanet API'sine bağımlı değiliz.

### Kıble
`atan2(sin Δλ, cos φ₁·tan φ₂ − sin φ₁·cos Δλ)` — büyük daire başlangıç açısı.
Kâbe: `21.4224779, 39.8261722`. Kayseri → 166.6°, İstanbul → 151.6° (bilinen değerle birebir).

### Pusula — dikkat edilenler
- **iOS:** `DeviceOrientationEvent.requestPermission()` mutlaka kullanıcı tıklamasıyla.
  `webkitCompassHeading` zaten **gerçek kuzey**, sapma düzeltmesi uygulanmaz.
- **Android:** `deviceorientationabsolute` → `heading = 360 − alpha + screen.orientation.angle`.
  `e.absolute` false ise manyetik kuzeye göredir.
- Yumuşatma: `yon += ((hedef − yon + 540) % 360 − 180) × 0.22` — 360° geçişinde sıçramaz.
- **Kalibrasyon:** "Şu an kıbleye bakıyorum" → `A.sapma = kible − yonHam`.
  Manyetik sapma tablosu (WMM) gömmek yerine kullanıcıya bir kere ölçtürüyoruz.
  Bu yaklaşım hem WMM'nin ~100 satırlık katsayı tablosundan kurtarıyor hem de
  telefonun kendi manyetometre hatasını da kapsıyor.

### Dış servisler (hepsi opsiyonel, düşerse uygulama çalışmaya devam eder)
| Servis | Kullanım | Anahtar |
|---|---|---|
| Esri World Imagery | Uydu tile | gerekmez |
| OpenStreetMap tile | Sokak görünümü | gerekmez |
| Overpass API | Yakındaki camiler | gerekmez, 2 uç nokta yedekli |
| Google Fonts | Antonio + Manrope | gerekmez, fallback var |

Leaflet CDN'den **tembel yükleniyor** — Harita sekmesine basılmadan indirilmiyor.

---

## 3. Tasarım kararları

- Renkler Selçuklu çini paleti: turkuaz `#22B2AE`, pirinç `#D8A93C`, lacivert `#080C18`
- Rakamlar `Antonio` (dar, dikey — minare hissi), metin `Manrope`
- **Gökyüzü:** arka plan gerçek vakte göre değişir (`GOK` sabiti). Dekorasyon değil —
  ekrana bakınca okumadan hangi vakitte olduğunu anlıyorsun.
- **Gün şeridi:** altı vakti gün içindeki gerçek oranına yerleştirir, turkuaz çizgi "şu an"
- `prefers-reduced-motion` destekli, `:focus-visible` görünür

---

## 4. Sıradaki adımlar

### 4.1 Capacitor kabuk (APK) — öncelik
```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npm i @capacitor/local-notifications @capacitor/haptics @capacitor/geolocation
npx cap init "Beş Vakit" com.kamilsaim.besvakit --web-dir=www
mkdir www && cp index.html www/
npx cap add android
npx cap sync
npx cap open android          # Android Studio → Build → Generate Signed APK
```

`capacitor.config.json`:
```json
{
  "appId": "com.kamilsaim.besvakit",
  "appName": "Beş Vakit",
  "webDir": "www",
  "android": { "allowMixedContent": false },
  "plugins": {
    "LocalNotifications": {
      "smallIcon": "ic_stat_besvakit",
      "iconColor": "#D8A93C",
      "sound": "ezan.wav"
    }
  }
}
```

**Yapılacak:**
- [ ] `LocalNotifications.schedule()` ile 30 günlük vakti önceden kuyruğa al
  (uygulama kapalıyken de çalışsın). Her açılışta yeniden kur.
- [ ] Gerçek ezan sesi: `android/app/src/main/res/raw/ezan.wav`
      (Diyanet yayınları veya archive.org'daki CC lisanslı kayıtlar — lisansı kontrol et)
- [ ] Ayarlarda ezan/bip/sessiz seçeneği
- [ ] `AndroidManifest.xml` → `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `VIBRATE`
- [ ] Android 13+ bildirim izni runtime'da isteniyor, akışa ekle

### 4.2 Android widget
WebView'la olmuyor, native `AppWidgetProvider` gerekiyor (~150 satır Kotlin).

```
android/app/src/main/
├── java/com/kamilsaim/besvakit/VakitWidget.kt
├── res/layout/widget_vakit.xml
└── res/xml/widget_info.xml
```

Yaklaşım: HTML tarafı hesapladığı 30 günlük vakti `Preferences` eklentisiyle
`SharedPreferences`'a yazar; widget oradan okur. Böylece hesap mantığı tek yerde kalır.
`AlarmManager` ile her vakit değişiminde `updateAppWidget` tetiklenir.

### 4.3 iOS
- IPA imzalama: ücretsiz Apple ID ile 7 günde bir yenileme (AltStore / Sideloadly)
- **Widget için Mac + Xcode + SwiftUI şart** — WebView ile mümkün değil
- Mac yoksa pratik yol: PWA olarak Ana Ekrana Ekle + Kısayollar otomasyonu
- [ ] Uygulamadan `.ics` dışa aktarma ekle (Kısayollar bunu tetikleyebilir)

### 4.4 İçerik fikirleri (sıraya alınabilir)
- [ ] Ramazan modu — iftar/sahur geri sayımı, imsakiye paylaşımı
- [ ] Kerahat vakitleri uyarısı (güneş doğuş/batış ±45 dk, istiva)
- [ ] Cuma hatırlatıcısı
- [ ] Kaza namazı sayacı
- [ ] Zikirmatik (Bereket'teki tasarım diliyle uyumlu)
- [ ] Çoklu şehir — memleket + bulunduğu yer aynı ekranda
- [ ] Camiye vakit girişinde "sessize al" hatırlatması

---

## 5. Bilinen sınırlar

- **Zaman dilimi** cihazdan alınıyor (`getTimezoneOffset`). Farklı zaman diliminde bir
  şehri elle seçersen vakitler cihaz saatine göre çıkar. Çok şehirli sürümde `tz` alanı gerekecek.
- **Kutup enlemleri** (|lat| > 48 civarı, yazın) imsak/yatsı hesaplanamaz → `--:--` gösterir.
  İhtiyaç olursa "en yakın gün" veya "gecenin 1/7'si" yöntemi eklenir.
- **PWA'da arka plan bildirimi yok.** Uygulama açıkken `setInterval` ile çalışır.
  Gerçek çözüm APK. iOS'ta PWA'da hiç olmaz.
- **Namaz takibi geçmişe dönük değil.** Yalnızca bugünü işaretleyebilirsin; dün unutulduysa
  telafi yok. İstenirse ızgaradaki güne dokununca o günü düzenleme eklenebilir.
- **Zikir sayacı zikir değişince sıfırlanır.** Günlük toplam korunur ama yarım kalan
  tesbih kaybolur. Bilinçli tercih; şikayet gelirse zikir başına sayaç tutulur.

---

## 6. Kod içinde hızlı referans

```js
A                              // ayarlar objesi, localStorage 'besvakit'
vakitleriHesapla(date, A)      // {imsak, gunes, ogle, ikindi, aksam, yatsi} — gece yarısından dk
kibleAcisi(lat, lng)           // derece, kuzeyden saat yönünde
saatYaz(dk)                    // 1234 → "20:34"
gunuTazele()                   // ayar değişince çağır, her şeyi yeniden çizer
sekmeAc('kible')               // vakit | kible | harita | ayar
toast('mesaj')
```

İsmi değiştirmek istersen: `const APP` sabiti + `<title>` + manifest + tabbar etiketleri.
