const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateTeachingScenes = async (lesson) => {
  if (!lesson) {
    throw new Error("Lesson is required");
  }

  const prompt = `
You are an expert educational video director and AI teacher.

Create a teaching video scene plan for the following lesson.

TOPIC:
${lesson.topic || "General"}

LEVEL:
${lesson.level || "Beginner"}

LANGUAGE:
${lesson.language || "English"}

INTRODUCTION:
${lesson.introduction || ""}

EXPLANATION:
${lesson.explanation || ""}

EXAMPLES:
${
  Array.isArray(lesson.examples)
    ? lesson.examples.join("\n")
    : lesson.examples || ""
}

DEMONSTRATION:
${lesson.demonstration || ""}

SUMMARY:
${lesson.summary || ""}

NEXT TOPIC:
${lesson.nextTopic || ""}

Create 4 to 8 educational scenes.

The scenes must teach the concept progressively.

For every scene provide:

- sceneNumber
- type
- title
- duration
- script
- visualType
- visualContent
- onScreenText

Allowed visualType values:

"text"
"diagram"
"code"
"equation"
"chart"
"timeline"
"image"
"comparison"

Rules:

1. Match the student's level.
2. Use the lesson content as the primary source.
3. Do not invent facts that contradict the lesson.
4. Programming topics should use code and diagrams.
5. Mathematics should use equations and graphs.
6. Science should use diagrams and labeled explanations.
7. History should use timelines and maps where appropriate.
8. Use simple language.
9. The teacher script must sound natural when spoken.
10. Include examples where useful.
11. Include a knowledge-check scene near the end.
12. Every scene must have meaningful visualContent.
13. Keep scripts concise.
14. Use the requested language.
15. Return ONLY valid JSON.
16. Do not use markdown.
17. Do not use code fences.

Return exactly this structure:

{
  "title": "",
  "description": "",
  "language": "${lesson.language || "English"}",
  "scenes": [
    {
      "sceneNumber": 1,
      "type": "intro",
      "title": "",
      "duration": 20,
      "script": "",
      "visualType": "text",
      "visualContent": "",
      "onScreenText": ""
    }
  ]
}
`;

  console.log(
    "Generating teaching scenes with Gemini..."
  );

  let response;

  try {
    response = await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash",

      contents: prompt,

      config: {
        responseMimeType:
          "application/json",

        temperature: 0.4,

        maxOutputTokens: 4000,
      },
    });
  } catch (error) {
    console.error(
      "Gemini teaching scene error:",
      error.message
    );

    if (error?.status === 429) {
      throw new Error(
        "Gemini API quota exceeded. Please try again later."
      );
    }

    if (error?.status === 503) {
      throw new Error(
        "Gemini is temporarily unavailable. Please try again."
      );
    }

    throw error;
  }

  const output =
    response?.text?.trim();

  if (!output) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  // Remove accidental markdown code fences
  const cleanedOutput = output
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let videoPlan;

  try {
    videoPlan =
      JSON.parse(cleanedOutput);
  } catch (error) {
    console.error(
      "Invalid Gemini video JSON:"
    );

    console.error(
      cleanedOutput
    );

    throw new Error(
      "Gemini returned invalid teaching video JSON"
    );
  }

  // ==========================================
  // VALIDATE PLAN
  // ==========================================

  if (
    !videoPlan ||
    !Array.isArray(videoPlan.scenes)
  ) {
    throw new Error(
      "Gemini returned an invalid scene plan"
    );
  }

  if (
    videoPlan.scenes.length < 1
  ) {
    throw new Error(
      "Gemini generated no teaching scenes"
    );
  }

  // ==========================================
  // NORMALIZE SCENES
  // ==========================================

  videoPlan.scenes =
    videoPlan.scenes.map(
      (scene, index) => ({
        sceneNumber:
          scene.sceneNumber ||
          index + 1,

        type:
          scene.type ||
          "teaching",

        title:
          scene.title ||
          `Scene ${index + 1}`,

        duration:
          Number(scene.duration) ||
          20,

        script:
          scene.script ||
          "",

        visualType:
          scene.visualType ||
          "text",

        visualContent:
          scene.visualContent ||
          "",

        onScreenText:
          scene.onScreenText ||
          "",
      })
    );

  // ==========================================
  // DEFAULT VALUES
  // ==========================================

  videoPlan.title =
    videoPlan.title ||
    `${lesson.topic} - AI Teaching Video`;

  videoPlan.description =
    videoPlan.description ||
    `An AI-generated teaching video about ${lesson.topic}.`;

  videoPlan.language =
    videoPlan.language ||
    lesson.language ||
    "English";

  console.log(
    `Gemini generated ${videoPlan.scenes.length} scenes`
  );

  return videoPlan;
};

module.exports = {
  generateTeachingScenes,
};