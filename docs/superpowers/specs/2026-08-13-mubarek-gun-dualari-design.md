# Mübarek gün ve gece duaları — tasarım

**Tarih:** 2026-08-13 · **Sürüm hedefi:** 0.14.0

## Amaç

Hicri takvimde belirli ay, gün ve gecelere mahsus dualar var: Muharrem'in ilk on
günü, Aşûre, Safer, Receb, Regaib, Mirac, Berat, Kadir, iftar, senenin sonu,
Arefe, bayram geceleri, Cuma. Uygulama hicri tarihi zaten biliyor
(`hicriParcala`) ve `DINI` dizisiyle kandilleri hesaplıyor. Eksik olan, o zamana
girildiğinde **okunacak metnin kullanıcının önüne gelmesi** ve o ay/gece
girdiğinde **hatırlatılması**.

**Kaynak:** Ramazanoğlu Mahmud Sâmi, *Dualar ve Zikirler*, Erkam Yayınları
(İstanbul, h. 1446 / m. 2025). Her duanın altında kitabın sayfa numarası künye
olarak yazılır. Kitabın tamamı çoğaltılmaz; yalnızca zamana bağlı bölümdeki
dualar alınır.

## Yapı

Cuma ve Ramazan modlarıyla aynı desen: veri + saf mantık ayrı dosyada, DOM
`index.html`'de.

```
dualar.js   (YENİ, saf, node --test edilebilir)
  BV_DUALAR         17 duanın metni + hangi zamana düştüğü kuralı
  bvDuaKuralUyar()  tek kural + gün bağlamı -> boolean
  bvDuaListesi(ctx) o güne düşen duaların listesi
  bvDuaIlkGunMu()   bildirim için: bu gün, o vesilenin ilk günü mü

index.html
  duaBaglami(d)     Date -> {ay, gun, yarinAy, yarinGun, hafta}
  duaBugun()        bugüne düşen dualar (A.dua kapalıysa boş)
  duaCiz()          Vakitler sayfasındaki "Bugünün duaları" kutusu
  duaArsivCiz()     İbadet sayfasındaki tam liste (akordeon)
  duaGunleri()      30 günlük {tarih: uyarı metni} — bildirim.js'e girdi
  duaUyari(dk)      tarayıcı yolu, cumaUyari ile aynı desen

bildirim.js
  BV_TUR.dua = 31, ayar.dua / ayar.duaSaat / ayar.duaGunleri
```

### Zaman kuralları

Her duanın `ne` alanı bir kural dizisidir (VEYA ile birleşir):

| Kural | Anlamı |
|---|---|
| `{t:'ay', ay:7}` | O hicri ay boyunca |
| `{t:'gun', ay:1, gun:1}` | O hicri günde |
| `{t:'aralik', ay:1, bas:1, son:10}` | Ay içindeki gün aralığında |
| `{t:'gece', ay:9, gun:27}` | O hicri günde **ve** bir gün öncesinde (gece ibadeti akşamdan başlar) |
| `{t:'hafta', gun:5}` | Haftanın o gününde (5 = Cuma) |
| `{t:'regaib'}` | Receb'in ilk cumasını başlatan perşembe akşamı ve cuma günü |
| `{t:'saferCarsamba'}` | Safer'in ilk ve son çarşambası |

`gece` kuralının iki gün tutması bilinçli: `DINI` dizisi kandilleri bir önceki
akşama yazıyor, uygulama da gün sınırını gece yarısında kabul ediyor. İki günde
göstermek, kullanıcının geceyi kaçırmamasını sağlar.

## Arayüz

1. **Vakitler sayfası — "Bugünün duaları" kutusu.** `#ramazanKutu` ve
   `#cumaKutu` ile birebir aynı desen: o gün hiçbir dua düşmüyorsa
   `display:none`. Satır başına ikon + ad + kısa açıklama. Satıra dokununca
   İbadet sekmesi açılır, arşiv bölümü açılır ve o dua genişletilir — mevcut
   `salavatBtn` davranışının aynısı.
2. **İbadet sayfası — "Mübarek gün duaları" katlanır bölümü.** 17 duanın tamamı
   hep durur; bugüne düşenler en üstte ve altın çerçeveli. Satır tıklanınca
   akordeon açılır: Arapça metin (sağdan sola, Scheherazade New), Türkçe meal,
   varsa okunuş tarifi, en altta `Dualar ve Zikirler, s. 119` künyesi.
   Vakitler sayfası zaten uzun; arşivin yeri zikirmatik ve Esmâ-ül Hüsnâ'nın
   yanı.
3. **Ayarlar.** "Bildirim ve görünüm" kartına iki alan: *Mübarek gün duaları*
   anahtarı (`A.dua`, açık) ve *Dua hatırlatma saati* (`A.duaSaat`, `09:00`).

## Bildirim

Yalnızca `bildir:true` işaretli dualar (ay girişleri, kandil geceleri, Aşûre,
Arefe, bayram gecesi, senenin sonu) ve yalnızca **vesilenin ilk gününde** uyarır
— Receb ayı boyunca her gün bildirim gitmez. `duaGunleri()` 30 günlük
`{'YYYY-MM-DD': 'metin'}` haritasını hicri hesapla üretir, `bildirim.js` bunu
`ramazanGunleri` gibi hazır alır; hicri mantık `index.html`'de kalır.

Kanal: mevcut `ozel` kanalı (Cuma ve kerahat). Yeni kanal açılmaz — kanal bir kez
oluşturulduktan sonra kod ile değiştirilemiyor, gereksiz kanal kalıcı çöp olur.

Tarayıcıda kuyruk yok: `duaUyari(dk)` `tikTak` içinden çağrılır, `cumaUyari` ile
aynı "günde bir kez" kilidini kullanır.

## Sınırlar

- **Latin okunuş yok.** Kitapta transkripsiyon yok; uydurmak yerine Arapça asıl
  metin + Türkçe meal veriliyor. Sonradan eklenebilir.
- **Hicri gün sınırı gece yarısı.** Uygulamanın her yerinde böyle; dualar da
  aynı kabulü kullanır, `gece` kuralı bunu iki güne yayarak telafi eder.
- **Ay 29'da mı biter 30'da mı** belirsizliği burada da var — Ümmülkura hesabı
  esas alınır, mevcut uyarı notu geçerli.

## Test

`araclar/dualar.test.cjs` — `node --test`. Kapsam: her kural tipi, Regaib'in
perşembe/cuma eşlemesi, `gece` kuralının iki günü tutması, ilk gün tespiti,
`A.dua` kapalıyken boş liste, her duanın zorunlu alanlarının dolu olması.
