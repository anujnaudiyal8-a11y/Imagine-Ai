const inferProvider = () => {
  if (process.env.MODEL_PROVIDER) return process.env.MODEL_PROVIDER;
  if (process.env.HUGGINGFACE_API_KEY) return "huggingface";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
};

const ratioToSize = (ratio) => {
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
};

const buildPrompt = ({ title, description, mood, style }) =>
  [
    title ? `Concept title: ${title}.` : "",
    `Generate one premium-quality AI artwork in ${style.toLowerCase()} style with a ${mood.toLowerCase()} mood.`,
    `Prompt: ${description.trim()}.`,
    "Ultra detailed, clean composition, beautiful lighting, high contrast, no text, no watermark, no logo, no frame."
  ]
    .filter(Boolean)
    .join(" ");

const json = (status, body, res) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed." }, res);
  }

  try {
    const { title = "", description = "", mood = "Dreamy", style = "Cinematic", ratio = "1:1" } = req.body || {};

    if (!description?.trim()) {
      return json(400, { success: false, error: "Prompt is required." }, res);
    }

    const prompt = buildPrompt({ title, description, mood, style });
    const provider = inferProvider();

    if (provider === "huggingface") {
      const key = process.env.HUGGINGFACE_API_KEY;
      
      const model = process.env.HF_IMAGE_MODEL || "stabilityai/stable-diffusion-xl-base-1.0";
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
        return json(response.status, { success: false, error: text.slice(0, 300) || "Hugging Face image generation failed." }, res);
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const bytes = Buffer.from(await response.arrayBuffer());
      return json(
        200,
        {
          success: true,
          provider: "huggingface",
          model,
          image: `data:${contentType};base64,${bytes.toString("base64")}`
        },
        res
      );
    }

    if (provider === "openai") {
      const { size } = ratioToSize(ratio);
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return json(response.status, { success: false, error: data?.error?.message || "OpenAI image generation failed." }, res);
      }
      const imageBase64 = data?.data?.[0]?.b64_json;
      if (!imageBase64) {
        return json(500, { success: false, error: "No image returned from OpenAI." }, res);
      }
      return json(
        200,
        {
          success: true,
          provider: "openai",
          model: "gpt-image-1",
          image: `data:image/png;base64,${imageBase64}`
        },
        res
      );
    }

    return json(500, { success: false, error: "Add HUGGINGFACE_API_KEY or OPENAI_API_KEY in project environment variables." }, res);
  } catch (error) {
    return json(500, { success: false, error: error?.message || "Something went wrong." }, res);
  }
  }
