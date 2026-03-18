export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = req.body || {};

    const prompt =
      rawBody.prompt ||
      rawBody.userPrompt ||
      rawBody?.body?.prompt ||
      "";

    const negativePrompt =
      rawBody.negativePrompt ||
      rawBody.negative_prompt ||
      "";

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        error: "Prompt required",
        debug: {
          receivedBody: rawBody
        }
      });
    }

    const model = "ByteDance/SDXL-Lightning";

    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: String(prompt).trim(),
          parameters: {
            negative_prompt: String(negativePrompt || "")
          }
        })
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error("HF error:", errText);
      return res.status(hfResponse.status).json({
        error: errText || "Hugging Face API error"
      });
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({
      image: `data:image/png;base64,${base64Image}`
    });
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      error: error.message || "Image generate error"
    });
  }
    }
