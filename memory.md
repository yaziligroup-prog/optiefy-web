# Sihirli Vitrin — Proje Hafıza Dosyası

## Proje Kimliği
- **İsim:** Sihirli Vitrin (Geçici)
- **Hedef Kitle:** Türkiye'deki amatör/Instagram e-ticaret satıcıları
- **Temel Değer Önerisi:** 1 Ürün Fotoğrafı + 1 Fiyat + Mağaza İsmi → Anında Hazır Mobil Vitrin

## Teknoloji Yığını
- **Framework:** Next.js 14+ (App Router)
- **Stil:** Tailwind CSS
- **Dil:** TypeScript
- **Animasyon:** Framer Motion
- **İkonlar:** Lucide React
- **Backend (Faz 2+):** Supabase
- **Ödeme (Faz 2+):** PayTR Marketplace API
- **Görsel AI (Faz 2+):** Photoroom API
- **Metin AI (Faz 2+):** Claude 3.5 Sonnet API

## Geliştirme Fazları

### Faz 1 — Ön Yüz ve İllüzyon (ŞİMDİKİ FAZ)
Gerçek API çağrısı yok. Her şey frontend'de simüle edilir.
- Landing page (yükleme formu)
- Sihirli loading animasyonu (5 Türkçe mesaj)
- Canlı mobil vitrin önizlemesi (iPhone mockup)

### Faz 2 — Gerçek Entegrasyon
- Supabase auth ve veritabanı
- Photoroom API ile arka plan kaldırma
- Claude API ile ürün açıklaması üretimi
- PayTR ile ödeme altyapısı

### Faz 3 — Büyüme
- Çoklu ürün desteği
- Özel domain
- Analitik dashboard
- Sosyal medya paylaşım linkleri

## Kod Kuralları
- Her şey modüler component olarak yazılır
- Türkçe içerik, İngilizce kod değişkenleri
- Mobile-first tasarım
- Dark mode destekli
