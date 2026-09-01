require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const Lesson = require("../models/Lesson");
const Document = require("../models/Document");

// =====================================================
// GEMINI
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// GENERATE LEARNING PATH
// =====================================================

const generateLearningPath = async (req, res) => {
  const startTime = Date.now();

  try {
    // =================================================
    // USER ID
    // =================================================

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

    // =================================================
    // GET LESSONS + DOCUMENTS
    // =================================================

    const [lessons, documents] =
      await Promise.all([
        Lesson.find({ userId })
          .sort({ createdAt: -1 })
          .limit(20)
          .select(
            "topic level language score questions completed nextTopic createdAt"
          )
          .lean(),

        Document.find({ userId })
          .sort({ createdAt: -1 })
          .limit(20)
          .select(
            "originalName pages totalChunks"
          )
          .lean(),
      ]);

    console.log(
      `Lessons found: ${lessons.length}`
    );

    console.log(
      `Documents found: ${documents.length}`
    );

    // =================================================
    // NO LESSONS
    // =================================================

    if (lessons.length === 0) {
      return res.status(200).json({
        success: true,

        learningPath: {
          title:
            "Your Learning Path",

          message:
            "Complete your first lesson to create a personalized learning path.",

          currentLevel:
            "Beginner",

          overallProgress: 0,

          topics: [],
        },
      });
    }

    // =================================================
    // LESSON HISTORY
    // =================================================

    const lessonHistory =
      lessons
        .map((lesson) => {
          const totalQuestions =
            Array.isArray(
              lesson.questions
            )
              ? lesson.questions.length
              : 0;

          const score =
            Number(lesson.score) || 0;

          const percentage =
            totalQuestions > 0
              ? Math.round(
                  (score /
                    totalQuestions) *
                    100
                )
              : 0;

          return `
Topic: ${lesson.topic || "Unknown"}
Level: ${lesson.level || "Beginner"}
Language: ${lesson.language || "English"}
Score: ${percentage}%
Completed: ${lesson.completed === true}
Next topic: ${lesson.nextTopic || "None"}
`;
        })
        .join("\n");

    // =================================================
    // DOCUMENTS
    // =================================================

    const materialList =
      documents
        .map(
          (document) =>
            `${document.originalName || "Untitled"} (${document.pages || 0} pages)`
        )
        .join("\n");

    // =================================================
    // GEMINI PROMPT
    // =================================================

    const prompt = `
You are an expert adaptive AI learning-path designer.

Create a personalized learning path for this student.

================ STUDENT HISTORY ================

${lessonHistory}

================ UPLOADED MATERIAL ================

${materialList || "No uploaded material."}

================ ANALYSIS ================

Analyze:

1. Completed topics.
2. Student scores.
3. Weak topics.
4. Current learning level.
5. Best next topic.
6. Future prerequisite topics.
7. Avoid unnecessary repetition.
8. Maintain prerequisite order.
9. Prefer topics related to uploaded material.

================ REQUIREMENTS ================

Create exactly 5 to 8 topics.

Only ONE topic can have status "current".

Previously completed topics should use:
"completed"

The topic the student should learn now should use:
"current"

Future topics should use:
"upcoming"

Difficulty must be:
"easy"
"medium"
"hard"

overallProgress must be an integer from 0 to 100.

Keep descriptions short.

Keep reasons short.

Return ONLY valid JSON.

Use exactly this structure:

{
  "title": "",
  "message": "",
  "currentLevel": "",
  "overallProgress": 0,
  "topics": [
    {
      "title": "",
      "description": "",
      "status": "upcoming",
      "reason": "",
      "difficulty": "easy"
    }
  ]
}

Do not use markdown.
Do not use code fences.
Do not add extra fields.
`;

    // =================================================
    // GEMINI GENERATION
    // =================================================

    console.log(
      "Generating learning path with Gemini..."
    );

    let response;

    try {
      response =
        await ai.models.generateContent({
          model:
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash",

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",

            temperature: 0.3,

            maxOutputTokens: 1200,
          },
        });

    } catch (error) {
      console.error(
        "Gemini learning path error:",
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
      // TEMPORARY ERROR
      // =============================================

      if (error?.status === 503) {
        return res.status(503).json({
          success: false,
          message:
            "Gemini is temporarily unavailable. Please try again.",
        });
      }

      throw error;
    }

    // =================================================
    // GET GEMINI OUTPUT
    // =================================================

    const output =
      response?.text?.trim();

    if (!output) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    console.log(
      "Gemini learning path response received"
    );

    // =================================================
    // CLEAN JSON
    // =================================================

    let cleanedOutput =
      output.trim();

    cleanedOutput =
      cleanedOutput
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
    // PARSE JSON
    // =================================================

    let learningPath;

    try {
      learningPath =
        JSON.parse(
          cleanedOutput
        );
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
          "Gemini returned invalid learning path JSON",
      });
    }

    // =================================================
    // VALIDATE BASIC DATA
    // =================================================

    if (
      typeof learningPath.title !==
      "string"
    ) {
      learningPath.title =
        "Your Learning Path";
    }

    if (
      typeof learningPath.message !==
      "string"
    ) {
      learningPath.message =
        "Continue learning step by step.";
    }

    if (
      typeof learningPath.currentLevel !==
      "string"
    ) {
      learningPath.currentLevel =
        "Beginner";
    }

    // =================================================
    // VALIDATE PROGRESS
    // =================================================

    let progress =
      Number(
        learningPath.overallProgress
      );

    if (!Number.isFinite(progress)) {
      progress = 0;
    }

    learningPath.overallProgress =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(progress)
        )
      );

    // =================================================
    // VALIDATE TOPICS
    // =================================================

    if (
      !Array.isArray(
        learningPath.topics
      )
    ) {
      learningPath.topics = [];
    }

    const validStatuses = [
      "completed",
      "current",
      "upcoming",
    ];

    const validDifficulty = [
      "easy",
      "medium",
      "hard",
    ];

    learningPath.topics =
      learningPath.topics
        .slice(0, 8)
        .map((topic) => ({
          title:
            typeof topic.title ===
            "string"
              ? topic.title
              : "Learning Topic",

          description:
            typeof topic.description ===
            "string"
              ? topic.description
              : "",

          status:
            validStatuses.includes(
              topic.status
            )
              ? topic.status
              : "upcoming",

          reason:
            typeof topic.reason ===
            "string"
              ? topic.reason
              : "",

          difficulty:
            validDifficulty.includes(
              topic.difficulty
            )
              ? topic.difficulty
              : "easy",
        }));

    // =================================================
    // ONLY ONE CURRENT TOPIC
    // =================================================

    let currentFound = false;

    learningPath.topics =
      learningPath.topics.map(
        (topic) => {
          if (
            topic.status ===
            "current"
          ) {
            if (!currentFound) {
              currentFound = true;

              return topic;
            }

            return {
              ...topic,
              status: "upcoming",
            };
          }

          return topic;
        }
      );

    // =================================================
    // CREATE CURRENT TOPIC IF MISSING
    // =================================================

    if (
      learningPath.topics.length >
        0 &&
      !currentFound
    ) {
      const currentIndex =
        learningPath.topics.findIndex(
          (topic) =>
            topic.status ===
            "upcoming"
        );

      if (
        currentIndex !== -1
      ) {
        learningPath.topics[
          currentIndex
        ].status = "current";
      }
    }

    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      `Learning path generated in ${
        Date.now() - startTime
      }ms`
    );

    return res.status(200).json({
      success: true,

      message:
        "Learning path generated successfully",

      learningPath,
    });

  } catch (error) {
    console.error(
      "Learning path error:",
      error
    );

    // =================================================
    // GEMINI QUOTA
    // =================================================

    if (
      error?.status === 429
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded.",
      });
    }

    // =================================================
    // GEMINI UNAVAILABLE
    // =================================================

    if (
      error?.status === 503
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini service is temporarily unavailable.",
      });
    }

    // =================================================
    // GENERAL ERROR
    // =================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate learning path",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  generateLearningPath,
};