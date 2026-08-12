# Wear OS: Complication ve Tile Uygulama Planı (Aşama 2)

> **Ajan çalışanlar için:** GEREKLİ ALT BECERİ: Bu planı görev görev uygulamak için
> superpowers:subagent-driven-development (önerilir) veya superpowers:executing-plans
> kullanın. Adımlar takip için onay kutusu (`- [ ]`) sözdizimi kullanır.

**Hedef:** Beş Vakit, eşlenmiş Wear OS saatinde sıradaki namaz vaktini ve kalan
süreyi kadran üzerinde (complication) ve kaydır-eriş kartında (tile) göstersin.

**Mimari:** Saat kendi vakit hesabını yapmaz. Telefon zaten 30 günlük vakti
`bv_widget` anahtarına yazıyor; aynı JSON Data Layer ile saate de gönderilir.
Saat onu yerel olarak saklar ve yalnızca "hangisi sırada, kaç dakika kaldı"
hesabını çizim anında yapar — böylece saat telefondan uzaktayken de çalışır.
"Sıradaki vakit" mantığı bugün `VakitWidget.java` içinde; saat de aynı şeye
ihtiyaç duyduğu için ortak bir modüle çıkarılır ve JUnit ile test edilir.

**Teknoloji:** Java (Kotlin yok — bkz. karar notu), Data Layer API
(`play-services-wearable`), ProtoLayout tabanlı Tiles, ComplicationDataSource.

**Tasarım belgesi:** `docs/superpowers/specs/2026-08-11-bildirim-ve-saat-design.md` §Aşama 2

---

## Kapsam kararı — neden Kotlin yok

Tasarım belgesi Kotlin + Compose for Wear OS diyordu. Uygulamaya geçerken kapsam
daraltıldı:

- **Compose for Wear OS Kotlin zorunlu kılar.** Proje bugün tamamen Java, ve
  Gradle 9.6.1 + AGP 9.3.1 + Java 25 kombinasyonu çok yeni — Aşama 1'de bunun
  Capacitor'ın varsayılan Gradle'ını kırdığını gördük. Kotlin araç zincirini bu
  üçlüye eklemek ayrı bir sürüm savaşı riski.
- **Complication ve tile saf Java ile yazılabilir** ve en çok bakılan iki yüzey
  bunlar.

Bu yüzden **tam saat uygulaması (vakitler ekranı, kıble, tesbih) bu plana dahil
değil.** Saatte complication ve tile çalıştıktan sonra, gerçekten gerekiyorsa
ayrı bir iş olarak Kotlin eklenip yazılır.

**Bildirimler için saat tarafında iş yok** — Wear OS eşlenmiş telefonun
bildirimlerini otomatik gösterir, yani Aşama 1 bittiği için vakit bildirimleri
saatte zaten görünüyor.

---

## Ön koşul — bu plana başlamadan önce

**Aşama 1 gerçek telefonda doğrulanmış olmalı.** Saat tarafı aynı `bv_widget`
verisini kullanıyor; orada bir sorun varsa saat işi de boşa gider. Özellikle
şunun doğrulanmış olması gerekir: uygulama kapalıyken bildirim geliyor ve
widget doğru vakti gösteriyor.

**Test cihazı:** Wear OS saati henüz yok. Emülatör arayüzü, tile'ı ve
complication'ı doğrular; **telefon-saat senkron gecikmesini ve pil davranışını
doğrulayamaz.** Bu ikisi Görev 9'da ayrı bir doğrulama adımı olarak durur ve
cihaz gelince yapılır.

---

## Dosya yapısı

| Dosya | Sorumluluk | Durum |
|---|---|---|
| `android/settings.gradle` | `:ortak` ve `:wear` modüllerini dahil et | Değişir |
| `android/ortak/build.gradle` | Saf Java kütüphane modülü | Yeni |
| `android/ortak/src/main/java/.../VakitTablosu.java` | `bv_widget` JSON'unu çöz, sıradaki vakti ve kalan süreyi bul | Yeni |
| `android/ortak/src/test/java/.../VakitTablosuTest.java` | JUnit testleri | Yeni |
| `android/app/.../VakitWidget.java` | Kendi kopyası yerine `VakitTablosu`'nu kullan | Değişir |
| `android/app/.../SaatKopru.java` | Telefon: `bv_widget`'ı Data Layer'a yaz | Yeni |
| `android/app/.../MainActivity.java` | `SaatKopru`'yu tetikle | Değişir |
| `android/wear/build.gradle` | Wear uygulama modülü | Yeni |
| `android/wear/src/main/AndroidManifest.xml` | Wear manifest, servis kayıtları | Yeni |
| `android/wear/.../VakitAlici.java` | Saat: Data Layer'dan veriyi al ve sakla | Yeni |
| `android/wear/.../VakitDeposu.java` | Saat: yerel saklama ve okuma | Yeni |
| `android/wear/.../VakitComplication.java` | Kadran üzeri complication | Yeni |
| `android/wear/.../VakitTile.java` | Kaydır-eriş kartı | Yeni |

**`:ortak` modülü neden var:** "Sıradaki vakit hangisi, kaç dakika kaldı" mantığı
bugün `VakitWidget.java` içinde gömülü ve test edilemiyor. Saat de aynı hesabı
yapacak. İki kopya zamanla birbirinden ayrışır — bu projenin en baştaki ilkesi
"vakit kaynağı tek yerde" olduğu için ortak modüle çıkarılıyor. Yan faydası:
JUnit ile test edilebilir hale geliyor.

**Not:** `:ortak` saf Java kütüphanesidir (`java-library`), Android'e bağımlı
değildir — bu yüzden testleri emülatörsüz, saniyeler içinde çalışır. JSON çözümü
için `org.json` kullanılamaz (Android'e gömülü), bunun yerine küçük bir
bağımlılık eklenir; Görev 2 bunu ele alıyor.

---

## Görev 1: `:ortak` modülü iskeleti

**Dosyalar:**
- Değiştir: `C:\apk\besvakit-apk\android\settings.gradle`
- Oluştur: `C:\apk\besvakit-apk\android\ortak\build.gradle`

- [ ] **Adım 1: Modülü settings.gradle'a ekle**

`settings.gradle` içeriğini şununla değiştir:

```gradle
include ':app'
include ':ortak'
include ':capacitor-cordova-android-plugins'
project(':capacitor-cordova-android-plugins').projectDir = new File('./capacitor-cordova-android-plugins/')

apply from: 'capacitor.settings.gradle'
```

`:wear` sonra eklenecek (Görev 5).

- [ ] **Adım 2: Modülün build dosyasını yaz**

`android/ortak/build.gradle` oluştur:

```gradle
// Telefon (widget) ve saat (tile, complication) arasinda paylasilan vakit
// mantigi. Saf Java: Android'e bagimli degil, bu yuzden testleri emulatorsuz
// calisir. Vakit HESABI burada degil — o web tarafinda; burasi yalnizca
// telefonun yazdigi tabloyu okuyup "sirada hangisi var" sorusunu yanitlar.
apply plugin: 'java-library'

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

dependencies {
    // Android'in kendi org.json'u android.jar icinde hazir gelir. Burada
    // yalnizca derleme ve JVM testleri icin gerekiyor — APK'ya paketlenirse
    // gomulu surumle cakisir, o yuzden compileOnly.
    compileOnly 'org.json:json:20240303'
    testImplementation 'org.json:json:20240303'
    testImplementation 'junit:junit:4.13.2'
}
```

- [ ] **Adım 3: Modülün tanındığını doğrula**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :ortak:tasks --all
```

Beklenen: görev listesi basılır, `test` görevi görünür. Hata alırsan
`java-library` eklentisinin Gradle 9.6.1 ile uyumsuz olması beklenmez — hata
gelirse **dur ve bildir**, sürüm ayarlamasına girme.

---

## Görev 2: `VakitTablosu` — sıradaki vakti bulan saf sınıf

**Dosyalar:**
- Oluştur: `android/ortak/src/main/java/com/kamilsaim/besvakit/ortak/VakitTablosu.java`
- Test: `android/ortak/src/test/java/com/kamilsaim/besvakit/ortak/VakitTablosuTest.java`

Bu, `VakitWidget.java` içindeki `bugununVakitleri` + `sonraki` + `kalanYazi`
mantığının test edilebilir hâli.

- [ ] **Adım 1: Başarısız testi yaz**

`VakitTablosuTest.java` oluştur:

```java
package com.kamilsaim.besvakit.ortak;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

import org.junit.Test;

public class VakitTablosuTest {

    /** Telefonun yazdigi bicimin aynisi: alti sayi = gece yarisindan dakika. */
    private static final String JSON =
        "{\"sehir\":\"Kayseri\",\"yazan\":\"2026-08-11\"," +
        "\"gunler\":{" +
        "\"2026-08-11\":[236,334,769,999,1195,1285]," +
        "\"2026-08-12\":[237,335,769,999,1194,1284]}," +
        "\"ramazan\":[\"2026-08-12\"]}";

    @Test
    public void bozukVeriNullDoner() {
        assertNull(VakitTablosu.coz(null));
        assertNull(VakitTablosu.coz(""));
        assertNull(VakitTablosu.coz("{bu json degil"));
    }

    @Test
    public void sehirOkunur() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        assertEquals("Kayseri", t.sehir());
    }

    @Test
    public void gununVakitleriOkunur() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        VakitTablosu.Gun g = t.gun("2026-08-11");
        assertEquals(236, g.vakit[0]);   // imsak
        assertEquals(1285, g.vakit[5]);  // yatsi
        assertFalse(g.ramazan);
    }

    @Test
    public void ramazanGunuIsaretlenir() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        assertTrue(t.gun("2026-08-12").ramazan);
    }

    @Test
    public void olmayanGunNullDoner() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        assertNull(t.gun("2030-01-01"));
    }

    @Test
    public void siradakiVaktiBulur() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        // 10:00 = 600 dk; sirada ogle (769 dk = 12:49)
        VakitTablosu.Sonraki s = t.sonraki("2026-08-11", 600);
        assertEquals(2, s.indeks);
        assertEquals("Öğle", s.ad);
        assertEquals(769, s.dakika);
        assertEquals(169, s.kalan);
        assertFalse(s.yarin);
    }

    @Test
    public void vaktinTamUzerindeSonrakineGecer() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        // Tam ogle vaktinde (769) sirada ikindi olmali — gecmis vakit gosterilmez
        VakitTablosu.Sonraki s = t.sonraki("2026-08-11", 769);
        assertEquals(3, s.indeks);
        assertEquals("İkindi", s.ad);
    }

    @Test
    public void yatsidanSonraYarininImsakinaSarar() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        // 23:00 = 1380 dk, yatsi (1285) gecti; sirada yarinin imsaki (237)
        VakitTablosu.Sonraki s = t.sonraki("2026-08-11", 1380);
        assertEquals(0, s.indeks);
        assertEquals("İmsak", s.ad);
        assertTrue(s.yarin);
        // (1440 - 1380) + 237 = 297
        assertEquals(297, s.kalan);
    }

    @Test
    public void yarinYoksaBugununImsakinaDuser() {
        // Tek gunluk tablo: yarin bilinmiyor
        String tek = "{\"sehir\":\"X\",\"gunler\":{\"2026-08-11\":[236,334,769,999,1195,1285]}}";
        VakitTablosu t = VakitTablosu.coz(tek);
        VakitTablosu.Sonraki s = t.sonraki("2026-08-11", 1380);
        assertTrue(s.yarin);
        assertEquals(0, s.indeks);
        assertEquals((1440 - 1380) + 236, s.kalan);
    }

    @Test
    public void eksikVakitAtlanir() {
        // 0 = hesaplanamayan vakit isareti (web tarafi boyle yaziyor)
        String eksik = "{\"gunler\":{\"2026-08-11\":[236,334,0,999,1195,1285]}}";
        VakitTablosu t = VakitTablosu.coz(eksik);
        // 10:00'da ogle eksik oldugu icin sirada ikindi olmali
        VakitTablosu.Sonraki s = t.sonraki("2026-08-11", 600);
        assertEquals(3, s.indeks);
        assertEquals("İkindi", s.ad);
    }

    @Test
    public void olmayanGunIcinSonrakiNullDoner() {
        VakitTablosu t = VakitTablosu.coz(JSON);
        assertNull(t.sonraki("2030-01-01", 600));
    }

    @Test
    public void kalanSureyiYazar() {
        assertEquals("şimdi", VakitTablosu.kalanYazi(0));
        assertEquals("1 dk", VakitTablosu.kalanYazi(1));
        assertEquals("59 dk", VakitTablosu.kalanYazi(59));
        assertEquals("1 sa", VakitTablosu.kalanYazi(60));
        assertEquals("1 sa 1 dk", VakitTablosu.kalanYazi(61));
        assertEquals("2 sa 14 dk", VakitTablosu.kalanYazi(134));
    }

    @Test
    public void saatiYazar() {
        assertEquals("00:00", VakitTablosu.saat(0));
        assertEquals("03:56", VakitTablosu.saat(236));
        assertEquals("12:49", VakitTablosu.saat(769));
        assertEquals("23:59", VakitTablosu.saat(1439));
    }
}
```

- [ ] **Adım 2: Testi çalıştır, başarısız olduğunu gör**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :ortak:test
```

Beklenen: BAŞARISIZ — `VakitTablosu` sınıfı yok, derleme hatası.

- [ ] **Adım 3: Sınıfı yaz**

`VakitTablosu.java` oluştur:

```java
package com.kamilsaim.besvakit.ortak;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Telefonun yazdigi 30 gunluk vakit tablosunu okur ve "sirada hangi vakit var,
 * kac dakika kaldi" sorusunu yanitlar.
 *
 * Vakit HESABI burada degil. Hesap tek yerde, web tarafindaki vakitAl'da —
 * once Diyanet takvimi, yoksa astronomik hesap. Telefon sonucu bv_widget
 * anahtarina yazar, hem ana ekran widget'i hem saat burayi kullanir. Boylece
 * iki ayri hesap birbirinden ayrisamaz.
 *
 * Saf Java: Android'e bagimli degil, testleri emulatorsuz calisir.
 */
public final class VakitTablosu {

    public static final String[] ADLAR = { "İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı" };

    /** Akşam vaktinin indeksi — ramazanda "İftar" olarak gosterilir. */
    public static final int AKSAM = 4;

    public static final class Gun {
        public final int[] vakit;      // gece yarisindan dakika, ADLAR sirasiyla
        public final boolean ramazan;
        Gun(int[] vakit, boolean ramazan) { this.vakit = vakit; this.ramazan = ramazan; }
    }

    public static final class Sonraki {
        public String ad;
        public int indeks;
        public int dakika;    // vaktin kendi saati, gece yarisindan dakika
        public int kalan;     // kac dakika kaldi
        public boolean yarin; // bugunun vakitleri bitti, yarina sardik
    }

    private final String sehir;
    private final Map<String, Gun> gunler = new HashMap<>();

    private VakitTablosu(String sehir) { this.sehir = sehir; }

    public String sehir() { return sehir; }

    public Gun gun(String anahtar) { return gunler.get(anahtar); }

    /**
     * bv_widget JSON'unu cozer. Bozuk veya eksik veride null doner —
     * cagiran taraf "veri yok" durumunu gosterir, cokmez.
     */
    public static VakitTablosu coz(String ham) {
        if (ham == null || ham.length() == 0) return null;
        try {
            JSONObject kok = new JSONObject(ham);
            JSONObject g = kok.optJSONObject("gunler");
            if (g == null) return null;

            VakitTablosu t = new VakitTablosu(kok.optString("sehir", "Beş Vakit"));

            JSONArray ram = kok.optJSONArray("ramazan");

            java.util.Iterator<String> it = g.keys();
            while (it.hasNext()) {
                String anahtar = it.next();
                JSONArray dizi = g.optJSONArray(anahtar);
                if (dizi == null || dizi.length() < 6) continue;

                int[] vakit = new int[6];
                for (int i = 0; i < 6; i++) vakit[i] = dizi.optInt(i, 0);

                boolean ramazan = false;
                if (ram != null) {
                    for (int i = 0; i < ram.length(); i++) {
                        if (anahtar.equals(ram.optString(i))) { ramazan = true; break; }
                    }
                }
                t.gunler.put(anahtar, new Gun(vakit, ramazan));
            }
            return t.gunler.isEmpty() ? null : t;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Verilen gun ve dakikada sirada hangi vakit var?
     * Gun tablosunda yoksa null. Bugunun vakitleri bittiyse yarinin imsakina
     * sarar; yarin da bilinmiyorsa bugunun imsakini kullanir (vakitler gunden
     * gune birkac dakika oynar, bir gunluk sapma kabul edilebilir).
     */
    public Sonraki sonraki(String gunAnahtari, int simdiDk) {
        Gun g = gunler.get(gunAnahtari);
        if (g == null) return null;

        Sonraki s = new Sonraki();
        for (int i = 0; i < 6; i++) {
            // 0 = hesaplanamayan vakit isareti, gercek gece yarisi degil
            if (g.vakit[i] != 0 && g.vakit[i] > simdiDk) {
                s.ad = ADLAR[i]; s.indeks = i; s.dakika = g.vakit[i];
                s.kalan = g.vakit[i] - simdiDk; s.yarin = false;
                return s;
            }
        }

        Gun yarin = gunler.get(ertesiGun(gunAnahtari));
        int imsak = (yarin != null && yarin.vakit[0] != 0) ? yarin.vakit[0] : g.vakit[0];
        s.ad = ADLAR[0]; s.indeks = 0; s.dakika = imsak;
        s.kalan = (1440 - simdiDk) + imsak; s.yarin = true;
        return s;
    }

    /** 'YYYY-MM-DD' -> ertesi gunun anahtari. */
    static String ertesiGun(String anahtar) {
        try {
            String[] p = anahtar.split("-");
            java.util.Calendar c = java.util.Calendar.getInstance();
            c.clear();
            c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            c.add(java.util.Calendar.DAY_OF_MONTH, 1);
            return String.format(Locale.US, "%04d-%02d-%02d",
                    c.get(java.util.Calendar.YEAR),
                    c.get(java.util.Calendar.MONTH) + 1,
                    c.get(java.util.Calendar.DAY_OF_MONTH));
        } catch (Exception e) {
            return "";
        }
    }

    /** Gece yarisindan dakika -> 'HH:MM'. */
    public static String saat(int dk) {
        int d = ((dk % 1440) + 1440) % 1440;
        return String.format(Locale.US, "%02d:%02d", d / 60, d % 60);
    }

    /** Kalan dakika -> '2 sa 14 dk' gibi kisa metin. */
    public static String kalanYazi(int dk) {
        if (dk <= 0) return "şimdi";
        int sa = dk / 60, d = dk % 60;
        if (sa == 0) return d + " dk";
        if (d == 0) return sa + " sa";
        return sa + " sa " + d + " dk";
    }
}
```

- [ ] **Adım 4: Testi çalıştır, geçtiğini gör**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :ortak:test
```

Beklenen: `BUILD SUCCESSFUL`, 13 test geçer. Rapor:
`ortak\build\reports\tests\test\index.html`

Bir test düşerse **testi değiştirme** — `VakitTablosu`'nu düzelt. Testler
davranışın tanımı.

---

## Görev 3: Widget'ı ortak modüle geçir

**Dosyalar:**
- Değiştir: `android/app/build.gradle`
- Değiştir: `android/app/src/main/java/com/kamilsaim/besvakit/VakitWidget.java`

Amaç: `VakitWidget` artık kendi JSON çözümünü ve sıradaki-vakit hesabını
yapmasın, `VakitTablosu`'nu kullansın. Böylece saat ile telefon aynı mantığı
paylaşır.

- [ ] **Adım 1: Bağımlılığı ekle**

`android/app/build.gradle` içindeki `dependencies` bloğuna ekle:

```gradle
    implementation project(':ortak')
```

- [ ] **Adım 2: Widget'ı uyarla**

`VakitWidget.java` içinde şunları **sil**: `Gun` iç sınıfı, `Sonraki` iç sınıfı,
`sonraki(Gun)` metodu, `bugununVakitleri(Context)` metodunun JSON çözen gövdesi,
`ADLAR` sabiti, `saat(int)` ve `kalanYazi(int)` yardımcıları — hepsinin
karşılığı `VakitTablosu`'nda var.

Yerine `bugununVakitleri` şu hâle gelir:

```java
    private static VakitTablosu tabloOku(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return VakitTablosu.coz(sp.getString(KEY, null));
    }

    private static String bugunAnahtar() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.US, "%04d-%02d-%02d",
                c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    private static int simdiDk() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }
```

Çizim yapan yerlerde (`tamGorunum`, `kompaktGorunum`) kullanım şu şekle döner:

```java
        VakitTablosu t = tabloOku(context);
        String bugun = bugunAnahtar();
        VakitTablosu.Sonraki s = (t == null) ? null : t.sonraki(bugun, simdiDk());
        VakitTablosu.Gun g = (t == null) ? null : t.gun(bugun);

        if (s == null || g == null) {
            // veri yok — kullaniciyi uygulamayi acmaya yonlendir
            rv.setTextViewText(R.id.wEtiket, "BEŞ VAKİT");
            rv.setTextViewText(R.id.wVakit, "—");
            rv.setTextViewText(R.id.wKalan, "Vakitleri yüklemek için dokun");
        } else {
            boolean iftarMi = g.ramazan && s.indeks == VakitTablosu.AKSAM && !s.yarin;
            rv.setTextViewText(R.id.wEtiket, t.sehir().toUpperCase(new Locale("tr", "TR")));
            rv.setTextViewText(R.id.wVakit, iftarMi ? "İftar" : s.ad);
            rv.setTextViewText(R.id.wSaat, VakitTablosu.saat(s.dakika));
            rv.setTextViewText(R.id.wKalan,
                (iftarMi ? "İftara " : "") + VakitTablosu.kalanYazi(s.kalan)
                + (s.yarin ? " (yarın)" : ""));
        }
```

Altı vaktin listelendiği bölümde `g.vakit[i]` ve `VakitTablosu.ADLAR[i]`
kullanılır; "içinde bulunulan vakit altın renkte" mantığı `s.indeks` ile
korunur. **Mevcut görünümü değiştirme** — yalnızca veri kaynağını değiştir.

- [ ] **Adım 3: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`

- [ ] **Adım 4: Widget'ın bozulmadığını doğrula**

APK'yı telefona kur, ana ekrandaki widget'a bak:
- [ ] Sıradaki vakit, saati ve kalan süre doğru
- [ ] Şehir adı başlıkta
- [ ] Altı vakit listesi doğru, içinde bulunulan vakit altın renkte
- [ ] Widget'ı yeniden boyutlandır, kompakt düzen de doğru
- [ ] Veri yokken "Vakitleri yüklemek için dokun" yazısı çıkıyor
      (test için: uygulama verilerini temizle, widget'ı ekle, uygulamayı açma)

**Bu adım atlanamaz.** Çalışan bir widget'ı refactor ediyoruz; testler ortak
sınıfı doğruluyor ama çizim kodunu doğrulamıyor.

---

## Görev 4: Telefon → saat veri köprüsü

**Dosyalar:**
- Değiştir: `android/app/build.gradle`
- Oluştur: `android/app/src/main/java/com/kamilsaim/besvakit/SaatKopru.java`
- Değiştir: `android/app/src/main/java/com/kamilsaim/besvakit/MainActivity.java`

- [ ] **Adım 1: Data Layer bağımlılığını ekle**

`android/app/build.gradle` `dependencies` bloğuna ekle:

```gradle
    implementation 'com.google.android.gms:play-services-wearable:18.2.0'
```

- [ ] **Adım 2: Sürümün çözüldüğünü doğrula**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :app:dependencies --configuration debugRuntimeClasspath
```

Beklenen: çıktıda `play-services-wearable:18.2.0` görünür ve `FAILED` yazmaz.
Çözülmezse **dur ve bildir** — sürümü kendi kafana göre değiştirme.

- [ ] **Adım 3: Köprüyü yaz**

`SaatKopru.java` oluştur:

```java
package com.kamilsaim.besvakit;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;

/**
 * Telefonda hazir olan 30 gunluk vakit tablosunu saate gonderir.
 *
 * Ayri bir hesap yapilmaz: web tarafi zaten ayni JSON'u bv_widget anahtarina
 * yaziyor (ana ekran widget'i icin). Burada o hazir JSON aynen Data Layer'a
 * kopyalanir. Saat onu yerel olarak saklar, boylece telefondan uzaktayken de
 * calisir.
 */
public final class SaatKopru {

    private static final String PREFS = "CapacitorStorage";
    private static final String KEY   = "bv_widget";
    private static final String YOL   = "/vakit";
    private static final String ALAN  = "tablo";

    private SaatKopru() { }

    public static void gonder(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String ham = sp.getString(KEY, null);
            if (ham == null || ham.length() == 0) return;

            PutDataMapRequest istek = PutDataMapRequest.create(YOL);
            istek.getDataMap().putString(ALAN, ham);
            // Icerik ayni kalsa bile saatin yeniden cizmesi icin zaman damgasi
            istek.getDataMap().putLong("zaman", System.currentTimeMillis());

            PutDataRequest hazir = istek.asPutDataRequest();
            hazir.setUrgent();
            Wearable.getDataClient(context).putDataItem(hazir);
        } catch (Exception ignored) {
            // Saat eslenik degilse veya Play Services yoksa sessizce gec
        }
    }
}
```

- [ ] **Adım 4: MainActivity'den tetikle**

`MainActivity.java` içindeki `onPause` metodunu bul (widget'ı yenileyen yer) ve
`SaatKopru.gonder` çağrısını ekle:

```java
    @Override
    public void onPause() {
        super.onPause();
        try { VakitWidget.hepsiniYenile(this); } catch (Exception ignored) { }
        try { SaatKopru.gonder(this); } catch (Exception ignored) { }
    }
```

Uygulamadan çıkarken gönderilir — web tarafı o sırada `bv_widget`'ı yazmış olur.
Bu, widget'ın çalıştığı andaki mantığın aynısı.

- [ ] **Adım 5: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`. Telefonda hiçbir davranış değişmemeli — saat
eşlenik değilse `gonder` sessizce döner.

---

## Görev 5: `:wear` modülü iskeleti

**Dosyalar:**
- Değiştir: `android/settings.gradle`
- Oluştur: `android/wear/build.gradle`
- Oluştur: `android/wear/src/main/AndroidManifest.xml`
- Oluştur: `android/wear/src/main/res/values/strings.xml`

- [ ] **Adım 1: Modülü ekle**

`settings.gradle` içine `include ':ortak'` satırının altına ekle:

```gradle
include ':wear'
```

- [ ] **Adım 2: Wear build dosyasını yaz**

`android/wear/build.gradle` oluştur:

```gradle
apply plugin: 'com.android.application'

android {
    namespace = "com.kamilsaim.besvakit.wear"
    compileSdk = rootProject.ext.compileSdkVersion

    defaultConfig {
        // Telefon uygulamasiyla AYNI applicationId olmali — Play Store saat
        // surumunu telefon surumuyle birlikte dagitabilsin diye.
        applicationId "com.kamilsaim.besvakit"
        // Wear OS 3 (API 30). Tile ve complication API'leri bunun altinda yok.
        minSdkVersion 30
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "0.11.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation project(':ortak')
    implementation 'com.google.android.gms:play-services-wearable:18.2.0'
    implementation 'androidx.wear.tiles:tiles:1.4.1'
    implementation 'androidx.wear.protolayout:protolayout:1.2.1'
    implementation 'androidx.wear.protolayout:protolayout-material:1.2.1'
    implementation 'androidx.wear.watchface:watchface-complications-data-source:1.2.1'
}
```

> **Sürüm uyarısı:** Bu sürümler yazıldığı andaki kararlı sürümler. Çözülmezlerse
> Adım 4'te fark edilecek. **Kendi kafana göre sürüm değiştirme** — çözülmeyen
> bir bağımlılık olursa dur ve bildir.

`versionCode` telefon modülünden bağımsız ilerler; aynı `applicationId` ama ayrı
APK'lar.

- [ ] **Adım 3: Manifest ve metinleri yaz**

`android/wear/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Beş Vakit</string>
    <string name="tile_ad">Namaz vakitleri</string>
    <string name="tile_aciklama">Sıradaki vakit ve kalan süre</string>
    <string name="comp_ad">Sıradaki vakit</string>
</resources>
```

`android/wear/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-feature android:name="android.hardware.type.watch" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true">

        <!-- Saat telefonsuz da son senkronla calisir -->
        <meta-data
            android:name="com.google.android.wearable.standalone"
            android:value="false" />

    </application>
</manifest>
```

`standalone=false`: uygulama telefon olmadan kurulamaz, çünkü veriyi telefondan
alıyor. Servis kayıtları sonraki görevlerde eklenecek.

- [ ] **Adım 4: Simgeleri kopyala**

Wear modülünün kendi başlatıcı simgesine ihtiyacı var:

```powershell
cd C:\apk\besvakit-apk\android
New-Item -ItemType Directory -Force wear\src\main\res\mipmap-hdpi
New-Item -ItemType Directory -Force wear\src\main\res\mipmap-xhdpi
New-Item -ItemType Directory -Force wear\src\main\res\mipmap-xxhdpi
Copy-Item app\src\main\res\mipmap-hdpi\ic_launcher.png  wear\src\main\res\mipmap-hdpi\
Copy-Item app\src\main\res\mipmap-xhdpi\ic_launcher.png  wear\src\main\res\mipmap-xhdpi\
Copy-Item app\src\main\res\mipmap-xxhdpi\ic_launcher.png wear\src\main\res\mipmap-xxhdpi\
```

- [ ] **Adım 5: Derle ve bağımlılıkların çözüldüğünü doğrula**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :wear:assembleDebug
```

Beklenen: `BUILD SUCCESSFUL` ve `wear\build\outputs\apk\debug\wear-debug.apk`
oluşur. Bağımlılık çözülmezse **dur ve bildir**.

---

## Görev 6: Saat tarafında veri alma ve saklama

**Dosyalar:**
- Oluştur: `android/wear/src/main/java/com/kamilsaim/besvakit/wear/VakitDeposu.java`
- Oluştur: `android/wear/src/main/java/com/kamilsaim/besvakit/wear/VakitAlici.java`
- Değiştir: `android/wear/src/main/AndroidManifest.xml`

- [ ] **Adım 1: Depoyu yaz**

`VakitDeposu.java`:

```java
package com.kamilsaim.besvakit.wear;

import android.content.Context;
import android.content.SharedPreferences;

import com.kamilsaim.besvakit.ortak.VakitTablosu;

import java.util.Calendar;
import java.util.Locale;

/**
 * Telefondan gelen vakit tablosunu saatte saklar ve okur.
 *
 * Saklamanin sebebi: saat telefondan uzaktayken de dogru calissin. Telefon
 * 30 gunluk tabloyu bir kez gonderdiginde, saat bir ay boyunca telefonsuz
 * dogru vakti gosterebilir.
 */
public final class VakitDeposu {

    private static final String PREFS = "besvakit_wear";
    private static final String KEY   = "tablo";

    private VakitDeposu() { }

    public static void yaz(Context context, String ham) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().putString(KEY, ham).apply();
    }

    public static VakitTablosu oku(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return VakitTablosu.coz(sp.getString(KEY, null));
    }

    public static String bugunAnahtar() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.US, "%04d-%02d-%02d",
                c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    public static int simdiDk() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }

    /** Veri geldiginde iki yuzeyi de tazele. */
    public static void yuzeyleriTazele(Context context) {
        try {
            androidx.wear.tiles.TileService.getUpdater(context)
                    .requestUpdate(VakitTile.class);
        } catch (Exception ignored) { }
        try {
            new androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
                    .Builder(context, new android.content.ComponentName(context, VakitComplication.class))
                    .build()
                    .requestUpdateAll();
        } catch (Exception ignored) { }
    }
}
```

> **Not:** `ComplicationDataSourceUpdateRequester`'ın oluşturma biçimi kütüphane
> sürümüne göre değişebilir (`create(...)` statik metodu da olabilir). Derleme
> hatası alırsan kütüphanenin kendi kaynağına bak
> (`~\.gradle\caches\modules-2\files-2.1\androidx.wear.watchface\...`) ve doğru
> biçimi kullan; **tahmin etme.** Görev 7 ve 8 bitene kadar bu metodun gövdesini
> boş bırakıp sonra doldurmak da kabul edilebilir — o durumda bunu bildir.

- [ ] **Adım 2: Alıcıyı yaz**

`VakitAlici.java`:

```java
package com.kamilsaim.besvakit.wear;

import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.WearableListenerService;

/** Telefon vakit tablosunu gonderince saklar ve yuzeyleri tazeler. */
public class VakitAlici extends WearableListenerService {

    private static final String YOL  = "/vakit";
    private static final String ALAN = "tablo";

    @Override
    public void onDataChanged(DataEventBuffer olaylar) {
        for (DataEvent olay : olaylar) {
            if (olay.getType() != DataEvent.TYPE_CHANGED) continue;
            if (!YOL.equals(olay.getDataItem().getUri().getPath())) continue;

            String ham = DataMapItem.fromDataItem(olay.getDataItem())
                    .getDataMap().getString(ALAN);
            if (ham == null || ham.length() == 0) continue;

            VakitDeposu.yaz(this, ham);
            VakitDeposu.yuzeyleriTazele(this);
        }
    }
}
```

- [ ] **Adım 3: Manifest'e kaydet**

`android/wear/src/main/AndroidManifest.xml` içindeki `<application>` bloğuna,
`<meta-data>` etiketinin altına ekle:

```xml
        <service
            android:name=".VakitAlici"
            android:exported="true">
            <intent-filter>
                <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
                <data android:scheme="wear" android:host="*" android:pathPrefix="/vakit" />
            </intent-filter>
        </service>
```

`exported="true"` gerekli — yayını Play Services gönderiyor, uygulama değil.

- [ ] **Adım 4: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :wear:assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`. `yuzeyleriTazele` içindeki sınıflar henüz yoksa
derleme hata verir — o durumda Görev 7 ve 8 bitene kadar o metodun gövdesini
geçici olarak boş bırak ve bunu bildir.

---

## Görev 7: Complication — kadran üzeri

**Dosyalar:**
- Oluştur: `android/wear/src/main/java/com/kamilsaim/besvakit/wear/VakitComplication.java`
- Değiştir: `android/wear/src/main/AndroidManifest.xml`

İki tip sağlanır: `SHORT_TEXT` ("İkindi 16:39" gibi) ve `RANGED_VALUE` (kalan
süreyi yay olarak gösterir).

- [ ] **Adım 1: Sınıfı yaz**

```java
package com.kamilsaim.besvakit.wear;

import androidx.wear.watchface.complications.data.ComplicationData;
import androidx.wear.watchface.complications.data.ComplicationText;
import androidx.wear.watchface.complications.data.ComplicationType;
import androidx.wear.watchface.complications.data.PlainComplicationText;
import androidx.wear.watchface.complications.data.RangedValueComplicationData;
import androidx.wear.watchface.complications.data.ShortTextComplicationData;
import androidx.wear.watchface.complications.datasource.ComplicationRequest;
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService;

import com.kamilsaim.besvakit.ortak.VakitTablosu;

/**
 * Kadran uzerinde siradaki vakit.
 *  - SHORT_TEXT : "İkindi" + "16:39"
 *  - RANGED_VALUE: kalan sureyi yay olarak; vakit girdikce yay dolar
 *
 * Hesap cizim aninda yapilir, veri telefondan gelen tablodan okunur.
 */
public class VakitComplication
        extends androidx.wear.watchface.complications.datasource.ComplicationDataSourceService {

    @Override
    public void onComplicationRequest(ComplicationRequest istek,
                                      ComplicationRequestListener dinleyici) {
        try {
            dinleyici.onComplicationData(uret(istek.getComplicationType()));
        } catch (Exception e) {
            try { dinleyici.onComplicationData(null); } catch (Exception ignored) { }
        }
    }

    @Override
    public ComplicationData getPreviewData(ComplicationType tip) {
        return kisaMetin("İkindi", "16:39");
    }

    private ComplicationData uret(ComplicationType tip) {
        VakitTablosu t = VakitDeposu.oku(this);
        String bugun = VakitDeposu.bugunAnahtar();
        VakitTablosu.Sonraki s = (t == null) ? null : t.sonraki(bugun, VakitDeposu.simdiDk());

        if (s == null) return kisaMetin("—", "aç");

        VakitTablosu.Gun g = t.gun(bugun);
        boolean iftarMi = g != null && g.ramazan
                && s.indeks == VakitTablosu.AKSAM && !s.yarin;
        String ad = iftarMi ? "İftar" : s.ad;

        if (tip == ComplicationType.RANGED_VALUE) {
            // Yay: bir vakitten digerine gecen surenin ne kadari doldu.
            // Ust sinir olarak 12 saat alinir — vakit araliklari bundan kisadir,
            // boylece yay her zaman anlamli bir doluluk gosterir.
            float enFazla = 720f;
            float kalan = Math.min(s.kalan, enFazla);
            return new RangedValueComplicationData.Builder(
                        enFazla - kalan, 0f, enFazla,
                        metin(ad + " " + VakitTablosu.saat(s.dakika)))
                    .setText(metin(VakitTablosu.kalanYazi(s.kalan)))
                    .setTitle(metin(ad))
                    .build();
        }

        return kisaMetin(ad, VakitTablosu.saat(s.dakika));
    }

    private ComplicationData kisaMetin(String baslik, String metin) {
        return new ShortTextComplicationData.Builder(metin(metin), metin(baslik))
                .setTitle(metin(baslik))
                .build();
    }

    private static ComplicationText metin(String s) {
        return new PlainComplicationText.Builder(s).build();
    }
}
```

> **Not:** `ComplicationDataSourceService`'in tam paket adı ve
> `ShortTextComplicationData.Builder`'ın imzası kütüphane sürümüne göre
> değişebilir. Derleme hatası alırsan kütüphane kaynağına bak ve doğru imzayı
> kullan; **tahmin etme.** Yapı aynı kalmalı: veri yoksa "—", varsa ad + saat.

- [ ] **Adım 2: Manifest'e kaydet**

`<application>` bloğuna ekle:

```xml
        <service
            android:name=".VakitComplication"
            android:exported="true"
            android:label="@string/comp_ad"
            android:permission="com.google.android.wearable.permission.BIND_COMPLICATION_PROVIDER">
            <intent-filter>
                <action android:name="android.support.wearable.complications.ACTION_COMPLICATION_UPDATE_REQUEST" />
            </intent-filter>
            <meta-data
                android:name="android.support.wearable.complications.SUPPORTED_TYPES"
                android:value="SHORT_TEXT,RANGED_VALUE" />
            <!-- Dakikada bir tazelenmesi gerekmez; kalan sure dakika hassasiyetinde -->
            <meta-data
                android:name="android.support.wearable.complications.UPDATE_PERIOD_SECONDS"
                android:value="300" />
        </service>
```

- [ ] **Adım 3: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :wear:assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`

---

## Görev 8: Tile — kaydır-eriş kartı

**Dosyalar:**
- Oluştur: `android/wear/src/main/java/com/kamilsaim/besvakit/wear/VakitTile.java`
- Değiştir: `android/wear/src/main/AndroidManifest.xml`

Üstte sıradaki vakit ve kalan süre, altında günün altı vakti. Ramazanda iftar
öne çıkar.

- [ ] **Adım 1: Sınıfı yaz**

```java
package com.kamilsaim.besvakit.wear;

import androidx.wear.protolayout.ColorBuilders;
import androidx.wear.protolayout.DeviceParametersBuilders;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.kamilsaim.besvakit.ortak.VakitTablosu;

/**
 * Kadranin yanindan kaydirinca gelen kart: siradaki vakit, kalan sure ve
 * gunun alti vakti. Vakit hesabi yapilmaz — telefondan gelen tablo okunur.
 */
public class VakitTile extends TileService {

    private static final String SURUM = "1";
    private static final int ALTIN  = 0xFFD8A93C;
    private static final int KAGIT  = 0xFFF2EEE2;
    private static final int HAYALET= 0xFF8A8578;

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(
            RequestBuilders.TileRequest istek) {
        return Futures.immediateFuture(
            new TileBuilders.Tile.Builder()
                .setResourcesVersion(SURUM)
                // 5 dakikada bir tazele — kalan sure dakika hassasiyetinde
                .setFreshnessIntervalMillis(300000L)
                .setTileTimeline(
                    TimelineBuilders.Timeline.fromLayoutElement(
                        govde(istek.getDeviceConfiguration())))
                .build());
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(
            RequestBuilders.ResourcesRequest istek) {
        return Futures.immediateFuture(
            new ResourceBuilders.Resources.Builder()
                .setVersion(SURUM)
                .build());
    }

    private LayoutElementBuilders.LayoutElement govde(
            DeviceParametersBuilders.DeviceParameters cihaz) {

        VakitTablosu t = VakitDeposu.oku(this);
        String bugun = VakitDeposu.bugunAnahtar();
        VakitTablosu.Sonraki s = (t == null) ? null : t.sonraki(bugun, VakitDeposu.simdiDk());

        LayoutElementBuilders.Column.Builder sutun =
            new LayoutElementBuilders.Column.Builder();

        if (s == null) {
            sutun.addContent(yazi("Beş Vakit", 16, KAGIT));
            sutun.addContent(yazi("Telefonda uygulamayı aç", 12, HAYALET));
            return sutun.build();
        }

        VakitTablosu.Gun g = t.gun(bugun);
        boolean iftarMi = g != null && g.ramazan
                && s.indeks == VakitTablosu.AKSAM && !s.yarin;
        String ad = iftarMi ? "İftar" : s.ad;

        sutun.addContent(yazi(t.sehir().toUpperCase(new java.util.Locale("tr","TR")), 11, HAYALET));
        sutun.addContent(yazi(ad + "  " + VakitTablosu.saat(s.dakika), 22, ALTIN));
        sutun.addContent(yazi((iftarMi ? "İftara " : "") + VakitTablosu.kalanYazi(s.kalan)
                + (s.yarin ? " (yarın)" : ""), 13, KAGIT));

        // Gunun alti vakti — icinde bulunulan altin renkte
        if (g != null) {
            LayoutElementBuilders.Row.Builder satir = new LayoutElementBuilders.Row.Builder();
            for (int i = 0; i < 6; i++) {
                if (g.vakit[i] == 0) continue;
                int renk = (i == s.indeks && !s.yarin) ? ALTIN : HAYALET;
                satir.addContent(
                    new LayoutElementBuilders.Column.Builder()
                        .addContent(yazi(VakitTablosu.ADLAR[i].substring(0, 1), 10, renk))
                        .addContent(yazi(VakitTablosu.saat(g.vakit[i]), 11, renk))
                        .build());
            }
            sutun.addContent(satir.build());
        }

        return sutun.build();
    }

    private LayoutElementBuilders.Text yazi(String metin, int boyut, int renk) {
        return new LayoutElementBuilders.Text.Builder()
            .setText(metin)
            .setFontStyle(
                new LayoutElementBuilders.FontStyle.Builder()
                    .setSize(androidx.wear.protolayout.DimensionBuilders.sp(boyut))
                    .setColor(ColorBuilders.argb(renk))
                    .build())
            .build();
    }
}
```

> **Not:** ProtoLayout API'si sürümler arasında en çok değişen kısım. Derleme
> hatası alırsan kütüphane kaynağına bak ve doğru sınıf/metot adlarını kullan;
> **tahmin etme.** Düzenin özü değişmemeli: şehir, sıradaki vakit büyük punto,
> kalan süre, altında altı vakit.

- [ ] **Adım 2: Manifest'e kaydet**

`<application>` bloğuna ekle:

```xml
        <service
            android:name=".VakitTile"
            android:exported="true"
            android:label="@string/tile_ad"
            android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER">
            <intent-filter>
                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />
            </intent-filter>
            <meta-data
                android:name="androidx.wear.tiles.PREVIEW"
                android:resource="@mipmap/ic_launcher" />
        </service>
```

- [ ] **Adım 3: `yuzeyleriTazele`'yi tamamla**

Görev 6 Adım 1'de bu metot geçici olarak boş bırakıldıysa, artık `VakitTile` ve
`VakitComplication` var — gövdeyi doldur ve derle.

- [ ] **Adım 4: Derle**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :wear:assembleDebug
```

Beklenen: `BUILD SUCCESSFUL` ve `wear\build\outputs\apk\debug\wear-debug.apk`

---

## Görev 9: Doğrulama

- [ ] **Adım 1: Ortak modülün testleri geçiyor**

```powershell
cd C:\apk\besvakit-apk\android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat :ortak:test
```

Beklenen: `BUILD SUCCESSFUL`, 13 test.

- [ ] **Adım 2: Her iki APK da derleniyor**

```powershell
.\gradlew.bat assembleDebug :wear:assembleDebug
```

Beklenen: `BUILD SUCCESSFUL`, iki APK üretilir.

- [ ] **Adım 3: Wear OS emülatöründe doğrula**

Android Studio → Device Manager → Create Device → Wear OS Small Round (API 30+).
Emülatörü başlat, telefon emülatörüyle eşle (Android Studio'da
`adb -s <wear> forward tcp:5601 tcp:5601` ile), her iki APK'yı kur.

- [ ] Telefon uygulamasını aç ve kapat (veri gönderilsin)
- [ ] Saatte kadranı uzun bas → complication ekle → "Sıradaki vakit" listede
- [ ] Complication doğru vakti ve saati gösteriyor
- [ ] RANGED_VALUE tipini destekleyen bir kadranda yay görünüyor
- [ ] Kaydır → tile listede, ekle → sıradaki vakit ve altı vakit doğru
- [ ] Telefonda şehri değiştir, uygulamayı kapat → saatte veri güncelleniyor
- [ ] Saatte veri hiç yokken tile "Telefonda uygulamayı aç" diyor
      (test için: saatte uygulama verilerini temizle)

- [ ] **Adım 4: Gerçek cihazda doğrulama — saat gelince**

Emülatörün doğrulayamadıkları:

- [ ] **Senkron gecikmesi:** telefonda uygulamayı kapattıktan sonra saat kaç
      saniyede güncelleniyor
- [ ] **Telefonsuz çalışma:** telefonu kapat/uzaklaştır, saat hâlâ doğru vakti
      gösteriyor mu (30 günlük tablo saklandığı için göstermeli)
- [ ] **Pil:** tile ve complication tazeleme aralıkları pili gözle görülür
      şekilde tüketiyor mu; tüketiyorsa `UPDATE_PERIOD_SECONDS` ve
      `setFreshnessIntervalMillis` artırılmalı
- [ ] **Gün dönümü:** gece yarısını geçince saat yarının vakitlerine geçiyor mu

- [ ] **Adım 5: OKUBENI.md'yi güncelle**

`C:\apk\besvakit-apk\OKUBENI.md` içine yeni bir bölüm ekle: saat modülünün ne
olduğu, `:ortak` modülünün neden var olduğu, iki APK'nın nasıl derlendiği, ve
tam saat uygulamasının (Kotlin + Compose) neden ertelendiği.

Ayrıca §7 "Sıradaki iş" bölümünü güncelle — artık sıradaki iş tam saat
uygulaması.

---

## Bu planın kapsamadığı işler

- **Tam saat uygulaması** (vakitler ekranı, kıble, tesbih) — Kotlin + Compose
  gerektiriyor, ayrı bir iş.
- **Play Store imzası.** Proje şu an debug anahtarıyla derleniyor. Saat ve
  telefon APK'ları aynı anahtarla imzalanmalı; yan yüklemede debug anahtarı
  ikisinde de aynı olduğu için sorun çıkmaz, ama Play Store'a çıkılacaksa
  gerçek bir `signingConfig` gerekir.
- **Saat için ayrı simge tasarımı** — telefon simgesi kopyalanıyor.
