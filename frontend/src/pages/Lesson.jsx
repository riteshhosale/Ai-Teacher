import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Lesson() {
  const navigate = useNavigate();

  // ================= STATE =================

  const [lessonData, setLessonData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ================= LOAD AI LESSON =================

  useEffect(() => {
    const savedLesson = localStorage.getItem("generatedLesson");

    if (!savedLesson) {
      navigate("/learn");
      return;
    }

    try {
      const parsedLesson = JSON.parse(savedLesson);
      setLessonData(parsedLesson);
    } catch (error) {
      console.error("Invalid lesson data:", error);

      localStorage.removeItem("generatedLesson");
      navigate("/learn");
    }
  }, [navigate]);

  // ================= LOADING =================

  if (!lessonData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Preparing your AI lesson...
        </p>
      </div>
    );
  }

  // ================= LESSON STEPS =================

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
        lessonData.examples?.length > 0
          ? lessonData.examples.join("\n\n")
          : "Let's understand this concept with a practical example.",
    },

    {
      type: "demonstrate",
      title: "Practical Demonstration",
      content:
        lessonData.demonstration ||
        "Let's apply what we have learned.",
    },

    // ================= ALL AI QUESTIONS =================

    ...(lessonData.questions || []).map((question, index) => ({
      type: "question",
      title: `Question ${index + 1}`,
      question: question.question,
      options: question.options || [],
      correctAnswer: question.correctAnswer || "",
      explanation:
        question.explanation ||
        "Review the explanation and try again.",
    })),

    {
      type: "adapt",
      title: "Personalized Feedback",
      content:
        lessonData.summary ||
        "You have completed the main part of the lesson.",
    },

    {
      type: "next",
      title: "What to Learn Next",
      content:
        lessonData.nextTopic ||
        "Continue practicing this topic.",
    },
  ];

  const currentLesson = lessonSteps[currentStep];

  // ================= ANSWER =================

  const handleAnswer = () => {
    if (!selectedAnswer || answered) return;

    setAnswered(true);

    if (selectedAnswer === currentLesson.correctAnswer) {
      setScore((previous) => previous + 1);
    }
  };

  // ================= NEXT =================

  const handleNext = () => {
    setSelectedAnswer("");
    setAnswered(false);

    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);
    }
  };

  // ================= FINISH =================

  const finishLesson = () => {
    const totalQuestions = lessonData.questions?.length || 0;

    localStorage.setItem(
      "lessonProgress",
      JSON.stringify({
        topic: lessonData.topic,
        score,
        totalQuestions,
        completed: true,
      })
    );

    // Stop voice if running
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    navigate("/dashboard");
  };

  // ================= PROGRESS =================

  const progress =
    ((currentStep + 1) / lessonSteps.length) * 100;

  // ================= VOICE =================

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (!text) return;

    // Stop current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang =
      lessonData.language === "Hindi"
        ? "hi-IN"
        : lessonData.language === "Marathi"
          ? "mr-IN"
          : "en-US";

    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onstart = () => {
      setIsSpeaking(true);
    };

    speech.onend = () => {
      setIsSpeaking(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };

  const handleVoice = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = "";

    if (currentLesson.type === "question") {
      textToSpeak = `${currentLesson.question}. Options are: ${currentLesson.options.join(
        ". "
      )}`;
    } else {
      textToSpeak = currentLesson.content || currentLesson.title;
    }

    speakText(textToSpeak);
  };

  // ================= UI =================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          <Link
            to="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
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

      {/* ================= PROGRESS ================= */}

      <div className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4">

          <div className="flex items-center justify-between text-sm">

            <span className="text-slate-400">
              Lesson Progress
            </span>

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

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-7xl px-5 py-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* ================= TEACHING AREA ================= */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">

            {/* ================= AI TEACHER ================= */}

            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">

              <div className="text-center">

                <div
                  className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 ${
                    isSpeaking
                      ? "border-green-400/60 bg-green-500/20"
                      : "border-indigo-400/30 bg-indigo-600/20"
                  } text-5xl transition`}
                >
                  👨‍🏫
                </div>

                <p className="mt-4 text-lg font-semibold">
                  AI Teacher
                </p>

                <div className="mt-2 flex items-center justify-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSpeaking
                        ? "animate-pulse bg-green-400"
                        : "bg-slate-500"
                    }`}
                  />

                  <span className="text-sm text-slate-400">
                    {isSpeaking
                      ? "Speaking..."
                      : "Ready to teach"}
                  </span>

                </div>

              </div>

              {/* Voice button */}

              <button
                type="button"
                onClick={handleVoice}
                className="absolute bottom-5 right-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
              >
                {isSpeaking
                  ? "⏹ Stop Voice"
                  : "🔊 Start Voice"}
              </button>

            </div>

            {/* ================= CONTENT ================= */}

            <div className="p-6 sm:p-8">

              {/* Step type */}

              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">

                {currentLesson.type === "explain" &&
                  "🧠 Explanation"}

                {currentLesson.type === "example" &&
                  "💡 Examples"}

                {currentLesson.type === "demonstrate" &&
                  "🛠️ Demonstration"}

                {currentLesson.type === "question" &&
                  "❓ Question"}

                {currentLesson.type === "adapt" &&
                  "🎯 Personalized Learning"}

                {currentLesson.type === "next" &&
                  "🚀 Next Topic"}

              </div>

              {/* Title */}

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                {currentLesson.title}
              </h1>

              {/* ================= TEXT CONTENT ================= */}

              {(currentLesson.type === "explain" ||
                currentLesson.type === "example" ||
                currentLesson.type === "demonstrate" ||
                currentLesson.type === "adapt" ||
                currentLesson.type === "next") && (

                <div className="mt-5 max-w-3xl">

                  {currentLesson.content
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

              {/* ================= QUESTION ================= */}

              {currentLesson.type === "question" && (

                <div className="mt-6">

                  <p className="leading-7 text-slate-300">
                    {currentLesson.question}
                  </p>

                  {/* Options */}

                  <div className="mt-5 space-y-3">

                    {currentLesson.options.map(
                      (option, index) => (

                        <button
                          key={index}
                          type="button"
                          disabled={answered}
                          onClick={() =>
                            setSelectedAnswer(option)
                          }
                          className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                            selectedAnswer === option
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-white/10 bg-slate-800 hover:border-indigo-400"
                          } ${
                            answered &&
                            option ===
                              currentLesson.correctAnswer
                              ? "border-green-500 bg-green-500/10"
                              : ""
                          } ${
                            answered &&
                            selectedAnswer === option &&
                            option !==
                              currentLesson.correctAnswer
                              ? "border-red-500 bg-red-500/10"
                              : ""
                          }`}
                        >
                          {option}
                        </button>

                      )
                    )}

                  </div>

                  {/* Check Answer */}

                  {!answered && (

                    <button
                      type="button"
                      onClick={handleAnswer}
                      disabled={!selectedAnswer}
                      className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Check Answer
                    </button>

                  )}

                  {/* Feedback */}

                  {answered && (

                    <div className="mt-5 rounded-xl border border-white/10 bg-slate-800 p-4">

                      {selectedAnswer ===
                      currentLesson.correctAnswer ? (

                        <div>

                          <p className="font-semibold text-green-400">
                            ✓ Correct! Good understanding.
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {currentLesson.explanation}
                          </p>

                        </div>

                      ) : (

                        <div>

                          <p className="font-semibold text-red-400">
                            ✗ Not quite.
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {currentLesson.explanation}
                          </p>

                          <p className="mt-3 text-sm text-slate-400">
                            Correct answer:{" "}

                            <span className="font-semibold text-green-400">
                              {currentLesson.correctAnswer}
                            </span>
                          </p>

                        </div>

                      )}

                    </div>

                  )}

                </div>
              )}

              {/* ================= NEXT BUTTON ================= */}

              {currentLesson.type !== "question" && (

                <button
                  type="button"
                  onClick={
                    currentStep ===
                    lessonSteps.length - 1
                      ? finishLesson
                      : handleNext
                  }
                  className="mt-7 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700"
                >
                  {currentStep ===
                  lessonSteps.length - 1
                    ? "Finish Lesson"
                    : "Continue →"}
                </button>

              )}

              {/* Next after question */}

              {currentLesson.type === "question" &&
                answered && (

                  <button
                    type="button"
                    onClick={
                      currentStep ===
                      lessonSteps.length - 1
                        ? finishLesson
                        : handleNext
                    }
                    className="mt-5 rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-700"
                  >
                    {currentStep ===
                    lessonSteps.length - 1
                      ? "Finish Lesson"
                      : "Continue →"}
                  </button>

                )}

            </div>
          </section>

          {/* ================= SIDEBAR ================= */}

          <aside className="space-y-5">

            {/* Lesson Information */}

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="font-bold">
                Lesson Information
              </h2>

              <div className="mt-5 space-y-4">

                <Info
                  label="Topic"
                  value={lessonData.topic}
                />

                <Info
                  label="Level"
                  value={lessonData.level}
                />

                <Info
                  label="Language"
                  value={lessonData.language}
                />

                <Info
                  label="Time"
                  value={
                    lessonData.estimatedTime ||
                    lessonData.time
                  }
                />

              </div>
            </div>

            {/* Teaching Process */}

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="font-bold">
                Teaching Process
              </h2>

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
                  active={
                    currentLesson.type === "question" ||
                    currentStep >= 3
                  }
                />

                <Process
                  number="05"
                  title="Adapt"
                  active={
                    currentLesson.type === "adapt" ||
                    currentStep >= lessonSteps.length - 2
                  }
                />

              </div>
            </div>

            {/* Score */}

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

/* ================= INFO ================= */

function Info({ label, value }) {
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

/* ================= PROCESS ================= */

function Process({ number, title, active }) {
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