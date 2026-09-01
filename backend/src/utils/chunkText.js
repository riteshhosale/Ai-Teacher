const chunkText = (
  text,
  chunkSize = 1200,
  overlap = 200
) => {
  const words = text.split(/\s+/);

  const chunks = [];

  let start = 0;

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

    if (end >= words.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
};

module.exports = chunkText; 