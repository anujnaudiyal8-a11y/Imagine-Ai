export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, negativePrompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    // 👉 Yahan apna actual API call lagao
    // Example placeholder:

    const imageUrl = `https://dummyimage.com/512x512/000/fff&text=Generated`;

    return res.status(200).json({
      success: true,
      image: imageUrl,
      prompt,
      negativePrompt
    });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}
