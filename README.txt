Imagine AI - production-ready AI image generator

What is included
- Premium single-page UI with logo and app branding
- Prompt presets, style + aspect ratio selectors
- Download button and local history
- PWA files (manifest + service worker)
- Works locally with Node/Express
- Works on Vercel with serverless API route
- Supports Hugging Face first, OpenAI fallback

Important security note
- Do NOT put SUPABASE_SERVICE_ROLE_KEY in frontend code.
- This project does not require service role key to generate images.
- Add secrets only in your hosting dashboard or local .env file.

Local run
1. Copy .env.example to .env
2. Add HUGGINGFACE_API_KEY or OPENAI_API_KEY
3. Run: npm install
4. Run: npm start
5. Open http://localhost:3000

Vercel deploy
1. Upload project to GitHub or import directly into Vercel
2. Add environment variables:
   - HUGGINGFACE_API_KEY
   - MODEL_PROVIDER=huggingface
   - HF_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
   - optionally OPENAI_API_KEY
3. Deploy

Recommended free setup
- Host on Vercel free plan
- Add app to phone as a PWA after publishing
- For Play Store, wrap the published PWA later using Bubblewrap / TWA and publish from Google Play Console

Files
- server.js -> local Node server
- api/generate.js -> Vercel serverless API
- public/index.html -> UI
- public/styles.css -> premium styling
- public/script.js -> frontend logic
- public/manifest.webmanifest -> installable app config
- public/sw.js -> offline shell
