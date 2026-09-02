const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const evaluateAnswer = async (req, res) => {
  try {
    const {
      lessonId,
      question,
      studentAnswer,
      expectedAnswer,
      context = "",
    } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (
      !question?.trim() ||
      !studentAnswer?.trim() ||
      !expectedAnswer?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "question, studentAnswer and expectedAnswer are required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is not configured",
      });
    }

    // -----------------------------
    // PROMPT
    // -----------------------------

    const prompt = `
You are an adaptive AI teacher.

Evaluate the student's answer based on the question and expected answer.

LESSON ID:
${lessonId || "Not provided"}

QUESTION:
${question}

EXPECTED ANSWER:
${expectedAnswer}

STUDENT ANSWER:
${studentAnswer}

ADDITIONAL CONTEXT:
${context || "No additional context"}

Determine:

1. Whether the student's answer is correct.
2. How well the student understands the concept.
3. Any misconception.
4. A simple explanation.
5. An alternative explanation if the student is incorrect.
6. A simple analogy.
7. A follow-up question.

Return ONLY valid JSON.

Use exactly this structure:

{
  "correct": true,
  "score": 85,
  "understood": "Short description",
  "misconception": null,
  "explanation": "Simple explanation",
  "reExplanation": "Alternative explanation",
  "analogy": "Simple analogy",
  "nextQuestion": "Follow-up question"
}

Rules:

- score must be an integer from 0 to 100.
- correct must be true or false.
- misconception must be null when there is no misconception.
- Keep explanations simple and educational.
- If partially correct, explain what is missing.
- If incorrect, clearly explain the misconception.
- Do not use Markdown.
- Do not use code fences.
- Return JSON only.
`;

    // -----------------------------
    // GEMINI MODELS
    // -----------------------------

    const models = [
      process.env.GEMINI_MODEL || "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];

    let response = null;
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        });

        if (response) {
          console.log(`Gemini model succeeded: ${model}`);
          break;
        }
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini model ${model} failed:`,
          error.message
        );
      }
    }

    if (!response) {
      throw lastError || new Error("Gemini evaluation failed");
    }

    // -----------------------------
    // GET GEMINI RESPONSE
    // -----------------------------

    let text = response.text;

    if (typeof text === "function") {
      text = text();
    }

    if (!text || !text.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    text = text.trim();

    // Remove accidental Markdown fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // -----------------------------
    // PARSE JSON
    // -----------------------------

    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error("Invalid Gemini JSON:");
      console.error(text);

      throw new Error(
        "AI returned an invalid evaluation response"
      );
    }

    // -----------------------------
    // VALIDATE RESULT
    // -----------------------------

    result.correct = Boolean(result.correct);

    const numericScore = Number(result.score);

    result.score = Number.isFinite(numericScore)
      ? Math.max(0, Math.min(100, Math.round(numericScore)))
      : 0;

    result.understood =
      typeof result.understood === "string"
        ? result.understood
        : "";

    result.misconception =
      result.misconception === null ||
      typeof result.misconception === "string"
        ? result.misconception
        : null;

    result.explanation =
      typeof result.explanation === "string"
        ? result.explanation
        : "";

    result.reExplanation =
      typeof result.reExplanation === "string"
        ? result.reExplanation
        : "";

    result.analogy =
      typeof result.analogy === "string"
        ? result.analogy
        : "";

    result.nextQuestion =
      typeof result.nextQuestion === "string"
        ? result.nextQuestion
        : "";

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return res.status(200).json({
      success: true,
      lessonId: lessonId || null,
      evaluation: result,
    });
  } catch (error) {
    console.error("Adaptive evaluation error:", error);

    // Gemini rate limit
    if (
      error.status === 429 ||
      error.message?.includes("429")
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API rate limit reached. Please try again shortly.",
      });
    }

    // Gemini unavailable
    if (
      error.status === 503 ||
      error.message?.includes("503")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini is temporarily unavailable. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to evaluate student answer",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  evaluateAnswer,
};