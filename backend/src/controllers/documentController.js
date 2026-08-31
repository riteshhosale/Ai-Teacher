const Document = require(
  "../models/Document"
);

const getDocuments = async (
  req,
  res
) => {
  try {

    const documents =
      await Document.find({
        userId: req.user._id,
      })
      .sort({
        createdAt: -1,
      })
      .select(
        "_id originalName pages totalChunks createdAt"
      );

    res.status(200).json({
      success: true,
      documents,
    });

  } catch (error) {

    console.error(
      "Get documents error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get documents",
    });
  }
};

module.exports = {
  getDocuments,
};