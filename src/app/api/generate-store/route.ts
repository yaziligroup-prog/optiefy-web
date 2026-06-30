/**
 * Evrensel AI Mağaza Üretici + Photoroom Entegrasyonu
 *
 * Akış:
 *  1. Kullanıcının yüklediği görseli GPT-4o Vision ile analiz et → ürünü tespit et
 *  2. Photoroom API ile 3 farklı arka plan varyasyonu üret (paralel)
 *  3. AI içerik üretimi + Photoroom işlemi eş zamanlı çalışır
 *  4. Supabase stores.image_urls[] → 3 ürün görseli
 *
 * Gerekli Supabase migrasyonu (bir kez çalıştır):
 *   ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
 *   ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_urls TEXT[];
 *   CREATE TABLE IF NOT EXISTS products (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
 *     user_id UUID REFERENCES auth.users(id),
 *     name TEXT NOT NULL,
 *     size_variants TEXT[],
 *     price NUMERIC NOT NULL DEFAULT 0,
 *     image_url TEXT
 *   );
 *   ALTER TABLE stores   ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "own_stores"   ON stores   FOR ALL USING (auth.uid() = user_id);
 *   CREATE POLICY "own_products" ON products FOR ALL USING (auth.uid() = user_id);
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI, { toFile } from "openai";

// ─── Types ──────────────────────────────────────────────────────────────────────

type GeneratedProduct = {
  name: string;
  size_variants: string[];
  price: number;
};

type GeneratedStore = {
  detected_product: string;
  store_name: string;
  seo_title: string;
  seo_description: string;
  features: string[];
  products: GeneratedProduct[];
};

type RequestBody = {
  storeName?: string;
  description?: string;
  price?: string;
  currency?: "TRY" | "USD";
  domain?: string;
  photoBase64?: string;
};

// ─── Universal AI Prompt ─────────────────────────────────────────────────────────
// Niş varsayımı yok — GPT-4o görseli analiz edip ürünü kendisi tespit eder.

function buildUniversalPrompt(
  userInput: string,
  price?: string,
  currency?: string,
  domain?: string,
): string {
  const priceInfo = price
    ? `Kullanıcının Belirlediği Fiyat: ${price} ${currency === "USD" ? "USD" : "TL"}`
    : "";
  const domainInfo = domain ? `İstenen Domain/Mağaza Adı: ${domain}` : "";

  return `Sen evrensel bir e-ticaret marka stratejisti ve Türk lüks pazarı uzmanısın.
Kullanıcının yüklediği ürün görseli ve/veya tanımına göre — ürün NE OLURSA OLSUN
(elektronik, giyim, aksesuar, gıda, ev dekor, takı, spor, kozmetik vb.) —
eksiksiz bir premium mağaza profili üret.

Kullanıcı Tanımı: "${userInput}"
${priceInfo}
${domainInfo}

SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{
  "detected_product": "Görselden veya tanımdan tespit edilen ürünün net, açıklayıcı Türkçe adı. Örn: 'Paslanmaz Çelik Tost Makinesi', 'El Yapımı Deri Omuz Çantası', 'Premium Seramik Kahve Seti', 'Altın Kaplama Takı Seti'",
  "store_name": "1-3 kelimeli, zarif, akılda kalıcı marka adı. Domain verilmişse onu kullan. Bu ürüne özel olsun.",
  "seo_title": "Ürün odaklı SEO başlığı, maksimum 60 karakter, Türkçe, detected_product içersin",
  "seo_description": "Bu ürünün değer önerisini öne çıkaran, alıcıyı ikna eden açıklama. 130-160 karakter, Türkçe. Bu ürüne özel yazılsın, genel olmasın.",
  "features": [
    "Bu ürünün en kritik teknik veya kalite özelliği — bu ürüne spesifik, gerçekçi",
    "Kullanıcıya duygusal veya pratik değer katan özellik — bu ürün için geçerli",
    "Güven ve özgünlüğü vurgulayan özellik — bu ürün kategorisine uygun"
  ],
  "products": [
    {
      "name": "Flagship versiyonun tam açıklayıcı ürün adı",
      "size_variants": ["Bu ürün türüne uygun seçenekler: giyimde S/M/L, elektronikte kapasite, takıda beden, renk vb."],
      "price": 0
    },
    {
      "name": "İkinci varyant, renk seçeneği veya tamamlayıcı ürün adı",
      "size_variants": ["Standart"],
      "price": 0
    },
    {
      "name": "Premium, koleksiyon veya bundle versiyonun adı",
      "size_variants": ["Özel"],
      "price": 0
    }
  ]
}

KESİN KURALLAR:
- Tüm çıktılar Türkçe
- detected_product: Görseli gerçekten analiz et, varsayım yapma. Görsel yoksa tanımdan tahmin et.
- store_name: Bu ürüne özel marka adı (elektronik ise tech, takı ise zarif, gıda ise doğal hissettirsin)
- features: Bu ürün kategorisi için gerçekten anlamlı özellikler (tost makinesi için ısınma süresi, çanta için deri kalitesi vb.)
- Fiyatlar: Kullanıcı fiyatına yakın, Türk pazarına uygun TL değerleri. 0 ise makul fiyat tahmin et.
- products tam 3 adet, features tam 3 adet
- Hiçbir genel/placeholder metin kullanma`;
}

// ─── AI Generation — GPT-4o Vision (evrensel) ───────────────────────────────────

async function generateWithOpenAI(
  userInput: string,
  price?: string,
  currency?: string,
  domain?: string,
  photoBase64?: string,
): Promise<GeneratedStore> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const promptText = buildUniversalPrompt(userInput, price, currency, domain);

  // Görsel varsa daima GPT-4o Vision kullan — ürün tespiti için kritik
  const useVision = !!photoBase64;
  const model = useVision ? "gpt-4o" : "gpt-4o-mini";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Sen evrensel bir e-ticaret marka stratejistisisin. Görüntüdeki ürünü analiz et ve sadece geçerli JSON döndür. Açıklama, markdown veya ek metin ekleme.",
    },
    useVision
      ? {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: photoBase64!, detail: "high" },
            },
            {
              type: "text",
              text: `Bu ürün görselini dikkatle analiz et. Ne tür bir ürün olduğunu tespit et ve buna göre mağaza profili oluştur.\n\n${promptText}`,
            },
          ],
        }
      : { role: "user", content: promptText },
  ];

  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages,
    max_tokens: 1400,
    temperature: 0.65,
  });

  const raw = resp.choices[0].message.content ?? "{}";
  return JSON.parse(raw) as GeneratedStore;
}

// ─── Gemini fallback (görsel yok, OpenAI mevcut değil) ──────────────────────────

async function generateWithGemini(
  userInput: string,
  price?: string,
  currency?: string,
  domain?: string,
): Promise<GeneratedStore> {
  const key = process.env.GOOGLE_AI_KEY!;
  const promptText = buildUniversalPrompt(userInput, price, currency, domain);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1400 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini API hatası (${res.status})`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(text) as GeneratedStore;
}

// ─── Validate AI output ──────────────────────────────────────────────────────────

function validateGenerated(raw: GeneratedStore): GeneratedStore {
  const detected = typeof raw.detected_product === "string" && raw.detected_product
    ? raw.detected_product
    : "Ürün";

  return {
    detected_product: detected,
    store_name:       typeof raw.store_name === "string" ? raw.store_name : detected,
    seo_title:        typeof raw.seo_title === "string" ? raw.seo_title : detected,
    seo_description:  typeof raw.seo_description === "string" ? raw.seo_description : "",
    features: Array.isArray(raw.features) ? raw.features.slice(0, 3).filter(Boolean) : [],
    products: Array.isArray(raw.products)
      ? raw.products.slice(0, 3).map((p) => ({
          name:          typeof p.name === "string" ? p.name : detected,
          size_variants: Array.isArray(p.size_variants) ? p.size_variants : ["Standart"],
          price:         typeof p.price === "number" && p.price > 0 ? p.price : 199,
        }))
      : [],
  };
}

// ─── Photoroom — stüdyo beyazı arka plan ────────────────────────────────────────

async function callPhotoroomVariant(
  imageBuffer: Buffer,
  bgColor: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
    formData.append("image_file", blob, "product.jpg");
    formData.append("bg_color", bgColor);
    formData.append("shadow",   "true");  // ürün altında doğal gölge
    formData.append("format",   "png");   // PNG — kalite zinciri için lossless

    const res = await fetch("https://api.photoroom.com/v1/segment", {
      method:  "POST",
      headers: { "x-api-key": apiKey },
      body:    formData,
    });

    if (!res.ok) {
      console.warn(`Photoroom ${bgColor} başarısız: ${res.status} ${await res.text().catch(() => "")}`);
      return null;
    }

    const imageData  = await res.arrayBuffer();
    const base64Str  = Buffer.from(imageData).toString("base64");
    const contentType = res.headers.get("content-type") ?? "image/png";
    return `data:${contentType};base64,${base64Str}`;
  } catch (err) {
    console.warn(`Photoroom variant error (${bgColor}):`, err);
    return null;
  }
}

// ─── Core: OpenAI images.edit — herhangi bir prompt için ────────────────────────────
// gpt-image-1 → dall-e-2 sırasıyla dener.
// Mask olmadan: model tüm görseli promptla yorumlar; arka plan değişir, ürün genelde korunur.

async function openAIImageEdit(
  pngBase64: string,
  prompt:    string,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const openai = new OpenAI({ apiKey: key });

  const rawB64 = pngBase64.replace(/^data:image\/[^;]+;base64,/, "");
  const pngBuf = Buffer.from(rawB64, "base64");

  for (const model of ["gpt-image-1", "dall-e-2"] as const) {
    try {
      const imageFile = await toFile(pngBuf, "product.png", { type: "image/png" });
      const resp = await openai.images.edit({
        model,
        image: imageFile,
        prompt,
        n:    1,
        size: "1024x1024",
      } as Parameters<typeof openai.images.edit>[0]) as { data: Array<{ b64_json?: string; url?: string }> };

      const item = resp.data[0];
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      if (item.url) {
        const imgResp = await fetch(item.url);
        const buf     = Buffer.from(await imgResp.arrayBuffer());
        return `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch (err) {
      console.warn(`images.edit (${model}):`, (err as Error).message?.slice(0, 100));
    }
  }
  return null;
}

// ─── V0 fallback: Gemini Vision → DALL-E 3 stüdyo ────────────────────────────────
// Yalnızca V0 (beyaz stüdyo) için kullanılır. Gemini ürünü tarif eder, DALL-E 3 üretir.

async function enhanceWithGeminiDALLE(
  pngBase64:   string,
  productDesc: string,
): Promise<string | null> {
  const geminiKey = process.env.GOOGLE_AI_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!geminiKey || !openaiKey) return null;

  try {
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: "image/png",
                  data: pngBase64.replace(/^data:image\/[^;]+;base64,/, ""),
                },
              },
              {
                text: "Analyze this product for DALL-E 3 studio photography prompt. Describe: exact product type, color(s), material, shape, distinctive features, finish. English only. Max 180 words.",
              },
            ],
          }],
          generationConfig: { maxOutputTokens: 260, temperature: 0.2 },
        }),
      },
    );

    let productEnDesc = productDesc;
    if (geminiResp.ok) {
      const gd = await geminiResp.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const txt = gd.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt && txt.length > 20) productEnDesc = txt;
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const resp   = await openai.images.generate({
      model:           "dall-e-3",
      prompt:          `Luxury professional e-commerce studio product photograph. ${productEnDesc}. Pure white background, soft shadow beneath, professional soft-box lighting, crystal sharp focus, photorealistic, no text, no people.`,
      n:               1,
      size:            "1024x1024",
      quality:         "hd",
      response_format: "b64_json",
    });

    const item = resp.data?.[0];
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  } catch (err) {
    console.warn("Gemini+DALL-E 3 studio:", (err as Error).message?.slice(0, 100));
  }
  return null;
}

// ─── Lifestyle sahneleri ───────────────────────────────────────────────────────────
// editPromptFn: images.edit için — ürünü korur, arka planı sahneleştirir
// dallePromptFn: DALL-E 3 için — sıfırdan lüks yaşam alanı görseli üretir (fallback)

const LIFESTYLE_SCENES: Array<{
  name:          string;
  editPromptFn:  (desc: string) => string;
  dallePromptFn: (desc: string) => string;
}> = [
  {
    name: "warm-interior",
    editPromptFn: (desc) =>
      `Keep the product (${desc}) exactly as shown. Transform the white background into a warm luxurious kitchen interior: the product rests on a marble countertop, soft natural window light, warm wood cabinet tones blurred in background, shallow depth of field. Premium editorial lifestyle photography. Product stays identical, only the background changes.`,
    dallePromptFn: (desc) =>
      `Professional lifestyle product photograph. ${desc} placed elegantly on a warm marble kitchen countertop. Soft natural window light, warm wood tones blurred in background, shallow depth of field, beautiful bokeh, fresh greenery accent. Premium editorial photography, aspirational and inviting, high resolution, no text, no people.`,
  },
  {
    name: "nordic-minimal",
    editPromptFn: (desc) =>
      `Keep the product (${desc}) exactly as shown. Transform the white background into a bright Scandinavian minimal interior: the product sits on a clean white concrete or stone surface, diffused soft daylight, small dried eucalyptus accent, linen textile nearby. Sophisticated and airy. Premium lifestyle magazine photography. Product unchanged, only background transforms.`,
    dallePromptFn: (desc) =>
      `Professional lifestyle product photograph. ${desc} on a clean white concrete surface in a Scandinavian minimal interior. Bright diffused daylight, subtle natural textures, small dried eucalyptus sprig, Nordic aesthetic. High-end editorial photography, clean and aspirational, high resolution, no text, no people.`,
  },
];

async function generateLifestyleVariant(
  pr0:         string | null,
  productDesc: string,
  photoBase64: string,
  sceneIdx:    0 | 1,
): Promise<string> {
  const scene = LIFESTYLE_SCENES[sceneIdx];
  const base  = pr0 ?? photoBase64;

  // Adım 1: images.edit — ürünü koruyarak arka planı lifestyle sahnesine çevir
  const edited = await openAIImageEdit(base, scene.editPromptFn(productDesc));
  if (edited) return edited;

  // Adım 2: DALL-E 3 HD — sıfırdan lüks lifestyle sahnesi üret
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const resp   = await openai.images.generate({
        model:           "dall-e-3",
        prompt:          scene.dallePromptFn(productDesc),
        n:               1,
        size:            "1024x1024",
        quality:         "hd",
        response_format: "b64_json",
      });
      const item = resp.data?.[0];
      if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    } catch (err) {
      console.warn(`DALL-E 3 lifestyle scene ${sceneIdx + 1}:`, (err as Error).message?.slice(0, 100));
    }
  }

  // Son fallback: pr0 — en azından arka planı temiz
  return pr0 ?? photoBase64;
}

/**
 * 3 Gerçekten Farklı Sahne
 *
 * V0 — Stüdyo Beyazı:   Photoroom(#FFF) + OpenAI edit + Gemini+DALL-E 3 fallback
 * V1 — Warm Interior:   Sıcak modern mutfak/yaşam alanı (images.edit → DALL-E 3)
 * V2 — Nordic Minimal:  İskandinav minimal mekan (images.edit → DALL-E 3)
 *
 * V1/V2 için Photoroom KULLANILMAZ — düz renk basar, lifestyle büyüsü bozulur.
 * OpenAI images.edit arka planı sahneleştirir; başarısız olursa DALL-E 3 yeni üretir.
 */
async function generatePhotoVariants(
  photoBase64:  string,
  apiKey:       string,
  productDesc?: string,
): Promise<string[]> {
  const rawBase64 = photoBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  const imgBuffer = Buffer.from(rawBase64, "base64");
  const desc      = productDesc ?? "premium product";

  // Photoroom yalnızca V0 için — temiz beyaz zemin oluşturur
  const pr0 = await callPhotoroomVariant(imgBuffer, "FFFFFF", apiKey);
  const studioBase = pr0 ?? photoBase64;

  // V0 stüdyo + V1 warm interior + V2 nordic minimal — tam paralel
  const [v0, v1, v2] = await Promise.all([
    (async (): Promise<string> => {
      const studioPrompt = `Professional luxury e-commerce studio photograph of: ${desc}. Pure white background, soft natural shadow beneath the product, professional soft-box lighting from upper-left, crystal sharp focus, high resolution, premium photorealistic quality, no text, no people.`;
      const edited = await openAIImageEdit(studioBase, studioPrompt);
      if (edited) return edited;
      const dalle  = await enhanceWithGeminiDALLE(studioBase, desc);
      return dalle ?? pr0 ?? photoBase64;
    })(),
    generateLifestyleVariant(pr0, desc, photoBase64, 0),
    generateLifestyleVariant(pr0, desc, photoBase64, 1),
  ]);

  return [v0, v1, v2];
}

// ─── Route Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body        = (await req.json()) as RequestBody;
    const userInput   = (body.description ?? body.storeName ?? "").trim();

    if (!userInput && !body.photoBase64) {
      return NextResponse.json({ error: "Ürün tanımı veya görsel gerekli" }, { status: 400 });
    }

    const description = userInput || "Genel ürün";

    // ── Auth ──────────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase    = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()  { return cookieStore.getAll(); },
          setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    // ── AI Üretimi + Photoroom paralel ────────────────────────────────────────────
    const photoroomKey   = process.env.PHOTOROOM_API_KEY;
    const hasPhoto       = !!body.photoBase64;
    const usePhotoroom   = hasPhoto && !!photoroomKey;

    const [rawGenerated, photoVariants] = await Promise.all([
      // AI içerik üretimi
      (async (): Promise<GeneratedStore> => {
        if (process.env.OPENAI_API_KEY) {
          return generateWithOpenAI(
            description, body.price, body.currency, body.domain, body.photoBase64,
          );
        }
        if (process.env.GOOGLE_AI_KEY) {
          return generateWithGemini(description, body.price, body.currency, body.domain);
        }
        throw new Error("Yapılandırılmış AI API anahtarı bulunamadı");
      })(),

      // Photoroom + enhancement zinciri (görsel varsa ve API key mevcutsa)
      // productDesc: AI üretimi tamamlanmadan başlar, bu yüzden body.description kullanıyoruz.
      // AI bitince detected_product daha doğru olur; enhancement paralel çalışır.
      usePhotoroom
        ? generatePhotoVariants(body.photoBase64!, photoroomKey!, body.description)
        : Promise.resolve<string[] | null>(null),
    ]);

    const generated = validateGenerated(rawGenerated);

    // ── Fiyat ─────────────────────────────────────────────────────────────────────
    const userPrice = body.price ? parseFloat(body.price.replace(",", ".")) : null;
    const finalPrice = userPrice && userPrice > 0
      ? userPrice
      : generated.products[0]?.price ?? 199;

    // ── image_urls: Photoroom varyasyonları veya orijinal görsel ──────────────────
    let imageUrls: string[] | null = null;
    if (photoVariants && photoVariants.length > 0) {
      imageUrls = photoVariants; // 3 adet Photoroom varyasyonu
    } else if (body.photoBase64) {
      imageUrls = [body.photoBase64]; // Photoroom yoksa orijinal
    }

    // ── Store insert ──────────────────────────────────────────────────────────────
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .insert({
        store_name:           generated.store_name,
        seo_title:            generated.seo_title,
        description:          generated.seo_description,
        features:             generated.features,
        product_price:        finalPrice,
        currency:             body.currency ?? "TRY",
        product_image_base64: body.photoBase64 ?? null,
        image_urls:           imageUrls,
        custom_domain:        body.domain || null,
        selected_plan:        "monthly",
        theme:                "modern",
        user_id:              user.id,
      })
      .select("id")
      .single();

    if (storeErr) {
      // Sütun yoksa (schema migration eksik) minimal fallback
      if (storeErr.code === "42703") {
        const { data: store2, error: storeErr2 } = await supabase
          .from("stores")
          .insert({
            store_name:    generated.store_name,
            seo_title:     generated.seo_title,
            description:   generated.seo_description,
            features:      generated.features,
            product_price: finalPrice,
            currency:      body.currency ?? "TRY",
            selected_plan: "monthly",
            theme:         "modern",
          })
          .select("id")
          .single();
        if (storeErr2) throw new Error(`Mağaza kaydedilemedi: ${storeErr2.message}`);
        return NextResponse.json({
          success: true,
          storeId: store2!.id,
          storeName: generated.store_name,
          detectedProduct: generated.detected_product,
        });
      }
      throw new Error(`Mağaza kaydedilemedi: ${storeErr.message}`);
    }

    // ── Products insert ───────────────────────────────────────────────────────────
    if (generated.products.length > 0) {
      const productRows = generated.products.map((p, i) => ({
        store_id:      store.id,
        user_id:       user.id,
        name:          p.name,
        size_variants: p.size_variants,
        price:         p.price > 0 ? p.price : finalPrice,
        // İlk ürüne Photoroom'un beyaz versiyonunu ata (varsa)
        ...(imageUrls && imageUrls[i] ? { image_url: imageUrls[i] } : {}),
      }));

      const { error: prodErr } = await supabase.from("products").insert(productRows);
      if (prodErr) console.warn("Products insert warning:", prodErr.message);
    }

    return NextResponse.json({
      success:         true,
      storeId:         store.id,
      storeName:       generated.store_name,
      detectedProduct: generated.detected_product,
      imageCount:      imageUrls?.length ?? 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu";
    console.error("generate-store hatası:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
