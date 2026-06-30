import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// --- A. OpenAI gpt-4o ile metin üretimi ---
async function generateAIContent(imageBase64: string, price: string, contextPrompt?: string) {
  const contextNote = contextPrompt
    ? `\n\nEk bağlam (öncelikli olarak dikkate al): ${contextPrompt}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Sen lüks markalar için çalışan, dönüşüm oranı (conversion) odaklı, üst düzey bir e-ticaret metin yazarı ve marka stratejistisin. Fotoğraftaki ürünün materyal kalitesini, boyutunu, işçiliğini ve hedef kitlesini analiz et.${contextNote}`,
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64 } },
          {
            type: "text",
            text: `Fiyatı: ${price} TL.${contextPrompt ? ` Mağaza/ürün bağlamı: ${contextPrompt}.` : ""} Bana SADECE şu JSON formatında yanıt ver:
{
  "seo_title": "Ürünü en lüks ve cazip haliyle tanımlayan, tıklama oranını maksimize edecek harika bir başlık.",
  "description": "Müşterinin duygularına hitap eden, ürünün nerede ve nasıl kullanılacağını anlatan, premium hissiyatı veren 3 paragraflık çok detaylı, ikna edici ve editoryal bir ürün hikayesi. Paragraflar arasında boş satır bırak.",
  "features": ["Vurucu ve teknik detay 1", "Vurucu detay 2", "Vurucu detay 3", "Vurucu detay 4"],
  "recommended_theme": "Ürünün estetiğine ve hedef kitlesine göre en uygun tema. Seçenekler: 'luxury' (sessiz lüks; mücevher, premium moda, yüksek fiyatlı tasarım için), 'modern' (Apple/minimalist tech; teknoloji, aksesuar, sade ürünler için), 'artisan' (doğal/bohem; el yapımı, seramik, organik, ahşap ürünler için), 'dynamic' (street/GenZ; gençlik, streetwear, sneaker, cesur ürünler için), 'corporate' (klasik kurumsal; güven odaklı, standart e-ticaret, ofis/teknik ürünler için). Sadece bu beş değerden birini yaz.",
  "color_palette": {
    "primary": "#hexkod — ürünün ana rengiyle uyumlu lüks bir renk",
    "secondary": "#hexkod — complementary ikincil renk"
  }
}`,
          },
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as {
    seo_title: string;
    description: string;
    features: string[];
    recommended_theme?: "luxury" | "modern" | "artisan" | "dynamic" | "corporate";
    color_palette?: { primary: string; secondary: string };
  };
}

// --- B. Photoroom ile stüdyo arka planı ---
async function processWithPhotoroom(
  imageBase64: string,
  backgroundPrompt: string
): Promise<string | null> {
  try {
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mediaType, data] = match;
    const buffer = Buffer.from(data, "base64");

    const formData = new FormData();
    formData.append(
      "imageFile",
      new Blob([buffer], { type: mediaType }),
      "product.jpg"
    );
    formData.append("background.prompt", backgroundPrompt);

    const res = await fetch("https://image-api.photoroom.com/v2/edit", {
      method: "POST",
      headers: { "x-api-key": process.env.PHOTOROOM_API_KEY! },
      body: formData,
    });

    if (!res.ok) {
      console.warn("Photoroom yanıtı:", res.status, await res.text());
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/png";
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("Photoroom hatası:", err);
    return null;
  }
}

const STUDIO_PROMPTS = [
  "A highly realistic, minimalist luxury studio setting with a premium Carrara marble podium, soft cinematic lighting, realistic soft shadows, 8k resolution, professional product photography.",
  "High-end modern interior lifestyle background, warm sunlight casting aesthetic shadows, blurred elegant living room elements in the background (bokeh), photorealistic.",
  "Clean, editorial pure soft pastel color background (like a high-end Vogue magazine product shoot), perfect studio flash lighting, sharp focus, hyper-realistic.",
];

// --- POST handler ---
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, storeName, price, context_prompt } = (await req.json()) as {
      imageBase64: string;
      storeName: string;
      price: string;
      context_prompt?: string;
    };

    if (!imageBase64 || !storeName || !price) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    // Metin + 3 görsel paralel üret
    const [aiContent, ...studioImages] = await Promise.all([
      generateAIContent(imageBase64, price, context_prompt).catch((err) => {
        console.error("OpenAI hatası:", err);
        return null;
      }),
      ...STUDIO_PROMPTS.map((prompt) =>
        processWithPhotoroom(imageBase64, prompt)
      ),
    ]);

    const image_urls = studioImages.filter((img): img is string => img !== null);

    return NextResponse.json({
      success: true,
      seo_title: aiContent?.seo_title ?? null,
      description: aiContent?.description ?? null,
      features: aiContent?.features ?? null,
      recommended_theme: aiContent?.recommended_theme ?? "modern",
      color_palette: aiContent?.color_palette ?? null,
      image_urls,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as Record<string, unknown>).message)
        : JSON.stringify(err);
    console.warn("API generate hatası:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
