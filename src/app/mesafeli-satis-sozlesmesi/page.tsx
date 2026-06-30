/* eslint-disable react/no-unescaped-entities */
import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | Optiefy",
  description: "Optiefy platformu mesafeli satış sözleşmesi ve kullanım koşulları.",
};

export default function MesafeliSatisSozlesmesi() {
  return (
    <LegalLayout
      title="Mesafeli Satış Sözleşmesi"
      subtitle="Bu sözleşme, Optiefy platformu üzerinden gerçekleştirilen abonelik ve hizmet alımlarını düzenler."
      updatedAt="1 Temmuz 2026"
      sections={[
        {
          title: "Taraflar",
          content: (
            <>
              <p><strong>Satıcı:</strong></p>
              <p>Unvan: YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ</p>
              <p>Platform: Optiefy (optiefy.com)</p>
              <p>E-posta: info@optiefy.com</p>
              <br />
              <p><strong>Alıcı (Kullanıcı):</strong> Optiefy platformuna kayıt olan ve hizmet satın alan gerçek veya tüzel kişi.</p>
              <br />
              <p>
                İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, Satıcı ile Alıcı arasında elektronik ortamda kurulmaktadır.
              </p>
            </>
          ),
        },
        {
          title: "Sözleşmenin Konusu ve Kapsamı",
          content: (
            <>
              <p>
                Bu sözleşmenin konusu; Alıcının, Satıcı tarafından optiefy.com adresi üzerinden sunulan e-ticaret vitrin oluşturma, yönetim ve yapay zeka destekli içerik üretme hizmetlerine ("Hizmet") ilişkin abonelik satın almasına dair karşılıklı hak ve yükümlülüklerin belirlenmesidir.
              </p>
              <br />
              <p>
                Optiefy; Instagram satıcıları ve küçük işletmeler için AI destekli vitrin oluşturma, ürün yönetimi, sipariş takibi, ödeme entegrasyonu ve pazaryeri bağlantısı hizmetleri sunan bir SaaS platformdur.
              </p>
            </>
          ),
        },
        {
          title: "Hizmet Planları, Fiyatlandırma ve Ödeme",
          content: (
            <>
              <p>
                Optiefy, Ücretsiz, Başlangıç ve Büyüme olmak üzere üç farklı abonelik planı sunmaktadır. Güncel fiyatlar optiefy.com/fiyatlandirma adresinde yayımlanır ve önceden bildirimde bulunulmak suretiyle değiştirilebilir.
              </p>
              <br />
              <p>
                Ücretli aboneliklerde ödeme, Alıcının seçeceği aylık veya yıllık fatura dönemine göre kredi/banka kartı aracılığıyla PayTR Ödeme Sistemi üzerinden tahsil edilir. Yıllık planlarda ödeme, dönem başında tek seferde alınır.
              </p>
              <br />
              <p>
                Tüm fiyatlar Türk Lirası (TL) ve/veya ABD Doları (USD) cinsinden gösterilmekte olup fiyatlara KDV dahil değildir; fatura aşamasında ilgili vergi oranı ayrıca eklenir.
              </p>
            </>
          ),
        },
        {
          title: "Hizmetin İfası ve Teslimat",
          content: (
            <>
              <p>
                Optiefy, dijital bir hizmet platformu olup fiziksel teslimat söz konusu değildir. Ödemenin başarıyla tamamlanmasının ardından Alıcı, seçilen plana ait özelliklere ve panel erişimine derhal kavuşur.
              </p>
              <br />
              <p>
                Satıcı, hizmetin kesintisiz ve hatasız işlemesi için azami özeni göstermekle birlikte; planlı bakım, internet altyapısı arızaları veya mücbir sebeplerden kaynaklanan kısa süreli kesintilerden sorumlu tutulamaz.
              </p>
            </>
          ),
        },
        {
          title: "Cayma Hakkı",
          content: (
            <>
              <p>
                6502 sayılı Kanun'un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği'nin 9. maddesi uyarınca, Alıcı aboneliğini satın aldığı tarihten itibaren <strong>14 (on dört) gün içinde</strong> herhangi bir gerekçe göstermeksizin ve cezai şart ödenmeksizin cayma hakkını kullanabilir.
              </p>
              <br />
              <p>
                Cayma hakkı kullanımı için <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> adresine "Cayma Bildirimi" konusuyla e-posta gönderilmesi yeterlidir. Cayma talebinin alınmasından itibaren <strong>14 gün içinde</strong> ödeme iadesi gerçekleştirilir.
              </p>
              <br />
              <p>
                Ancak; Alıcının isteği veya kişisel ihtiyaçları doğrultusunda hazırlanan, niteliği itibarıyla iade edilemeyen ya da teslimden sonra değişen/bozulan dijital içerik ve hizmetlerde, Alıcının ifanın başlatılmasına açıkça onay vermiş olması koşuluyla cayma hakkı kullanılamaz.
              </p>
            </>
          ),
        },
        {
          title: "Alıcının Yükümlülükleri",
          content: (
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>Kayıt sırasında gerçek ve doğru bilgiler vermek.</li>
              <li>Hesap güvenliğini sağlamak; şifresini üçüncü şahıslarla paylaşmamak.</li>
              <li>Platformu yalnızca yasal ticari faaliyetler için kullanmak.</li>
              <li>Telif hakkı veya marka hakkı ihlali oluşturan içerik yüklememek.</li>
              <li>Türk Ceza Kanunu, Tüketicinin Korunması Hakkında Kanun ve ilgili mevzuata uymak.</li>
              <li>Abonelik bedelini zamanında ödemek.</li>
            </ul>
          ),
        },
        {
          title: "Fikri Mülkiyet Hakları",
          content: (
            <>
              <p>
                Optiefy platformunun tasarımı, yazılımı, logosu, içerikleri ve tüm ticari markaları YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ'ne aittir. Alıcı, hizmetleri yalnızca kişisel/ticari kullanım amacıyla kullanabilir; içerikleri kopyalayamaz, dağıtamaz veya alt lisans veremez.
              </p>
              <br />
              <p>
                Alıcının platforma yüklediği ürün görselleri, metinler ve marka unsurlarının fikri mülkiyet hakları Alıcıya aittir. Satıcı bu içerikleri yalnızca hizmetin ifası amacıyla kullanır.
              </p>
            </>
          ),
        },
        {
          title: "Sözleşmenin Feshi ve Hesap Askıya Alma",
          content: (
            <>
              <p>
                Alıcı, istediği zaman aboneliğini iptal edebilir. İptal halinde mevcut fatura dönemi sonuna kadar hizmet erişimi devam eder; kalan süre için ücret iadesi yapılmaz.
              </p>
              <br />
              <p>
                Satıcı; Alıcının bu sözleşmeyi, Kullanım Koşullarını veya ilgili mevzuatı ihlal etmesi durumunda önceden bildirimde bulunmaksızın Alıcının hesabını askıya alabilir veya sözleşmeyi feshedebilir.
              </p>
            </>
          ),
        },
        {
          title: "Sorumluluk Sınırlaması",
          content: (
            <>
              <p>
                Satıcı, Alıcının platforma yüklediği içeriklerden, üçüncü taraf entegrasyonlarından kaynaklanan sorunlardan veya Alıcının hatası nedeniyle oluşan zararlardan sorumlu değildir. Satıcının hizmet kusuru nedeniyle doğabilecek toplam sorumluluğu, son fatura döneminde tahsil edilen abonelik bedeli ile sınırlıdır.
              </p>
            </>
          ),
        },
        {
          title: "Uygulanacak Hukuk ve Uyuşmazlık Çözümü",
          content: (
            <>
              <p>
                Bu sözleşme Türk Hukuku'na tabidir. Uyuşmazlıklarda öncelikle Tüketici Hakem Heyetleri'ne başvurulabilir. Yasal sınırı aşan uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
              <br />
              <p>
                Alıcı, Gümrük ve Ticaret Bakanlığı tarafından yürütülen Tüketici Bilgi Sistemi (TBiS) üzerinden de şikâyet başvurusunda bulunabilir.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
