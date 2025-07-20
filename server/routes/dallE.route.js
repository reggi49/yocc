import express from "express";
import { OpenAI } from "openai";
import { VertexAI } from "@google-cloud/vertexai";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  OPENAI_API_KEY, 
  GOOGLE_CLOUD_PROJECT_ID,
  GOOGLE_CLOUD_LOCATION,
  GEMINI_API_KEY } from "../config/index.js";
import CustomErrorHandler from "../services/CustomErrorHandler.js";
import { authenticate } from "../middlewares/index.js";
import multer from "multer";

const router = express.Router();

// const configuration = new Configuration({
//   apiKey: OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const genAI = new GoogleGenAI(GEMINI_API_KEY);

const vertexAI = new VertexAI({
  project: GOOGLE_CLOUD_PROJECT_ID,
  location: GOOGLE_CLOUD_LOCATION,
});

const generativeModel = vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.0-flash-preview-image-generation',
});

// Konfigurasi Multer untuk file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Batas 10MB
});

// Helper function untuk Vertex AI
const fileToGenerativePart = (buffer, mimeType) => ({
  inlineData: {
    data: buffer.toString('base64'),
    mimeType,
  },
});

router.get("/", (req, res) => {
  res.send("Hello from YOCC Routes");
});

router.post("/", authenticate, async (req, res, next) => {
  console.log('memproses gambar');
  try {
    console.log('membuat gambar');
    // const { prompt } = req.body;
    // if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    //   return res.status(400).json({ error: "Prompt is required and must be a string." });
    // }

    const prompt = `
    Replace the texture of the seating object in the image—whether it's a sofa, chair, bench, or a similar item—with the texture provided in the reference image. 
    Maintain the object's original shape, lighting, shadows, and perspective. 
    Apply the new texture naturally so it follows the surface contours, folds, and material behavior. 
    Only apply the reference color (#0463ac) to the seating object. 
    Ensure the rest of the scene remains unchanged, and the final result looks photorealistic and seamlessly integrated.
    `;

    const aiResponse = await openai.images.generate({
      model: "dall-e-3", // Lebih akurat dari gpt-image-1
      prompt,
      n: 1,
      size: "1024x1024", // Bisa ubah ke 512x512 sesuai kebutuhan
      response_format: "b64_json"
    });

    // const aiResponse = await openai.images.generate({
    //   // model:"gpt-image-1",
    //   prompt,
    //   n: 1,
    //   size: "512x512",
    //   response_format: "b64_json",
    // });

    const images = aiResponse.data;
    res.status(200).json({ images, prompt });
  } catch (err) {
    console.log("Error details:", err?.response?.data || err.message);
    return next(CustomErrorHandler.serverError("Image generation failed."));
  }
  // try {
  //   const { prompt } = req.body;
  //   const aiResponse = await openai.createImage({
  //     prompt,
  //     n: 1,
  //     size: "512x512",
  //     // size: "256x256", // for testing purpose
  //     response_format: "b64_json",
  //     // response_format: "url",
  //   });

  //   const images = aiResponse?.data?.data;
  //   console.log('berhasil memproses gambar');

  //   res.status(200).json({ images, prompt });
  // } catch (err) {
  //   console.log('gagal memproses gambar');
  //   console.log(err?.message || err?.response?.data?.error?.message);
  //   console.log('Error2:', err?.response?.data || err.message);

  //   const message =
  //     err?.response?.data?.error?.message || "Internal server error";

  //   return next(CustomErrorHandler.serverError(message));
  // }
});
router.post("/describe", authenticate, async (req, res, next) => {
  console.log("Describing image...");
  try {
    const { base64Image } = req.body;
    const { color } = req.body;
    console.log('warna', color);

    if (!base64Image || !base64Image.startsWith("data:image")) {
      return res.status(400).json({ error: "Invalid image data." });
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4.1", // important: must be GPT-4-turbo with vision
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please provide a detailed description of the image shown. The description should capture every aspect of the image, including but not limited to the following details: Ambiance and Lighting. Layout and Composition: Explain the arrangement of objects, their positions relative to each other, and the overall composition of the scene. Colors and Textures: Mention the dominant colors, any noticeable patterns, and the textures of various surfaces. Objects and Elements: List all the objects present in the image, their sizes, shapes, and any distinguishing features. Background and Foreground: Describe the background elements and how they contrast or complement the foreground. The goal is to create a prompt with a length of less than 1000 characters of text that allows an AI to recreate the image as accurately as possible based on the detailed description provided. This is the most important thing among all, if there is a sofa, chair, bed, table, or furniture, please change the dominant color with the following hex code ${color}`,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });
    const description = response.choices[0].message.content;
    res.status(200).json({ result: description });
    // res.status(200).json({ images, prompt });
    console.log(response.choices[0].message.content); // <-- This is your string result
  } catch (err) {
    console.log("Error details:", err?.response?.data || err.message);
    return next(CustomErrorHandler.serverError("Image generation failed."));
  }
});

router.post(
  "/edit-with-texture", // Anda bisa menggunakan nama route utama sekarang
  upload.fields([
    { name: 'baseImage', maxCount: 1 },
    { name: 'textureImage', maxCount: 1 },
  ]),
  async (req, res, next) => {
    console.log("Memproses image editing dengan metode yang benar...");
    try {
      if (!req.files?.baseImage || !req.files?.textureImage || !req.body.prompt) {
        return next(CustomErrorHandler.badRequest('Error: Missing input.'));
      }

      const baseImageFile = req.files.baseImage[0];
      const textureImageFile = req.files.textureImage[0];
      const prompt = req.body.prompt;

      console.log('baseImageFile',baseImageFile)
      console.log('textureImageFile', textureImageFile)
      console.log('prompt', prompt)
      
      // Siapkan 'contents' dengan format array datar yang benar
      const contents = [
        { text: prompt },
        fileToGenerativePart(baseImageFile.buffer, baseImageFile.mimetype),
        { text: 'Use this as the new texture:' },
        fileToGenerativePart(textureImageFile.buffer, textureImageFile.mimetype),
      ];

      // ====================== PERUBAHAN DI SINI ======================
      // Panggil API dengan metode yang benar: genAI.models.generateContent
      // dan masukkan semua konfigurasi dalam satu objek.
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });
      // ===============================================================

      console.log('result', result)
      const imagePart = result.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (!imagePart) {
        // Jika tidak ada gambar, coba cari respons teks untuk di-log
        const textPart = result.candidates?.[0]?.content?.parts?.find(part => part.text);
        const textResponse = textPart ? textPart.text : "No text response found.";
        console.error("Gagal menghasilkan gambar. Respons teks dari AI:", textResponse);
        return next(CustomErrorHandler.serverError(`Gagal menghasilkan gambar. AI merespons: ${textResponse}`));
      }    

      console.log("Berhasil mengedit gambar!");
      res.set('Content-Type', imagePart.inlineData.mimeType);
      res.send(Buffer.from(imagePart.inlineData.data, 'base64'));

    } catch (error) {
      console.error('Error calling @google/genai:', error);
      return next(CustomErrorHandler.serverError("Terjadi error saat memproses dengan SDK genAI."));
    }
  }
);

// router.post(
//   "/edit-with-texture", // Menggunakan middleware authenticate Anda
//   upload.fields([ // Menggunakan Multer untuk menangani file
//     { name: 'baseImage', maxCount: 1 },
//     { name: 'textureImage', maxCount: 1 },
//   ]),
//   async (req, res, next) => {
//     console.log("Memproses image-to-image editing dengan Vertex AI...");
//     try {
//       // Validasi input
//       if (!req.files?.baseImage || !req.files?.textureImage || !req.body.prompt) {
//         return next(CustomErrorHandler.badRequest('Error: Missing baseImage, textureImage, or prompt.'));
//       }

//       const baseImageFile = req.files.baseImage[0];
//       const textureImageFile = req.files.textureImage[0];
//       const prompt = req.body.prompt;

//       const request = {
//         contents: [
//           { text: prompt },
//           fileToGenerativePart(baseImageFile.buffer, baseImageFile.mimetype),
//           { text: 'Use this as the new texture:' },
//           fileToGenerativePart(textureImageFile.buffer, textureImageFile.mimetype),
//         ],
//         generationConfig: {
//           responseMimeType: "image/png",
//         }
//       };


//       // Panggil API Vertex AI
//       const result = await generativeModel.generateContent(request);
//       const response = result.response;
//       const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

//       if (!imagePart) {
//         console.error("Vertex AI failed to generate image.", response.candidates?.[0]);
//         return next(CustomErrorHandler.serverError("Failed to generate image from Vertex AI.", response.candidates?.[0]));
//       }

//       // Kirim gambar hasil editan sebagai respons langsung
//       console.log("Berhasil mengedit gambar dengan Vertex AI.");
//       res.set('Content-Type', imagePart.inlineData.mimeType);
//       res.send(Buffer.from(imagePart.inlineData.data, 'base64'));

//     } catch (error) {
//       console.error('Error calling Vertex AI:', error);
//       return next(CustomErrorHandler.serverError("An error occurred during image editing.", error));
//     }
//   }
// );
export default router;
