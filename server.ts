import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limit for full subtitle files
app.use(express.json({ limit: "50mb" }));

// Initialize Google GenAI Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Translation API will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Support 130+ languages (collated popular and standard list)
const SUPPORTED_LANGUAGES = [
  { code: "auto", name: "Auto Detect" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "as", name: "Assamese" },
  { code: "ay", name: "Aymara" },
  { code: "az", name: "Azerbaijani" },
  { code: "bm", name: "Bambara" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bho", name: "Bhojpuri" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "dv", name: "Dhivehi" },
  { code: "doi", name: "Dogri" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "ee", name: "Ewe" },
  { code: "tl", name: "Filipino (Tagalog)" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "fy", name: "Frisian" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gn", name: "Guarani" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "iw", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "ilo", name: "Ilocano" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "gom", name: "Konkani" },
  { code: "ko", name: "Korean" },
  { code: "kri", name: "Krio" },
  { code: "ku", name: "Kurdish (Kurmanji)" },
  { code: "ckb", name: "Kurdish (Sorani)" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "ln", name: "Lingala" },
  { code: "lt", name: "Lithuanian" },
  { code: "lg", name: "Luganda" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mai", name: "Maithili" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mni-Mtei", name: "Meiteilon (Manipuri)" },
  { code: "lus", name: "Mizo" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "or", name: "Odia (Oriya)" },
  { code: "om", name: "Oromo" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "qu", name: "Quechua" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sm", name: "Samoan" },
  { code: "sa", name: "Sanskrit" },
  { code: "gd", name: "Scots Gaelic" },
  { code: "nso", name: "Sepedi" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "es", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "tt", name: "Tatar" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "ti", name: "Tigrinya" },
  { code: "ts", name: "Tsonga" },
  { code: "tr", name: "Turkish" },
  { code: "tk", name: "Turkmen" },
  { code: "ak", name: "Twi" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "ug", name: "Uyghur" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" }
];

// Return language choices
app.get("/api/languages", (req, res) => {
  res.json(SUPPORTED_LANGUAGES);
});

// Translation API endpoint (Batch-based)
app.post("/api/translate-batch", async (req, res) => {
  try {
    const { items, sourceLang, targetLang, glossary } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'items' field. Expected a non-empty array." });
    }

    if (!targetLang) {
      return res.status(400).json({ error: "Missing required 'targetLang' field." });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API client is not configured on this server. Please set GEMINI_API_KEY." });
    }

    // Lookup full language names for better context
    const sourceLangName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
    const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

    // Build the glossary instructions
    let glossaryInstructions = "";
    if (glossary && Array.isArray(glossary) && glossary.length > 0) {
      glossaryInstructions = "\nCRITICAL GLOSSARY RULES (Strictly enforce these translation matchings):\n" +
        glossary.map((g: any, index: number) => 
          `${index + 1}. Source term "${g.source}" must be translated exactly as "${g.target}"` + (g.matchCase ? " (case-sensitive)." : ".")
        ).join("\n");
    }

    // Format prompt instructions
    const systemInstruction = `You are a professional subtitle translator. Your task is to translate subtitle texts into the target language: "${targetLangName}".
The source language is: "${sourceLangName}".

CRITICAL TRANSLATION RULES:
1. Preserve all subtitle formatting tags, HTML tags (e.g., <i>, </i>, <b>, </b>, <u>, </u>, <font color="...">) and ASS style/placement tags (e.g., {\\an8}, {\\pos(x,y)}, {\\i1}, {\\b1}, {\\bord2}, {\\fnArial}, etc.) exactly as they are. Keep them in their exact relative positions in the translated string.
2. Maintain line breaks (represented as "\\n") in the translated text where appropriate to maintain subtitle flow.
3. Keep speaker prefixes if present (e.g., "Narrator: ", "John: ").
4. Translate the actual spoken dialogue accurately, naturally, and contextually. Do not translate the tags themselves or technical words.
5. If the dialogue is empty, contains only tags, or is non-verbal sounds (like [coughing]), return it exactly as is or with minimal translation where appropriate.
6. Return the exact same number of items, mapping each translated line to its original index.
${glossaryInstructions}
`;

    // Map items to simplified input array to save tokens
    const inputPayload = items.map(item => ({
      index: item.id,
      text: item.text
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `Translate the following subtitle items according to the rules. Return the translations inside the required JSON schema format matching each original index.\n\nItems:\n${JSON.stringify(inputPayload, null, 2)}` }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Lower temperature for consistent translations and strict format
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of translated subtitle entries",
          items: {
            type: Type.OBJECT,
            properties: {
              index: { 
                type: Type.STRING, 
                description: "The original index/id of the item" 
              },
              translatedText: { 
                type: Type.STRING, 
                description: "The translated subtitle dialogue text with all original formatting tags preserved" 
              }
            },
            required: ["index", "translatedText"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from translation engine.");
    }

    const translations = JSON.parse(responseText.trim());

    // Map translations back to the items array
    const mappedItems = items.map(originalItem => {
      const match = translations.find((t: any) => String(t.index) === String(originalItem.id));
      return {
        ...originalItem,
        translatedText: match ? match.translatedText : originalItem.text
      };
    });

    res.json({ translations: mappedItems });
  } catch (error: any) {
    console.error("Translation Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred during translation.",
      details: error.stack || ""
    });
  }
});

// Configure Vite middleware and static asset routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
