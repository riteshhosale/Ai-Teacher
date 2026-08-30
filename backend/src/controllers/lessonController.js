const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateLesson = async (req, res) => {
  try {
    const {
      topic,
      level,
      language,
      time,
    } = req.body;

    if (!topic || !level || !language || !time) {
      return res.status(400).json({
        success: false,
        message: "Topic, level, language and time are required",
      });
    }

    const prompt = `
You are an expert human-like AI teacher.

Create a personalized lesson for a student.

Student information:
Topic: ${topic}
Level: ${level}
Language: ${language}
Available time: ${time}

Teaching requirements:

1. Start with a simple explanation.
2. Explain the concept according to the student's level.
3. Give practical examples.
4. Include a demonstration or application.
5. Ask questions to check understanding.
6. Provide a multiple-choice question.
7. Provide the correct answer.
8. Explain why the answer is correct.
9. Give adaptive feedback.
10. End with a short summary.
11. Suggest what the student should learn next.

Return ONLY valid JSON.

Use exactly this structure:

{
  "topic": "",
  "level": "",
  "language": "",
  "estimatedTime": "",
  "introduction": "",
  "explanation": "",
  "examples": [
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
    }
  ],
  "summary": "",
  "nextTopic": ""
}

Do not use markdown.
`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: prompt,
    });

    const output = response.output_text;

    let lesson;

    try {
      lesson = JSON.parse(output);
    } catch (error) {
      console.error("AI returned invalid JSON:", output);

      return res.status(500).json({
        success: false,
        message: "AI returned invalid lesson data",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lesson generated successfully",
      lesson,
    });

  } catch (error) {
    console.error("Lesson generation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate lesson",
    });
  }
};

module.exports = {
  generateLesson,
};