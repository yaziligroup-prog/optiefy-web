import { Resend } from "resend";
import type { OrderItem } from "@/types/order";

const FROM  = process.env.RESEND_FROM_EMAIL ?? "Optiefy <noreply@optiefy.com>";
const BRAND = "#7C3AED";

// Resend client lazy başlatılır — API key yoksa null döner (build sırasında patlamaz)
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function fmtPrice(n: number, currency?: string | null) {
  return currency === "USD"
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}

// ─── Base layout ─────────────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F7F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F5;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo / Header -->
        <tr><td style="background:linear-gradient(135deg,${BRAND},#EC4899);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">✨</div>
            <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Optiefy</span>
          </div>
        </td></tr>

        <!-- Body card -->
        <tr><td style="background:#FFFFFF;border-radius:0 0 16px 16px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            Optiefy &mdash; Türkiye'nin Akıllı Vitrin Platformu<br/>
            Bu e-postayı bir Optiefy mağazasından verdiğiniz sipariş nedeniyle aldınız.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: OrderItem[], currency?: string | null): string {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0F0EE;font-size:14px;color:#1A1A1A;">
        ${it.product_name}${it.quantity > 1 ? ` <span style="color:#9CA3AF;">×${it.quantity}</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #F0F0EE;font-size:14px;color:#1A1A1A;text-align:right;white-space:nowrap;">
        ${fmtPrice(it.line_total, currency)}
      </td>
    </tr>`).join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr>
        <th style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;text-align:left;border-bottom:2px solid #EAEAE8;">Ürün</th>
        <th style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;text-align:right;border-bottom:2px solid #EAEAE8;">Tutar</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── Email 1: Müşteri Sipariş Onayı ─────────────────────────────────────────────

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  city: string;
  createdAt: string;
  currency?: string | null;
}

export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-0.02em;">Siparişiniz Alındı! 🎉</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Merhaba ${data.customerName}, <strong>${data.storeName}</strong> mağazasına verdiğiniz sipariş başarıyla alındı.</p>

    <!-- Sipariş numarası -->
    <div style="background:#F7F0FF;border:1px solid #DDD6FE;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#7C3AED;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sipariş Numarası</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${BRAND};letter-spacing:0.04em;">${data.orderNumber}</p>
    </div>

    <!-- Ürünler -->
    <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sipariş Özeti</p>
    ${itemsTable(data.items, data.currency)}

    <!-- Toplam -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="font-size:13px;color:#6B7280;padding:4px 0;">Ara Toplam</td>
        <td style="font-size:13px;color:#1A1A1A;text-align:right;padding:4px 0;">${fmtPrice(data.subtotal, data.currency)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6B7280;padding:4px 0;">Kargo</td>
        <td style="font-size:13px;color:#1A1A1A;text-align:right;padding:4px 0;">${data.shippingCost === 0 ? "Ücretsiz" : fmtPrice(data.shippingCost, data.currency)}</td>
      </tr>
      <tr style="border-top:2px solid #EAEAE8;">
        <td style="font-size:15px;font-weight:700;color:#1A1A1A;padding:10px 0 0;">Toplam</td>
        <td style="font-size:15px;font-weight:700;color:${BRAND};text-align:right;padding:10px 0 0;">${fmtPrice(data.total, data.currency)}</td>
      </tr>
    </table>

    <!-- Teslimat adresi -->
    <div style="background:#F9F9F7;border:1px solid #EAEAE8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Teslimat Adresi</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${data.shippingAddress}<br/>${data.city}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
      Siparişiniz hazırlandıkça kargo takip bilgilerinizi bu e-posta adresine göndereceğiz.<br/>
      Sorularınız için mağaza sahibiyle iletişime geçebilirsiniz.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Siparişiniz alındı — ${data.orderNumber}`,
    html: layout(`Sipariş Onayı — ${data.orderNumber}`, body),
  });
}

// ─── Email 2: Satıcı Yeni Sipariş Bildirimi ──────────────────────────────────────

export interface NewOrderAlertData {
  orderNumber: string;
  sellerEmail: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  currency?: string | null;
}

export async function sendNewOrderAlert(data: NewOrderAlertData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-0.02em;">Yeni Sipariş Geldi! 🛍️</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;"><strong>${data.storeName}</strong> mağazanıza yeni bir sipariş geldi. Hemen hazırlamaya başlayabilirsiniz.</p>

    <!-- Sipariş numarası + tutar -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="margin:0 0 2px;font-size:11px;color:#059669;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sipariş No</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#064E3B;">${data.orderNumber}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0 0 2px;font-size:11px;color:#059669;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Toplam</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#064E3B;">${fmtPrice(data.total, data.currency)}</p>
      </div>
    </div>

    <!-- Müşteri bilgileri -->
    <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Müşteri Bilgileri</p>
    <div style="background:#F9F9F7;border:1px solid #EAEAE8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:12px;color:#9CA3AF;padding:3px 0;width:100px;">Ad Soyad</td><td style="font-size:13px;color:#1A1A1A;font-weight:500;">${data.customerName}</td></tr>
        <tr><td style="font-size:12px;color:#9CA3AF;padding:3px 0;">E-posta</td><td style="font-size:13px;color:#1A1A1A;">${data.customerEmail}</td></tr>
        <tr><td style="font-size:12px;color:#9CA3AF;padding:3px 0;">Telefon</td><td style="font-size:13px;color:#1A1A1A;">${data.customerPhone}</td></tr>
        <tr><td style="font-size:12px;color:#9CA3AF;padding:3px 0;">Adres</td><td style="font-size:13px;color:#1A1A1A;">${data.shippingAddress}, ${data.city}</td></tr>
      </table>
    </div>

    <!-- Ürünler -->
    <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sipariş Kalemleri</p>
    ${itemsTable(data.items, data.currency)}

    <div style="background:${BRAND};border-radius:12px;padding:16px 20px;text-align:center;margin-top:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.8);">Panele giriş yaparak siparişi yönetebilirsiniz.</p>
      <a href="https://optiefy.com/panel/siparisler" style="display:inline-block;margin-top:8px;background:#FFFFFF;color:${BRAND};font-size:13px;font-weight:700;padding:8px 20px;border-radius:8px;text-decoration:none;">
        Sipariş Paneli →
      </a>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.sellerEmail,
    subject: `🛍️ Yeni sipariş: ${data.orderNumber} — ${data.storeName}`,
    html: layout(`Yeni Sipariş — ${data.orderNumber}`, body),
  });
}

// ─── Email 3: Kargo Takip Bildirimi ──────────────────────────────────────────────

export interface ShippingUpdateData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  trackingNumber: string | null;
  shippingAddress: string;
  city: string;
  currency?: string | null;
}

export async function sendShippingUpdate(data: ShippingUpdateData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-0.02em;">Siparişiniz Kargoya Verildi! 📦</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Merhaba ${data.customerName}, <strong>${data.storeName}</strong> mağazasından verdiğiniz sipariş kargoya teslim edildi.</p>

    <!-- Sipariş numarası -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sipariş Numarası</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1E40AF;">${data.orderNumber}</p>
    </div>

    ${data.trackingNumber ? `
    <!-- Takip numarası -->
    <div style="background:#F0FDF4;border:2px dashed #86EFAC;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#059669;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Kargo Takip Numarası</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#064E3B;letter-spacing:0.08em;">${data.trackingNumber}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#6B7280;">Bu numarayı kargo firmasının web sitesinde kullanarak takip edebilirsiniz.</p>
    </div>` : ""}

    <!-- Teslimat adresi -->
    <div style="background:#F9F9F7;border:1px solid #EAEAE8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Teslimat Adresi</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${data.shippingAddress}<br/>${data.city}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
      Siparişiniz 1–3 iş günü içinde teslim edilmesi beklenmektedir.<br/>
      Bir sorunuz varsa mağaza sahibiyle iletişime geçin.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `📦 Siparişiniz kargoda — ${data.orderNumber}`,
    html: layout(`Kargo Bildirimi — ${data.orderNumber}`, body),
  });
}
