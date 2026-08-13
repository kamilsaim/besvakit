/* Beş Vakit — mübarek gün ve gecelerde okunacak dualar
   Kaynak: Ramazanoğlu Mahmud Sâmi, "Dualar ve Zikirler", Erkam Yayınları
   (İstanbul, h. 1446 - m. 2025). Her duanın `sayfa` alanı kitaptaki sayfasıdır.

   Burası saf mantıktır: DOM'a, localStorage'a, Capacitor eklentisine dokunmaz.
   İki işi var: (a) dua metinlerini tutmak, (b) verilen bir güne hangi duaların
   düştüğünü söylemek. Bu sayede Node ile eklentisiz test edilebilir.
   Arayüzü çizen ve bildirimi kuran katman index.html içindedir. */

/* Zaman kuralları — bir duanın `ne` dizisindeki kurallardan biri tutarsa o gün
   o dua okunur.

     {t:'ay',    ay:7}                  o hicri ay boyunca
     {t:'gun',   ay:1, gun:1}           o hicri günde
     {t:'aralik',ay:1, bas:1, son:10}   ay içindeki gün aralığında
     {t:'gece',  ay:9, gun:27}          o günde VE bir gün öncesinde
     {t:'hafta', gun:5}                 haftanın o gününde (0 pazar, 5 cuma)
     {t:'regaib'}                       Receb'in ilk cumasına bağlanan gece
     {t:'saferCarsamba'}                Safer'in ilk ve son çarşambası

   'gece' kuralının iki gün tutması bilinçli: gece ibadeti akşam namazıyla
   başlar ama uygulama gün sınırını gece yarısında kabul eder. İki güne yaymak,
   hicri günün akşamdan başlaması gerçeğini kullanıcı lehine telafi eder;
   DINI dizisinin kandilleri bir önceki akşama yazmasıyla da tutarlıdır. */

const BV_DUALAR = [
  {
    id: 'muharrem-1',
    ad: 'Senenin birinci günü',
    alt: '1 Muharrem — hicri yılbaşı',
    ikon: '◈',
    sayfa: 103,
    ne: [{ t: 'gun', ay: 1, gun: 1 }],
    bildir: true,
    uyari: 'Hicri yılın ilk günü — senenin birinci günü duası okunur',
    metin: [{
      adet: '3 kere',
      ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلَّمَ. اَللّٰهُمَّ أَنْتَ الْأَبَدِىُّ الْقَدِيمُ الْأَوَّلُ وَعَلَا فَضْلُكَ الْعَظِيمُ وَجُودُكَ الْعَمِيمُ الْمُعَوَّلُ وَهٰذِهِ عَامٌ جَدِيدٌ قَدْ أَقْبَلَ نَسْئَلُكَ الْعِصْمَةَ فِيهِ مِنَ الشَّيْطَانِ وَأَوْلِيَائِهِ وَجُنُودِهِ وَالْعَوْنَ عَلَى هٰذِهِ النَّفْسِ الْأَمَّارَةِ بِالسُّوءِ وَالْاِشْتِغَالَ بِمَا يُقَرِّبُنِى إِلَيْكَ زُلْفَى يَا ذَا الْجَلَالِ وَالْإِكْرَامِ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ النَّبِىِّ الْأُمِّىِّ وَعَلَى آلِهِ وَأَصْحَابِهِ الطَّيِّبِينَ الطَّاهِرِينَ وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
      meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eylesin! Allah’ım! Sen ebedîsin, Kadîm’sin, Evvel’sin. Fazl u ihsânın çok yücedir. Her şeyi kaplayan ve her şeyin sığınağı olan cömertliğin çok yücedir. Yeni yıl gelmiş bulunuyor. Bu sene içinde bizi şeytandan, onun dostlarından ve ordularından korumanı istiyoruz. Şu dâimâ kötülüğü emreden nefse karşı yardımını istiyoruz. Sana yaklaştıracak şeylerle meşgul olabilmem için yardımını istiyorum, ey Celâl ve İkrâm Sâhibi olan Allah’ım! Allah, ümmî nebî Efendimiz Muhammed’e, âline, mübarek ve temiz ashâbına salât eylesin! Hamd, âlemlerin Rabbi olan Allah’a mahsustur.'
    }],
    tarif: ['Senenin birinci gününde üç defa okunur.']
  },

  {
    id: 'muharrem-on',
    ad: 'Muharrem’in ilk on günü',
    alt: '1–10 Muharrem, sabahleyin',
    ikon: '◈',
    sayfa: 104,
    ne: [{ t: 'aralik', ay: 1, bas: 1, son: 10 }],
    bildir: true,
    uyari: 'Muharrem girdi — ayın ilk on günü sabahleyin okunacak dua var',
    metin: [{
      adet: '3 kere',
      ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ اَللّٰهُمَّ أَنْتَ الْأَبَدِىُّ الْقَدِيمُ الْحَيُّ الْكَرِيمُ الْحَنَّانُ الْمَنَّانُ وَهٰذِهِ سَنَةٌ جَدِيدَةٌ أَسْئَلُكَ فِيهَا الْعِصْمَةَ مِنَ الشَّيْطَانِ الرَّجِيمِ. وَالْعَوْنَ عَلَى هٰذِهِ النَّفْسِ الْأَمَّارَةِ بِالسُّوءِ وَالْاِشْتِغَالَ بِمَا يُقَرِّبُنِى إِلَيْكَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
      meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah’ım! Sen ebedîsin, Kadîm’sin, dirisin, Kerîm’sin, Hannân’sın, Mennân’sın. Bu yeni sene içinde beni ilâhî rahmetten kovulmuş şeytandan korumanı istiyorum. Şu dâimâ kötülüğü emreden nefse karşı yardımını istiyorum. Yine Sana yaklaştıracak şeylerle meşgul olabilmem için yardımını istiyorum, ey Celâl ve İkrâm Sâhibi olan Allah’ım! Rahmetinle lutfeyle ey merhametlilerin en merhametlisi!'
    }],
    tarif: [
      'Muharrem ayının ilk on gününde, özellikle birinci ve onuncu (Aşûre) günleri sabahleyin üç kere okunur.',
      'Bu duayı okuyanın gelecek senenin Muharrem ayına kadar bütün belâlardan muhafaza olunacağı rivâyet edilmiştir.'
    ]
  },

  {
    id: 'asure',
    ad: 'Aşûre günü',
    alt: '10 Muharrem',
    ikon: '◈',
    sayfa: 105,
    ne: [{ t: 'gun', ay: 1, gun: 10 }],
    bildir: true,
    uyari: 'Bugün Aşûre günü — oruç, sadaka ve Aşûre duası',
    metin: [
      {
        adet: '70 kere',
        ar: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ',
        meal: 'Allah bize yeter, O ne güzel vekîldir. Ne güzel Mevlâ ve ne güzel yardımcıdır.'
      },
      {
        adet: '7 kere',
        ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ سُبْحَانَ اللّٰهِ مِلْءَ الْمِيزَانِ وَمُنْتَهَى الْعِلْمِ وَمَبْلَغَ الرِّضَا وَزِنَةَ الْعَرْشِ لَا مَلْجَأَ وَلَا مَنْجَا مِنَ اللّٰهِ إِلَّا إِلَيْهِ سُبْحَانَ اللّٰهِ عَدَدَ الشَّفْعِ وَالْوَتْرِ وَعَدَدَ كَلِمَاتِ اللّٰهِ التَّامَّاتِ كُلِّهَا أَسْأَلُكَ السَّلَامَةَ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِىِّ الْعَظِيمِ وَهُوَ حَسْبِى نِعْمَ الْوَكِيلُ نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ. وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ خَيْرِ خَلْقِهِ وَعَلَى آلِهِ وَأَصْحَابِهِ أَجْمَعِينَ. آمِينَ.',
        meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah’ı mîzân dolusunca, ilimlerin nihâyet derecesiyle, râzı olacağı şekilde, Arş’ın ağırlığınca tesbih ederim. Allah’tan koruyacak hiçbir sığınak ve kurtuluş yolu yok, O’ndan yine O’na sığınılır. Çift ve tek olan şeyler adedince, Allah’ın bütün tam kelimeleri adedince O’nu tesbih ederim. Ey merhametlilerin en merhametlisi, rahmetinle bana selâmet vermeni istiyorum. Günahlardan korunmaya güç yetirmek ve taate kuvvet bulmak, ancak yüce ve Azîm olan Allah’ın tevfik ve yardımıyladır. O bana yeter, O ne güzel vekildir. Ne güzel Mevlâ ve ne güzel yardımcıdır. Allah, mahlûkâtın en hayırlısı olan Efendimiz Muhammed’e, âline ve ashâbına salât eylesin! Âmîn!'
      }
    ],
    tarif: [
      'Önce yetmiş defa “Hasbünallâhu ve ni‘mel-vekîl…”, sonra yedi defa yukarıdaki dua okunur.',
      'Aşûre orucu müekked sünnettir. Yahudilere benzememek için dokuzuncu ve onuncu, yahut onuncu ve onbirinci günler beraber tutulur.',
      'Bu günde eve bol erzak almak, muhtaçlara tasadduk etmek, komşu ve akrabaya ikramda bulunmak sene boyunca berekete vesiledir.'
    ]
  },

  {
    id: 'safer',
    ad: 'Safer ayı duaları',
    alt: 'Safer ayı boyunca',
    ikon: '◇',
    sayfa: 112,
    ne: [{ t: 'ay', ay: 2 }],
    bildir: true,
    uyari: 'Safer ayı girdi — selâm âyetleri ve Safer duası okunur',
    metin: [
      {
        ar: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
        meal: 'İlâhî rahmetten kovulmuş şeytandan Allah’a sığınırım. Rahmân ve Rahîm olan Allah’ın adıyla.'
      },
      {
        ar: 'سَلَامٌ عَلَيْكُمْ كَتَبَ رَبُّكُمْ عَلَى نَفْسِهِ الرَّحْمَةَ',
        meal: '“…Selâm size! Rabbiniz merhamet etmeyi kendisine yazdı…”', not: 'el-En’âm, 54'
      },
      {
        ar: 'سَلَامٌ عَلَيْكُمْ بِمَا صَبَرْتُمْ فَنِعْمَ عُقْبَى الدَّارِ',
        meal: '“Sabrettiğinize karşılık size selâm olsun! Dünya yurdunun sonu (cennet) ne güzeldir!”', not: 'er-Ra’d, 24'
      },
      {
        ar: 'سَلَامٌ عَلَيْكُمُ ادْخُلُوا الْجَنَّةَ بِمَا كُنْتُمْ تَعْمَلُونَ',
        meal: '“…Size selâm olsun. Yapmış olduğunuz (sâlih) amellere karşılık cennete girin!”', not: 'en-Nahl, 32'
      },
      {
        ar: 'وَسَلَامٌ عَلَيْهِ يَوْمَ وُلِدَ وَيَوْمَ يَمُوتُ وَيَوْمَ يُبْعَثُ حَيًّا',
        meal: '“Doğduğu gün, öleceği gün ve diri olarak kabirden kaldırılacağı gün ona (Hz. Îsâ’ya) selâm olsun!”', not: 'Meryem, 15'
      },
      {
        ar: 'وَالسَّلَامُ عَلَىَّ يَوْمَ وُلِدْتُ وَيَوْمَ أَمُوتُ وَيَوْمَ أُبْعَثُ حَيًّا',
        meal: '“Doğduğum gün, öleceğim gün ve diri olarak kabirden kaldırılacağım gün selâm banadır.”', not: 'Meryem, 33'
      },
      {
        ar: 'سَلَامٌ عَلَيْكَ سَأَسْتَغْفِرُ لَكَ رَبِّى إِنَّهُ كَانَ بِى حَفِيًّا',
        meal: '“(İbrahim babasına:) Selâm sana, dedi, Rabbimden senin için mağfiret dileyeceğim. Çünkü O, bana karşı çok lütufkârdır.”', not: 'Meryem, 47'
      },
      {
        ar: 'وَالسَّلَامُ عَلَى مَنِ اتَّبَعَ الْهُدٰى',
        meal: '“…Selâm hidâyete tâbî olanlaradır.”', not: 'Tâhâ, 47'
      },
      {
        ar: 'وَسَلَامٌ عَلَى عِبَادِهِ الَّذِينَ اصْطَفَى',
        meal: '“…Selâm olsun seçkin kıldığı kullarına!”', not: 'en-Neml, 59'
      },
      {
        ar: 'سَلَامٌ عَلَيْكُمْ لَا نَبْتَغِى الْجَاهِلِينَ',
        meal: '“«…Size selâm olsun. Biz kendini bilmezleri (arkadaş edinmek) istemeyiz» derler.”', not: 'el-Kasas, 55'
      },
      {
        ar: 'سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ',
        meal: '“Onlara merhametli Rabb’in söylediği selâm vardır.”', not: 'Yâsîn, 58'
      },
      {
        ar: 'سَلَامٌ عَلَى نُوحٍ فِى الْعَالَمِينَ إِنَّا كَذٰلِكَ نَجْزِى الْمُحْسِنِينَ إِنَّهُ مِنْ عِبَادِنَا الْمُؤْمِنِينَ',
        meal: '“Bütün âlemlerde Nûh’a selâm olsun! İşte biz muhsinleri böyle mükâfatlandırırız. Zira o, bizim mü’min kullarımızdan idi.”', not: 'es-Sâffât, 79-81'
      },
      {
        ar: 'سَلَامٌ عَلَىٓ إِبْرَاهِيمَ كَذٰلِكَ نَجْزِى الْمُحْسِنِينَ إِنَّهُ مِنْ عِبَادِنَا الْمُؤْمِنِينَ',
        meal: '“İbrahim’e selâm! dedik. Biz muhsinleri böyle mükâfatlandırırız. Çünkü o, bizim mü’min kullarımızdandır.”', not: 'es-Sâffât, 109-111'
      },
      {
        ar: 'سَلَامٌ عَلَى مُوسٰى وَهَارُونَ إِنَّا كَذٰلِكَ نَجْزِى الْمُحْسِنِينَ إِنَّهُمَا مِنْ عِبَادِنَا الْمُؤْمِنِينَ',
        meal: '“Mûsâ ve Hârûn’a selâm olsun. Doğrusu biz, muhsinleri böylece mükâfatlandırırız. Şüphesiz, ikisi de mü’min kullarımızdandı.”', not: 'es-Sâffât, 120-122'
      },
      {
        ar: 'سَلَامٌ عَلَىٓ إِلْيَاسِينَ إِنَّا كَذٰلِكَ نَجْزِى الْمُحْسِنِينَ إِنَّهُ مِنْ عِبَادِنَا الْمُؤْمِنِينَ',
        meal: '“Selâm olsun İlyâsîn’e! Şüphesiz biz, muhsinleri işte böyle mükâfatlandırırız. Çünkü o, bizim mü’min kullarımızdandı.”', not: 'es-Sâffât, 130-132'
      },
      {
        ar: 'وَسَلَامٌ عَلَى الْمُرْسَلِينَ',
        meal: '“Gönderilen bütün peygamberlere selâm olsun!”', not: 'es-Sâffât, 181'
      },
      {
        ar: 'سَلَامٌ عَلَيْكُمْ طِبْتُمْ فَادْخُلُوهَا خَالِدِينَ',
        meal: '“…Selâm size! Tertemiz geldiniz. Artık ebedî kalmak üzere girin buraya.”', not: 'ez-Zümer, 73'
      },
      {
        ar: 'سَلَامٌ هِىَ حَتّٰى مَطْلَعِ الْفَجْرِ',
        meal: '“O gece, selâm doludur. Tâ fecrin doğuşuna kadar.”', not: 'el-Kadr, 5'
      },
      {
        ar: 'اَللّٰهُمَّ بَارِكْ فِى شَهْرِ الصَّفَرِ وَاخْتِمْ لَنَا بِالسَّعَادَةِ وَالظَّفَرِ',
        meal: 'Allah’ım! Safer ayını mübârek kıl, bizlere onu saâdetle ve zaferle/kazançlarla bitirmeyi nasîb eyle!'
      },
      {
        ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ عَبْدِكَ وَنَبِيِّكَ وَرَسُولِكَ وَعَلَى آلِهِ وَبَارِكْ وَسَلِّمْ. اَللّٰهُمَّ إِنِّى أَعُوذُ بِكَ مِنْ شَرِّ هٰذَا الْيَوْمِ وَمِنْ كُلِّ شِدَّةٍ وَبَلَاءٍ وَبَلِيَّةٍ الَّتِى فِيهِ وَيَكُونُ فِى عِلْمِكَ يَا دَهْرُ يَا دِيَارُ يَا كَيْنَانُ يَا كَيْنُونُ يَا أَوَّلُ يَا أَبَدُ يَا مُبْدِئُ يَا مُعِيدُ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ يَا ذَا الْعَرْشِ الْمَجِيدِ أَنْتَ تَفْعَلُ مَا تُرِيدُ. اَللّٰهُمَّ احْرُسْنِى بِعَيْنِكَ الَّتِى لَا تَنَامُ فِى نَفْسِى وَمَالِى وَأَوْلَادِى وَدِينِى وَدُنْيَاىَ الَّتِى ابْتَلَيْتَنِى بِصُحْبَتِهِمْ بِحُرْمَةِ الْأَبْرَارِ وَالْأَخْيَارِ بِرَحْمَتِكَ يَا عَزِيزُ يَا غَفَّارُ يَا سَتَّارُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ. اَللّٰهُمَّ يَا شَدِيدَ الْقُوَى يَا شَدِيدُ يَا عَزِيزُ يَا كَرِيمُ يَا كَبِيرُ يَا مُتَعَالُ ذَلَّلْتَ بِعِزَّتِكَ جَمِيعَ خَلْقِكَ يَا مُحْسِنُ يَا مُجْمِلُ يَا مُتَفَضِّلُ يَا مُنْعِمُ يَا مُكْرِمُ لَا إِلٰهَ إِلَّا أَنْتَ. اَللّٰهُمَّ يَا لَطِيفُ لَطَفْتَ بِخَلْقِكَ السَّمٰوَاتِ وَالْأَرْضِ الْطُفْ بِنَا فِى قَضَائِكَ وَعَافِنَا مِنْ بَلَائِكَ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِكَ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِىِّ الْعَظِيمِ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلَّمَ.',
        meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah’ım! Kulun, peygamberin, rasûlün Muhammed’e ve âline salât u selâm eyle ve onları mübârek kıl! Allah’ım, bugünün şerrinden, bugünde ve Sen’in ilminde bulunan her türlü şiddet, belâ ve musîbetlerden Sana sığınırım. Yâ Dehr, yâ Diyâr, yâ Keynân, yâ Keynûn, yâ Evvel, yâ Ebed, yâ Mübdi’, yâ Muîd, yâ Ze’l-Celâli ve’l-İkrâm, ey şerefli Arş’ın sahibi, Sen istediğin her şeyi yaparsın. Allah’ım, ebrâr ve seçkin kulların hürmetine hiçbir zaman uyumayan gözünle beni, kendileriyle beraber yaşamakla beni imtihan ettiğin malımı, evlâdımı, dînimi ve dünyamı koruyup kolla, rahmetinle ey Azîz, ey Ğaffâr, ey Kerîm, ey Settâr, rahmetinle ey merhametlilerin en merhametlisi! Allah’ım, ey pek güçlü ve kuvvetli olan, ey Şedîd, ey Azîz, ey Kerîm, ey Kebîr, ey Müteâl, izzetinle ve yüceliğinle bütün mahlûkâta boyun eğdirdin, yâ Muhsin, yâ Mücmil, yâ Mütefaddıl, yâ Mün’im, yâ Mükrim, Sen’den başka ilâh yoktur. Allah’ım, yâ Latîf, semâları ve arzı yaratarak lütufta bulundun, hakkımızda vereceğin hüküm ve takdirlerinde bize de lutufkâr davran, bize âfiyet vererek belâlardan sâlim kıl, güç ve kuvvet ancak Sen’in yardımınladır, rahmetinle lutfeyle ey merhametlilerin en merhametlisi! Allah bize yeter ve O ne güzel vekildir. Güç ve kuvvet ancak yüce ve azamet sahibi Allah’ın tevfîki iledir. Allah, Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eylesin!'
      }
    ],
    tarif: ['Selâm âyetleri ve Safer duası, ay boyunca okunur.']
  },

  {
    id: 'safer-carsamba',
    ad: 'Safer’in ilk ve son çarşambası',
    alt: 'Yeryüzüne inecek belâlardan muhafaza için',
    ikon: '◇',
    sayfa: 117,
    ne: [{ t: 'saferCarsamba' }],
    bildir: true,
    uyari: 'Safer’in çarşambası — dört rekât nafile ve Salât-ı Münciye',
    metin: [{
      ar: 'إِنَّكَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ',
      meal: 'Şüphesiz Sen her şeye kâdirsin/her şeye gücün yeter.'
    }],
    tarif: [
      'İlk çarşamba gecesi, sabah namazından evvel dört rekât nafile kılınır: birinci rekâtta Fâtiha’dan sonra onyedi Kevser, ikincide beş İhlâs, üçüncüde bir Felâk, dördüncüde bir Nâs okunup selâm verilir ve dua edilir.',
      'Son çarşambanın gecesi veya gündüzü iki rekât namaz kılınır; her iki rekâtta Fâtiha’dan sonra onbir İhlâs okunur. Namazdan sonra yedi defa istiğfar edilip el kaldırılır, onbir defa Salât-ı Münciye ve sonlarında “İnneke alâ külli şey’in kadîr” okunur.',
      'Kaynak: el-Cevâhiru’l-Hams, s. 19-20.'
    ]
  },

  {
    id: 'recep',
    ad: 'Receb ayı duası',
    alt: 'Receb-i Şerîf girdiğinde — üç aylar başlar',
    ikon: '◈',
    sayfa: 119,
    ne: [{ t: 'ay', ay: 7 }],
    bildir: true,
    uyari: 'Receb ayı girdi — üç aylar başladı, Receb duası okunur',
    metin: [{
      ar: 'اَللّٰهُمَّ بَارِكْ لَنَا فِى رَجَبٍ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ',
      meal: 'Ey Rabbim! Bize Receb’i ve Şa’ban’ı mübarek kıl ve bizi Ramazan’a ulaştır.',
      not: 'İbn Hanbel, I, 259'
    }],
    tarif: ['Receb ayının birinden Ramazan-ı Şerif sonuna kadar her gün biner adet kelime-i tevhid okunmalıdır.']
  },

  {
    id: 'regaib',
    ad: 'Leyle-i Regâib',
    alt: 'Receb’in ilk cuma gecesi',
    ikon: '✦',
    sayfa: 119,
    ne: [{ t: 'regaib' }],
    bildir: true,
    uyari: 'Bu gece Regaib Kandili — Regâib namazı ve duaları',
    metin: [
      {
        adet: '70 kere',
        ar: 'اَللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ النَّبِىِّ الْأُمِّىِّ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ',
        meal: 'Allah’ım, ümmî nebî Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eyle!'
      },
      {
        adet: 'secdede 70 kere',
        ar: 'سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ',
        meal: 'Bizim Rabbimiz, Rûh’un ve melâike-i kirâmın Rabbi, bütün kusurlardan münezzeh ve cümle eksikliklerden pâk ve yücedir.'
      },
      {
        adet: 'otururken 70 kere',
        ar: 'رَبِّ اغْفِرْ وَارْحَمْ وَتَجَاوَزْ عَمَّا تَعْلَمُ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
        meal: 'Rabbim, beni mağfiret et, bana rahmet et, bildiğin bütün kusurlarımdan geç, onları bağışla, şüphesiz Sen en yüce ve en kerîmsin.'
      }
    ],
    tarif: [
      'Regâib gecesinden evvelki perşembe günü oruç tutulur; akşam birkaç lokma iftar edilip akşam namazından sonra, iki rekâtta bir selâm vermek üzere oniki rekât nafile namaz kılınır.',
      'Her rekâtta Fâtiha’dan sonra üç kere Kadir ve oniki kere İhlâs sûresi okunur; yahut bir kere Kadir ve üç kere İhlâs okunur.',
      'Namaz tamam olunca yetmiş kere salât u selâm, sonra secdede yetmiş kere “Sübbûhun Kuddûsün…”, secdeden kalkıp otururken yetmiş kere “Rabbiğfir verham…”, tekrar secde edilip yine yetmiş kere “Sübbûhun Kuddûsün…” okunur.',
      'Sonra secdede iken dünyevî ve uhrevî ne hâceti varsa Hak Teâlâ’dan niyaz edilir.'
    ]
  },

  {
    id: 'mirac',
    ad: 'Mi’rac gecesi namazı',
    alt: '27 Receb gecesi',
    ikon: '✦',
    sayfa: 121,
    ne: [{ t: 'gece', ay: 7, gun: 27 }],
    bildir: true,
    uyari: 'Bu gece Mi’rac Kandili — oniki rekât nafile ve tesbih',
    metin: [{
      adet: '100 kere',
      ar: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ',
      meal: 'Allah’ı tesbih ederim/bütün noksan sıfatlardan tenzih ederim, hamd Allah’a mahsustur, Allah’tan başka ilâh yoktur, Allah en büyüktür.'
    }],
    tarif: [
      'Receb-i Şerîf’in yirmiyedinci gecesinde oniki rekât nafile namaz kılınması müstahsen görülmüştür. Her rekâtta Fâtiha’dan sonra başka bir sûre okunur, iki rekâtta bir selâm verilir.',
      'Sonra yüz kere yukarıdaki zikir, yüz kere istiğfar, yüz kere de salât ve selâm okunur.',
      'Gündüzünde de oruçlu bulunmalıdır.'
    ]
  },

  {
    id: 'berat',
    ad: 'Berât duası',
    alt: '15 Şaban gecesi',
    ikon: '✦',
    sayfa: 122,
    ne: [{ t: 'gece', ay: 8, gun: 15 }],
    bildir: true,
    uyari: 'Bu gece Berat Kandili — üç Yâsîn ve Berât duası',
    metin: [{
      ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ اَللّٰهُمَّ يَا ذَا الْمَنِّ وَلَا يُمَنُّ عَلَيْهِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ يَا ذَا الطَّوْلِ وَالْإِنْعَامِ لَا إِلٰهَ إِلَّا أَنْتَ ظَهْرَ اللَّاجِئِينَ وَجَارَ الْمُسْتَجِيرِينَ وَأَمَانَ الْخَائِفِينَ. اَللّٰهُمَّ إِنْ كُنْتَ كَتَبْتَنِى عِنْدَكَ فِى أُمِّ الْكِتَابِ شَقِيًّا أَوْ مَحْرُومًا أَوْ مَطْرُودًا أَوْ مُقَتَّرًا عَلَىَّ فِى الرِّزْقِ فَامْحُ اَللّٰهُمَّ بِفَضْلِكَ شَقَاوَتِى وَحِرْمَانِى وَطَرْدِى وَإِقْتَارَ رِزْقِى وَأَثْبِتْنِى عِنْدَكَ فِى أُمِّ الْكِتَابِ سَعِيدًا وَمَرْزُوقًا وَمُوَفَّقًا لِلْخَيْرَاتِ فَإِنَّكَ قُلْتَ وَقَوْلُكَ الْحَقُّ فِى كِتَابِكَ الْمُنْزَلِ عَلَى لِسَانِ نَبِيِّكَ الْمُرْسَلِ «يَمْحُو اللّٰهُ مَا يَشَاءُ وَيُثْبِتُ وَعِنْدَهُ أُمُّ الْكِتَابِ» إِلٰهِى بِالتَّجَلِّى الْأَعْظَمِ فِى لَيْلَةِ النِّصْفِ مِنْ شَعْبَانَ الْمُكَرَّمِ الَّتِى «فِيهَا يُفْرَقُ كُلُّ أَمْرٍ حَكِيمٍ» وَيُبْرَمُ أَنْ تَكْشِفَ عَنَّا مِنَ الْبَلَاءِ مَا نَعْلَمُ وَمَا لَا نَعْلَمُ وَمَا أَنْتَ بِهِ أَعْلَمُ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلَّمَ.',
      meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah’ım, ey ihsân ve ikram sahibi olan ve kendisine ihsan edilemeyen, ey Celâl ve İkrâm Sahibi, ey lutfu ve ihsânı bol olan, Sen’den başka ilâh yok, Sen kendisine ilticâ edenlerin yardımcısı, kendisine sığınanlara emân veren, korkanların kendisinde emniyete kavuştuğu yüce zâtsın. Allah’ım! Beni katında, Ümmü’l-Kitâb’da şakî/kötü veya mahrûm veya kovulmuş veya rızkı dar olarak yazdıysan, Allah’ım fazl u ihsânınla kötülüğümü, mahrûmiyetimi, kovulmamı ve rızkımın az olmasını sil, beni katında, Ümmü’l-Kitâb’da saîd/iyi, rızkı bol ve hayırlara muvaffak olan bir kulun olarak yaz. Şüphesiz Sen Rasûl’ünün lisânı üzere indirilen Kitâb’ında bir söz buyurdun ve Sen’in sözün haktır: «Allah dilediğini siler, (dilediğini de) sâbit bırakır. Ümmü’l-Kitâb (Ana Kitâb) O’nun yanındadır.» (er-Ra’d, 39) İlâhî! En büyük tecellin ile «Her hikmetli işe kendisinde hükmedilen» (ed-Duhân, 4) ve kesin karar verilen mübarek Şa’bân’ın yarısı gecesinde, bizden bildiğimiz, bilmediğimiz ve Sen’in bildiğin bütün belâları uzaklaştır. Şüphesiz Sen en yüce ve en keremlisin. Allah, Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eylesin!',
      not: 'Ali el-Müttakî, no: 5090'
    }],
    tarif: [
      'Şaban’ın onbeşinci — Berât — gecesi akşam namazından sonra üç kere Yâsîn sûresi ve her birinin sonunda bu Berât duası okunur.',
      'Birinci Yâsîn’den sonra Allah’ın saîd kullarından olmak, ikincide hayırlı ömür uzunluğu, üçüncüde kazâ ve belâlardan emîn olup hayırlı rızık niyetiyle okunur.',
      'Berât gecesinde yatsıdan sonra, ikide bir selâm vermek üzere yüz rekât namaz kılınır; her rekâtta Fâtiha’dan sonra on kere İhlâs okunur. On defaya kudreti olmayan beş veya üç kere okur. Sonra okuyabildiği kadar salavât ve huzûr-ı kalb ile tevbe ve istiğfar edilir.'
    ]
  },

  {
    id: 'kadir',
    ad: 'Leyle-i Kadir',
    alt: '27 Ramazan gecesi',
    ikon: '✧',
    sayfa: 124,
    ne: [{ t: 'gece', ay: 9, gun: 27 }],
    bildir: true,
    uyari: 'Bu gece Kadir Gecesi — Leyle-i Kadir namazı ve duası',
    metin: [{
      ar: 'سُبْحَانَ مَنْ هُوَ قَائِمٌ يَسْهَرُ سُبْحَانَ مَنْ هُوَ دَائِمٌ لَمْ يَزَلْ سُبْحَانَ مَنْ هُوَ حَافِظٌ لَا يَغْفَلُ سُبْحَانَ مَنْ هُوَ جَوَادٌ لَا يَبْخَلُ سُبْحَانَ مَنْ هُوَ رَحِيمٌ لَا يَعْجَلُ سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِىِّ الْعَظِيمِ. سُبْحَانَ يَا عَلِيمُ يَا عَظِيمُ اغْفِرْ لِىَ الذَّنْبَ الْعَظِيمَ.',
      meal: 'Dâimâ ayakta ve uyanık olan zâtı tesbih ederim. Dâimâ vâr olan zâtı tesbih ederim. Hiçbir zaman gâfil olmayıp dâimâ muhafaza eden zâtı tesbih ederim. Cömert olup cimrilik yapmayan zâtı tesbih ederim. Cezâlandırmada acele etmeyip merhametle muâmele eden zâtı tesbih ederim. Allah’ı tesbih ederim, hamd Allah’a mahsustur, Allah’tan başka ilâh yoktur, Allah en büyüktür. Güç ve kuvvet ancak yüce ve azamet sahibi Allah’ın tevfîki iledir. Sen’i tesbih ederim ey Alîm, Sen’i tesbih ederim ey Azîm! Benim pek büyük olan günahlarımı mağfiret eyle!'
    }],
    tarif: [
      'Evvelâ iki rekât namaz kılınır; her rekâtta Fâtiha’dan sonra yedi kere İhlâs okunur, selâmdan sonra yetmiş kere istiğfar edilir.',
      'Sonra yine iki rekât namaz kılınır; her rekâtta Fâtiha’dan sonra üç kere İhlâs okunur, selâmdan sonra yukarıdaki dua okunur.'
    ]
  },

  {
    id: 'iftar',
    ad: 'İftar duası',
    alt: 'Ramazan boyunca, orucu açarken',
    ikon: '☾',
    sayfa: 126,
    ne: [{ t: 'ay', ay: 9 }],
    bildir: false,
    metin: [{
      ar: 'اَللّٰهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
      meal: 'Allah’ım! Senin rızân için oruç tuttum. Sana inandım. Sana güvendim. Senin rızkınla orucumu açıyorum.',
      not: 'krş. Ebû Dâvud, Savm, 22'
    }],
    tarif: []
  },

  {
    id: 'arefe',
    ad: 'Arefe günü duası',
    alt: '9 Zilhicce ve Ramazan bayramı arefesi',
    ikon: '◌',
    sayfa: 127,
    ne: [{ t: 'gun', ay: 12, gun: 9 }, { t: 'aralik', ay: 9, bas: 29, son: 30 }],
    bildir: true,
    uyari: 'Bugün arefe — Peygamberimiz’in arefe günü en çok okuduğu dua',
    metin: [{
      ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ. لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ',
      meal: 'Allah’tan başka ilâh yoktur, yalnız O vardır ve hiçbir şerîki yoktur. Mülk O’nundur ve hamd de O’na mahsustur. Bütün hayırlar O’nun elindedir ve O her şeye kâdirdir.'
    }],
    tarif: ['Peygamber Efendimiz -sallallahu aleyhi ve sellem- arefe gününde en ziyâde bu duayı okurlardı.']
  },

  {
    id: 'bayram-gecesi',
    ad: 'Bayram geceleri',
    alt: 'Ramazan ve Kurban bayramı geceleri',
    ikon: '★',
    sayfa: 128,
    ne: [{ t: 'gece', ay: 10, gun: 1 }, { t: 'gece', ay: 12, gun: 10 }],
    bildir: true,
    uyari: 'Bu gece bayram gecesi — ihyâ edenin kalbi ölmez',
    metin: [{
      meal: '“Ramazan bayramı gecesini ve Kurban Bayramı gecesini sevâbını Allah’tan umarak ihyâ edenin kalbi, kalblerin öldüğü günde ölmez.”',
      not: 'İbn Mâce, Sıyâm, 68'
    }],
    tarif: ['Bayram gecesi namaz, Kur’ân, zikir ve dua ile ihyâ edilir.']
  },

  {
    id: 'sene-sonu',
    ad: 'Senenin sonunda okunacak dua',
    alt: 'Zilhicce’nin son günleri',
    ikon: '◈',
    sayfa: 126,
    ne: [{ t: 'aralik', ay: 12, bas: 29, son: 30 }],
    bildir: true,
    uyari: 'Hicri yıl bitiyor — senenin sonunda okunacak dua',
    metin: [{
      ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلَّمَ اَللّٰهُمَّ مَا عَمِلْتُ فِى هٰذِهِ السَّنَةِ مِمَّا نَهَيْتَنِى عَنْهُ فَلَمْ أَتُبْ مِنْهُ وَلَمْ تَرْضَهُ وَنَسِيتُهُ وَلَمْ تَنْسَهُ وَحَلِمْتَ عَلَىَّ فِيهِ بَعْدَ قُدْرَتِكَ عَلَىَّ عُقُوبَتِى وَدَعَوْتَنِى إِلَى التَّوْبَةِ بَعْدَ جُرْأَتِى عَلَى مَعْصِيَتِكَ فَإِنِّى أَسْتَغْفِرُكَ فَاغْفِرْ لِى! وَمَا عَمِلْتُ فِيهَا مِمَّا تَرْضَاهُ وَوَعَدْتَنِى عَلَيْهِ الثَّوَابَ فَأَسْأَلُكَ اَللّٰهُمَّ يَا كَرِيمُ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ أَنْ تَتَقَبَّلَهُ مِنِّى وَلَا تَقْطَعَ رَجَائِى مِنْكَ يَا كَرِيمُ وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلَّمَ',
      meal: 'Rahmân ve Rahîm olan Allah’ın adıyla. Allah, Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eylesin! Allah’ım, bu senede Sen’in nehyettiklerinden işleyip de bildiğim, tevbe etmediğim ve Sen’in de râzı olmadığın günahlarımı, yine benim unutup da Sen’in unutmadığın, beni cezâlandırmaya gücün yettiği hâlde bana yumuşak davranıp cezâlandırmakta acele etmediğin, Sana isyana cür’et ettikten sonra beni tevbeye dâvet ettiğin günahlarımı affetmeni istiyorum, beni mağfiret eyle! Allah’ım, bu senede Sen’in râzı olduğun ve sevap vaat ettiğin amellerden yaptıklarımı kabul etmeni istiyorum ey Kerîm, ey Celâl ve İkrâm sahibi! Ümidimi Sen’den kestirmemeni istiyorum ey Kerîm! Allah, Efendimiz Muhammed’e, âline ve ashâbına salât u selâm eylesin!'
    }],
    tarif: []
  },

  {
    id: 'cuma',
    ad: 'Cuma günü duası',
    alt: 'Her cuma',
    ikon: '☪',
    sayfa: 99,
    ne: [{ t: 'hafta', gun: 5 }],
    bildir: false,
    metin: [
      {
        ar: 'لَا إِلٰهَ إِلَّا أَنْتَ يَا حَنَّانُ يَا مَنَّانُ يَا بَدِيعَ السَّمٰوَاتِ وَالْأَرْضِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        meal: 'Sen’den başka hiçbir ilâh yoktur. Ey Hannân, ey Mennân, ey gökleri ve yeri en güzel şekilde yaratan, ey Celâl ve İkrâm sâhibi!',
        not: 'Suyûtî, el-Câmiu’s-sağîr, no: 7450'
      },
      {
        adet: 'cuma namazından sonra 100 kere',
        ar: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ سُبْحَانَ اللّٰهِ الْعَظِيمِ وَبِحَمْدِهِ وَأَسْتَغْفِرُ اللّٰهَ',
        meal: 'Allah’ı hamdiyle tesbih ederim. Azîm olan yüce Allah’ı hamd ile tesbîh ederim. Allah’tan beni affetmesini isterim.',
        not: 'Ali el-Müttakî, no: 21321'
      }
    ],
    tarif: [
      'Bu dua ile cuma günü herhangi bir saatte dua edilirse sahibine muhakkak icâbet olunur.',
      'Cuma gününde bir saat vardır ki o vakitte yapılan dua kabul olunur; ikindi namazı ile güneşin batması arasındaki vakittir.',
      'Kehf sûresini okuyan, gelecek cumaya kadar bu sûre ile mağfiret olunur ve Deccâl’in fitnesinden muhafaza edilir.',
      'Cuma namazından sonra — konuşmadan ve kalkmadan — İhlâs, Felâk ve Nâs sûrelerini yedişer defa okuyan, gelecek cumaya kadar zarar verici şeylerden muhafaza olunur.',
      'Perşembeyi cumaya bağlayan gece iki rekât namaz kılıp Fâtiha’dan sonra onbeş defa Zilzâl sûresini okuyan, kabir azâbından ve kıyamet korkularından emin kılınır.'
    ]
  },

  {
    id: 'hilal',
    ad: 'Hilâl’i görünce',
    alt: 'Hicri ayın başında ve sonunda',
    ikon: '☾',
    sayfa: 158,
    ne: [{ t: 'aralik', ay: 0, bas: 1, son: 2 }, { t: 'aralik', ay: 0, bas: 29, son: 30 }],
    bildir: false,
    metin: [
      {
        ar: 'اَللّٰهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّى وَرَبُّكَ اللّٰهُ',
        meal: 'Ey Rabbim! Bize bunu bereket ve îmân, selâmet ve İslâm hilâli eyle! Ey Hilâl! Benim de senin de Rabbimiz Allah’tır.',
        not: 'Tirmizî, Deavât, 50'
      },
      {
        ar: 'اَللّٰهُ أَكْبَرُ اَللّٰهُ أَكْبَرُ اَلْحَمْدُ لِلّٰهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ. اَللّٰهُمَّ إِنِّى أَسْأَلُكَ مِنْ خَيْرِ هٰذَا الشَّهْرِ وَأَعُوذُ بِكَ مِنْ شَرِّ الْقَدَرِ وَمِنْ شَرِّ يَوْمِ الْمَحْشَرِ.',
        meal: 'Allah büyüktür, Allah büyüktür, hamd Allah’a mahsustur, Allah’a dayanmaktan başka kudret ve kuvvet yoktur. Allah’ım! Senden bu ayın hayrını istiyorum, kaderin şerrinden ve mahşer gününün şerrinden Sana sığınıyorum.',
        not: 'İbn Hanbel, V, 329'
      }
    ],
    tarif: ['Rasûl-i Ekrem -sallallahu aleyhi ve sellem- hilâli gördükleri zaman bu duaları okurlardı.']
  },

  {
    id: 'salat-i-munciye',
    ad: 'Salât-ı Münciye',
    alt: 'Her zaman okunabilir',
    ikon: '✧',
    sayfa: 118,
    ne: [],
    bildir: false,
    metin: [{
      ar: 'اَللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ وَتَقْضِى لَنَا بِهَا جَمِيعَ الْحَاجَاتِ وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ وَتَرْفَعُنَا بِهَا أَعْلَى الدَّرَجَاتِ وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيعِ الْخَيْرَاتِ فِى الْحَيَاةِ وَبَعْدَ الْمَمَاتِ.',
      meal: 'Allah’ım! Peygamber Efendimiz Hazret-i Muhammed Mustafâ’ya salât eyle. Öyle bir salât ki; o salât vesîlesiyle bizi bütün korku ve âfetlerden kurtar, bütün ihtiyaçlarımızı gider, bizi bütün günahlardan temizle, bizi derecelerin en yücesine yükselt ve onun vesîlesiyle bizi, hayâtta ve ölümden sonra bütün hayırların en son noktasına ulaştır.'
    }],
    tarif: [
      'Bu duayı okurken “Beni ve efrâd-ı âilemi ve bilcümle mü’minleri yer ve gök âfâtından ve cemî’ belâlardan muhafaza buyur yâ Rabbi!” diye dua edilir.',
      'Safer’in son çarşambasında onbir defa okunur.'
    ]
  }
];

/** Tek kural, tek gün bağlamı. ctx: {ay, gun, yarinAy, yarinGun, hafta}. */
function bvDuaKuralUyar(kural, ctx) {
  if (!kural || !ctx) return false;
  switch (kural.t) {
    case 'ay':
      return ctx.ay === kural.ay;

    case 'gun':
      return ctx.ay === kural.ay && ctx.gun === kural.gun;

    // ay:0 "hangi ay olursa olsun" demektir — hilâl duası her ayın başında geçerli.
    case 'aralik':
      return (kural.ay === 0 || ctx.ay === kural.ay) &&
             ctx.gun >= kural.bas && ctx.gun <= kural.son;

    // Gece ibadeti akşamdan başlar: hem o hicri günde hem bir gün öncesinde tutar.
    case 'gece':
      return (ctx.ay === kural.ay && ctx.gun === kural.gun) ||
             (ctx.yarinAy === kural.ay && ctx.yarinGun === kural.gun);

    case 'hafta':
      return ctx.hafta === kural.gun;

    // Regâib: Receb'in ilk cumasını başlatan perşembe akşamı ve o cuma günü.
    case 'regaib':
      return (ctx.hafta === 4 && ctx.yarinAy === 7 && ctx.yarinGun <= 7) ||
             (ctx.hafta === 5 && ctx.ay === 7 && ctx.gun <= 7);

    // Safer'in ilk ve son çarşambası. Son çarşamba, ayın 29/30'da bitmesinden
    // bağımsız olsun diye "son haftaya düşen çarşamba" kabul edilir.
    case 'saferCarsamba':
      return ctx.ay === 2 && ctx.hafta === 3 && (ctx.gun <= 7 || ctx.gun >= 23);

    default:
      return false;
  }
}

/** Verilen güne düşen duaların listesi — BV_DUALAR sırasını korur. */
function bvDuaListesi(ctx) {
  if (!ctx) return [];
  return BV_DUALAR.filter(d =>
    (d.ne || []).some(kural => bvDuaKuralUyar(kural, ctx)));
}

/**
 * Bu gün, o duanın vesilesinin ilk günü mü? Bildirim yalnızca ilk günde
 * gider — yoksa Receb ayı boyunca her gün aynı bildirim tekrarlanır.
 * `dunCtx` bir önceki günün bağlamıdır; verilmezse gün ilk gün sayılır.
 */
function bvDuaIlkGunMu(dua, ctx, dunCtx) {
  const bugun = (dua.ne || []).some(k => bvDuaKuralUyar(k, ctx));
  if (!bugun) return false;
  if (!dunCtx) return true;
  return !(dua.ne || []).some(k => bvDuaKuralUyar(k, dunCtx));
}

/* Hem tarayıcıda (script etiketiyle) hem Node'da (require ile) çalışsın. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BV_DUALAR, bvDuaKuralUyar, bvDuaListesi, bvDuaIlkGunMu };
}
