export type Product = {
  id: string;
  created_at: string;
  store_id: string;
  user_id: string | null;
  name: string;
  size_variants: string[] | null;
  price: number;
  image_url?: string | null;
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
  currency: string | null;
  user_id: string | null;
  shipping_fee?: number | null;
  free_shipping_threshold?: number | null;
  // populated when fetched with .select("*, products(*)")
  products?: Product[];
};
