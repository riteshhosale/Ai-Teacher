const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const Document = require("../models/Document");
const chromaService = require("../services/chromaService");
const { createEmbedding } = require("../services/embeddingService");

// =====================================================
// CONSTANTS
// =====================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_CONCURRENCY = 3;
const CHROMA_BATCH_SIZE = 100;

// =====================================================
// GEMINI CLIENT
// =====================================================

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured"
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

// =====================================================
// CREATE CHUNKS
// =====================================================

const createChunks = (
  text,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
) => {
  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return [];
  }

  if (
    !Number.isInteger(chunkSize) ||
    chunkSize <= 0
  ) {
    throw new Error(
      "chunkSize must be a positive integer"
    );
  }

  if (
    !Number.isInteger(overlap) ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new Error(
      "overlap must be >= 0 and smaller than chunkSize"
    );
  }

  const chunks = [];
  const step = chunkSize - overlap;

  let start = 0;

  while (start < text.length) {
    const end = Math.min(
      start + chunkSize,
      text.length
    );

    const chunk = text
      .slice(start, end)
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start += step;
  }

  return chunks;
};

// =====================================================
// CREATE EMBEDDINGS WITH LIMITED CONCURRENCY
// =====================================================

const createEmbeddingsWithConcurrency = async (
  chunks,
  ai,
  concurrency = EMBEDDING_CONCURRENCY
) => {
  if (!Array.isArray(chunks)) {
    throw new Error("Chunks must be an array");
  }

  if (chunks.length === 0) {
    return [];
  }

  const results = new Array(chunks.length);

  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex++;

      if (index >= chunks.length) {
        return;
      }

      console.log(
        `Creating embedding ${index + 1}/${chunks.length}`
      );

      results[index] = await createEmbedding(
        chunks[index]
      );

      console.log(
        `Embedding created ${index + 1}/${chunks.length}`
      );
    }
  };

  const workerCount = Math.min(
    Math.max(1, concurrency),
    chunks.length
  );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => worker()
    )
  );

  return results;
};

// =====================================================
// UPLOAD MATERIAL
// =====================================================

const uploadMaterial = async (req, res) => {
  let parser = null;
  let filePath = null;
  let createdDocument = null;
  let chromaWriteAttempted = false;

  try {
    // =================================================
    // FILE VALIDATION
    // =================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const uploadedFile = req.file;

    const originalName = String(
      uploadedFile.originalname || ""
    ).trim();

    if (!originalName) {
      return res.status(400).json({
        success: false,
        message: "Original file name is required",
      });
    }

    const mimetype = String(
      uploadedFile.mimetype || ""
    ).toLowerCase();

    if (
      mimetype !== "application/pdf" ||
      !originalName.toLowerCase().endsWith(".pdf")
    ) {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    // =================================================
    // USER
    // =================================================

    const rawUserId =
      req.user?.userId ??
      req.user?._id;

    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const userId = String(rawUserId);

    if (
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user ID",
      });
    }

    // =================================================
    // FILE PATH
    // =================================================

    if (!uploadedFile.path) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file path is missing",
      });
    }

    filePath = path.resolve(
      uploadedFile.path
    );

    // =================================================
    // FILE SIZE
    // =================================================

    const fileStats = await fs.stat(filePath);

    if (fileStats.size > MAX_FILE_SIZE) {
      return res.status(413).json({
        success: false,
        message: "PDF file exceeds the 10 MB limit",
      });
    }

    if (fileStats.size === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded PDF is empty",
      });
    }

    // =================================================
    // READ PDF
    // =================================================

    const pdfBuffer = await fs.readFile(
      filePath
    );

    // =================================================
    // VERIFY PDF SIGNATURE
    // =================================================

    const pdfHeader = pdfBuffer
      .subarray(0, 5)
      .toString("ascii");

    if (pdfHeader !== "%PDF-") {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF file",
      });
    }

    // =================================================
    // PARSE PDF
    // =================================================

    parser = new PDFParse({
      data: pdfBuffer,
    });

    const result = await parser.getText();

    const pageCount =
      Number(result?.total) || 0;

    const extractedText =
      typeof result?.text === "string"
        ? result.text.trim()
        : "";

    console.log(
      "PDF pages:",
      pageCount
    );

    console.log(
      "Extracted characters:",
      extractedText.length
    );

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message:
          "PDF contains no readable text",
      });
    }

    // =================================================
    // CREATE CHUNKS
    // =================================================

    const chunks = createChunks(
      extractedText,
      CHUNK_SIZE,
      CHUNK_OVERLAP
    );

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Could not create text chunks from PDF",
      });
    }

    console.log(
      `Created ${chunks.length} chunks`
    );

    // =================================================
    // GEMINI
    // =================================================

    const ai = getAIClient();

    // =================================================
    // CREATE EMBEDDINGS
    // =================================================

    const embeddings =
      await createEmbeddingsWithConcurrency(
        chunks,
        ai,
        EMBEDDING_CONCURRENCY
      );

    if (
      embeddings.length !== chunks.length
    ) {
      throw new Error(
        "Embedding count does not match chunk count"
      );
    }

    // =================================================
    // CREATE MONGODB DOCUMENT
    // =================================================

    createdDocument =
      await Document.create({
        userId,

        fileName:
          uploadedFile.filename,

        originalName,

        pages: pageCount,

        totalChunks:
          chunks.length,
      });

    const documentId =
      String(createdDocument._id);

    console.log(
      "Document created:",
      documentId
    );

    // =================================================
    // PREPARE CHROMA DOCUMENTS
    // =================================================

    const chromaDocuments =
      chunks.map((text, index) => ({
        id: `${documentId}:${index}`,

        embedding: embeddings[index],

        document: text,

        metadata: {
          userId,
          documentId,
          fileName:
            uploadedFile.filename,
          originalName,
          chunkIndex: index,
        },
      }));

    // =================================================
    // SAVE TO CHROMA IN BATCHES
    // =================================================

    chromaWriteAttempted = true;

    for (
      let start = 0;
      start < chromaDocuments.length;
      start += CHROMA_BATCH_SIZE
    ) {
      const batch = chromaDocuments.slice(
        start,
        start + CHROMA_BATCH_SIZE
      );

      await chromaService.addDocuments(
        batch
      );

      console.log(
        `Saved Chroma batch: ${
          start + 1
        }-${Math.min(
          start + batch.length,
          chromaDocuments.length
        )}/${chromaDocuments.length}`
      );
    }

    console.log(
      `Saved ${chromaDocuments.length} chunks to Chroma`
    );

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Material uploaded and processed successfully",

      material: {
        documentId,

        originalName,

        filename:
          uploadedFile.filename,

        size: fileStats.size,

        pages: pageCount,

        chunkCount:
          chunks.length,
      },
    });
  } catch (error) {
    console.error(
      "Material processing error:",
      {
        message: error?.message,
        status:
          error?.status ??
          error?.statusCode,
      }
    );

    // =================================================
    // ROLLBACK CHROMA
    // =================================================

    if (
      chromaWriteAttempted &&
      createdDocument?._id
    ) {
      try {
        await chromaService.deleteDocumentChunks(
          String(
            createdDocument.userId
          ),
          String(
            createdDocument._id
          )
        );

        console.log(
          "Rolled back Chroma document chunks"
        );
      } catch (rollbackError) {
        console.error(
          "Chroma rollback failed:",
          rollbackError?.message
        );
      }
    }

    // =================================================
    // ROLLBACK MONGODB
    // =================================================

    if (createdDocument?._id) {
      try {
        await Document.deleteOne({
          _id: createdDocument._id,
          userId:
            createdDocument.userId,
        });

        console.log(
          "Rolled back MongoDB document"
        );
      } catch (rollbackError) {
        console.error(
          "MongoDB rollback failed:",
          rollbackError?.message
        );
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    const status =
      error?.status ??
      error?.statusCode;

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "AI API rate limit reached. Please try again later.",
      });
    }

    if (status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "AI service is temporarily unavailable. Please try again later.",
      });
    }

    if (status === 400) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid material or request",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to process material",

      ...(process.env.NODE_ENV ===
      "development"
        ? {
            error:
              error?.message,
          }
        : {}),
    });
  } finally {
    // =================================================
    // DESTROY PDF PARSER
    // =================================================

    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error(
          "Parser cleanup error:",
          error?.message
        );
      }
    }

    // =================================================
    // DELETE TEMPORARY UPLOAD
    // =================================================

    if (filePath) {
      try {
        await fs.unlink(filePath);

        console.log(
          "Temporary uploaded PDF removed"
        );
      } catch (error) {
        if (error?.code !== "ENOENT") {
          console.error(
            "Uploaded file cleanup error:",
            error?.message
          );
        }
      }
    }
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  uploadMaterial,
  createChunks,
};