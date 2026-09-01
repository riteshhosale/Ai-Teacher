const { GoogleGenAI } = require("@google/genai");
const Lesson = require("../models/Lesson");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateAssessmentReport = async (req, res) => {
  try {
    const { lessonId } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required",
      });
    }

    // ===============================
    // USER ID
    // ===============================

    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ===============================
    // GET LESSON
    // ===============================

    const lesson = await Lesson.findOne({
      _id: lessonId,
      userId,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // ===============================
    // QUESTIONS
    // ===============================

    const questions = Array.isArray(
      lesson.questions
    )
      ? lesson.questions
      : [];

    const correct = questions.filter(
      (q) => q.isCorrect === true
    );

    const incorrect = questions.filter(
      (q) => q.isCorrect !== true
    );

    const score =
      questions.length > 0
        ? Math.round(
            (correct.length /
              questions.length) *
              100
          )
        : 0;

    // ===============================
    // QUESTION DATA
    // ===============================

    const questionData = questions
      .map(
        (q, index) => `
Question ${index + 1}:
${q.question || ""}

Correct answer:
${q.correctAnswer || ""}

Student answer:
${q.userAnswer || "Not answered"}

Correct:
${q.isCorrect === true}
`
      )
      .join("\n");

    // ===============================
    // GEMINI PROMPT
    // ===============================

    const prompt = `
You are an expert AI learning evaluator.

Analyze the student's actual performance.

================ LESSON ================

Topic:
${lesson.topic || "Unknown"}

Level:
${lesson.level || "Beginner"}

Language:
${lesson.language || "English"}

================ QUESTIONS ================

${questionData || "No questions available."}

================ SCORE ================

Score:
${score}%

Correct answers:
${correct.length}

Incorrect answers:
${incorrect.length}

================ TASK ================

Identify:

1. Strong concepts.
2. Weak concepts.
3. Misconceptions.
4. Recommended revision.
5. Recommended practice.
6. Next topic.

IMPORTANT:

- Base your analysis ONLY on the student's actual answers.
- Do not invent weaknesses.
- Do not claim the student misunderstood something unless the answers support it.
- Keep the recommendations appropriate for the student's level.
- If there is not enough evidence for a weakness, keep weakConcepts empty.
- If there are no clear misconceptions, keep misconceptions empty.
- The next topic should logically follow from the student's performance.
- Keep the response concise.

Return ONLY valid JSON.

Use exactly this structure:

{
  "score": ${score},
  "performance": "",
  "strongConcepts": [],
  "weakConcepts": [],
  "misconceptions": [],
  "revision": [],
  "practice": [],
  "nextTopic": ""
}

Rules:

- score must be an integer from 0 to 100.
- performance must briefly summarize the student's performance.
- strongConcepts must be an array of strings.
- weakConcepts must be an array of strings.
- misconceptions must be an array of strings.
- revision must be an array of strings.
- practice must be an array of strings.
- nextTopic must be a string.
- Do not add extra fields.
- Do not use markdown.
- Do not use code fences.
`;

    // ===============================
    // GEMINI GENERATION
    // ===============================

    console.log(
      "Generating assessment report with Gemini..."
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

            temperature: 0.2,

            maxOutputTokens: 1200,
          },
        });

    } catch (error) {
      console.error(
        "Gemini assessment error:",
        error.message
      );

      // ===============================
      // QUOTA
      // ===============================

      if (error?.status === 429) {
        return res.status(429).json({
          success: false,
          message:
            "Gemini API quota exceeded. Please try again later.",
        });
      }

      // ===============================
      // TEMPORARY UNAVAILABLE
      // ===============================

      if (error?.status === 503) {
        return res.status(503).json({
          success: false,
          message:
            "Gemini is temporarily unavailable. Please try again.",
        });
      }

      throw error;
    }

    // ===============================
    // GET OUTPUT
    // ===============================

    const output =
      response?.text?.trim();

    if (!output) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    // ===============================
    // CLEAN JSON
    // ===============================

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

    // ===============================
    // PARSE JSON
    // ===============================

    let report;

    try {
      report =
        JSON.parse(
          cleanedOutput
        );
    } catch (error) {
      console.error(
        "Invalid Gemini assessment JSON:"
      );

      console.error(
        cleanedOutput
      );

      return res.status(500).json({
        success: false,
        message:
          "Gemini returned invalid assessment JSON",
      });
    }

    // ===============================
    // VALIDATE RESULT
    // ===============================

    report.score = score;

    if (
      typeof report.performance !==
      "string"
    ) {
      report.performance =
        score >= 80
          ? "Excellent performance."
          : score >= 60
          ? "Good performance with some areas to improve."
          : "More practice and revision are recommended.";
    }

    if (
      !Array.isArray(
        report.strongConcepts
      )
    ) {
      report.strongConcepts = [];
    }

    if (
      !Array.isArray(
        report.weakConcepts
      )
    ) {
      report.weakConcepts = [];
    }

    if (
      !Array.isArray(
        report.misconceptions
      )
    ) {
      report.misconceptions = [];
    }

    if (
      !Array.isArray(
        report.revision
      )
    ) {
      report.revision = [];
    }

    if (
      !Array.isArray(
        report.practice
      )
    ) {
      report.practice = [];
    }

    if (
      typeof report.nextTopic !==
      "string"
    ) {
      report.nextTopic = "";
    }

    // ===============================
    // SAVE SCORE
    // ===============================

    // Store number of correct answers,
    // because the Lesson model uses score
    // as the raw correct-answer count.

    lesson.score =
      correct.length;

    lesson.nextTopic =
      report.nextTopic || "";

    await lesson.save();

    // ===============================
    // SUCCESS
    // ===============================

    console.log(
      "Assessment report generated successfully"
    );

    return res.status(200).json({
      success: true,

      message:
        "Assessment report generated successfully",

      report,
    });

  } catch (error) {
    console.error(
      "Assessment report error:",
      error
    );

    // ===============================
    // GEMINI ERRORS
    // ===============================

    if (
      error?.status === 429
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later.",
      });
    }

    if (
      error?.status === 503
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini service is temporarily unavailable. Please try again.",
      });
    }

    // ===============================
    // GENERAL ERROR
    // ===============================

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate assessment report",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  generateAssessmentReport,
};