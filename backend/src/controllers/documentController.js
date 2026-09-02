const Document = require("../models/Document");

const getDocuments = async (req, res) => {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const userId =
      req.user?._id ??
      req.user?.userId ??
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ==================================================
    // GET USER DOCUMENTS
    // ==================================================

    const documents = await Document.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .select(
        "_id originalName pages totalChunks createdAt"
      )
      .lean();

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error(
      "Get documents error:",
      error?.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get documents",
    });
  }
};

module.exports = {
  getDocuments,
};
