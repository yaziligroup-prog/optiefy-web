import crypto from "crypto";

// ─── Ortam değişkenleri ──────────────────────────────────────────────────────────

export const PAYTR_ENABLED = Boolean(process.env.PAYTR_MERCHANT_ID);

const MERCHANT_ID   = process.env.PAYTR_MERCHANT_ID   ?? "";
const MERCHANT_KEY  = process.env.PAYTR_MERCHANT_KEY  ?? "";
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT ?? "";
const TEST_MODE     = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0";
const BASE_URL      = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4000";

const PAYTR_API_URL   = "https://www.paytr.com/odeme/api/get-token/";
const PAYTR_IFRAME_URL = "https://www.paytr.com/odeme/guvenli/";

// ─── Types ───────────────────────────────────────────────────────────────────────

export interface PayTRBasketItem {
  name:      string;
  unitPrice: number; // TL
  quantity:  number;
}

export interface GenerateTokenInput {
  merchantOid:      string; // = order_number
  email:            string;
  customerName:     string;
  userPhone:        string;
  userAddress:      string;
  userIp:           string;
  amountTL:         number; // TL, kuruşa çevrilir
  items:            PayTRBasketItem[];
  currency?:        "TL" | "USD" | "EUR";
  maxInstallment?:  number;
  // Pazaryeri: alt satıcı anahtarları (opsiyonel)
  subMerchantKey?:  string | null;
  subMerchantSalt?: string | null;
}

export interface PayTRTokenResult {
  success:    boolean;
  iframeToken?: string;
  iframeUrl?:   string;
  error?:       string;
}

export interface CallbackPayload {
  merchant_oid:      string;
  status:            "success" | "failed";
  total_amount:      string; // kuruş
  hash:              string;
  payment_type?:     string;
  installment_count?: string;
  currency?:         string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function buildBasket(items: PayTRBasketItem[]): string {
  const arr = items.map((it) => [
    it.name.slice(0, 100),
    it.unitPrice.toFixed(2),
    String(it.quantity),
  ]);
  return Buffer.from(JSON.stringify(arr)).toString("base64");
}

function hmac(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("base64");
}

// ─── iFrame Token Oluşturma ──────────────────────────────────────────────────────

export async function generateIframeToken(
  input: GenerateTokenInput
): Promise<PayTRTokenResult> {
  if (!PAYTR_ENABLED) {
    return { success: false, error: "PayTR yapılandırılmamış." };
  }

  const amountKurus   = Math.round(input.amountTL * 100);
  const currency      = input.currency ?? "TL";
  const maxInstall    = input.maxInstallment ?? 0;
  const noInstall     = maxInstall === 0 ? "1" : "0";
  const installCount  = "0";
  const paymentType   = "card";
  const non3d         = "0";
  const userBasket    = buildBasket(input.items);

  // PayTR hash string: platform anahtarları kullanılır
  const hashStr =
    MERCHANT_ID +
    input.userIp +
    input.merchantOid +
    input.email +
    String(amountKurus) +
    paymentType +
    installCount +
    currency +
    TEST_MODE +
    non3d;

  const paytrToken = hmac(hashStr + MERCHANT_SALT, MERCHANT_KEY);

  const params = new URLSearchParams({
    merchant_id:       MERCHANT_ID,
    user_basket:       userBasket,
    user_name:         input.customerName.slice(0, 60),
    user_address:      input.userAddress.slice(0, 200),
    user_phone:        input.userPhone,
    user_email:        input.email,
    payment_amount:    String(amountKurus),
    merchant_ok_url:   `${BASE_URL}/paytr/success`,
    merchant_fail_url: `${BASE_URL}/paytr/fail`,
    currency_type:     currency,
    test_mode:         TEST_MODE,
    debug_on:          "0",
    non_3d:            non3d,
    lang:              "tr",
    max_installment:   String(maxInstall),
    no_installment:    noInstall,
    merchant_oid:      input.merchantOid,
    user_ip:           input.userIp,
    paytr_token:       paytrToken,
  });

  // Pazaryeri: alt satıcı anahtarı varsa ekle
  if (input.subMerchantKey)  params.set("sub_merchant_key",  input.subMerchantKey);
  if (input.subMerchantSalt) params.set("sub_merchant_salt", input.subMerchantSalt);

  const res = await fetch(PAYTR_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = (await res.json()) as { status: string; token?: string; reason?: string };

  if (json.status !== "success" || !json.token) {
    return { success: false, error: json.reason ?? "PayTR token alınamadı." };
  }

  return {
    success:    true,
    iframeToken: json.token,
    iframeUrl:   PAYTR_IFRAME_URL + json.token,
  };
}

// ─── Callback Hash Doğrulama ─────────────────────────────────────────────────────

export function verifyCallbackHash(payload: CallbackPayload): boolean {
  const { merchant_oid, status, total_amount, hash } = payload;
  const hashStr = MERCHANT_ID + MERCHANT_SALT + total_amount + status + merchant_oid;
  const expected = hmac(hashStr, MERCHANT_KEY);
  return expected === hash;
}

// ─── Alt Satıcı Kaydı ────────────────────────────────────────────────────────────

export interface SubMerchantInput {
  name:       string;
  email:      string;
  phone:      string;
  iban?:      string;
  taxNumber?: string;
}

export interface SubMerchantResult {
  success:          boolean;
  subMerchantId?:   string;
  subMerchantKey?:  string;
  subMerchantSalt?: string;
  error?:           string;
}

export async function registerSubMerchant(
  input: SubMerchantInput
): Promise<SubMerchantResult> {
  if (!PAYTR_ENABLED) {
    return { success: false, error: "PayTR yapılandırılmamış." };
  }

  // PayTR Pazaryeri alt satıcı kayıt API'si
  // Gerçek endpoint ve parametreler PayTR entegrasyon dokümanından alınmalı
  const hashStr = MERCHANT_ID + input.email + MERCHANT_SALT;
  const token   = hmac(hashStr, MERCHANT_KEY);

  const params = new URLSearchParams({
    merchant_id:    MERCHANT_ID,
    sub_name:       input.name,
    sub_email:      input.email,
    sub_phone:      input.phone,
    paytr_token:    token,
  });

  if (input.iban)      params.set("sub_iban",       input.iban);
  if (input.taxNumber) params.set("sub_tax_number", input.taxNumber);

  const res = await fetch("https://www.paytr.com/odeme/api/sub-merchant/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = (await res.json()) as {
    status: string;
    sub_merchant_id?: string;
    sub_merchant_key?: string;
    sub_merchant_salt?: string;
    reason?: string;
  };

  if (json.status !== "success") {
    return { success: false, error: json.reason ?? "Alt satıcı kaydı başarısız." };
  }

  return {
    success:          true,
    subMerchantId:   json.sub_merchant_id,
    subMerchantKey:  json.sub_merchant_key,
    subMerchantSalt: json.sub_merchant_salt,
  };
}
