import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey || "MISSING_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

interface ServerLog {
  id: string;
  timestamp: number;
  type: "info" | "chat" | "image" | "error" | "admin";
  message: string;
  details?: string;
}

// In-Memory Admin & Usage State
const systemState = {
  adminPasscode: "admin123",
  settings: {
    defaultModel: "gemini-3.6-flash",
    systemInstruction:
      "You are 'My AI Assistant', an intelligent, polite, and helpful AI assistant. You fluently understand and respond in English, Urdu, Hindi, and Roman Urdu (e.g., 'Aap kaise hain? Main aapki kya madad kar sakta hoon?'). Match the language and script used by the user. Use clear formatting, bullet points, code blocks, and markdown tables when appropriate.",
    temperature: 0.7,
    imageLimitDaily: 50,
    enableVoiceInput: true,
    rateLimitPerMin: 30,
  },
  stats: {
    totalMessages: 0,
    totalImages: 0,
    activeUsersCount: 1,
    errorCount: 0,
    logs: [
      {
        id: "init-log",
        timestamp: Date.now(),
        type: "info" as const,
        message: "Server initialized and AI service ready.",
      },
    ] as ServerLog[],
  },
};

function logEvent(type: "info" | "chat" | "image" | "error" | "admin", message: string, details?: string) {
  const log = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    type,
    message,
    details,
  };
  systemState.stats.logs.unshift(log);
  if (systemState.stats.logs.length > 100) {
    systemState.stats.logs.pop();
  }
}

// System Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, customSystemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid message payload." });
    }

    systemState.stats.totalMessages++;
    logEvent("chat", "Chat message processed", `Count: ${systemState.stats.totalMessages}`);

    const client = getGenAIClient();
    const systemPrompt = customSystemInstruction || systemState.settings.systemInstruction;

    // Convert chat history for Gemini API
    // Gemini chat or generateContent accepts structured content
    const contents = messages.map((m: { role: string; content: string }) => {
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.content }],
      };
    });

    const response = await client.models.generateContent({
      model: systemState.settings.defaultModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: systemState.settings.temperature,
      },
    });

    const responseText = response.text || "I'm sorry, I couldn't process your request.";

    res.json({ text: responseText });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    systemState.stats.errorCount++;
    logEvent("error", "Chat generation failed", err?.message || String(err));
    res.status(500).json({
      error: "The AI service encountered an error generating a response.",
      details: err?.message || "Internal server error",
    });
  }
});

// API SSE Streaming Chat Endpoint
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { messages, customSystemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid message payload." });
    }

    systemState.stats.totalMessages++;
    logEvent("chat", "Streaming chat message", `Message length: ${messages.length}`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const client = getGenAIClient();
    const systemPrompt = customSystemInstruction || systemState.settings.systemInstruction;

    const contents = messages.map((m: { role: string; content: string }) => {
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.content }],
      };
    });

    const responseStream = await client.models.generateContentStream({
      model: systemState.settings.defaultModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: systemState.settings.temperature,
      },
    });

    for await (const chunk of responseStream) {
      const textChunk = chunk.text || "";
      if (textChunk) {
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Chat Stream API Error:", err);
    systemState.stats.errorCount++;
    logEvent("error", "Streaming chat failed", err?.message || String(err));
    if (!res.headersSent) {
      res.status(500).json({ error: "Streaming failed", details: err?.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err?.message || "Stream error" })}\n\n`);
      res.end();
    }
  }
});

// API Image Generation Endpoint
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, style = "realistic", aspectRatio = "1:1" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Image prompt is required." });
    }

    systemState.stats.totalImages++;
    logEvent("image", `Image generation requested`, `Style: ${style}, Ratio: ${aspectRatio}`);

    // Enhance prompt with style modifiers
    const styleModifiers: Record<string, string> = {
      realistic: "photorealistic, ultra detailed 8k photography, crisp focus, hyperdetailed natural lighting",
      cartoon: "playful cartoon illustration, vibrant colors, clean outlines, digital art style",
      anime: "masterpiece anime artwork, vibrant studio ghibli inspired illustration, detailed anime character",
      cinematic: "dramatic cinematic movie screenshot, atmospheric lighting, anamorphic lens flare, 35mm film grain",
      "3d": "3D render, blender 3d style, smooth octanerender lighting, vibrant textures, digital sculpture",
      illustration: "artistic digital illustration, modern editorial graphic art, clean composition, artistic texture",
      logo: "minimalist vector logo design, clean icon graphic, modern corporate emblem, centered, white background",
    };

    const modifier = styleModifiers[style] || styleModifiers.realistic;
    const fullPrompt = `${prompt}. ${modifier}`;

    const client = getGenAIClient();

    // Use gemini-3.1-flash-lite-image model
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16",
        },
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from model.");
    }

    res.json({
      imageUrl,
      prompt,
      style,
      aspectRatio,
      revisedPrompt: fullPrompt,
    });
  } catch (err: any) {
    console.error("Image Gen API Error:", err);
    systemState.stats.errorCount++;
    logEvent("error", "Image generation failed", err?.message || String(err));
    res.status(500).json({
      error: "Unable to generate image. Please try again or rephrase the prompt.",
      details: err?.message || "Internal server error",
    });
  }
});

// Admin Authentication & Endpoints
app.post("/api/admin/auth", (req, res) => {
  const { passcode } = req.body;
  if (passcode === systemState.adminPasscode) {
    logEvent("admin", "Admin logged in successfully");
    res.json({ authenticated: true });
  } else {
    logEvent("admin", "Failed admin login attempt");
    res.status(401).json({ authenticated: false, error: "Incorrect passcode." });
  }
});

app.get("/api/admin/stats", (req, res) => {
  res.json({
    stats: systemState.stats,
    settings: systemState.settings,
  });
});

app.post("/api/admin/settings", (req, res) => {
  const { settings, newPasscode } = req.body;
  if (settings) {
    systemState.settings = { ...systemState.settings, ...settings };
  }
  if (newPasscode && typeof newPasscode === "string") {
    systemState.adminPasscode = newPasscode;
  }
  logEvent("admin", "Admin settings updated");
  res.json({ success: true, settings: systemState.settings });
});

app.post("/api/admin/clear-logs", (req, res) => {
  systemState.stats.logs = [
    {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type: "info",
      message: "Logs cleared by admin.",
    },
  ];
  res.json({ success: true });
});

// Vite Middleware for Dev or Static files for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
