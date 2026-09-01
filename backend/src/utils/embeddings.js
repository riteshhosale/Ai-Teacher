const { GoogleGenAI } = require("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const createEmbedding = async (text) => {
  try {
    if (!text || !text.trim()) {
      throw new Error(
        "Text is required to create embedding"
      );
    }

    console.log("Creating Gemini embedding...");

    const response = await client.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const embedding =
      response.embeddings?.[0]?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error(
        "Gemini returned an empty embedding"
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
      error
    );

    throw error;
  }
};

module.exports = {
  createEmbedding,
};