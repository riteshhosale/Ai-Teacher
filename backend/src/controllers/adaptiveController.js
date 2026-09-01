const { GoogleGenAI } = require("@google/genai");

const { createEmbedding } = require("../utils/embeddings");
const searchKnowledge = require("../utils/searchKnowledge");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// EVALUATE ANSWER
// =====================================================

const evaluateAnswer = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      topic,
      question,
      selectedAnswer,
      correctAnswer,
      level,
      language,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !topic ||
      !question ||
      !selectedAnswer ||
      !correctAnswer
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // =================================================
    // CHECK ANSWER LOCALLY
    // =================================================

    const isCorrect =
      selectedAnswer
        .trim()
        .toLowerCase() ===
      correctAnswer
        .trim()
        .toLowerCase();

    console.log("");
    console.log("================================");
    console.log("ADAPTIVE ANSWER EVALUATION");
    console.log("================================");

    console.log(
      "Answer:",
      isCorrect ? "CORRECT" : "INCORRECT"
    );

    // =================================================
    // USER ID
    // =================================================

    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found in authentication token",
      });
    }

    // =================================================
    // CREATE QUESTION EMBEDDING
    // =================================================

    console.log(
      "Creating question embedding..."
    );

    const queryEmbedding =
      await createEmbedding(question);

    console.log(
      "Question embedding created"
    );

    // =================================================
    // SEARCH KNOWLEDGE
    // =================================================

    console.log(
      "Searching uploaded material..."
    );

    const knowledge =
      await searchKnowledge(
        queryEmbedding,
        userId,
        2
      );

    console.log(
      `Found ${knowledge.length} relevant chunks`
    );

    // =================================================
    // BUILD CONTEXT
    // =================================================

    const context =
      knowledge
        .map(
          (item, index) =>
            `SOURCE ${index + 1}:
${item.text}`
        )
        .join("\n\n");

    // =================================================
    // PROMPT
    // =================================================

    const prompt = `
You are an adaptive AI teacher.

Student level:
${level}

Language:
${language}

Topic:
${topic}

Question:
${question}

Student answer:
${selectedAnswer}

Correct answer:
${correctAnswer}

Answer status:
${isCorrect ? "CORRECT" : "INCORRECT"}

Study material:
${context || "No relevant study material found."}

${
  isCorrect
    ? `
The student answered correctly.

Give:
1. Short positive feedback.
2. A concise explanation.
3. One slightly harder follow-up question.
`
    : `
The student answered incorrectly.

Give:
1. The likely misconception.
2. A simple explanation.
3. One easy practical example.
4. One easier follow-up question.
`
}

Return ONLY valid JSON.

Use exactly this structure:

{
  "correct": ${isCorrect},
  "feedback": "",
  "misconception": "",
  "explanation": "",
  "example": "",
  "nextQuestion": {
    "question": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "correctAnswer": ""
  },
  "difficulty": "easy"
}

Rules:

- correct must be boolean.
- Keep feedback concise.
- Keep explanation concise.
- Keep example concise.
- nextQuestion must contain exactly 4 options.
- difficulty must be easy, medium, or hard.
- Do not use markdown.
- Do not use code fences.
- Return JSON only.
`;

    // =================================================
    // GEMINI MODELS
    // =================================================

    const models = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
    ];

    let response = null;
    let usedModel = null;

    // =================================================
    // TRY MODELS
    // =================================================

    for (const model of models) {
      try {
        console.log(
          `Trying Gemini model: ${model}`
        );

        response =
          await ai.models.generateContent({
            model,

            contents: prompt,

            config: {
              responseMimeType:
                "application/json",
            },
          });

        usedModel = model;

        console.log(
          `AI response received from ${model}`
        );

        break;

      } catch (error) {
        console.error(
          `${model} failed:`,
          error.message
        );

        // =============================================
        // QUOTA
        // =============================================

        if (error?.status === 429) {
          return res.status(429).json({
            success: false,
            message:
              "Gemini API quota exceeded. Please try again later.",
          });
        }

        // =============================================
        // TEMPORARY UNAVAILABLE
        // =============================================

        if (error?.status === 503) {
          console.log(
            `${model} is temporarily unavailable.`
          );

          continue;
        }

        // =============================================
        // OTHER ERROR
        // =============================================

        throw error;
      }
    }

    // =================================================
    // NO MODEL AVAILABLE
    // =================================================

    if (!response) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is temporarily unavailable. Please try again.",
      });
    }

    // =================================================
    // GET OUTPUT
    // =================================================

    const output =
      response?.text?.trim();

    if (!output) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    console.log(
      `Gemini output received using ${usedModel}`
    );

    // =================================================
    // PARSE JSON
    // =================================================

    let result;

    try {
      const cleanedOutput =
        output
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      result =
        JSON.parse(cleanedOutput);

    } catch (error) {
      console.error(
        "Invalid Gemini JSON:"
      );

      console.error(output);

      return res.status(500).json({
        success: false,
        message:
          "Gemini returned invalid evaluation data",
      });
    }

    // =================================================
    // ALWAYS TRUST BACKEND FOR CORRECTNESS
    // =================================================

    result.correct =
      isCorrect;

    // =================================================
    // RESPONSE
    // =================================================

    console.log(
      `Evaluation completed in ${
        Date.now() - startTime
      }ms`
    );

    return res.status(200).json({
      success: true,

      message:
        "Answer evaluated successfully",

      result,

      model:
        usedModel,

      sources:
        knowledge.map(
          (item) => ({
            fileName:
              item.fileName,

            chunkIndex:
              item.chunkIndex,

            score:
              item.score,
          })
        ),
    });

  } catch (error) {
    console.error(
      "Adaptive learning error:",
      error
    );

    // =================================================
    // GEMINI 429
    // =================================================

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later.",
      });
    }

    // =================================================
    // GEMINI 503
    // =================================================

    if (error?.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is temporarily unavailable. Please try again.",
      });
    }

    // =================================================
    // GENERAL ERROR
    // =================================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to evaluate answer",
      error:
        error.message,
    });
  }
};

module.exports = {
  evaluateAnswer,
};
