const STYLE_PRESETS = {
  photoreal: {
    base: "Ultra realistic, highly detailed, professional photography, natural skin texture, realistic facial proportions, detailed eyes, detailed hair strands, cinematic lighting, soft shadows, depth, sharp focus, premium color grading, high resolution, clean background, realistic materials, natural pose, anatomically correct, lifelike, fine details",
    negative: "blurry, low quality, low resolution, cartoon, anime, painting, illustration, deformed face, extra fingers, bad hands, malformed eyes, cross-eye, duplicated features, plastic skin, oversmoothed skin, unnatural lighting, distorted body, bad anatomy, watermark, text, logo, cropped, out of frame"
  },
  portrait: {
    base: "Ultra realistic portrait photography, natural skin texture, sharp eyes, realistic face symmetry, detailed hair, studio lighting, premium DSLR look, shallow depth of field, lifelike details, natural tones",
    negative: "blurry, cartoon, anime, bad face, bad eyes, bad hands, deformed, extra limbs, waxy skin, overprocessed, watermark, text"
  },
  product: {
    base: "Ultra realistic product photography, commercial studio lighting, clean reflections, realistic materials, crisp edges, high detail, premium advertisement style, sharp focus, white or luxury background",
    negative: "blurry, noisy, distorted shape, bad reflections, extra objects, watermark, text, logo, low quality"
  },
  cinematic: {
    base: "Ultra realistic cinematic scene, dramatic but natural lighting, high detail, realistic textures, volumetric light, film still quality, premium composition, lifelike atmosphere, sharp focus",
    negative: "cartoon, anime, blurry, flat lighting, bad anatomy, distorted objects, watermark, text, low detail"
  }
};

function buildPrompt(userPrompt, style = "photoreal") {
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.photoreal;

  return {
    prompt: `${preset.base}. ${userPrompt}. Keep it photorealistic and natural. Emphasize realism, correct anatomy, natural skin texture, detailed face, sharp eyes, realistic lighting, premium photography look.`,
    negativePrompt: preset.negative
  };
}

async function generateImage() {
  const promptInput = document.getElementById("prompt");
  const styleInput = document.getElementById("style");
  const imageEl = document.getElementById("result");

  const userPrompt = promptInput.value.trim();
  const style = styleInput?.value || "photoreal";

  if (!userPrompt) {
    alert("Prompt likho pehle");
    return;
  }

  const { prompt, negativePrompt } = buildPrompt(userPrompt, style);

  try {
    imageEl.src = "";
    
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        negativePrompt,
        style
      })
    });

    const data = await res.json();

    if (data.image) {
      imageEl.src = data.image;
    } else {
      alert("Image generate nahi hui");
    }

  } catch (err) {
    console.error(err);
    alert("Error aaya");
  }
}

window.generateImage = generateImage;
