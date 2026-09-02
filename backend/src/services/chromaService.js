const { CloudClient } = require("chromadb");

const COLLECTION_NAME = "education_documents";

const MAX_BATCH_SIZE = 100;
const MAX_SEARCH_RESULTS = 20;

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing from backend/.env`);
  }

  return value;
};

let chromaClient = null;
let collectionPromise = null;

// ==================================================
// CLIENT
// ==================================================

const getClient = () => {
  if (!chromaClient) {
    chromaClient = new CloudClient({
      apiKey: getRequiredEnv("CHROMA_API_KEY"),
      tenant: getRequiredEnv("CHROMA_TENANT"),
      database: getRequiredEnv("CHROMA_DATABASE"),
    });
  }

  return chromaClient;
};

// ==================================================
// COLLECTION
// ==================================================

const initializeCollection = async () => {
  const client = getClient();

  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: {
      "hnsw:space": "cosine",
    },
  });
};

const getCollection = async () => {
  if (!collectionPromise) {
    collectionPromise = initializeCollection().catch(
      (error) => {
        collectionPromise = null;
        throw error;
      }
    );
  }

  return collectionPromise;
};

// ==================================================
// VALIDATION
// ==================================================

const validateEmbedding = (embedding) => {
  return (
    Array.isArray(embedding) &&
    embedding.length > 0 &&
    embedding.every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    )
  );
};

const normalizeId = (value, fieldName) => {
  if (
    value === undefined ||
    value === null ||
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
};

const normalizeLimit = (limit) => {
  const value = Number(limit);

  if (!Number.isInteger(value)) {
    return 5;
  }

  return Math.min(
    Math.max(value, 1),
    MAX_SEARCH_RESULTS
  );
};

const normalizeMetadata = (
  metadata,
  userId,
  documentId
) => {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new Error("Invalid metadata");
  }

  return {
    ...metadata,

    // These values are controlled by this service.
    // Callers cannot override them accidentally.
    userId: String(userId),
    documentId: String(documentId),
  };
};

// ==================================================
// ADD ONE DOCUMENT / CHUNK
// ==================================================

const addDocument = async ({
  id,
  embedding,
  document,
  metadata = {},
}) => {
  const normalizedId = normalizeId(id, "Document ID");

  if (!validateEmbedding(embedding)) {
    throw new Error("Invalid embedding");
  }

  if (
    typeof document !== "string" ||
    !document.trim()
  ) {
    throw new Error("Document text is required");
  }

  const userId = normalizeId(
    metadata.userId,
    "userId"
  );

  const documentId = normalizeId(
    metadata.documentId,
    "documentId"
  );

  const collection = await getCollection();

  const safeMetadata = normalizeMetadata(
    metadata,
    userId,
    documentId
  );

  await collection.add({
    ids: [normalizedId],
    embeddings: [embedding],
    documents: [document.trim()],
    metadatas: [safeMetadata],
  });

  return {
    success: true,
    id: normalizedId,
  };
};

// ==================================================
// ADD MULTIPLE DOCUMENTS / CHUNKS
// ==================================================

const addDocuments = async (documents) => {
  if (
    !Array.isArray(documents) ||
    documents.length === 0
  ) {
    throw new Error("Documents array is required");
  }

  if (documents.length > MAX_BATCH_SIZE) {
    throw new Error(
      `Maximum batch size is ${MAX_BATCH_SIZE}`
    );
  }

  const ids = documents.map((item) =>
    normalizeId(item?.id, "Document ID")
  );

  if (new Set(ids).size !== ids.length) {
    throw new Error(
      "Duplicate document IDs in batch"
    );
  }

  const embeddings = [];
  const texts = [];
  const metadatas = [];

  for (const item of documents) {
    if (!validateEmbedding(item?.embedding)) {
      throw new Error(
        `Invalid embedding for document ${item?.id}`
      );
    }

    if (
      typeof item.document !== "string" ||
      !item.document.trim()
    ) {
      throw new Error(
        `Document text is required for ${item?.id}`
      );
    }

    const userId = normalizeId(
      item?.metadata?.userId,
      "userId"
    );

    const documentId = normalizeId(
      item?.metadata?.documentId,
      "documentId"
    );

    embeddings.push(item.embedding);

    texts.push(item.document.trim());

    metadatas.push(
      normalizeMetadata(
        item.metadata || {},
        userId,
        documentId
      )
    );
  }

  const collection = await getCollection();

  await collection.add({
    ids,
    embeddings,
    documents: texts,
    metadatas,
  });

  return {
    success: true,
    count: documents.length,
  };
};

// ==================================================
// SEARCH RAG KNOWLEDGE
// ==================================================

const searchKnowledge = async (
  queryEmbedding,
  userId,
  documentId = null,
  limit = 5
) => {
  const normalizedUserId = normalizeId(
    userId,
    "userId"
  );

  if (!validateEmbedding(queryEmbedding)) {
    throw new Error("Invalid query embedding");
  }

  if (
    documentId !== null &&
    documentId !== undefined
  ) {
    documentId = normalizeId(
      documentId,
      "documentId"
    );
  }

  const collection = await getCollection();

  const safeLimit = normalizeLimit(limit);

  const where = documentId
    ? {
        $and: [
          {
            userId: normalizedUserId,
          },
          {
            documentId: documentId,
          },
        ],
      }
    : {
        userId: normalizedUserId,
      };

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: safeLimit,
    where,
  });

  const documents =
    results?.documents?.[0] || [];

  const metadatas =
    results?.metadatas?.[0] || [];

  const distances =
    results?.distances?.[0] || [];

  return documents.map((document, index) => ({
    document,
    metadata: metadatas[index] || {},
    distance:
      distances[index] !== undefined
        ? distances[index]
        : null,
  }));
};

// ==================================================
// DELETE ALL USER RAG DATA
// ==================================================

const deleteUserDocuments = async (userId) => {
  const normalizedUserId = normalizeId(
    userId,
    "userId"
  );

  const collection = await getCollection();

  await collection.delete({
    where: {
      userId: normalizedUserId,
    },
  });

  return {
    success: true,
  };
};

// ==================================================
// DELETE ONE DOCUMENT'S RAG CHUNKS
// ==================================================

const deleteDocumentChunks = async (
  userId,
  documentId
) => {
  const normalizedUserId = normalizeId(
    userId,
    "userId"
  );

  const normalizedDocumentId = normalizeId(
    documentId,
    "documentId"
  );

  const collection = await getCollection();

  await collection.delete({
    where: {
      $and: [
        {
          userId: normalizedUserId,
        },
        {
          documentId: normalizedDocumentId,
        },
      ],
    },
  });

  return {
    success: true,
  };
};

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
  initializeCollection,
  getCollection,
  addDocument,
  addDocuments,
  searchKnowledge,
  deleteUserDocuments,
  deleteDocumentChunks,
};