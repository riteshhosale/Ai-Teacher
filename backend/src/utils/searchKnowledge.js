const chromaService = require("../services/chromaService");

/**
 * Search Chroma for relevant knowledge.
 *
 * @param {number[]} queryEmbedding
 * @param {string} userId
 * @param {string|null} documentId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const searchKnowledge = async (
  queryEmbedding,
  userId,
  documentId = null,
  limit = 5
) => {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error("Valid query embedding is required");
  }

  if (!userId || typeof userId !== "string") {
    throw new Error("userId is required");
  }

  if (documentId !== null && typeof documentId !== "string") {
    throw new Error("Invalid documentId");
  }

  const safeLimit =
    Number.isInteger(limit) && limit > 0
      ? Math.min(limit, 20)
      : 5;

  return chromaService.searchKnowledge(
    queryEmbedding,
    userId,
    documentId,
    safeLimit
  );
};

module.exports = searchKnowledge;
