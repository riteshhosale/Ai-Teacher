
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const uploadMaterial = async (req, res) => {
  try {
    // ================= CHECK FILE =================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    console.log("Processing PDF:", req.file.path);

    // ================= READ PDF =================

    const buffer = fs.readFileSync(req.file.path);

    // ================= PARSE PDF =================

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    // Free parser resources
    await parser.destroy();

    console.log("PDF pages:", result.total);
    console.log("Extracted text length:", result.text.length);

    // ================= CHECK TEXT =================

    if (!result.text || !result.text.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "PDF uploaded successfully, but no readable text was found",
      });
    }

    // ================= RESPONSE =================

    return res.status(200).json({
      success: true,
      message: "Material uploaded and processed successfully",
      material: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        pages: result.total,
        text: result.text,
      },
    });

  } catch (error) {
    console.error("Material processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process material",
      error: error.message,
    });
  }
};

module.exports = {
  uploadMaterial,
};
