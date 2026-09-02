const { ChromaClient } = require("chromadb");

// =====================================================
// CHROMA CLIENT
// =====================================================

const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

// =====================================================
// COLLECTION
// =====================================================

const COLLECTION_NAME = "education_documents";

// =====================================================
// INITIALIZE COLLECTION
// =====================================================

const initializeCollection = async () => {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: {
        "hnsw:space": "cosine",
      },
    });

    console.log(`ChromaDB collection ready: ${COLLECTION_NAME}`);

    return collection;
  } catch (error) {
    console.error("ChromaDB initialization error:", error);
    throw error;
  }
};

// =====================================================
// GET COLLECTION
// =====================================================

const getCollection = async () => {
  return await initializeCollection();
};

// =====================================================
// ADD DOCUMENT
// =====================================================

const addDocument = async ({
  id,
  embedding,
  document,
  metadata = {},
}) => {
  try {
    const collection = await getCollection();

    await collection.add({
      ids: [String(id)],
      embeddings: [embedding],
      documents: [document],
      metadatas: [metadata],
    });

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error("Chroma add document error:", error);
    throw error;
  }
};

// =====================================================
// ADD MULTIPLE DOCUMENTS
// =====================================================

const addDocuments = async (documents) => {
  try {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error("Documents array is required");
    }

    const collection = await getCollection();

    await collection.add({
      ids: documents.map((item) => String(item.id)),
      embeddings: documents.map((item) => item.embedding),
      documents: documents.map((item) => item.document),
      metadatas: documents.map((item) => item.metadata || {}),
    });

    return {
      success: true,
      count: documents.length,
    };
  } catch (error) {
    console.error("Chroma add documents error:", error);
    throw error;
  }
};

// =====================================================
// SEARCH KNOWLEDGE
// =====================================================

const searchKnowledge = async (
  queryEmbedding,
  userId,
  limit = 5
) => {
  try {
    const collection = await getCollection();

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: {
        userId: String(userId),
      },
    });

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    return documents.map((document, index) => ({
      document,
      metadata: metadatas[index] || {},
      distance: distances[index] ?? null,
    }));
  } catch (error) {
    console.error("Chroma search error:", error);
    throw error;
  }
};

// =====================================================
// DELETE USER DOCUMENTS
// =====================================================

const deleteUserDocuments = async (userId) => {
  try {
    const collection = await getCollection();

    await collection.delete({
      where: {
        userId: String(userId),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Chroma delete error:", error);
    throw error;
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  initializeCollection,
  getCollection,
  addDocument,
  addDocuments,
  searchKnowledge,
  deleteUserDocuments,
};