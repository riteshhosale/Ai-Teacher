const DocumentChunk = require(
  "../models/DocumentChunk"
);

const searchKnowledge = async (
  queryEmbedding,
  userId,
  documentId = null,
  limit = 5
) => {

  const filter = {
    userId: userId,
  };

  if (documentId) {
    filter.documentId = documentId;
  }

  const results =
    await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",

          path: "embedding",

          queryVector: queryEmbedding,

          numCandidates: 100,

          limit,

          filter,
        },
      },

      {
        $project: {
          _id: 0,

          text: 1,

          fileName: 1,

          documentId: 1,

          chunkIndex: 1,

          score: {
            $meta:
              "vectorSearchScore",
          },
        },
      },
    ]);

  return results;
};

module.exports = searchKnowledge;