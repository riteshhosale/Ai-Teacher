const DocumentChunk = require(
  "../models/DocumentChunk"
);
const searchKnowledge = async (
  queryEmbedding,
  userId,
  limit = 3
) => {
  const results =
    await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 20,
          limit,
          filter: {
            userId: userId,
          },
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          fileName: 1,
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