/* eslint-disable react/no-unescaped-entities */
import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | Optiefy",
  description: "Optiefy'ın kişisel veri işleme politikası ve KVKK kapsamındaki aydınlatma metni.",
};

export default function GizlilikVeKvkk() {
  return (
    <LegalLayout
      title="Gizlilik Politikası ve KVKK Aydınlatma Metni"
      subtitle="6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kişisel verilerinizin nasıl işlendiğini açıklayan bilgilendirme metnidir."
      updatedAt="1 Temmuz 2026"
      sections={[
        {
          title: "Veri Sorumlusu",
          content: (
            <>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz <strong>Veri Sorumlusu</strong> sıfatıyla aşağıda bilgileri yer alan şirketimiz tarafından işlenmektedir:
              </p>
              <br />
              <p><strong>Unvan:</strong> YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ</p>
              <p><strong>Platform:</strong> Optiefy (optiefy.com)</p>
              <p><strong>E-posta:</strong> <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a></p>
            </>
          ),
        },
        {
          title: "İşlenen Kişisel Veriler ve Toplama Yöntemleri",
          content: (
            <>
              <p>Optiefy platformunu kullandığınızda aşağıdaki kişisel verileriniz toplanmaktadır:</p>
              <br />
              <p><strong>Kimlik ve İletişim Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası.</p>
              <br />
              <p><strong>Hesap ve Mağaza Bilgileri:</strong> Kullanıcı adı, mağaza adı, mağaza açıklaması, ürün ve fiyat bilgileri, tercih edilen tema ve görsel ayarlar.</p>
              <br />
              <p><strong>Finansal Bilgiler:</strong> Ödeme işlemlerinde ödeme yöntemi tipi (kart numarası doğrudan Optiefy sunucularında saklanmaz; ödeme altyapısı PayTR tarafından güvenli şekilde işlenir).</p>
              <br />
              <p><strong>Teknik ve Log Verileri:</strong> IP adresi, tarayıcı türü, işletim sistemi, ziyaret tarihleri, sayfa etkileşimleri.</p>
              <br />
              <p><strong>Sosyal Medya Verileri:</strong> Google veya Apple ile giriş yapılması durumunda, ilgili sağlayıcı tarafından paylaşılan profil bilgileri (ad, e-posta, profil resmi).</p>
              <br />
              <p>Kişisel verileriniz; platform kayıt formları, ödeme süreçleri, otomatik teknik sistemler ve üçüncü taraf OAuth sağlayıcıları aracılığıyla otomatik/otomatik olmayan yollarla toplanmaktadır.</p>
            </>
          ),
        },
        {
          title: "Kişisel Verilerin İşlenme Amaçları",
          content: (
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>Kullanıcı hesabı oluşturulması ve kimlik doğrulaması</li>
              <li>Abonelik ve ödeme işlemlerinin yürütülmesi</li>
              <li>E-ticaret vitrini ve mağaza yönetimi hizmetlerinin sunulması</li>
              <li>AI destekli içerik üretimi ve kişiselleştirme</li>
              <li>Müşteri destek hizmetlerinin sağlanması</li>
              <li>Platform güvenliğinin ve dolandırıcılık önleme faaliyetlerinin yürütülmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi (vergi, fatura, KVKK)</li>
              <li>Platform geliştirme ve kullanıcı deneyimi iyileştirme amacıyla anonim analiz</li>
              <li>Açık rıza alınmış olması halinde ticari elektronik ileti gönderimi</li>
            </ul>
          ),
        },
        {
          title: "Hukuki İşleme Dayanaklarımız",
          content: (
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li><strong>Sözleşmenin ifası:</strong> Hizmet sunumu için zorunlu veriler (KVKK md. 5/2-c)</li>
              <li><strong>Meşru menfaat:</strong> Platform güvenliği ve hizmet kalitesi geliştirme (KVKK md. 5/2-f)</li>
              <li><strong>Yasal yükümlülük:</strong> Vergi, muhasebe ve resmi bildirim gereksinimleri (KVKK md. 5/2-ç)</li>
              <li><strong>Açık rıza:</strong> Pazarlama iletişimi ve opsiyonel özellikler (KVKK md. 5/1)</li>
            </ul>
          ),
        },
        {
          title: "Kişisel Verilerin Aktarılması",
          content: (
            <>
              <p>Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:</p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li><strong>PayTR Bilişim Hizmetleri A.Ş.:</strong> Ödeme işlemlerinin güvenli biçimde gerçekleştirilmesi</li>
                <li><strong>Supabase Inc.:</strong> Veritabanı ve kimlik doğrulama altyapısı (veriler şifreli olarak saklanır)</li>
                <li><strong>Vercel Inc.:</strong> Platform barındırma hizmetleri</li>
                <li><strong>Resmi makamlar:</strong> Mahkeme kararı veya yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları</li>
              </ul>
              <br />
              <p>Yurt dışına aktarımlarda KVKK'nın 9. maddesi ve Kişisel Verileri Koruma Kurulu kararları esas alınmaktadır.</p>
            </>
          ),
        },
        {
          title: "Çerezler (Cookies) ve İzleme Teknolojileri",
          content: (
            <>
              <p>Optiefy, platform işlevselliğini ve kullanıcı deneyimini sağlamak amacıyla çerezler kullanmaktadır:</p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li><strong>Zorunlu Çerezler:</strong> Oturum yönetimi ve kimlik doğrulama için gereklidir; devre dışı bırakılamaz.</li>
                <li><strong>Fonksiyonel Çerezler:</strong> Dil ve tema tercihlerinizi hatırlamak için kullanılır.</li>
                <li><strong>Analitik Çerezler:</strong> Platform kullanım istatistikleri için (açık rızanıza bağlıdır).</li>
              </ul>
              <br />
              <p>Tarayıcı ayarlarınızdan çerez tercihlerinizi yönetebilirsiniz.</p>
            </>
          ),
        },
        {
          title: "Veri Saklama Süreleri",
          content: (
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>Hesap verileri: Hesap aktif olduğu süre + silinme talebinden itibaren 30 gün</li>
              <li>Ödeme kayıtları ve faturalar: 10 yıl (Vergi Usul Kanunu gereği)</li>
              <li>Log ve teknik veriler: 2 yıl</li>
              <li>Pazarlama onayı kapsamındaki veriler: Rıza geri alınana kadar</li>
              <li>Yasal uyuşmazlık süreçleri: Uyuşmazlık sonuçlanana kadar</li>
            </ul>
          ),
        },
        {
          title: "KVKK Kapsamındaki Haklarınız",
          content: (
            <>
              <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <br />
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
                <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
                <li>Kanun kapsamında silinmesini veya yok edilmesini isteme</li>
                <li>İtiraz etme ve zararın giderilmesini talep etme</li>
              </ul>
              <br />
              <p>
                Taleplerinizi <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED" }}>info@optiefy.com</a> adresine "KVKK Başvurusu" konusuyla iletebilirsiniz. Başvurular <strong>30 gün</strong> içinde yanıtlanır.
              </p>
            </>
          ),
        },
        {
          title: "Gizlilik Politikası Değişiklikleri",
          content: (
            <p>
              YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ bu politikayı zaman zaman güncelleyebilir. Önemli değişiklikler, kayıtlı e-posta adresinize bildirim gönderilerek duyurulur. Güncel metne her zaman optiefy.com/gizlilik-ve-kvkk adresinden ulaşabilirsiniz.
            </p>
          ),
        },
      ]}
    />
  );
}
