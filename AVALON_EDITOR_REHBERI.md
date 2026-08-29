# Avalon Ürün ve Editör Rehberi

Bu belge, depodaki mevcut uygulama davranışını kaynak kod üzerinden açıklar. Avalon; yaratıcı brief'leri veya JSON prompt'larını **yerelde saklanan, düzenlenebilir prompt dokümanlarına** dönüştüren bir çalışma alanıdır. Amaç yalnızca ham JSON yazdırmak değil; prompt'u oluşturmak, yapılandırmak, AI ile iyileştirmek ve aynı dokümandan görsel ya da video üretmektir.

> Durum notu: Bu açıklama kod incelemesine dayanır. Sağlayıcı çağrılarının kullanıcı anahtarlarıyla gerçek üretim sonucu vermesi, ilgili anahtarın/modelin geçerliliğine ve sağlayıcı hesabına bağlıdır.

## 1. Ürün ne yapar?

Avalon'ın ana çalışma modeli şudur:

```text
Ham brief veya JSON
        |
        v
Prompt dokümanı (kaynak + yapı + revizyon)
        |
        +--> Build: yapıyı elle düzenle
        +--> Refine: seçili alan için AI önerisi al
        +--> Generate: Image Studio veya Video Studio
        |
        v
Yerel prompt, revizyonlar, üretilen varlıklar ve film projesi
```

Ürün dört temel giriş yöntemi sunar:

1. Boş doküman oluşturmak.
2. Düz metin yaratıcı brief yapıştırmak.
3. Yapılandırılmış JSON içe aktarmak.
4. Topluluk kütüphanesinden bir prompt içe aktarmak veya bir görseli tersine analiz etmek.

Prompt'lar tarayıcıdaki kalıcı durum deposunda tutulur. API anahtarları ise yalnızca tarayıcı oturumu boyunca `sessionStorage` içinde tutulacak şekilde tasarlanmıştır; sekme/oturum kapandığında kaybolurlar. Bu nedenle Avalon, mevcut koduyla bulut senkronizasyonlu bir ekip doküman sistemi değil, öncelikle tek tarayıcıda çalışan bir yaratıcı çalışma alanıdır.

## 2. İlk açılış ve bağlantı kurulumu

İlk girişte landing sayfası görünür. Kullanıcı "Open editor" / başlama aksiyonu ile uygulama kipine geçer; tamamlanmış kurulum yoksa onboarding gösterilir.

Kurulum sırası:

1. Karşılama ekranı.
2. Metin/LLM sağlayıcısı seçimi: Anthropic, OpenAI veya Google Gemini.
3. İstenirse seçilen LLM anahtarının test edilmesi; istenirse bu adım atlanabilir.
4. Görsel üretim sağlayıcısı seçimi: fal.ai, Wiro.ai veya hiçbiri.
5. İstenirse görsel sağlayıcı anahtarının test edilmesi.
6. Hazır ekranından çalışma alanına geçiş.

Wiro iki kimlik doğrulama biçimini destekleyecek şekilde tasarlanmıştır: yalnız API anahtarı veya API anahtarı + secret ile imzalı istek. Ayarları yeniden çalıştırmak, onboarding ve sağlayıcı seçimlerini yerel depodan; anahtarları ise oturum deposundan temizler.

## 3. Dashboard: editöre giden ana kapı

Kurulum tamamlandığında kullanıcı dashboard'a gelir. Burada şunlar yapılabilir:

- Yeni prompt dokümanı açmak.
- prompts.chat kütüphanesinde arayıp içe aktarmak.
- Bir görselden JSON prompt üretmek için Reverse engineer aracını açmak.
- Örnek prompt yüklemek.
- Yerel prompt'ları aramak, açmak veya silmek.
- En son güncellenen prompt'a tek tıkla devam etmek.
- Bağlı LLM ve görsel üretim sağlayıcısı durumunu görmek; kurulumu yeniden başlatmak.

### Yeni doküman oluşturma

"New prompt" penceresi ad ve içerik kabul eder. İçerik alanına:

- geçerli bir JSON nesnesi,
- veya serbest biçimli bir brief

yapıştırılabilir. Uygulama girdinin JSON mu düz metin mi olduğunu saptar; media türü ve varsa timeline segmenti gibi ilk ipuçlarını gösterir. Ad boş bırakılırsa, brief içindeki uygun başlıktan otomatik ad üretmeyi dener.

Doküman oluşturulduğunda Avalon aşağıdaki üç şeyi birlikte üretir:

- **Kaynak (source):** Kullanıcının asıl metni/JSON'u korunur.
- **Projeksiyon (projection):** Düzenleme ve üretimde kullanılan yapılandırılmış yorum.
- **İlk revizyon:** İçe aktarma anının izlenebilir kaydı.

JSON girişi doğrudan çalışma içeriği olur. Düz metin brief ise deterministik ayrıştırıcı ile yapı, medya türü ve timeline tahmini üretir.

## 4. Editörün zihinsel modeli

Editör, ekranın üstündeki üç adımla anlatılır:

| Adım | Amaç | Temel sonuç |
| --- | --- | --- |
| 1. Build | Prompt'un yapısını kurmak ve düzenlemek | Güncel JSON/projeksiyon |
| 2. Refine | Seçili alanı AI ile geliştirmek | İncelenebilir öneri |
| 3. Generate | Aynı dokümandan çıktı üretmek | Görsel veya video |

Bir prompt açıldığında editör tam ekran çalışır. Üst çubukta doküman adı, yerel kayıt durumu, seçili AI sağlayıcısı ve belge eylemleri bulunur. Buradan JSON panoya kopyalanabilir veya `.json` dosyası olarak dışa aktarılabilir. Dashboard'a dönmek düzenleme ekranından çıkartır; prompt silinmez.

### Kalıcılık ve revizyon davranışı

Alanlarda yapılan düzenlemeler doğrudan yerel store'a yazılır. İçerik/projeksiyon değiştiğinde yeni bir revizyon oluşur. Önceki revizyona bağlı üretilmiş artifact'lar (örneğin çıktılar) artık güncel yapıyı temsil etmiyorsa `stale` olarak işaretlenir.

Kaynak brief'ini değiştirip yalnız "Save source only" seçilirse kaynak korunur fakat yapı **stale** olur: yani editör, yeni metnin mevcut yapı tarafından henüz yeniden kurulmadığını açıkça belirtir. "Rebuild structure" bu yapıyı yerel ayrıştırıcıyla yeniden kurar. "Organize with AI" ise AI'ın şemaya uyan bir projeksiyon döndürmesini ister; başarısız veya geçersiz sonuç mevcut projeksiyonu değiştirmez.

## 5. Build: yapıyı kurma ve düzenleme

Build ekranı üç bölümlü bir çalışma alanıdır (dar ekranda sekmelerle iki panele indirgenir).

### Sol panel: Prompt map

Prompt map, en üst seviye bölümleri listeler. `subject`, `camera`, `lighting`, `composition`, `style`, `negative` gibi tanınan anahtarlar için daha anlaşılır açıklama ve ikon gösterir; özel anahtarlar da desteklenir.

Buradan kullanıcı:

- Bölüm arayabilir.
- Bir bölümü aktif düzenleme alanı yapabilir.
- Yeni özel bölüm ekleyebilir.
- Bölüm silebilir (tarayıcı onayı istenir).

Tek köklü JSON yapılarında kökün altındaki alanlar doğrudan bölüm gibi gösterilir. Böylece örneğin `image_generation` sarmalayıcısı yerine onun altındaki yaratıcı alanlarla çalışmak kolaylaşır.

### Orta panel: alan düzenleyici

Aktif bölüm, JSON tipine göre form alanlarına açılır:

- Metinler input veya uzun metin alanı olarak,
- Sayılar sayısal input olarak,
- Boolean değerler seçim alanı olarak,
- Nesne ve diziler açılır/kapanır dallar olarak görünür.

Nesne ve dizilerin içinde yeni alan/öğe eklenebilir; alanlar veya dallar silinebilir. Her odaklanan alan, AI iyileştirme için "seçili alan" olur. Alt durum çubuğu seçili JSON yolunu gösterir ve arayüz üzerinden yapılan yapı değişikliklerinde JSON'un geçerli olduğunu bildirir.

### Alternatif belge görünümleri

Orta panelde yalnız form düzenleme yoktur:

- **Preview:** Aktif bölümün okunabilir özet görünümü.
- **Source brief:** Korunan orijinal brief'in düzenlenmesi, yerel yeniden yapılandırma veya AI ile organize edilmesi.
- **Structure:** Çalışma yapısındaki üst seviye alanların kart özeti.
- **Timeline:** Brief/projeksiyondaki sahne veya segment sırasının editoryal görünümü; Video Studio'ya geçiş noktası.
- **Raw JSON:** Tüm dokümanı ham JSON olarak düzenleme. "Apply JSON" yalnız kökü nesne olan geçerli JSON'u kaydeder; parse hatası ekranda kalır ve içerik değiştirilmez.

Bu ayrım önemlidir: Source brief, kullanıcının niyetinin kaynağıdır; çalışma yapısı ise üretim ve alan-bazlı düzenlemenin kullandığı yorumdur.

## 6. Refine: AI ile alan-bazlı iyileştirme

Refine, tüm prompt'u körlemesine yeniden yazan bir sohbet ekranı değildir. Önce prompt map veya formdan bir alan seçilir. Sağdaki Enhance paneli seçili yolun örneğin `subject.clothing.top` olduğunu ve mevcut değerini gösterir.

Kullanıcı üç hazır isteği kullanabilir veya kendi talimatını yazabilir:

- Daha açık ve kesin yap.
- Yararlı görsel detay ekle.
- Niyeti kaybetmeden sadeleştir.

İstek, seçili yol, seçili değer ve tam prompt bağlamıyla `/api/ai/update` rotasına gider. Model seçimi, sağlayıcıdan yüklenmeye çalışılır; anahtar yoksa veya model listesi alınamazsa sağlayıcıya göre bir varsayılan model gösterilir.

AI dönüşü doğrudan kaydedilmez. Panel, önce eski ve önerilen değeri yan yana fark biçiminde ve kısa açıklamayla gösterir. Kullanıcı:

- **Apply** ile yalnızca seçili alanı günceller,
- **Discard** ile öneriyi atar.

Bu, modelin değişiklik alanını daraltır ve kullanıcı onayı olmadan prompt'a müdahale edilmesini engeller. Sunucu talimatı da modelden yeni anahtar eklememesini ve yalnız istenen alanı dönmesini ister; yine de nihai denetim kullanıcıdadır.

## 7. Generate: Image Studio

Generate adımında kullanıcı görsel veya video yolunu seçer. "Generate image" Image Studio'yu açar.

Image Studio'nun çalışma şekli:

1. Kaynak olarak tüm doküman veya o anda seçili bölüm belirlenir.
2. Kullanıcı sadece bu üretime özgü isteğe bağlı bir yön ekleyebilir (ör. gün batımı film fotoğrafı hissi).
3. İsterse LLM ile "Prepare with AI" çalıştırılır; sonuç genişletilmiş prompt, sahne, stil, negative guidance vb. içeren bir tarif olarak doğrulanır.
4. Seçilen görsel sağlayıcı ve modelle üretim başlatılır.
5. Sonuç, geçerli doküman imzasıyla ilişkilendirilir; doküman değişirse eski hazırlık/çıktının yanlışlıkla yeni içerik sanılmaması hedeflenir.

fal.ai ve Wiro.ai desteklenir. Görsel üretime başlamadan önce uygun sağlayıcının seçilmiş olması ve oturumda anahtarının bulunması zorunludur. Wiro imzalı kipte secret da gerekir. Sağlayıcı seçilmediyse veya anahtar yoksa studio üretim yerine anlamlı hata verir.

Image Studio, dokümanla canlı bağlıdır: editördeki değişiklikler tekrar kopyalama gerektirmeden kaynak görünümüne akar. Studio'da yapılan isteğe bağlı yön, temel dokümanı bozmaz; o üretim için ek bağlamdır.

## 8. Generate: Video Studio ve film projesi

"Create video" seçeneği Video Studio'yu açar. Video yolu, basit bir tek seferlik video isteğinden daha kapsamlıdır: her prompt dokümanı oluşturulurken bir film projesi de türetilir.

Film projesi şunları izler:

- Sahne yönlendirmeleri ve sahne sırası,
- Her sahne için take'ler,
- Sağlayıcıya gönderilen generation job'ları ve durumları,
- Video, görüntü ve türetilmiş frame asset'leri,
- Seçilmiş take,
- Sahne giriş/çıkış süreklilik frame'leri.

Video üretimi sırasında Avalon sahnenin prompt'unu güncel projeksiyondan derler, model kabiliyetine göre süre/oran/çözünürlük/format ve gerekirse ses seçeneklerini gönderir. İş önce yerelde queued olarak kayda alınır, sağlayıcı işi başlatınca running olur, sonuç dönünce video asset'i ve take complete olur. Hata olursa job/take failed durumuna alınır.

Bir take içinden frame yakalanabilir. Bu frame bir sonraki sahnenin ilk karesi/süreklilik referansı yapılabilir; bu değişiklik aşağı akıştaki sahneleri "yeniden gözden geçir" durumuna getirir. Seçilen model ilk frame girdisini desteklemiyorsa, mevcut continuity frame ile üretime izin verilmez ve kullanıcı image-to-video uyumlu işlemi seçmeye yönlendirilir.

## 9. Topluluk içe aktarma ve reverse engineering

Dashboard'taki iki yardımcı giriş akışı editörü besler:

- **Browse library:** prompts.chat üzerinde arama yapar. Liste için kısa önizleme kullanır; içe aktarma anında tam içerik istenir. Geçerli JSON nesnesi doğrudan doküman içeriği olur, düz metin ise `{ "prompt": "..." }` biçiminde saklanır.
- **Reverse engineer:** Kullanıcının verdiği görseli AI ile analiz ederek yeniden üretime yönelik yapılandırılmış prompt elde etmeyi amaçlar; sonuç editörde açılabilecek bir JSON çalışma akışına dönüşür.

Bu araçlar başlangıç malzemesi sağlar; kullanıcının sonrasında Build/Refine/Generate zincirindeki kontrolünü değiştirmez.

## 10. Sağlayıcılar, veriler ve güvenlik sınırları

| Konu | Mevcut davranış |
| --- | --- |
| LLM sağlayıcıları | Anthropic, OpenAI, Google Gemini |
| Görsel sağlayıcıları | fal.ai, Wiro.ai |
| Video sağlayıcıları | fal.ai ve Wiro.ai kabiliyet listesi üzerinden |
| Prompt/film verisi | Tarayıcıdaki Zustand persist store |
| API anahtarları | `sessionStorage`; tarayıcı oturumuna bağlı |
| Kurulum ve sağlayıcı tercihi | `localStorage` |
| Sunucu API rotaları | LLM çağrısı ve sağlayıcı proxy/istemci işlemleri |
| Dışa aktarım | Geçerli çalışma içeriğinin JSON dosyası |

Kod, kullanıcı anahtarını API istek gövdesiyle kendi Next.js API rotalarına iletebilir; rota yoksa çevresel değişkenle fallback yapar. Bu nedenle uygulamanın "anahtar cihazdan hiç çıkmaz" şeklinde yorumlanması doğru değildir: anahtar kullanıcı tarayıcısında kalıcı olarak depolanmaz, ancak seçilen AI işlevini çalıştırmak için uygulamanın sunucu rotasına iletilir. Üretim dağıtımında HTTPS, loglama politikası ve rota güvenliği ayrıca doğrulanmalıdır.

## 11. Uçtan uca önerilen kullanım senaryosu

Örnek: Bir ürün videosu için yaratıcı brief'ten üretime gitmek.

1. Dashboard'da **New prompt** açılır.
2. Senaryo, görsel dil, sahne ve ses notlarını içeren brief yapıştırılır.
3. Avalon medya türünü ve varsa segmentleri saptar; doküman oluşturulur.
4. **Source brief** görünümünde metin gözden geçirilir. Gerekirse önce kaynak kaydedilir, sonra **Rebuild structure** veya **Organize with AI** ile yapı yenilenir.
5. **Build** içinde subject, kamera, ışık, stil ve kısıtlar düzenlenir; gerekirse özel bölümler eklenir.
6. Bir alan seçilip **Refine** ile yalnız o alan için öneri alınır; öneri incelenir ve uygunsa uygulanır.
7. **Timeline** görünümünde sahne sırası doğrulanır.
8. **Generate > Create video** ile sahne bazlı video üretimine geçilir. Her sahne için uygun model kabiliyeti ve ayarlar seçilir.
9. Bir take başarılı olunca seçilir; gerekirse son frame yakalanıp sonraki sahnenin continuity frame'i yapılır.
10. Son yapı gerektiğinde üst menüden JSON olarak kopyalanır veya dışa aktarılır.

Görsel için aynı akışın 8. adımında **Generate image** seçilir; tüm prompt ya da aktif bölüm kaynak seçilerek önce AI ile tarif hazırlanabilir, ardından fal.ai/Wiro üzerinden üretim yapılır.

## 12. Bilinmesi gereken pratik sınırlar

- Veriler cihaz/tarayıcı bağlamındadır; cihaz, profil veya tarayıcı değişiminde yerel prompt'ların taşınacağı garanti edilmez. JSON dışa aktarmak güvenli aktarım yoludur.
- AI önerisi sadece seçili alanı değiştirecek şekilde tasarlanmıştır, ancak önerinin yaratıcı ve teknik doğruluğu kullanıcının onayıyla kesinleşir.
- Kaynak brief değiştiğinde yapı otomatik olarak sessizce yeniden yazılmaz. Bu bilinçli bir davranıştır; kullanıcı "Rebuild" veya "Organize with AI" ile yeni projeksiyonu kabul eder.
- Görsel/video üretimi, bağlı sağlayıcı hesabı, anahtar, model kabiliyeti, kota ve ağ erişimine bağlıdır.
- Üretilen varlıkların güncelliği revizyonla ilişkilidir. Prompt değiştiğinde eski sonuçlar stale sayılabilir; yayınlamadan önce seçili take/asset'in güncel yapıyla uyumunu kontrol etmek gerekir.

## 13. Kod haritası

| Alan | Ana dosyalar |
| --- | --- |
| Uygulama kipleri, dashboard ve modallar | `src/app/page.tsx` |
| Dashboard | `src/components/dashboard/DashboardHome.tsx` |
| İlk kurulum | `src/components/onboarding/OnboardingScreen.tsx` |
| Ana editör | `src/components/editor/EditorWorkspace.tsx` |
| Brief, yapı, timeline ve stüdyo geçişleri | `src/components/editor/PromptDocumentPanels.tsx` |
| Görsel üretim yüzeyi | `src/components/image/ImageExpanderPanel.tsx` |
| Video üretimi ve süreklilik | `src/components/video/ConnectedFilmmakingWorkspace.tsx` |
| Yerel prompt/revizyon/film projesi durumu | `src/lib/store/promptStore.ts` |
| Brief ayrıştırma ve prompt dokümanı | `src/lib/prompt-document/` |
| AI alan güncelleme API'si | `src/app/api/ai/update/route.ts` |
| AI brief organizasyonu | `src/app/api/documents/organize/route.ts` |
| Görsel prompt hazırlama | `src/app/api/image/expand/route.ts` |

Bu mimarinin özeti: Avalon'da JSON, ürünün son çıktısı değil ortak çalışma dili. Kullanıcı niyetini kaynak brief'te korur; editör onu görünür ve düzenlenebilir yapıya taşır; AI bu yapının yalnız seçilen kısmına öneri verir; görsel/video stüdyoları da aynı canlı dokümandan üretim yapar.
