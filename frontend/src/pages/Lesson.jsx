import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AITeacher from "../components/AITeacher";
import RealtimeTeacher from "../components/RealtimeTeacher";
import AdaptiveQuestion from "../components/AdaptiveQuestion";

// =====================================================
// API URL
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL || "https://ai-teacher-qrj7.onrender.com/api";

// =====================================================
// LESSON COMPONENT
// =====================================================

function Lesson() {
  const navigate = useNavigate();

  const { id } = useParams();

  // =====================================================
  // STATE
  // =====================================================

  const [lessonData] = useState(() => {
    const savedLesson = localStorage.getItem("generatedLesson");

    if (!savedLesson) {
      return null;
    }

    try {
      const parsedLesson = JSON.parse(savedLesson);

      if (!parsedLesson) {
        localStorage.removeItem("generatedLesson");
        return null;
      }

      localStorage.removeItem("adaptiveResult");
      return parsedLesson;
    } catch (error) {
      console.error("Invalid lesson data:", error);
      localStorage.removeItem("generatedLesson");
      return null;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [answered, setAnswered] = useState(false);

  const [evaluating, setEvaluating] = useState(false);

  const [score, setScore] = useState(0);

  const [adaptiveResult, setAdaptiveResult] = useState(null);

  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);

  useEffect(() => {
    if (!lessonData) {
      navigate("/learn");
    }
  }, [lessonData, navigate]);

  // =====================================================
  // STOP SPEECH WHEN LEAVING
  // =====================================================

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (!lessonData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Preparing your AI lesson...</p>
      </div>
    );
  }

  // =====================================================
  // QUESTIONS
  // =====================================================

  const normalQuestions = Array.isArray(lessonData.questions)
    ? lessonData.questions
    : [];

  const allQuestions = [...normalQuestions, ...adaptiveQuestions];

  // =====================================================
  // LESSON STEPS
  // =====================================================

  const lessonSteps = [
    {
      type: "explain",

      title: `Understanding ${lessonData.topic}`,

      content:
        lessonData.introduction ||
        lessonData.explanation ||
        `Let's learn about ${lessonData.topic}.`,
    },

    {
      type: "example",

      title: "Let's understand with examples",

      content:
        Array.isArray(lessonData.examples) && lessonData.examples.length
          ? lessonData.examples.join("\n\n")
          : "Let's understand this concept with a practical example.",
    },

    {
      type: "demonstrate",

      title: "Practical Demonstration",

      content: lessonData.demonstration || "Let's apply what we have learned.",
    },

    ...allQuestions.map((question, index) => ({
      type: "question",

      title: `Question ${index + 1}`,

      question: question.question || "",

      options: Array.isArray(question.options) ? question.options : [],

      correctAnswer: question.correctAnswer || "",

      explanation: question.explanation || "",

      adaptive: question.adaptive === true,
    })),

    {
      type: "adapt",

      title: "Personalized Feedback",

      content:
        adaptiveResult?.feedback ||
        lessonData.summary ||
        "You have completed the main part of the lesson.",
    },

    {
      type: "next",

      title: "What to Learn Next",

      content: lessonData.nextTopic || "Continue practicing this topic.",
    },
  ];

  const currentLesson = lessonSteps[currentStep];

  // =====================================================
  // ANSWER
  // =====================================================

  const handleAnswer = async () => {
    if (
      !selectedAnswer ||
      evaluating ||
      answered ||
      currentLesson?.type !== "question"
    ) {
      return;
    }

    try {
      setEvaluating(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/adaptive/evaluate`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          topic: lessonData.topic,

          question: currentLesson.question,

          selectedAnswer,

          correctAnswer: currentLesson.correctAnswer,

          level: lessonData.level,

          language: lessonData.language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to evaluate answer");
      }

      if (!data.result) {
        throw new Error("AI evaluation result not received");
      }

      // =================================================
      // SAVE RESULT
      // =================================================

      setAdaptiveResult(data.result);

      localStorage.setItem("adaptiveResult", JSON.stringify(data.result));

      // =================================================
      // SCORE
      // =================================================

      if (data.result.correct) {
        setScore((previous) => previous + 1);
      }

      // =================================================
      // MARK ANSWERED
      // =================================================

      setAnswered(true);

      // =================================================
      // CREATE ADAPTIVE QUESTION
      // =================================================

      const isNormalQuestion = currentLesson.adaptive !== true;

      if (
        isNormalQuestion &&
        adaptiveQuestions.length === 0 &&
        data.result.nextQuestion?.question
      ) {
        const nextQuestion = data.result.nextQuestion;

        const adaptiveQuestion = {
          question: nextQuestion.question,

          options: Array.isArray(nextQuestion.options)
            ? nextQuestion.options
            : [],

          correctAnswer: nextQuestion.correctAnswer || "",

          explanation: "",

          adaptive: true,
        };

        setAdaptiveQuestions([adaptiveQuestion]);
      }
    } catch (error) {
      console.error("Adaptive evaluation error:", error);

      alert(error.message || "Failed to evaluate answer");
    } finally {
      setEvaluating(false);
    }
  };

  // =====================================================
  // NEXT STEP
  // =====================================================

  const handleNext = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSelectedAnswer("");
    setAnswered(false);

    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);

      return;
    }

    finishLesson();
  };

  // =====================================================
  // FINISH LESSON
  // =====================================================

  const finishLesson = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!id) {
        throw new Error("Lesson ID is missing");
      }

      const response = await fetch(`${API_URL}/lessons/${id}/complete`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete lesson");
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      localStorage.removeItem("generatedLesson");

      localStorage.removeItem("adaptiveResult");

      navigate("/progress");
    } catch (error) {
      console.error("Finish lesson error:", error);

      alert(error.message || "Failed to save lesson");
    }
  };

  // =====================================================
  // PROGRESS
  // =====================================================

  const progress =
    lessonSteps.length > 0 ? ((currentStep + 1) / lessonSteps.length) * 100 : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-xs font-bold">AI</span>
            </div>

            <span className="font-bold">
              AI
              <span className="text-indigo-400">Teacher</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:block">
              {lessonData.language}
            </span>

            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Exit Lesson
            </Link>
          </div>
        </div>
      </nav>

      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Lesson Progress</span>

            <span className="font-semibold">
              {currentStep + 1} / {lessonSteps.length}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* =================================================
              TEACHING AREA
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            {/* =================================================
                AI TEACHER
            ================================================= */}

            <div className="border-b border-white/10">
              <AITeacher
                text={`
${lessonData.introduction || ""}

${lessonData.explanation || ""}

${lessonData.demonstration || ""}
                `}
                language={lessonData.language}
              />
            </div>

            {/* =================================================
                REALTIME AI TEACHER
            ================================================= */}

            <div className="p-5 pb-0">
              <RealtimeTeacher
                topic={lessonData.topic}
                level={lessonData.level}
                language={lessonData.language}
                context={lessonData.explanation}
              />
            </div>

            {/* =================================================
                 ADAPTIVE QUESTION
             ================================================= */}

            <div className="p-5">
              <AdaptiveQuestion
                lessonId={lessonData._id}
                question="What is force?"
                expectedAnswer="Force is a push or pull acting on an object."
                context={lessonData.explanation}
              />
            </div>

            {/* =================================================
                AI TEACHING VIDEO BUTTON
            ================================================= */}

            <div className="p-5">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      AI Teaching Video
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Learn this topic through an AI-generated teaching video.
                    </p>
                  </div>

                  <Link
                    to={`/teaching-video/${id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    🎬 Start AI Teaching Video
                  </Link>
                </div>
              </div>
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="p-6 sm:p-8">
              {/* STEP TYPE */}

              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                {currentLesson.type === "explain" && "🧠 Explanation"}

                {currentLesson.type === "example" && "💡 Examples"}

                {currentLesson.type === "demonstrate" && "🛠️ Demonstration"}

                {currentLesson.type === "question" && "❓ Question"}

                {currentLesson.type === "adapt" && "🎯 Personalized Learning"}

                {currentLesson.type === "next" && "🚀 Next Topic"}
              </div>

              {/* TITLE */}

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                {currentLesson.title}
              </h1>

              {/* =================================================
                  NORMAL CONTENT
              ================================================= */}

              {["explain", "example", "demonstrate", "adapt", "next"].includes(
                currentLesson.type,
              ) && (
                <div className="mt-5 max-w-3xl">
                  {(currentLesson.content || "")
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="mb-4 whitespace-pre-line leading-8 text-slate-300"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              )}

              {/* =================================================
                  QUESTION
              ================================================= */}

              {currentLesson.type === "question" && (
                <div className="mt-6">
                  <p className="leading-7 text-slate-300">
                    {currentLesson.question}
                  </p>

                  {/* OPTIONS */}

                  <div className="mt-5 space-y-3">
                    {currentLesson.options.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={answered || evaluating}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                          selectedAnswer === option
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-white/10 bg-slate-800 hover:border-indigo-400"
                        } ${
                          answered && option === currentLesson.correctAnswer
                            ? "border-green-500 bg-green-500/10"
                            : ""
                        } ${
                          answered &&
                          selectedAnswer === option &&
                          option !== currentLesson.correctAnswer
                            ? "border-red-500 bg-red-500/10"
                            : ""
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {/* CHECK ANSWER */}

                  {!answered && (
                    <button
                      type="button"
                      onClick={handleAnswer}
                      disabled={!selectedAnswer || evaluating}
                      className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {evaluating ? "AI is evaluating..." : "Check Answer"}
                    </button>
                  )}

                  {/* =================================================
                      FEEDBACK
                  ================================================= */}

                  {answered && adaptiveResult && (
                    <div className="mt-6 space-y-4">
                      {/* FEEDBACK */}

                      <div
                        className={`rounded-xl border p-5 ${
                          adaptiveResult.correct
                            ? "border-green-500/20 bg-green-500/10"
                            : "border-orange-500/20 bg-orange-500/10"
                        }`}
                      >
                        <p className="font-semibold">
                          {adaptiveResult.correct
                            ? "✓ Correct!"
                            : "Let's understand this better."}
                        </p>

                        {adaptiveResult.feedback && (
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {adaptiveResult.feedback}
                          </p>
                        )}
                      </div>

                      {/* EXPLANATION */}

                      {adaptiveResult.explanation && (
                        <div className="rounded-xl bg-slate-800 p-5">
                          <p className="text-sm font-semibold text-indigo-400">
                            🧠 Explanation
                          </p>

                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {adaptiveResult.explanation}
                          </p>
                        </div>
                      )}

                      {/* EXAMPLE */}

                      {adaptiveResult.example && (
                        <div className="rounded-xl bg-slate-800 p-5">
                          <p className="text-xs font-semibold text-slate-500">
                            Example
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {adaptiveResult.example}
                          </p>
                        </div>
                      )}

                      {/* MISCONCEPTION */}

                      {adaptiveResult.misconception && (
                        <div className="rounded-xl bg-slate-800 p-5">
                          <p className="text-sm font-semibold text-orange-400">
                            🔍 What to improve
                          </p>

                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {adaptiveResult.misconception}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                  CONTINUE NON QUESTION
              ================================================= */}

              {currentLesson.type !== "question" && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-7 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700"
                >
                  {currentStep === lessonSteps.length - 1
                    ? "Finish Lesson"
                    : "Continue →"}
                </button>
              )}

              {/* =================================================
                  CONTINUE AFTER QUESTION
              ================================================= */}

              {currentLesson.type === "question" && answered && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-5 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700"
                >
                  {currentStep === lessonSteps.length - 1
                    ? "Finish Lesson"
                    : "Continue →"}
                </button>
              )}
            </div>
          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-5">
            {/* LESSON INFO */}

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="font-bold">Lesson Information</h2>

              <div className="mt-5 space-y-4">
                <Info label="Topic" value={lessonData.topic} />

                <Info label="Level" value={lessonData.level} />

                <Info label="Language" value={lessonData.language} />

                <Info
                  label="Time"
                  value={lessonData.estimatedTime || lessonData.time || "-"}
                />
              </div>
            </div>

            {/* TEACHING PROCESS */}

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="font-bold">Teaching Process</h2>

              <div className="mt-5 space-y-4">
                <Process
                  number="01"
                  title="Explain"
                  active={currentStep >= 0}
                />

                <Process
                  number="02"
                  title="Examples"
                  active={currentStep >= 1}
                />

                <Process
                  number="03"
                  title="Demonstrate"
                  active={currentStep >= 2}
                />

                <Process
                  number="04"
                  title="Questions"
                  active={currentLesson.type === "question" || currentStep >= 3}
                />

                <Process
                  number="05"
                  title="Adapt"
                  active={
                    currentLesson.type === "adapt" ||
                    adaptiveQuestions.length > 0
                  }
                />
              </div>
            </div>

            {/* SCORE */}

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Current Score</p>

              <p className="mt-1 text-3xl font-bold">{score}</p>

              <p className="mt-1 text-xs text-slate-500">Correct answers</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// =====================================================
// INFO COMPONENT
// =====================================================

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

// =====================================================
// PROCESS COMPONENT
// =====================================================

function Process({ number, title, active }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"
        }`}
      >
        {number}
      </div>

      <span
        className={`text-sm ${
          active ? "font-medium text-white" : "text-slate-500"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

export default Lesson;
