const { GoogleGenAI } = require("@google/genai");

const {
  createEmbedding,
} = require("../utils/embeddings");

const searchKnowledge =
  require("../utils/searchKnowledge");

// =====================================================
// GEMINI CLIENT
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// GENERATE LESSON
// =====================================================

const generateLesson = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      topic,
      level,
      language,
      time,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !topic ||
      !level ||
      !language ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Topic, level, language and time are required",
      });
    }

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
    // 1. CREATE TOPIC EMBEDDING
    // =================================================

    console.log("");
    console.log(
      "Creating topic embedding..."
    );

    const queryEmbedding =
      await createEmbedding(topic);

    console.log(
      "Topic embedding created"
    );

    // =================================================
    // 2. SEARCH UPLOADED MATERIAL
    // =================================================

    console.log(
      "Searching uploaded material..."
    );

    const knowledge =
      await searchKnowledge(
        queryEmbedding,
        userId,
        3
      );

    console.log(
      `Found ${knowledge.length} relevant chunks`
    );

    // =================================================
    // 3. BUILD RAG CONTEXT
    // =================================================

    const context =
      knowledge
        .map(
          (item, index) =>
            `SOURCE ${index + 1}

File:
${item.fileName}

Chunk:
${item.chunkIndex}

Content:
${item.text}`
        )
        .join("\n\n");

    // =================================================
    // 4. PROMPT
    // =================================================

    const prompt = `
You are an expert AI teacher.

Create a SHORT personalized lesson.

STUDENT:

Topic: ${topic}
Level: ${level}
Language: ${language}
Available time: ${time}


STUDY MATERIAL:

Use the uploaded study material as the
PRIMARY source when relevant.

${context || "No relevant study material found."}


TEACHING REQUIREMENTS:

1. Give a simple introduction.
2. Explain the topic according to the student's level.
3. Use the uploaded material when relevant.
4. Give exactly 2 practical examples.
5. Give exactly 1 short demonstration.
6. Create exactly 2 multiple-choice questions.
7. Each question must have exactly 4 options.
8. Give the correct answer.
9. Explain why the answer is correct.
10. Give a short summary.
11. Suggest the next topic.


LENGTH LIMITS:

- Introduction: maximum 60 words.
- Explanation: maximum 120 words.
- Each example: maximum 40 words.
- Demonstration: maximum 60 words.
- Each question: maximum 30 words.
- Each question explanation: maximum 40 words.
- Summary: maximum 40 words.
- nextTopic: maximum 10 words.

IMPORTANT:

Keep the complete response SHORT.

DO NOT generate unnecessary text.

ALWAYS finish the JSON.

RETURN ONLY VALID JSON.

Use exactly this structure:

{
  "topic": "",
  "level": "",
  "language": "",
  "estimatedTime": "",
  "introduction": "",
  "explanation": "",
  "examples": [
    "",
    ""
  ],
  "demonstration": "",
  "questions": [
    {
      "question": "",
      "options": [
        "",
        "",
        "",
        ""
      ],
      "correctAnswer": "",
      "explanation": ""
    },
    {
      "question": "",
      "options": [
        "",
        "",
        "",
        ""
      ],
      "correctAnswer": "",
      "explanation": ""
    }
  ],
  "summary": "",
  "nextTopic": ""
}

Rules:

- Exactly 2 questions.
- Exactly 4 options per question.
- Do not use markdown.
- Do not use code fences.
- Return JSON only.
`;

    // =================================================
    // 5. GEMINI MODEL FALLBACK
    // =================================================

    const models = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
    ];

    let response = null;
    let usedModel = null;

    for (const model of models) {
      try {
        console.log("");
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

              temperature: 0.2,

              // Increased enough to avoid
              // truncated JSON.
              maxOutputTokens: 3000,
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

        if (
          error?.status === 429
        ) {
          return res.status(429).json({
            success: false,
            message:
              "Gemini API quota exceeded. Please try again later.",
          });
        }

        // =============================================
        // MODEL TEMPORARILY BUSY
        // =============================================

        if (
          error?.status === 503
        ) {
          console.log(
            `${model} is busy. Trying next model...`
          );

          continue;
        }

        throw error;
      }
    }

    // =================================================
    // NO GEMINI MODEL AVAILABLE
    // =================================================

    if (!response) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is temporarily unavailable. Please try again in a moment.",
      });
    }

    // =================================================
    // 6. GET GEMINI TEXT
    // =================================================

    const output =
      typeof response?.text === "string"
        ? response.text.trim()
        : "";

    if (!output) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    console.log(
      `Gemini output received using ${usedModel}`
    );

    // =================================================
    // 7. CLEAN JSON
    // =================================================

    let cleanedOutput =
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

    // =================================================
    // 8. PARSE JSON
    // =================================================

    let lesson;

    try {

      lesson =
        JSON.parse(
          cleanedOutput
        );

    } catch (error) {

      console.error(
        "================================"
      );

      console.error(
        "INVALID GEMINI JSON"
      );

      console.error(
        "================================"
      );

      console.error(
        cleanedOutput
      );

      console.error(
        "================================"
      );

      return res.status(500).json({
        success: false,
        message:
          "Gemini returned incomplete or invalid JSON",
      });
    }

    // =================================================
    // 9. VALIDATE LESSON
    // =================================================

    if (
      !lesson.topic ||
      !lesson.level ||
      !lesson.language ||
      !lesson.introduction ||
      !lesson.explanation ||
      !Array.isArray(
        lesson.examples
      ) ||
      !Array.isArray(
        lesson.questions
      )
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini returned incomplete lesson data",
      });
    }

    // =================================================
    // 10. ENSURE EXACTLY 2 QUESTIONS
    // =================================================

    lesson.questions =
      lesson.questions
        .slice(0, 2);

    // =================================================
    // 11. VALIDATE QUESTIONS
    // =================================================

    for (
      const question
      of lesson.questions
    ) {

      if (
        !question.question ||
        !Array.isArray(
          question.options
        ) ||
        question.options.length < 4 ||
        !question.correctAnswer
      ) {

        return res.status(500).json({
          success: false,
          message:
            "Gemini returned invalid question data",
        });
      }

      // Keep exactly 4 options
      question.options =
        question.options.slice(
          0,
          4
        );
    }

    // =================================================
    // 12. SUCCESS
    // =================================================

    const generationTime =
      Date.now() - startTime;

    console.log("");
    console.log(
      "================================"
    );

    console.log(
      "LESSON GENERATED SUCCESSFULLY"
    );

    console.log(
      "Model:",
      usedModel
    );

    console.log(
      "Generation time:",
      `${generationTime} ms`
    );

    console.log(
      "Questions:",
      lesson.questions.length
    );

    console.log(
      "================================"
    );

    // =================================================
    // 13. RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "RAG lesson generated successfully",

      lesson,

      model:
        usedModel,

      generationTime,

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

    console.error("");
    console.error(
      "RAG lesson generation error:",
      error
    );

    // =================================================
    // QUOTA
    // =================================================

    if (
      error?.status === 429
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later.",
      });
    }

    // =================================================
    // TEMPORARY UNAVAILABLE
    // =================================================

    if (
      error?.status === 503
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is temporarily unavailable. Please try again in a moment.",
      });
    }

    // =================================================
    // GENERAL ERROR
    // =================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate RAG lesson",

      error:
        error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  generateLesson,
};
