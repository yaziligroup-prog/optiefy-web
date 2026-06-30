/* eslint-disable react/no-unescaped-entities */
import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İptal, İade ve Değişim Koşulları | Optiefy",
  description: "Optiefy abonelik iptali, iade süreci ve değişim koşullarına ilişkin bilgilendirme.",
};

export default function IptalVeIade() {
  return (
    <LegalLayout
      title="İptal, İade ve Değişim Koşulları"
      subtitle="Optiefy abonelik planlarınızı nasıl iptal edebileceğinizi, iade sürecini ve istisnai durumları açıklar."
      updatedAt="1 Temmuz 2026"
      sections={[
        {
          title: "Genel Bilgi",
          content: (
            <p>
              Optiefy, YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ tarafından işletilen bir dijital SaaS (Software as a Service) platformdur. Sunulan hizmetler; e-ticaret vitrin oluşturma, yapay zeka destekli içerik üretimi ve mağaza yönetimi aboneliklerinden oluşmaktadır. Bu politika, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde hazırlanmıştır.
            </p>
          ),
        },
        {
          title: "Cayma Hakkı (14 Günlük İade Garantisi)",
          content: (
            <>
              <p>
                Abonelik satın alımınızdan itibaren <strong>14 (on dört) takvim günü</strong> içinde, herhangi bir gerekçe göstermeksizin aboneliğinizi iptal edebilir ve tam ücret iadesi talep edebilirsiniz.
              </p>
              <br />
              <p><strong>Cayma hakkı nasıl kullanılır?</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>Panel → Ayarlar → Abonelik bölümünden "Aboneliği İptal Et" seçeneğini kullanabilirsiniz.</li>
                <li>Veya <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> adresine "Cayma Bildirimi" konusuyla e-posta gönderebilirsiniz.</li>
              </ul>
              <br />
              <p>
                E-postanızda şu bilgileri belirtin: Ad Soyad, kayıtlı e-posta adresi, abonelik planı, satın alma tarihi ve iade talebiniz.
              </p>
            </>
          ),
        },
        {
          title: "İade Süreci ve Geri Ödeme Süresi",
          content: (
            <>
              <p>
                Cayma bildiriminizin alınmasının ardından işlemler şu şekilde ilerler:
              </p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li><strong>1-2 iş günü:</strong> Talebiniz incelenir ve onaylanır; onay e-postası gönderilir.</li>
                <li><strong>3-5 iş günü:</strong> İade tutarı ödeme yönteminize göre işleme alınır.</li>
                <li><strong>5-14 iş günü:</strong> Banka/kart işlem süresine bağlı olarak tutarın hesabınıza yansıması.</li>
              </ul>
              <br />
              <p>
                İade; orijinal ödeme yönteminize (kredi kartı, banka kartı) yapılır. Farklı bir hesaba iade mümkün değildir.
              </p>
            </>
          ),
        },
        {
          title: "14 Gün Sonrasında Abonelik İptali",
          content: (
            <>
              <p>
                Cayma süresi geçtikten sonra aboneliğinizi istediğiniz zaman iptal edebilirsiniz. Ancak bu durumda:
              </p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>Mevcut fatura döneminin sonuna kadar platforma erişiminiz <strong>devam eder</strong>.</li>
                <li>Kalan gün sayısı için <strong>kısmi iade yapılmaz</strong>.</li>
                <li>Bir sonraki dönem için otomatik yenileme iptal edilir.</li>
              </ul>
              <br />
              <p><strong>Yıllık planlarda:</strong> İlk 14 günlük cayma süresinin dışında kalan süre için iade yapılmaz. Yıllık planı aylık plana düşürmek için <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> ile iletişime geçiniz.</p>
            </>
          ),
        },
        {
          title: "İade Edilemeyen Durumlar",
          content: (
            <>
              <p>Aşağıdaki durumlarda iade talebi kabul edilmez:</p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>14 günlük cayma süresinin aşılmış olması</li>
                <li>Ücretsiz (Free) plan kullanıcılarının ücret iade talebi</li>
                <li>Kullanım Koşulları ihlali nedeniyle hesabın askıya alınmış veya kapatılmış olması</li>
                <li>Platform üzerinden gerçekleştirilen üçüncü taraf hizmet alımları (ör. özel alan adı kayıt ücretleri)</li>
                <li>Promosyon, indirim kodu veya ücretsiz deneme kapsamında sağlanan hizmetler</li>
              </ul>
            </>
          ),
        },
        {
          title: "Plan Değişikliği (Upgrade / Downgrade)",
          content: (
            <>
              <p><strong>Yükseltme (Upgrade):</strong></p>
              <p>
                Daha üst bir plana geçişte, kalan fatura dönemi için mevcut planın kalan ücreti ile yeni planın ücreti arasındaki fark orantısal biçimde hesaplanarak tahsil edilir. Yükseltme anlık olarak geçerli olur.
              </p>
              <br />
              <p><strong>Düşürme (Downgrade):</strong></p>
              <p>
                Alt bir plana geçiş, mevcut fatura döneminin sonunda otomatik olarak uygulanır. Dönem içinde fark iadesi yapılmaz. Düşürme talepleri için <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> ile iletişime geçiniz.
              </p>
            </>
          ),
        },
        {
          title: "Teknik Sorun Kaynaklı İadeler",
          content: (
            <p>
              Optiefy altyapısından kaynaklanan ve 48 saat veya daha uzun süren kesintiler yaşandığında, etkilenen kullanıcılara orantılı hizmet kredisi veya iade sağlanabilir. Bu durum, destek ekibimiz tarafından incelenerek <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> üzerinden başvuru alınır ve değerlendirilir.
            </p>
          ),
        },
        {
          title: "Uyuşmazlık Çözümü",
          content: (
            <>
              <p>
                İade ve iptal süreçlerine ilişkin uyuşmazlıklarda öncelikle <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> adresi üzerinden müşteri hizmetlerimize başvurmanız beklenir.
              </p>
              <br />
              <p>
                Yasal yolların tüketilmesi gerektiği durumlarda; 6502 sayılı Kanun kapsamındaki Tüketici Hakem Heyetlerine veya Tüketici Mahkemelerine başvurabilirsiniz. Başvuru sınırları her yıl Gümrük ve Ticaret Bakanlığı tarafından güncellenmektedir.
              </p>
            </>
          ),
        },
        {
          title: "İletişim",
          content: (
            <>
              <p>Tüm iptal, iade ve değişim talepleriniz için:</p>
              <br />
              <p><strong>E-posta:</strong> <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a></p>
              <p><strong>Konu:</strong> "İptal Talebi" / "İade Talebi" / "Plan Değişikliği"</p>
              <p><strong>Yanıt süresi:</strong> İş günlerinde 24 saat içinde</p>
              <br />
              <p>
                YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ, bu politikayı önceden bildirimde bulunmak suretiyle değiştirme hakkını saklı tutar. Güncel politikaya her zaman optiefy.com/iptal-ve-iade adresinden ulaşabilirsiniz.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
