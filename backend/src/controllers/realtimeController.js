const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// CREATE GEMINI LIVE SESSION CONFIG
// =====================================================

const createRealtimeSession = async (req, res) => {
  try {
    const {
      topic,
      level,
      language,
      context,
    } = req.body;

    console.log(
      "Creating Gemini Live session..."
    );

    // =================================================
    // VALIDATION
    // =================================================

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "GEMINI_API_KEY is not configured",
      });
    }

    // =================================================
    // TEACHER INSTRUCTIONS
    // =================================================

    const instructions = `
You are an AI Teacher.

Topic:
${topic || "General learning"}

Student level:
${level || "Beginner"}

Language:
${language || "English"}

Relevant study material:
${context || "No study material provided."}

Teaching rules:

- Teach at the student's level.
- Explain concepts clearly.
- Use simple examples.
- Ask questions instead of only giving answers.
- If the student is confused, simplify the explanation.
- If the student answers correctly, gradually increase difficulty.
- If the student answers incorrectly, explain the misconception.
- Prefer the supplied study material when relevant.
- Do not invent information that contradicts the study material.
- Encourage the student to reason through problems.
- Keep responses concise and natural.
- Speak like a friendly human teacher.
`;

    // =================================================
    // GEMINI LIVE CONFIG
    // =================================================

    const liveConfig = {
      responseModalities: [
        "AUDIO",
      ],

      systemInstruction: instructions,

      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Puck",
          },
        },
      },
    };

    // =================================================
    // RETURN CONFIGURATION
    // =================================================

    return res.status(200).json({
      success: true,

      provider: "gemini",

      model:
        "gemini-2.5-flash-native-audio-preview-12-2025",

      liveConfig,
    });

  } catch (error) {

    console.error(
      "Gemini realtime session error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create Gemini realtime session",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  createRealtimeSession,
};