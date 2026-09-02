import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AITeacher from "../components/AITeacher";
import RealtimeTeacher from "../components/RealtimeTeacher";
import AdaptiveQuestion from "../components/AdaptiveQuestion";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_ANSWER_LENGTH = 5000;

/* =========================================================
   HELPERS
========================================================= */

function parseStoredLesson() {
  const savedLesson = localStorage.getItem("generatedLesson");

  if (!savedLesson) {
    return null;
  }

  try {
    const parsedLesson = JSON.parse(savedLesson);

    if (!parsedLesson || typeof parsedLesson !== "object") {
      localStorage.removeItem("generatedLesson");
      return null;
    }

    return parsedLesson;
  } catch (error) {
    console.error("Invalid lesson data:", error);
    localStorage.removeItem("generatedLesson");
    return null;
  }
}

function normalizeQuestion(question, index, adaptive = false) {
  if (!question || typeof question !== "object") {
    return null;
  }

  const text =
    typeof question.question === "string"
      ? question.question.trim()
      : "";

  if (!text) {
    return null;
  }

  const id =
    question._id ||
    question.id ||
    question.questionId ||
    `${adaptive ? "adaptive" : "normal"}-${index}`;

  return {
    id: String(id),

    question: text,

    options: Array.isArray(question.options)
      ? question.options.filter(
          (option) =>
            typeof option === "string" &&
            option.trim()
        )
      : [],

    correctAnswer:
      typeof question.correctAnswer === "string"
        ? question.correctAnswer
        : "",

    explanation:
      typeof question.explanation === "string"
        ? question.explanation
        : "",

    adaptive:
      adaptive || question.adaptive === true,
  };
}

/* =========================================================
   LESSON
========================================================= */

function Lesson() {
  const navigate = useNavigate();
  const { id } = useParams();

  const evaluationControllerRef = useRef(null);
  const completionControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const finishingRef = useRef(false);

  const [lessonData, setLessonData] = useState(
    parseStoredLesson
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [score, setScore] = useState(0);
  const [adaptiveResult, setAdaptiveResult] =
    useState(null);

  /*
   * Only one adaptive question is created at a time.
   */
  const [adaptiveQuestions, setAdaptiveQuestions] =
    useState([]);

  const [error, setError] = useState("");

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      evaluationControllerRef.current?.abort();
      completionControllerRef.current?.abort();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* =======================================================
     VALIDATE STORED LESSON
  ======================================================= */

  useEffect(() => {
    if (!lessonData) {
      navigate("/learn", {
        replace: true,
      });
      return;
    }

    const storedId =
      lessonData._id ||
      lessonData.id ||
      lessonData.lessonId;

    if (
      id &&
      storedId &&
      String(storedId) !== String(id)
    ) {
      console.warn(
        "Lesson ID mismatch between URL and stored lesson."
      );

      localStorage.removeItem("generatedLesson");
      localStorage.removeItem("adaptiveResult");

      navigate("/learn", {
        replace: true,
      });
    }
  }, [id, lessonData, navigate]);

  /* =======================================================
     CLEAR OLD RESULT
  ======================================================= */

  useEffect(() => {
    localStorage.removeItem("adaptiveResult");
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (!lessonData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Preparing your AI lesson...
        </p>
      </div>
    );
  }

  /* =======================================================
     NORMAL QUESTIONS
  ======================================================= */

  const normalQuestions = Array.isArray(
    lessonData.questions
  )
    ? lessonData.questions
        .map((question, index) =>
          normalizeQuestion(
            question,
            index,
            false
          )
        )
        .filter(Boolean)
    : [];

  /*
   * Only the first adaptive question is used.
   */
  const adaptiveQuestion =
    adaptiveQuestions.length > 0
      ? adaptiveQuestions[0]
      : null;

  /* =======================================================
     LESSON STEPS
  ======================================================= */

  const lessonSteps = [
    {
      type: "explain",

      title: `Understanding ${
        lessonData.topic || "this topic"
      }`,

      content:
        lessonData.introduction ||
        lessonData.explanation ||
        `Let's learn about ${
          lessonData.topic || "this topic"
        }.`,
    },

    {
      type: "example",

      title:
        "Let's understand with examples",

      content:
        Array.isArray(
          lessonData.examples
        ) &&
        lessonData.examples.length > 0
          ? lessonData.examples
              .map(String)
              .join("\n\n")
          : "Let's understand this concept with a practical example.",
    },

    {
      type: "demonstrate",

      title:
        "Practical Demonstration",

      content:
        lessonData.demonstration ||
        "Let's apply what we have learned.",
    },

    /*
     * Normal questions.
     */
    ...normalQuestions.map(
      (question, index) => ({
        type: "question",

        id: question.id,

        title: `Question ${index + 1}`,

        question: question.question,

        options: question.options,

        correctAnswer:
          question.correctAnswer,

        explanation:
          question.explanation,

        adaptive: false,
      })
    ),

    /*
     * IMPORTANT:
     *
     * Adaptive question is NOT appended here.
     *
     * It is handled separately by handleNext().
     * This prevents the adaptive question from
     * appearing at the wrong position.
     */

    {
      type: "adapt",

      title:
        "Personalized Feedback",

      content:
        adaptiveResult?.feedback ||
        lessonData.summary ||
        "You have completed the main part of the lesson.",
    },

    {
      type: "next",

      title:
        "What to Learn Next",

      content:
        lessonData.nextTopic ||
        "Continue practicing this topic.",
    },
  ];

  const currentLesson =
    lessonSteps[currentStep];

  /* =======================================================
     ANSWER
  ======================================================= */

  const handleAnswer = async () => {
  if (
    !selectedAnswer ||
    evaluating ||
    answered ||
    currentLesson?.type !== "question"
  ) {
    return;
  }

  const trimmedAnswer = selectedAnswer.trim();

  if (!trimmedAnswer) {
    setError("Please select an answer.");
    return;
  }

  if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
    setError("Answer is too long.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login", {
      replace: true,
    });
    return;
  }

  /*
   * Cancel any previous evaluation request.
   */
  evaluationControllerRef.current?.abort();

  const controller = new AbortController();

  evaluationControllerRef.current = controller;

  try {
    setEvaluating(true);
    setError("");

    const response = await fetch(
      `${API_URL}/adaptive/evaluate`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        signal: controller.signal,

        body: JSON.stringify({
          /*
           * Lesson information
           */
          lessonId: id || lessonData._id,

          questionId: currentLesson.id,

          /*
           * Question being evaluated
           */
          question: currentLesson.question,

          /*
           * IMPORTANT:
           * Backend expects studentAnswer.
           */
          studentAnswer: trimmedAnswer,

          /*
           * IMPORTANT:
           * Backend expects expectedAnswer.
           */
          expectedAnswer: currentLesson.correctAnswer,

          /*
           * Educational context
           */
          context:
            lessonData.explanation ||
            lessonData.introduction ||
            "",

          /*
           * Optional metadata
           */
          level: lessonData.level,
          language: lessonData.language,
        }),
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Invalid response from the evaluation server."
      );
    }

    /*
     * Authentication failure
     */
    if (response.status === 401) {
      localStorage.removeItem("token");

      navigate("/login", {
        replace: true,
      });

      return;
    }

    /*
     * Backend error
     */
    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Failed to evaluate the answer."
      );
    }

    /*
     * IMPORTANT:
     * adaptiveController returns `evaluation`,
     * not `result`.
     */
    if (
      !data?.evaluation ||
      typeof data.evaluation !== "object"
    ) {
      throw new Error(
        "AI evaluation result was not received."
      );
    }

    if (!mountedRef.current) {
      return;
    }

    const result = data.evaluation;

    /*
     * Validate evaluation result.
     */
    if (typeof result.correct !== "boolean") {
      throw new Error(
        "AI returned an invalid correctness result."
      );
    }

    /*
     * SAVE RESULT
     */
    setAdaptiveResult(result);

    localStorage.setItem(
      "adaptiveResult",
      JSON.stringify(result)
    );

    /*
     * SCORE
     */
    if (result.correct === true) {
      setScore(
        (previous) => previous + 1
      );
    }

    /*
     * CREATE ADAPTIVE QUESTION
     *
     * Backend returns nextQuestion as a STRING.
     */
    const nextQuestion = result.nextQuestion;

    if (
      currentLesson.adaptive !== true &&
      !adaptiveQuestion &&
      typeof nextQuestion === "string" &&
      nextQuestion.trim()
    ) {
      const normalized = normalizeQuestion(
        {
          question: nextQuestion.trim(),
          options: [],
          correctAnswer: "",
          explanation: "",
          adaptive: true,
        },
        0,
        true
      );

      if (normalized) {
        setAdaptiveQuestions([normalized]);
      }
    }

    /*
     * Mark answered only after successful evaluation.
     */
    setAnswered(true);
  } catch (requestError) {
    if (
      requestError?.name === "AbortError"
    ) {
      return;
    }

    console.error(
      "Adaptive evaluation error:",
      requestError
    );

    if (mountedRef.current) {
      setError(
        requestError?.message ||
          "Failed to evaluate the answer."
      );
    }
  } finally {
    if (
      evaluationControllerRef.current ===
      controller
    ) {
      evaluationControllerRef.current = null;
    }

    if (mountedRef.current) {
      setEvaluating(false);
    }
  }
};

  /* =======================================================
     NEXT
  ======================================================= */

  const handleNext = () => {
    if (
      evaluating ||
      finishing
    ) {
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    /*
     * -----------------------------------------------------
     * AFTER A NORMAL QUESTION
     * -----------------------------------------------------
     *
     * If an adaptive question was generated,
     * immediately display it.
     */
    if (
      currentLesson?.type ===
        "question" &&
      currentLesson.adaptive !==
        true &&
      adaptiveQuestion
    ) {
      /*
       * Find the first normal question
       * after which the adaptive question
       * should appear.
       *
       * We place it immediately after
       * the current normal question.
       */
      setSelectedAnswer("");
      setAnswered(false);
      setError("");

      /*
       * Insert adaptive question into
       * lesson steps dynamically by
       * replacing the adaptive question
       * state with a dedicated step.
       *
       * The easiest safe approach is to
       * move currentStep forward and keep
       * adaptive question as the next step.
       */

      const adaptiveIndex =
        lessonSteps.findIndex(
          (step) =>
            step.type === "question" &&
            step.adaptive === false &&
            step.id === currentLesson.id
        );

      if (
        adaptiveIndex !== -1
      ) {
        /*
         * Add adaptive question into
         * the actual lesson data only once.
         */
        setLessonData(
          (previous) => {
            if (!previous) {
              return previous;
            }

            const existing =
              Array.isArray(
                previous.questions
              )
                ? previous.questions
                : [];

            const alreadyAdded =
              existing.some(
                (question) =>
                  question?.adaptive ===
                    true &&
                  String(
                    question?.question
                  ) ===
                    String(
                      adaptiveQuestion.question
                    )
              );

            if (alreadyAdded) {
              return previous;
            }

            return {
              ...previous,

              questions: [
                ...existing,

                {
                  ...adaptiveQuestion,

                  adaptive: true,
                },
              ],
            };
          }
        );

        /*
         * Clear the temporary adaptive
         * state. The next render will rebuild
         * the question list.
         */
        setAdaptiveQuestions([]);

        /*
         * Move to the next step.
         */
        setCurrentStep(
          (previous) =>
            previous + 1
        );

        return;
      }
    }

    /*
     * -----------------------------------------------------
     * NORMAL NEXT STEP
     * -----------------------------------------------------
     */

    setSelectedAnswer("");
    setAnswered(false);
    setAdaptiveResult(null);
    setError("");

    if (
      currentStep <
      lessonSteps.length - 1
    ) {
      setCurrentStep(
        (previous) =>
          previous + 1
      );

      return;
    }

    void finishLesson();
  };

  /* =======================================================
     FINISH LESSON
  ======================================================= */

  const finishLesson = async () => {
    if (
      finishingRef.current ||
      finishing
    ) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (!id) {
      setError(
        "Lesson ID is missing."
      );
      return;
    }

    finishingRef.current = true;

    completionControllerRef.current?.abort();

    const controller =
      new AbortController();

    completionControllerRef.current =
      controller;

    try {
      setFinishing(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/lessons/${encodeURIComponent(
            id
          )}/complete`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            signal:
              controller.signal,

            body: JSON.stringify({
              /*
               * Compatibility with current
               * backend.
               */
              score,
            }),
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response from the lesson server."
        );
      }

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "token"
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to save the completed lesson."
        );
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      localStorage.removeItem(
        "generatedLesson"
      );

      localStorage.removeItem(
        "adaptiveResult"
      );

      navigate("/progress", {
        replace: true,
      });
    } catch (requestError) {
      if (
        requestError?.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(
        "Finish lesson error:",
        requestError
      );

      if (
        mountedRef.current
      ) {
        setError(
          requestError?.message ||
            "Failed to save the completed lesson."
        );
      }

      finishingRef.current = false;
    } finally {
      if (
        completionControllerRef.current ===
        controller
      ) {
        completionControllerRef.current =
          null;
      }

      if (
        mountedRef.current
      ) {
        setFinishing(false);
      }
    }
  };

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress = useMemo(() => {
    if (
      lessonSteps.length === 0
    ) {
      return 0;
    }

    const value =
      ((currentStep + 1) /
        lessonSteps.length) *
      100;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(value)
      )
    );
  }, [
    currentStep,
    lessonSteps.length,
  ]);

  const isQuestion =
    currentLesson?.type ===
    "question";

  const isLastStep =
    currentStep ===
    lessonSteps.length - 1;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* NAVBAR */}

      <nav className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          <Link
            to="/dashboard"
            aria-label="AI Teacher dashboard"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600"
              aria-hidden="true"
            >
              <span className="text-xs font-bold">
                AI
              </span>
            </div>

            <span className="font-bold">
              AI
              <span className="text-indigo-400">
                Teacher
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-4">

            {lessonData.language && (
              <span className="hidden text-sm text-slate-400 sm:block">
                {lessonData.language}
              </span>
            )}

            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Exit Lesson
            </Link>

          </div>
        </div>
      </nav>

      {/* PROGRESS */}

      <div className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4">

          <div className="flex items-center justify-between text-sm">

            <span className="text-slate-400">
              Lesson Progress
            </span>

            <span className="font-semibold">
              {currentStep + 1} /{" "}
              {lessonSteps.length}
            </span>

          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Lesson progress"
          >
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>
      </div>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-5 py-8">

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* TEACHING AREA */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">

            <div className="border-b border-white/10">
              <AITeacher
                text={[
                  lessonData.introduction,
                  lessonData.explanation,
                  lessonData.demonstration,
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                language={
                  lessonData.language
                }
              />
            </div>

            <div className="p-5 pb-0">
              <RealtimeTeacher
                topic={
                  lessonData.topic
                }
                level={
                  lessonData.level
                }
                language={
                  lessonData.language
                }
                context={
                  lessonData.explanation
                }
              />
            </div>

            {normalQuestions.length === 0 && (
              <div className="p-5">

                <AdaptiveQuestion
                  lessonId={
                    lessonData._id ||
                    id
                  }

                  question={
                    lessonData
                      .adaptiveQuestion
                      ?.question ||
                    (lessonData.topic
                      ? `What did you understand about ${lessonData.topic}?`
                      : "What did you learn from this lesson?")
                  }

                  expectedAnswer={
                    lessonData
                      .adaptiveQuestion
                      ?.expectedAnswer ||
                    lessonData
                      .adaptiveQuestion
                      ?.correctAnswer ||
                    ""
                  }

                  context={
                    lessonData.explanation ||
                    lessonData.introduction ||
                    ""
                  }
                />

              </div>
            )}

            {id && (
              <div className="p-5">

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <h3 className="text-lg font-bold">
                        AI Teaching Video
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Learn this topic through an
                        AI-generated teaching video.
                      </p>

                    </div>

                    <Link
                      to={`/teaching-video/${encodeURIComponent(
                        id
                      )}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Start AI Teaching Video
                    </Link>

                  </div>

                </div>

              </div>
            )}

            {/* LESSON CONTENT */}

            <div className="p-6 sm:p-8">

              <div className="text-sm font-semibold text-indigo-400">

                {currentLesson.type ===
                  "explain" &&
                  "🧠 Explanation"}

                {currentLesson.type ===
                  "example" &&
                  "💡 Examples"}

                {currentLesson.type ===
                  "demonstrate" &&
                  "🛠️ Demonstration"}

                {currentLesson.type ===
                  "question" &&
                  "❓ Question"}

                {currentLesson.type ===
                  "adapt" &&
                  "🎯 Personalized Learning"}

                {currentLesson.type ===
                  "next" &&
                  "🚀 Next Topic"}

              </div>

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                {currentLesson.title}
              </h1>

              {/* NORMAL CONTENT */}

              {[
                "explain",
                "example",
                "demonstrate",
                "adapt",
                "next",
              ].includes(
                currentLesson.type
              ) && (

                <div className="mt-5 max-w-3xl">

                  {(currentLesson.content ||
                    "")
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map(
                      (
                        paragraph,
                        index
                      ) => (

                        <p
                          key={`${currentLesson.type}-${index}`}
                          className="mb-4 whitespace-pre-line leading-8 text-slate-300"
                        >
                          {paragraph}
                        </p>

                      )
                    )}

                </div>
              )}

              {/* QUESTION */}

              {isQuestion && (

                <div className="mt-6">

                  <p className="leading-7 text-slate-300">
                    {currentLesson.question}
                  </p>

                  {currentLesson.options.length >
                  0 ? (

                    <div className="mt-5 space-y-3">

                      {currentLesson.options.map(
                        (
                          option,
                          index
                        ) => {

                          const isSelected =
                            selectedAnswer ===
                            option;

                          const isCorrect =
                            answered &&
                            option ===
                              currentLesson.correctAnswer;

                          const isWrong =
                            answered &&
                            isSelected &&
                            option !==
                              currentLesson.correctAnswer;

                          return (
                            <button
                              key={`${currentLesson.id}-${index}-${option}`}
                              type="button"
                              disabled={
                                answered ||
                                evaluating ||
                                finishing
                              }
                              onClick={() => {
                                setSelectedAnswer(
                                  option
                                );

                                setError("");
                              }}
                              className={`w-full rounded-xl border p-4 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed ${
                                isCorrect
                                  ? "border-green-500 bg-green-500/10"
                                  : isWrong
                                    ? "border-red-500 bg-red-500/10"
                                    : isSelected
                                      ? "border-indigo-500 bg-indigo-500/10"
                                      : "border-white/10 bg-slate-800 hover:border-indigo-400"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        }
                      )}

                    </div>

                  ) : (

                    <p className="mt-5 text-sm text-slate-500">
                      This question does not have
                      selectable options.
                    </p>

                  )}

                  {/* CHECK ANSWER */}

                  {!answered && (
                    <button
                      type="button"
                      onClick={
                        handleAnswer
                      }
                      disabled={
                        !selectedAnswer ||
                        evaluating ||
                        finishing
                      }
                      className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {evaluating
                        ? "AI is evaluating..."
                        : "Check Answer"}
                    </button>
                  )}

                  {/* FEEDBACK */}

                  {answered &&
                    adaptiveResult && (

                      <div className="mt-6 space-y-4">

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
                              {
                                adaptiveResult.feedback
                              }
                            </p>
                          )}

                        </div>

                        {adaptiveResult.explanation && (
                          <div className="rounded-xl bg-slate-800 p-5">

                            <p className="text-sm font-semibold text-indigo-400">
                              🧠 Explanation
                            </p>

                            <p className="mt-3 text-sm leading-7 text-slate-300">
                              {
                                adaptiveResult.explanation
                              }
                            </p>

                          </div>
                        )}

                        {adaptiveResult.example && (
                          <div className="rounded-xl bg-slate-800 p-5">

                            <p className="text-xs font-semibold text-slate-500">
                              Example
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              {
                                adaptiveResult.example
                              }
                            </p>

                          </div>
                        )}

                        {adaptiveResult.misconception && (
                          <div className="rounded-xl bg-slate-800 p-5">

                            <p className="text-sm font-semibold text-orange-400">
                              🔍 What to improve
                            </p>

                            <p className="mt-3 text-sm leading-7 text-slate-300">
                              {
                                adaptiveResult.misconception
                              }
                            </p>

                          </div>
                        )}

                      </div>
                    )}

                </div>
              )}

              {/* CONTINUE */}

              {currentLesson.type !==
                "question" && (

                <button
                  type="button"
                  onClick={
                    handleNext
                  }
                  disabled={
                    finishing
                  }
                  className="mt-7 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finishing
                    ? "Saving Lesson..."
                    : isLastStep
                      ? "Finish Lesson"
                      : "Continue →"}
                </button>
              )}

              {/* QUESTION CONTINUE */}

              {isQuestion &&
                answered && (

                <button
                  type="button"
                  onClick={
                    handleNext
                  }
                  disabled={
                    finishing
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finishing
                    ? "Saving Lesson..."
                    : "Continue →"}
                </button>
              )}

            </div>
          </section>

          {/* SIDEBAR */}

          <aside className="space-y-5">

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="font-bold">
                Lesson Information
              </h2>

              <div className="mt-5 space-y-4">

                <Info
                  label="Topic"
                  value={
                    lessonData.topic ||
                    "-"
                  }
                />

                <Info
                  label="Level"
                  value={
                    lessonData.level ||
                    "-"
                  }
                />

                <Info
                  label="Language"
                  value={
                    lessonData.language ||
                    "-"
                  }
                />

                <Info
                  label="Time"
                  value={
                    lessonData.estimatedTime ||
                    lessonData.time ||
                    "-"
                  }
                />

              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="font-bold">
                Teaching Process
              </h2>

              <div className="mt-5 space-y-4">

                <Process
                  number="01"
                  title="Explain"
                  active={
                    currentStep >= 0
                  }
                />

                <Process
                  number="02"
                  title="Examples"
                  active={
                    currentStep >= 1
                  }
                />

                <Process
                  number="03"
                  title="Demonstrate"
                  active={
                    currentStep >= 2
                  }
                />

                <Process
                  number="04"
                  title="Questions"
                  active={
                    currentLesson.type ===
                      "question" ||
                    currentStep >= 3
                  }
                />

                <Process
                  number="05"
                  title="Adapt"
                  active={
                    currentLesson.type ===
                      "adapt" ||
                    adaptiveQuestion !== null
                  }
                />

              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <p className="text-sm text-slate-400">
                Current Score
              </p>

              <p className="mt-1 text-3xl font-bold">
                {score}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Correct answers
              </p>

            </div>

          </aside>

        </div>
      </main>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Info({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-200">
        {value}
      </p>

    </div>
  );
}

function Process({
  number,
  title,
  active,
}) {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          active
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-slate-500"
        }`}
      >
        {number}
      </div>

      <span
        className={`text-sm ${
          active
            ? "font-medium text-white"
            : "text-slate-500"
        }`}
      >
        {title}
      </span>

    </div>
  );
}

export default Lesson;