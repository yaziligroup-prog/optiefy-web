// ─── Sipariş veri modeli (Supabase: orders / order_items) ────────────────────────

export type OrderStatus =
  | "pending"     // Onay bekliyor
  | "preparing"   // Hazırlanıyor
  | "shipped"     // Kargolandı
  | "delivered"   // Teslim edildi
  | "cancelled";  // İptal edildi

export type PaymentStatus = "paid" | "pending" | "failed";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  image: string | null;
  line_total: number;
}

export interface Order {
  id: string;
  created_at: string;
  order_number: string;
  store_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  postal_code: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  total_desi: number;
  is_oversized: boolean;
  status: OrderStatus;
  payment_status: PaymentStatus;
  tracking_number?: string | null;
}

// Sipariş listesi + detay için tüm kalemlerle birlikte çekilen sipariş
export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

// Server Action girdisi (CheckoutModal → createOrder)
export interface CreateOrderInput {
  storeId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    image: string | null;
  }[];
  subtotal: number;
  shippingCost: number;
  totalDesi: number;
  isOversized: boolean;
}
