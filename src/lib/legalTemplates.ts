/**
 * Dükkan adına özel otomatik yasal sayfa şablonları.
 * Veritabanında mağaza başına sözleşme metni tutulmaz — şablonlar kod içinde
 * yaşar, render anında mağaza adı ve domain ilgili boşluklara giydirilir.
 * Rota: /store/[domain]/legal/[slug]
 */

export type LegalSlug =
  | "gizlilik-politikasi"
  | "mesafeli-satis-sozlesmesi"
  | "iade-ve-iptal-kosullari";

export const LEGAL_SLUGS: LegalSlug[] = [
  "gizlilik-politikasi",
  "mesafeli-satis-sozlesmesi",
  "iade-ve-iptal-kosullari",
];

export type LegalSection = { heading: string; body: string };
export type LegalDoc = {
  slug:     LegalSlug;
  title:    string;
  intro:    string;
  sections: LegalSection[];
};

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as string[]).includes(slug);
}

/** Şablonu mağaza adı + domain ile doldurup hazır dokümanı döner. */
export function getLegalDoc(slug: string, storeName: string, domain: string): LegalDoc | null {
  if (!isLegalSlug(slug)) return null;
  const store = storeName.trim() || "Mağaza";
  const site  = domain.trim() || "bu web sitesi";

  if (slug === "gizlilik-politikasi") {
    return {
      slug,
      title: `${store} Gizlilik Politikası`,
      intro: `İşbu Gizlilik Politikası, ${store} tarafından ${site} adresi üzerinden sunulan hizmetler kapsamında toplanan kişisel verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca nasıl işlendiğini açıklar.`,
      sections: [
        {
          heading: "1. Veri Sorumlusu",
          body: `KVKK kapsamında kişisel verileriniz, veri sorumlusu sıfatıyla ${store} tarafından aşağıda açıklanan amaçlar doğrultusunda ve hukuka uygun şekilde işlenmektedir.`,
        },
        {
          heading: "2. Toplanan Kişisel Veriler",
          body: `${site} üzerinden sipariş oluşturduğunuzda ad-soyad, teslimat adresi, telefon numarası ve e-posta adresi bilgileriniz; sitenin kullanımı sırasında ise çerezler aracılığıyla anonim gezinme verileri toplanır. Ödeme kartı bilgileriniz ${store} tarafından saklanmaz; ödemeler lisanslı ödeme kuruluşlarının güvenli altyapısı üzerinden gerçekleştirilir.`,
        },
        {
          heading: "3. Verilerin İşlenme Amaçları",
          body: `Kişisel verileriniz; siparişlerinizin oluşturulması, teslimatın sağlanması, sipariş durumu hakkında bilgilendirme yapılması, yasal yükümlülüklerin yerine getirilmesi ve müşteri hizmetleri süreçlerinin yürütülmesi amacıyla işlenir.`,
        },
        {
          heading: "4. Verilerin Aktarılması",
          body: `Verileriniz, yalnızca teslimatın gerçekleştirilebilmesi için kargo firmalarına, ödemenin alınabilmesi için ödeme kuruluşlarına ve yasal zorunluluk hâlinde yetkili kamu kurumlarına aktarılır. ${store}, kişisel verilerinizi hiçbir koşulda üçüncü kişilere pazarlama amacıyla satmaz veya kiralamaz.`,
        },
        {
          heading: "5. Verilerin Saklanma Süresi",
          body: `Kişisel verileriniz, ilgili mevzuatta öngörülen süreler boyunca (6563 sayılı Kanun ve Vergi Usul Kanunu uyarınca asgari saklama süreleri saklıdır) muhafaza edilir; sürenin dolmasıyla birlikte silinir, yok edilir veya anonim hâle getirilir.`,
        },
        {
          heading: "6. KVKK Kapsamındaki Haklarınız",
          body: `KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, düzeltilmesini veya silinmesini isteme ve zarara uğramanız hâlinde tazminat talep etme haklarına sahipsiniz. Taleplerinizi ${store} müşteri hizmetlerine iletebilirsiniz.`,
        },
        {
          heading: "7. Çerezler",
          body: `${site}, alışveriş deneyiminizi iyileştirmek amacıyla zorunlu ve performans çerezleri kullanır. Tarayıcı ayarlarınızdan çerez tercihlerinizi dilediğiniz zaman değiştirebilirsiniz.`,
        },
      ],
    };
  }

  if (slug === "mesafeli-satis-sozlesmesi") {
    return {
      slug,
      title: `${store} Mesafeli Satış Sözleşmesi`,
      intro: `İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), ${store} ("SATICI") ile ${site} üzerinden sipariş veren müşteri ("ALICI") arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca elektronik ortamda kurulmuştur.`,
      sections: [
        {
          heading: "1. Sözleşmenin Konusu",
          body: `İşbu Sözleşme'nin konusu, ALICI'nın ${site} üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş sayfasında belirtilen ürünün satışı ve teslimi ile ilgili olarak tarafların hak ve yükümlülüklerinin belirlenmesidir.`,
        },
        {
          heading: "2. Satıcı Bilgileri",
          body: `Satıcı: ${store} · Web sitesi: ${site} · İletişim taleplerinizi sitedeki iletişim kanalları üzerinden iletebilirsiniz.`,
        },
        {
          heading: "3. Ürün ve Ödeme Bilgileri",
          body: `Ürünün temel nitelikleri, tüm vergiler dâhil satış fiyatı ve kargo ücreti sipariş özet sayfasında gösterilir. ALICI, siparişi onayladığında bu bilgileri okuduğunu ve kabul ettiğini beyan eder. Ödemeler, 3D Secure destekli güvenli ödeme altyapısı üzerinden tahsil edilir.`,
        },
        {
          heading: "4. Teslimat",
          body: `Ürün, sipariş tarihinden itibaren en geç 30 (otuz) gün içinde, ALICI'nın bildirdiği teslimat adresine kargo ile gönderilir. El yapımı/kişiye özel üretim ürünlerde üretim süresi sipariş sayfasında ayrıca belirtilir. Kargo teslim anında hasarlı paketler teslim alınmamalı ve kargo yetkilisine tutanak tutturulmalıdır.`,
        },
        {
          heading: "5. Cayma Hakkı",
          body: `ALICI, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildirimi ${store} müşteri hizmetlerine yazılı olarak iletilmelidir. Cayma hakkının kullanılması hâlinde ürün bedeli, bildirimin ulaşmasından itibaren 14 gün içinde ALICI'ya iade edilir. ALICI'nın istekleri doğrultusunda kişiye özel üretilen ürünlerde, Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca cayma hakkı kullanılamaz.`,
        },
        {
          heading: "6. Genel Hükümler",
          body: `ALICI, ${site} üzerinde sipariş verdiği anda işbu Sözleşme'nin tüm koşullarını kabul etmiş sayılır. İşbu Sözleşme'den doğan uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dâhilinde ALICI'nın veya SATICI'nın yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.`,
        },
        {
          heading: "7. Yürürlük",
          body: `ALICI'nın sipariş onayı ile birlikte işbu Sözleşme yürürlüğe girer ve sipariş onay e-postası ile ALICI'ya elektronik ortamda iletilmiş sayılır.`,
        },
      ],
    };
  }

  // iade-ve-iptal-kosullari
  return {
    slug,
    title: `${store} İade ve İptal Koşulları`,
    intro: `${store} olarak müşteri memnuniyetini esas alıyoruz. Aşağıdaki koşullar, ${site} üzerinden satın alınan ürünlerin iade, değişim ve sipariş iptali süreçlerini düzenler.`,
    sections: [
      {
        heading: "1. Sipariş İptali",
        body: `Siparişiniz kargoya teslim edilmeden önce dilediğiniz an ${store} müşteri hizmetlerine ulaşarak ücretsiz iptal edebilirsiniz. Ödemeniz, iptal onayından itibaren 3–5 iş günü içinde ödeme yönteminize iade edilir.`,
      },
      {
        heading: "2. İade Süresi",
        body: `Ürünü teslim aldığınız tarihten itibaren 14 (on dört) gün içinde iade talebinde bulunabilirsiniz. İade talebiniz için sitedeki iletişim kanallarından ${store} müşteri hizmetlerine ulaşmanız yeterlidir.`,
      },
      {
        heading: "3. İade Koşulları",
        body: `İade edilecek ürünün kullanılmamış, yıpranmamış ve orijinal ambalajında olması gerekmektedir. El yapımı ürünlerin doğası gereği ürünler arasında küçük doku ve renk farklılıkları olabilir; bu farklılıklar ayıp kapsamında değerlendirilmez.`,
      },
      {
        heading: "4. Kişiye Özel Ürünler",
        body: `Talebiniz üzerine kişiselleştirilen veya özel ölçü ile üretilen ürünlerde, ilgili mevzuat uyarınca cayma ve iade hakkı bulunmamaktadır. Bu durum, sipariş sayfasında ayrıca belirtilir.`,
      },
      {
        heading: "5. Hasarlı veya Hatalı Ürün",
        body: `Ürün elinize hasarlı, kusurlu veya siparişinizden farklı ulaştıysa, teslimattan itibaren 48 saat içinde fotoğraflarıyla birlikte ${store} müşteri hizmetlerine bildirmeniz hâlinde değişim veya iade işlemi kargo bedeli tarafımıza ait olmak üzere gerçekleştirilir.`,
      },
      {
        heading: "6. Ücret İadesi",
        body: `İade edilen ürün tarafımıza ulaşıp kontrolü tamamlandıktan sonra, ürün bedeli 14 gün içinde ödemeyi yaptığınız yönteme iade edilir. Banka süreçlerine bağlı olarak tutarın hesabınıza yansıması 2–7 iş günü sürebilir.`,
      },
    ],
  };
}
