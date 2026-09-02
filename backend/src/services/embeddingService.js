const { GoogleGenAI } = require("@google/genai");

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing from backend/.env`
    );
  }

  return value;
};

let aiClient = null;

const getAIClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: getRequiredEnv("GEMINI_API_KEY"),
    });
  }

  return aiClient;
};

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ||
  "gemini-embedding-001";

const EMBEDDING_DIMENSIONS = Number(
  process.env.GEMINI_EMBEDDING_DIMENSIONS || 0
);

const validateEmbedding = (embedding) => {
  if (
    !Array.isArray(embedding) ||
    embedding.length === 0
  ) {
    return false;
  }

  if (
    EMBEDDING_DIMENSIONS > 0 &&
    embedding.length !== EMBEDDING_DIMENSIONS
  ) {
    return false;
  }

  return embedding.every(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );
};

const createEmbedding = async (text) => {
  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    throw new Error(
      "Text is required for embedding"
    );
  }

  const ai = getAIClient();

  const response =
    await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.trim(),
    });

  const embedding =
    response?.embeddings?.[0]?.values;

  if (
    !Array.isArray(embedding) ||
    embedding.length === 0
  ) {
    throw new Error(
      "Gemini returned an empty embedding"
    );
  }

  if (
    EMBEDDING_DIMENSIONS > 0 &&
    embedding.length !== EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`
    );
  }

  if (
    !embedding.every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    )
  ) {
    throw new Error(
      "Gemini returned an invalid embedding"
    );
  }

  return embedding;
};

module.exports = {
  createEmbedding,
};