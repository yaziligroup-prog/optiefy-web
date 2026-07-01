export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  gradient: string;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "yapay-zeka-ile-e-ticaret",
    title: "Yapay Zeka ile E-Ticaret: Küçük Satıcılar İçin Yeni Dönem",
    excerpt: "Instagram üzerinden ürün satan amatör girişimcilerin yapay zeka destekli araçlarla nasıl profesyonel bir vitrine kavuştuğunu ve dönüşüm oranlarını nasıl artırdığını inceliyoruz.",
    category: "Yapay Zeka",
    date: "2026-06-18",
    readTime: "6 dk okuma",
    gradient: "linear-gradient(135deg,#7C3AED 0%,#6366F1 100%)",
    content: [
      "Türkiye'de e-ticaretin en hızlı büyüyen segmenti artık büyük markalar değil; Instagram ve WhatsApp üzerinden ürün satan bireysel girişimciler. Ancak bu satıcıların büyük çoğunluğu profesyonel bir vitrine, SEO'ya veya güvenilir bir ödeme altyapısına sahip değil.",
      "Yapay zeka destekli platformlar, tek bir ürün fotoğrafından SEO uyumlu başlık, açıklama ve marka tonuna uygun içerik üretebiliyor. Bu sayede saatler süren içerik hazırlama süreci saniyelere iniyor.",
      "Öne çıkan bir diğer nokta ise kişiselleştirme: yapay zeka, girilen ürün fotoğrafı ve mağaza tonuna göre en uygun tema ve renk paletini otomatik olarak öneriyor. Bu, teknik bilgisi olmayan satıcıların da tutarlı bir marka kimliği oluşturmasını sağlıyor.",
      "Sonuç olarak, yapay zeka artık sadece büyük şirketlerin değil; tek kişilik işletmelerin de profesyonel bir dijital varlık kurmasını mümkün kılıyor. Önümüzdeki dönemde bu araçların daha da yaygınlaşması bekleniyor.",
    ],
  },
  {
    slug: "domain-secim-stratejileri",
    title: "Doğru Domain Nasıl Seçilir? Mağazanız İçin 7 Altın Kural",
    excerpt: "Alan adı seçimi, marka güvenilirliğinin ilk adımıdır. Uzantı seçiminden isim uzunluğuna kadar dikkat etmeniz gereken kritik noktaları derledik.",
    category: "Domain & Marka",
    date: "2026-06-25",
    readTime: "5 dk okuma",
    gradient: "linear-gradient(135deg,#EA580C 0%,#F59E0B 100%)",
    content: [
      "Bir alan adı, markanızın dijital dünyadaki ilk el sıkışmasıdır. Kısa, akılda kalıcı ve telaffuzu kolay bir isim, güven duygusunu doğrudan etkiler.",
      "1. Kısa tutun: 15 karakterin altındaki alan adları hem hatırlanması hem de yazılması açısından daha avantajlıdır.",
      "2. Uzantıyı doğru seçin: .com hâlâ en güvenilir uzantı olsa da, .shop ve .store gibi sektöre özel uzantılar e-ticaret markaları için güçlü bir alternatif sunuyor.",
      "3. Tire ve rakamlardan kaçının: Sözlü olarak paylaşıldığında karışıklığa yol açabilir.",
      "4. Marka adınızla birebir uyumlu olsun: Sosyal medya kullanıcı adınızla alan adınız arasında tutarlılık, müşteri güvenini artırır.",
      "5. Uzun vadeli düşünün: İleride ürün yelpazenizi genişletebileceğinizi göz önünde bulundurarak çok dar kapsamlı isimlerden kaçının.",
      "6. Müsaitlik kontrolünü erken yapın: Beğendiğiniz bir ismin sosyal medyada da uygun olup olmadığını kontrol edin.",
      "7. Güvenilir bir sağlayıcı ile kayıt yapın: DNS yönetimi ve yenileme süreçlerinin şeffaf olduğu bir altyapı tercih edin.",
    ],
  },
  {
    slug: "paytr-altyapisi-guvenli-odeme",
    title: "PayTR Altyapısı ile Güvenli Ödeme: Bilmeniz Gerekenler",
    excerpt: "Türkiye'nin en yaygın ödeme altyapılarından biri olan PayTR'ın 3D Secure, taksit imkânları ve komisyon yapısını mağaza sahipleri için özetledik.",
    category: "Ödeme & Güvenlik",
    date: "2026-06-30",
    readTime: "4 dk okuma",
    gradient: "linear-gradient(135deg,#16A34A 0%,#059669 100%)",
    content: [
      "PayTR, Türkiye'de e-ticaret yapan işletmelerin en çok tercih ettiği ödeme altyapılarından biri. Tüm yerel bankalarla entegrasyonu ve 3D Secure desteği sayesinde hem satıcıya hem alıcıya güven veriyor.",
      "Taksit seçenekleri, özellikle yüksek tutarlı ürünlerde dönüşüm oranını doğrudan etkiliyor. Müşteriler taksit imkânı gördüklerinde satın alma kararını daha kolay veriyor.",
      "Kart bilgileri hiçbir zaman satıcının sunucularında saklanmıyor; tüm hassas veri PayTR'ın PCI-DSS uyumlu altyapısında işleniyor. Bu da KVKK ve veri güvenliği açısından satıcıyı önemli bir yükten kurtarıyor.",
      "Kurulum süreci de oldukça basit: mağaza sahipleri birkaç dakika içinde PayTR hesaplarını bağlayarak ödeme almaya başlayabiliyor, ekstra bir sunucu veya teknik altyapı gerektirmiyor.",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
