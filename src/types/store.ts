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
