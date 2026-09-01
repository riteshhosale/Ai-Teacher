const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// GENERATE SPEECH USING GEMINI
// =====================================================

const generateSpeech = async (req, res) => {
  try {
    const {
      text,
      language = "English",
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    console.log(
      "Generating Gemini speech..."
    );

    console.log(
      "Language:",
      language
    );

    // =================================================
    // LANGUAGE INSTRUCTION
    // =================================================

    let languageInstruction =
      "Speak naturally in English.";

    if (
      language
        .toLowerCase()
        .includes("hindi")
    ) {
      languageInstruction =
        "Speak naturally in Hindi.";
    }

    if (
      language
        .toLowerCase()
        .includes("marathi")
    ) {
      languageInstruction =
        "Speak naturally in Marathi.";
    }

    // =================================================
    // GEMINI TTS
    // =================================================

    const response =
      await ai.models.generateContent({
        model:
          "gemini-2.5-flash-preview-tts",

        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
You are an AI teacher.

${languageInstruction}

Read the following lesson content
clearly and naturally.

Use a friendly teaching tone.
Speak at a comfortable learning pace.
Do not add extra information.
Do not change the meaning.

TEXT:

${text}
                `,
              },
            ],
          },
        ],

        config: {
          responseModalities: [
            "AUDIO",
          ],

          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
      });

    // =================================================
    // GET AUDIO DATA
    // =================================================

    const audioPart =
      response?.candidates?.[0]
        ?.content?.parts?.find(
          (part) =>
            part.inlineData &&
            part.inlineData.data
        );

    if (!audioPart) {
      console.error(
        "Gemini did not return audio:",
        response
      );

      return res.status(500).json({
        success: false,
        message:
          "Gemini did not return audio",
      });
    }

    const audioData =
      audioPart.inlineData.data;

    const mimeType =
      audioPart.inlineData.mimeType ||
      "audio/wav";

    // =================================================
    // CONVERT BASE64 TO BUFFER
    // =================================================

    const buffer =
      Buffer.from(
        audioData,
        "base64"
      );

    console.log(
      "Gemini speech generated successfully"
    );

    console.log(
      "Audio size:",
      buffer.length,
      "bytes"
    );

    // =================================================
    // SEND AUDIO
    // =================================================

    res.set({
      "Content-Type": mimeType,

      "Content-Length":
        buffer.length,

      "Cache-Control":
        "no-cache",
    });

    return res.send(buffer);

  } catch (error) {

    console.error(
      "Gemini speech generation error:",
      error
    );

    // =================================================
    // GEMINI QUOTA
    // =================================================

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini speech quota exceeded. Please try again later.",
      });
    }

    // =================================================
    // GEMINI TEMPORARILY UNAVAILABLE
    // =================================================

    if (error?.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini speech service is temporarily unavailable. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate Gemini speech",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  generateSpeech,
};