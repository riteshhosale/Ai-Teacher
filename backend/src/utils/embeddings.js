const { GoogleGenAI } = require("@google/genai");

// =====================================================
// CONFIGURATION
// =====================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing from backend/.env"
  );
}

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ||
  "gemini-embedding-001";

const EXPECTED_DIMENSIONS =
  process.env.GEMINI_EMBEDDING_DIMENSIONS
    ? Number(
        process.env.GEMINI_EMBEDDING_DIMENSIONS
      )
    : null;

// =====================================================
// GEMINI CLIENT
// =====================================================

const client = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// =====================================================
// CREATE EMBEDDING
// =====================================================

const createEmbedding = async (text) => {
  try {
    // =================================================
    // VALIDATE INPUT
    // =================================================

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      throw new TypeError(
        "Text must be a non-empty string"
      );
    }

    const cleanText = text.trim();

    console.log(
      "Creating Gemini embedding..."
    );

    // =================================================
    // GEMINI EMBEDDING
    // =================================================

    const response =
      await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: cleanText,
      });

    // =================================================
    // EXTRACT EMBEDDING
    // =================================================

    const embedding =
      response?.embeddings?.[0]?.values;

    if (
      !Array.isArray(embedding) ||
      embedding.length === 0
    ) {
      throw new Error(
        "Gemini returned an empty or invalid embedding"
      );
    }

    // =================================================
    // VALIDATE EMBEDDING VALUES
    // =================================================

    const hasInvalidValues =
      embedding.some(
        (value) =>
          typeof value !== "number" ||
          !Number.isFinite(value)
      );

    if (hasInvalidValues) {
      throw new Error(
        "Gemini returned an invalid embedding vector"
      );
    }

    // =================================================
    // VALIDATE DIMENSIONS
    // =================================================

    if (
      EXPECTED_DIMENSIONS !== null &&
      embedding.length !== EXPECTED_DIMENSIONS
    ) {
      throw new Error(
        `Unexpected embedding dimensions. Expected ${EXPECTED_DIMENSIONS}, received ${embedding.length}`
      );
    }

    console.log(
      "Gemini embedding created:",
      embedding.length,
      "dimensions"
    );

    return embedding;
  } catch (error) {
    console.error(
      "Gemini embedding error:",
      {
        status: error?.status,
        message: error?.message,
      }
    );

    throw error;
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createEmbedding,
};