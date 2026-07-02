export type Product = {
  id: string;
  created_at: string;
  store_id: string;
  user_id: string | null;
  name: string;
  size_variants: string[] | null;
  price: number;
  currency?: string | null;
  description?: string | null;
  image_url?: string | null;
  status?: string | null; // 'active' | 'pending'
  category?: string | null; // nav alt menü slug'ı — vitrin kategori filtresi (örn: "yeni-urunler")
};

// Canlı Tema Editörü'nün yayınladığı özelleştirmeler (stores.theme_settings jsonb)
export type StoreThemeSettings = {
  announcement_text?: string | null;
  primary_color?:     string | null; // hex, örn: "#7C3AED"
  button_radius?:     number | null; // px
  font_heading?:      string | null; // THEME_FONTS anahtarı, örn: "Playfair Display"
  font_body?:         string | null; // THEME_FONTS anahtarı
  hero_title?:        string | null; // hero büyük başlık override
  hero_subtitle?:     string | null; // hero alt açıklama override
  hero_overlay?:      number | null; // 0–90, hero görseli üzerine ek karartma yüzdesi
  logo_url?:          string | null; // https URL veya data:image/... — metin logo yerine geçer
  show_countdown?:        boolean | null; // duyuru barında flash-sale geri sayım sayacı
  show_currency_selector?: boolean | null; // header'da para birimi dropdown'u (TRY/USD/AUD)
  social_instagram?:  string | null; // footer sosyal ikon linkleri — boşsa ikon gizlenir
  social_twitter?:    string | null;
  social_facebook?:   string | null;
  // Vitrin nav menüsü — iki kademeli hiyerarşi (max 6 ana eleman, her birinde max 6 alt menü)
  nav_links?:         {
    label: string;
    url: string;
    children?: { label: string; url: string }[];
  }[] | null;
  hero_image_url?:    string | null; // hero arka plan görseli override (https veya data:image)
  dark_mode?:         boolean | null; // vitrin gece modu
  hide_store_name?:   boolean | null; // true → header'da marka metni tamamen gizlenir
  header_layout?:     "center" | "left" | null; // marka/logo konumu (varsayılan: center)
};

export type Store = {
  id: string;
  created_at: string;
  store_name: string;
  product_price: number;
  product_image_base64: string | null;
  selected_plan: "monthly" | "yearly";
  status: string;
  seo_title: string | null;
  description: string | null;
  features: string[] | null;
  image_urls: string[] | null;
  custom_domain: string | null;
  theme: string | null;
  theme_settings?: StoreThemeSettings | null;
  currency: string | null;
  user_id: string | null;
  shipping_fee?: number | null;
  free_shipping_threshold?: number | null;
  // populated when fetched with .select("*, products(*)")
  products?: Product[];
};
