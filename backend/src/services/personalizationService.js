const buildPersonalizationContext = ({
  level,
  existingKnowledge,
  goal,
  teachingStyle,
  language,
  availableTime,
  weakConcepts = [],
  strongConcepts = [],
  previousScore = null,
}) => {
  return `
STUDENT PERSONALIZATION PROFILE

Level:
${level || "Beginner"}

Existing Knowledge:
${existingKnowledge || "No prior knowledge specified"}

Learning Goal:
${goal || "Understand the topic"}

Preferred Teaching Style:
${teachingStyle || "Simple and example-based"}

Preferred Language:
${language || "English"}

Available Learning Time:
${availableTime || "30 minutes"}

Previous Assessment Score:
${
  previousScore !== null
    ? `${previousScore}/100`
    : "No previous assessment"
}

Weak Concepts:
${
  weakConcepts.length
    ? weakConcepts.join(", ")
    : "None identified"
}

Strong Concepts:
${
  strongConcepts.length
    ? strongConcepts.join(", ")
    : "None identified"
}


TIME-BASED TEACHING RULES

The student's available learning time is:
${availableTime || "30 minutes"}

Adjust the lesson according to the available time.

If the student has very little time:
- Focus only on the most important concepts.
- Keep explanations concise.
- Use fewer examples.
- Ask only essential questions.
- Avoid unnecessary background information.

If the student has moderate time:
- Cover the important concepts.
- Provide useful examples.
- Include knowledge-check questions.
- Give moderate explanation depth.

If the student has plenty of time:
- Explain concepts deeply.
- Include multiple examples.
- Include demonstrations.
- Include additional practice questions.
- Explore related concepts.

Never exceed the student's requested learning time unnecessarily.


PERSONALIZATION RULES

1. Adapt explanation to the student's level.
2. Focus more on weak concepts.
3. Avoid unnecessary repetition of strong concepts.
4. Use the student's preferred teaching style.
5. Use the student's preferred language.
6. Adapt difficulty based on previous performance.
7. Respect the available learning time.
8. Use appropriate examples.
9. Ask questions to verify understanding.
10. Detect misconceptions.
11. Re-explain misconceptions differently.
12. Continue adapting based on student answers.
`;
};

module.exports = {
  buildPersonalizationContext,
};