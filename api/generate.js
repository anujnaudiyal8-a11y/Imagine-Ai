export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, negativePrompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
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
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt || ""
          }
        })
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error("HF error:", errText);
      return res.status(500).json({ error: errText });
    }

    const blob = await hfResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({
      image: `data:image/png;base64,${base64Image}`
    });

  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      error: "Image generate error"
    });
  }
        }
