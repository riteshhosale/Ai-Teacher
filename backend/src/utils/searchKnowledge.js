const chromaService = require("../services/chromaService");

const searchKnowledge = async (
  queryEmbedding,
  userId,
  documentId = null,
  limit = 5,
) => {
  const results = await chromaService.searchChunks(
    queryEmbedding,
    userId,
    documentId,
    limit,
  );

  return results;
};

module.exports = searchKnowledge;
