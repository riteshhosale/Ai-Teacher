const chunkText = (
  text,
  chunkSize = 1200,
  overlap = 200
) => {
  // =====================================================
  // VALIDATE TEXT
  // =====================================================

  if (typeof text !== "string") {
    throw new TypeError(
      "text must be a string"
    );
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  // =====================================================
  // VALIDATE CHUNK SIZE
  // =====================================================

  if (
    !Number.isInteger(chunkSize) ||
    chunkSize <= 0
  ) {
    throw new RangeError(
      "chunkSize must be a positive integer"
    );
  }

  // =====================================================
  // VALIDATE OVERLAP
  // =====================================================

  if (
    !Number.isInteger(overlap) ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new RangeError(
      "overlap must be an integer greater than or equal to 0 and smaller than chunkSize"
    );
  }

  // =====================================================
  // SPLIT INTO WORDS
  // =====================================================

  const words = normalizedText.split(/\s+/);

  const chunks = [];

  let start = 0;

  // =====================================================
  // CREATE OVERLAPPING CHUNKS
  // =====================================================

  while (start < words.length) {
    const end = Math.min(
      start + chunkSize,
      words.length
    );

    const chunk = words
      .slice(start, end)
      .join(" ")
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    // Last chunk
    if (end >= words.length) {
      break;
    }

    // Move forward while preserving overlap
    start = end - overlap;
  }

  return chunks;
};

module.exports = chunkText;