import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.MODEL_PROVIDER || inferProvider(),
    hasHuggingFaceKey: Boolean(process.env.HUGGINGFACE_API_KEY),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/api/generate", async (req, res) => {
  const result = await generateImage(req.body || {});
  res.status(result.status).json(result.body);
});

app.get("*", (_req, res) => {
  res.sendFile(new URL("./public/index.html", import.meta.url).pathname);
});

app.listen(PORT, () => {
  console.log(`Imagine AI running on http://localhost:${PORT}`);
});

function inferProvider() {
  if (process.env.MODEL_PROVIDER) return process.env.MODEL_PROVIDER;
  if (process.env.HUGGINGFACE_API_KEY) return "huggingface";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

async function generateImage(payload) {
  try {
    const {
      title = "",
      description = "",
      mood = "Dreamy",
      style = "Cinematic",
      ratio = "1:1"
    } = payload;

    if (!description?.trim()) {
      return respond(400, false, "Prompt is required.");
    }

    const prompt = buildPrompt({ title, description, mood, style });
    const provider = inferProvider();

    if (provider === "huggingface") {
      return await generateWithHuggingFace({ prompt, ratio });
    }

    if (provider === "openai") {
      return await generateWithOpenAI({ prompt, ratio });
    }

    return respond(
      500,
      false,
      "No image provider key found. Add HUGGINGFACE_API_KEY or OPENAI_API_KEY in your deployment environment variables."
    );
  } catch (error) {
    console.error("Generate error:", error);
    return respond(500, false, error?.message || "Something went wrong.");
  }
}

function buildPrompt({ title, description, mood, style }) {
  return [
    title ? `Concept title: ${title}.` : "",
    `Generate one premium-quality AI artwork in ${style.toLowerCase()} style with a ${mood.toLowerCase()} mood.`,
    `Prompt: ${description.trim()}.`,
    "Ultra detailed, clean composition, beautiful lighting, high contrast, no text, no watermark, no logo, no frame."
  ]
    .filter(Boolean)
    .join(" ");
}

function ratioToSize(ratio) {
  switch (ratio) {
    case "16:9":
      return { width: 1344, height: 768, size: "1536x1024" };
    case "9:16":
      return { width: 768, height: 1344, size: "1024x1536" };
    case "4:5":
      return { width: 896, height: 1120, size: "1024x1024" };
    default:
      return { width: 1024, height: 1024, size: "1024x1024" };
  }
}

async function generateWithHuggingFace({ prompt, ratio }) {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) {
    return respond(500, false, "HUGGINGFACE_API_KEY is missing.");
  }

  const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-dev";
  const { width, height } = ratioToSize(ratio);

  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width,
        height,
        guidance_scale: 7.5,
        num_inference_steps: 28
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return respond(response.status, false, extractProviderError(text) || "Hugging Face image generation failed.");
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  const base64 = bytes.toString("base64");

  return {
    status: 200,
    body: {
      success: true,
      image: `data:${contentType};base64,${base64}`,
      provider: "huggingface",
      model
    }
  };
}

async function generateWithOpenAI({ prompt, ratio }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return respond(500, false, "OPENAI_API_KEY is missing.");
  }

  const { size } = ratioToSize(ratio);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return respond(response.status, false, data?.error?.message || "OpenAI image generation failed.");
  }

  const imageBase64 = data?.data?.[0]?.b64_json;
  if (!imageBase64) {
    return respond(500, false, "No image returned from OpenAI.");
  }

  return {
    status: 200,
    body: {
      success: true,
      image: `data:image/png;base64,${imageBase64}`,
      provider: "openai",
      model: "gpt-image-1"
    }
  };
}

function extractProviderError(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed?.error || parsed?.message || parsed?.error?.message;
  } catch {
    return text?.slice(0, 300);
  }
}

function respond(status, success, error) {
  return {
    status,
    body: { success, error }
  };
}
