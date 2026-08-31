const { GoogleGenAI } = require("@google/genai");

const Lesson = require("../models/Lesson");
const { createEmbedding } = require("../utils/embeddings");
const searchKnowledge = require("../utils/searchKnowledge");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateLesson = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      topic,
      level,
      language,
      time,
      documentId,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

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

    // =====================================================
    // USER
    // =====================================================

    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    console.log("================================");
    console.log("GENERATING LESSON");
    console.log("================================");

    // =====================================================
    // 1. CREATE EMBEDDING
    // =====================================================

    console.log(
      "Creating topic embedding..."
    );

    const queryEmbedding =
      await createEmbedding(topic);

    console.log(
      "Topic embedding created"
    );

    // =====================================================
    // 2. SEARCH MATERIAL
    // =====================================================

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

    // =====================================================
    // 3. BUILD CONTEXT
    // =====================================================

    const context =
      knowledge
        .map(
          (item, index) => `
SOURCE ${index + 1}

File:
${item.fileName}

Chunk:
${item.chunkIndex}

Content:
${item.text}
`
        )
        .join("\n\n");

    // =====================================================
    // 4. GEMINI PROMPT
    // =====================================================

    const prompt = `
You are an expert AI teacher.

Create a short personalized lesson.

Student:
Topic: ${topic}
Level: ${level}
Language: ${language}
Available time: ${time}

Uploaded study material:

${
  context ||
  "No relevant uploaded material was found."
}

Rules:

- Explain the topic simply.
- Match the student's level.
- Use uploaded material when relevant.
- Do not contradict the uploaded material.
- Give 2 practical examples.
- Give 1 short demonstration.
- Create exactly 2 multiple-choice questions.
- Each question must have exactly 4 options.
- Give the correct answer.
- Give an explanation for each answer.
- Give a short summary.
- Suggest the next topic.
- Keep the response concise.

Return ONLY valid JSON.

Use exactly:

{
  "topic": "",
  "level": "",
  "language": "",
  "estimatedTime": "",
  "introduction": "",
  "explanation": "",
  "examples": ["", ""],
  "demonstration": "",
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": "",
      "explanation": ""
    },
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": "",
      "explanation": ""
    }
  ],
  "summary": "",
  "nextTopic": ""
}

Do not use markdown.
Do not use code fences.
Return JSON only.
`;

    // =====================================================
    // 5. GEMINI GENERATION
    // =====================================================

    console.log(
      "Generating lesson with Gemini..."
    );

    let response;

    try {
      response =
        await ai.models.generateContent({
          model:
            "gemini-3.7-flash",

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",
          },
        });

    } catch (error) {
      console.error(
        "Gemini generation error:",
        error.message
      );

      if (error?.status === 429) {
        return res.status(429).json({
          success: false,
          message:
            "Gemini API quota exceeded. Please try again later.",
        });
      }

      if (error?.status === 503) {
        return res.status(503).json({
          success: false,
          message:
            "Gemini is temporarily unavailable. Please try again.",
        });
      }

      throw error;
    }

    // =====================================================
    // 6. GET GEMINI OUTPUT
    // =====================================================

    const output =
      response?.text?.trim();

    if (!output) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    console.log(
      "Gemini response received"
    );

    // =====================================================
    // 7. CLEAN JSON
    // =====================================================

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

    // =====================================================
    // 8. PARSE JSON
    // =====================================================

    let lesson;

    try {
      lesson =
        JSON.parse(cleanedOutput);

    } catch (error) {
      console.error(
        "Invalid Gemini JSON:"
      );

      console.error(
        cleanedOutput
      );

      return res.status(500).json({
        success: false,
        message:
          "Gemini returned invalid lesson JSON",
      });
    }

    // =====================================================
    // 9. NORMALIZE LESSON
    // =====================================================

    lesson.topic =
      lesson.topic || topic;

    lesson.level =
      lesson.level || level;

    lesson.language =
      lesson.language || language;

    lesson.estimatedTime =
      lesson.estimatedTime || time;

    lesson.introduction =
      lesson.introduction || "";

    lesson.explanation =
      lesson.explanation || "";

    lesson.examples =
      Array.isArray(
        lesson.examples
      )
        ? lesson.examples
        : [];

    lesson.demonstration =
      lesson.demonstration || "";

    lesson.questions =
      Array.isArray(
        lesson.questions
      )
        ? lesson.questions
        : [];

    lesson.summary =
      lesson.summary || "";

    lesson.nextTopic =
      lesson.nextTopic || "";

    // =====================================================
    // 10. SAVE LESSON TO MONGODB
    // =====================================================

    console.log(
      "Saving lesson to MongoDB..."
    );

    const savedLesson =
      await Lesson.create({
        userId,

        documentId:
          documentId || null,

        topic:
          lesson.topic,

        level:
          lesson.level,

        language:
          lesson.language,

        estimatedTime:
          lesson.estimatedTime,

        introduction:
          lesson.introduction,

        explanation:
          lesson.explanation,

        examples:
          lesson.examples,

        demonstration:
          lesson.demonstration,

        questions:
          lesson.questions,

        summary:
          lesson.summary,

        nextTopic:
          lesson.nextTopic,

        score: 0,

        completed: false,
      });

    console.log(
      "Lesson saved:",
      savedLesson._id
    );

    // =====================================================
    // 11. SUCCESS RESPONSE
    // =====================================================

    console.log(
      `Lesson completed in ${
        Date.now() - startTime
      }ms`
    );

    return res.status(200).json({
      success: true,

      message:
        "RAG lesson generated successfully",

      lessonId:
        savedLesson._id,

      lesson:
        savedLesson,

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
      "RAG lesson generation error:",
      error
    );

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded.",
      });
    }

    if (error?.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini service is temporarily unavailable.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate lesson",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  generateLesson,
};