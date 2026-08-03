<div align="center">

<img src="logos.png" alt="Beş Vakit" width="128">

# Beş Vakit

**Reklamsız, ücretsiz, internetsiz çalışan namaz vakti ve kıble uygulaması.**

[**→ Uygulamayı aç**](https://kamilsaim.github.io/besvakit/)

![sürüm](https://img.shields.io/badge/sürüm-0.3.0-22B2AE?style=flat-square)
![bağımlılık](https://img.shields.io/badge/bağımlılık-yok-D8A93C?style=flat-square)
![tek dosya](https://img.shields.io/badge/tek%20dosya-HTML-080C18?style=flat-square)

</div>

---

## Ne yapar

Namaz vakitlerini **cihazında hesaplar**. Hiçbir sunucuya vakit sorulmaz, hiçbir
API anahtarı gerekmez, hiçbir veri dışarı çıkmaz. Tek bir HTML dosyası; indir, aç, çalışır.

| | |
|---|---|
| **Vakitler** | Altı vakit, canlı geri sayım, gün şeridi, aylık imsakiye, kerahat vakitleri |
| **Ramazan** | İftar ve sahur geri sayımı, gün sayacı, oruç takibi |
| **Dini günler** | Kandiller, bayramlar, üç aylar — hicri takvimden otomatik |
| **Kıble** | Sekmeye girince başlayan pusula, kalibrasyon, uydu haritasında kıble hattı |
| **İbadet** | Namaz takibi, seri gün, aylık istatistik, kaza sayacı, zikirmatik |
| **Camiler** | 3 km çevrendeki camiler, yön ve yürüme mesafesiyle |
| **Bildirim** | Vakit girince ve istersen X dakika öncesinde uyarı, ses, titreşim |
| **Çevrimdışı** | Servis işçisiyle uygulama kabuğu; vakitler zaten cihazda hesaplanıyor |

## Nasıl hesaplıyor

PrayTimes ile aynı astronomik model, sıfırdan yazıldı, **bağımlılık yok**:

- Güneş konumu: ortalama anomali → görünen boylam → deklinasyon + zaman denklemi
- Ufuk açısı rakıma göre düzeltilir (`0.833 + 0.0347·√rakım`) — 1000 m'de ~4 dakika fark
- Varsayılan yöntem Diyanet (imsak 18°, yatsı 17°); MWL, ISNA, Mısır, Karaçi da var
- İkindi için Şâfiî/Diyanet ve Hanefî seçeneği

**Doğrulama** — 3 Ağustos 2026, Kayseri, 1050 m:
`03:56 / 05:35 / 12:44 / 16:35 / 19:53 / 21:24` — Diyanet ile 1-3 dakika içinde.

Mahalle caminle fark varsa Ayarlar → Dakika düzeltmesi'nden vakit başına ±30 dk hizalayabilirsin.
Bu bilinçli bir tercih: hiçbir gayriresmî API'ye bağımlı değiliz.

## Kıble

Büyük daire başlangıç açısı: `atan2(sin Δλ, cos φ₁·tan φ₂ − sin φ₁·cos Δλ)`
Kâbe `21.4224779, 39.8261722`. Kayseri → 166.6°, İstanbul → 151.6°.

Manyetik sapma için WMM katsayı tablosu gömmek yerine kullanıcıya bir kere ölçtürüyoruz:
haritadan doğrula, **"Şu an kıbleye bakıyorum"**a bas, uygulama telefonunun sapmasını
kalıcı olarak düzeltsin. Bu yaklaşım telefonun kendi manyetometre hatasını da kapsıyor.

## Gizlilik

- Konum cihazdan çıkmaz, hesap tarayıcıda yapılır
- Ayarlar yalnızca `localStorage`'da tutulur
- Sunucu, hesap, takip, analitik, reklam — hiçbiri yok
- Yalnızca **isteğe bağlı** olarak dışarı bağlanılan yerler: harita karoları (Esri / OpenStreetMap),
  cami araması (Overpass API), yazı tipleri (Google Fonts). Üçü de kapalıyken uygulama çalışmaya devam eder.

## Sürüm geçmişi

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
- [ ] Capacitor kabuk (APK) — uygulama kapalıyken de bildirim
- [ ] Gerçek ezan sesi
- [ ] Android ana ekran widget'ı
- [x] Açık tema ve AMOLED tema
- [x] Ramazan modu — iftar/sahur geri sayımı
- [x] Kerahat vakitleri uyarısı
- [ ] Cuma modu — salavat sayacı, Kehf hatırlatması
- [ ] Vakitleri Diyanet takvimiyle birebir hizalayan düzeltme tablosu
- [ ] Ayarları ve kayıtları dışa aktar / geri yükle

## Lisans

Henüz belirlenmedi.

Cami ve harita verisi © OpenStreetMap katkıcıları (ODbL) · Uydu görüntüsü Esri.
