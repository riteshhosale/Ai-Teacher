const fs = require("fs");
const path = require("path");

const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const Document = require("../models/Document");
const chromaService = require("../services/chromaService");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ================= CHUNK TEXT =================

const createChunks = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    start += chunkSize - overlap;
  }

  return chunks;
};

// ================= CREATE EMBEDDING =================

const createEmbedding = async (text) => {
  if (!text || !text.trim()) {
    throw new Error("Text is required for embedding");
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length === 0) {
    throw new Error("Gemini returned an empty embedding");
  }

  console.log(`Gemini embedding created: ${embedding.length} dimensions`);

  return embedding;
};

// ================= UPLOAD MATERIAL =================

const uploadMaterial = async (req, res) => {
  let parser;

  try {
    // ================= CHECK FILE =================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const userId = req.user?._id || req.user?.id || req.user?.userId;

    console.log("Authenticated user:", req.user);
    console.log("Using userId:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    console.log("");
    console.log("================================");
    console.log("PDF PROCESSING STARTED");
    console.log("================================");

    console.log("User ID:", userId);

    console.log("Original name:", req.file.originalname);

    console.log("File size:", req.file.size, "bytes");

    // ================= READ PDF =================

    const filePath = path.resolve(req.file.path);

    const pdfBuffer = fs.readFileSync(filePath);

    // ================= PARSE PDF =================

    parser = new PDFParse({
      data: pdfBuffer,
    });

    const result = await parser.getText();

    console.log("PDF pages:", result.total);

    const extractedText = result.text?.trim();

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "PDF contains no readable text",
      });
    }

    console.log("Extracted characters:", extractedText.length);

    // ================= CREATE CHUNKS =================

    const chunks = createChunks(extractedText, 1000, 200);

    console.log("");
    console.log(`Created ${chunks.length} chunks`);

    // ================= CREATE DOCUMENT RECORD =================

    const document = await Document.create({
      userId: userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      pages: result.total,
      totalChunks: chunks.length,
    });

    console.log("Document record created:", document._id);

    // ================= DELETE OLD CHUNKS =================

    await chromaService.deleteChunksByDocumentId(document._id);

    console.log("Old chunks removed from Chroma");

    // ================= CREATE EMBEDDINGS & SAVE TO CHROMA =================

    const chunksWithEmbeddings = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Creating embedding ${i + 1}/${chunks.length}`);

      const embedding = await createEmbedding(chunks[i]);

      chunksWithEmbeddings.push({
        text: chunks[i],
        embedding: embedding,
      });

      console.log(`Embedding created ${i + 1}/${chunks.length}`);
    }

    // ================= ADD ALL CHUNKS TO CHROMA =================

    await chromaService.addChunks(
      chunksWithEmbeddings,
      userId,
      document._id,
      req.file.originalname,
    );

    console.log("");
    console.log(
      `Successfully saved ${chunksWithEmbeddings.length} chunks to Chroma`,
    );

    // ================= SUCCESS =================

    return res.status(200).json({
      success: true,

      message: "Material uploaded and processed successfully",

      material: {
        documentId: document._id,

        originalName: req.file.originalname,

        filename: req.file.filename,

        size: req.file.size,

        pages: result.total,

        chunkCount: chunksWithEmbeddings.length,
      },
    });
  } catch (error) {
    console.error("Material processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process material",
      error: error.message,
    });
  } finally {
    // ================= CLEANUP =================

    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error("Parser cleanup error:", error);
      }
    }
  }
};

module.exports = {
  uploadMaterial,
};
