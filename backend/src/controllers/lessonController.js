const { GoogleGenAI } = require("@google/genai");

const {
  createEmbedding,
} = require("../utils/embeddings");

const searchKnowledge =
  require("../utils/searchKnowledge");

const Lesson = require("../models/Lesson");

const {
  buildPersonalizationContext,
} = require("../services/personalizationService");


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
    // 4. BUILD PERSONALIZATION CONTEXT
    // =================================================

    const personalizationContext =
      buildPersonalizationContext({
        level,

        existingKnowledge:
          req.user?.existingKnowledge || "",

        goal:
          req.user?.learningGoal ||
          "Understand the topic",

        teachingStyle:
          req.user?.teachingStyle ||
          "Simple and example-based",

        language,

        availableTime:
          time,

        weakConcepts:
          req.user?.weakConcepts || [],

        strongConcepts:
          req.user?.strongConcepts || [],

        previousScore:
          req.user?.previousScore ?? null,
      });


    // =================================================
    // 5. PROMPT
    // =================================================

    const prompt = `
You are an expert adaptive AI teacher.

${personalizationContext}


=================================================
STUDENT REQUEST
=================================================

Topic:
${topic}

Level:
${level}

Language:
${language}

Available learning time:
${time}


=================================================
STUDY MATERIAL
=================================================

Use the uploaded study material as the
PRIMARY source when relevant.

${context || "No relevant study material found."}


=================================================
TEACHING REQUIREMENTS
=================================================

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


=================================================
TIME-BASED PERSONALIZATION
=================================================

The student's available learning time is:

${time}

Adapt the lesson to this time.

If the available time is short:

- Focus on the most important concepts.
- Keep explanations concise.
- Use fewer examples when necessary.
- Ask only essential questions.
- Avoid unnecessary background information.

If the available time is moderate:

- Cover the important concepts.
- Provide useful examples.
- Include knowledge-check questions.
- Use moderate explanation depth.

If the available time is long:

- Explain concepts more deeply.
- Provide additional examples.
- Include demonstrations.
- Include additional practice where appropriate.

Do not unnecessarily exceed the student's available time.


=================================================
PERSONALIZATION RULES
=================================================

- Match the student's knowledge level.
- Focus more on weak concepts.
- Avoid unnecessary repetition of strong concepts.
- Follow the preferred teaching style.
- Use the requested language.
- Adapt difficulty according to previous performance.
- Use examples appropriate for the student.
- Keep the lesson grounded in the uploaded material.
- Do not invent information that contradicts the study material.
- Ask questions that verify understanding.


// =================================================
// LANGUAGE RULE
// =================================================

LANGUAGE REQUIREMENT:

The student's selected language is:

${language}

Generate the ENTIRE lesson in this language.

Translate and generate all educational content
naturally in the selected language.

This includes:

- Introduction
- Explanation
- Examples
- Demonstration
- Questions
- Options
- Correct answers
- Question explanations
- Summary
- Next topic

IMPORTANT:

Do not mix English with the selected language
unless a technical term normally remains in English.

Preserve:
- Mathematical formulas
- Programming syntax
- Scientific symbols
- Technical names
- Code

The teaching explanation itself must use the
selected language.


=================================================
LENGTH LIMITS
=================================================

- Introduction: maximum 60 words.
- Explanation: maximum 120 words.
- Each example: maximum 40 words.
- Demonstration: maximum 60 words.
- Each question: maximum 30 words.
- Each question explanation: maximum 40 words.
- Summary: maximum 40 words.
- nextTopic: maximum 10 words.


=================================================
IMPORTANT
=================================================

Keep the complete response SHORT.

DO NOT generate unnecessary text.

ALWAYS finish the JSON.

RETURN ONLY VALID JSON.


=================================================
EXACT JSON STRUCTURE
=================================================

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


=================================================
FINAL RULES
=================================================

- Exactly 2 questions.
- Exactly 4 options per question.
- Do not use markdown.
- Do not use code fences.
- Return JSON only.
`;


    // =================================================
    // 6. GEMINI MODEL FALLBACK
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
    // 7. GET GEMINI TEXT
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
    // 8. CLEAN JSON
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
    // 9. PARSE JSON
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
    // 10. VALIDATE LESSON
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
    // 11. ENSURE EXACTLY 2 QUESTIONS
    // =================================================

    lesson.questions =
      lesson.questions
        .slice(0, 2);


    // =================================================
    // 12. VALIDATE QUESTIONS
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
    // 13. SUCCESS
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
    // 14. RESPONSE
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