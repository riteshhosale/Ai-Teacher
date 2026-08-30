import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Lesson() {
  const navigate = useNavigate();

  const [lessonData, setLessonData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedLesson = localStorage.getItem("lessonData");

    if (!savedLesson) {
      navigate("/learn");
      return;
    }

    setLessonData(JSON.parse(savedLesson));
  }, [navigate]);

  if (!lessonData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading lesson...</p>
      </div>
    );
  }

  const lessonSteps = [
    {
      type: "explain",
      title: `Understanding ${lessonData.topic}`,
      content: `Let's start with the basics of ${lessonData.topic}. I'll explain the concept in a simple way based on your ${lessonData.level.toLowerCase()} level.`,
    },
    {
      type: "example",
      title: "Let's understand with an example",
      content: `Think about ${lessonData.topic} as something you can understand through a simple real-world example. The AI Teacher will use examples and demonstrations to make the concept easier to understand.`,
    },
    {
      type: "question",
      title: "Let's check your understanding",
      question: `Which approach is best when learning a new concept like ${lessonData.topic}?`,
      options: [
        "Memorize everything without understanding",
        "Understand the concept and apply it with examples",
        "Skip the examples",
        "Only read the definition",
      ],
      correctAnswer:
        "Understand the concept and apply it with examples",
    },
    {
      type: "adapt",
      title: "Personalized Feedback",
      content:
        "Based on your answer, the AI Teacher can identify areas that need more explanation and adjust the next part of the lesson accordingly.",
    },
  ];

  const currentLesson = lessonSteps[currentStep];

  const handleAnswer = () => {
    if (!selectedAnswer) return;

    setAnswered(true);

    if (selectedAnswer === currentLesson.correctAnswer) {
      setScore((previous) => previous + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer("");
    setAnswered(false);

    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);
    }
  };

  const finishLesson = () => {
    localStorage.setItem(
      "lessonProgress",
      JSON.stringify({
        topic: lessonData.topic,
        score,
        completed: true,
      })
    );

    navigate("/dashboard");
  };

  const progress =
    ((currentStep + 1) / lessonSteps.length) * 100;

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
              AI<span className="text-indigo-400">Teacher</span>
            </span>

          </Link>

          <div className="flex items-center gap-4">

            <span className="hidden text-sm text-slate-400 sm:block">
              {lessonData.language}
            </span>

            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm text-slate-300
              transition hover:bg-white/10"
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
              style={{ width: `${progress}%` }}
            />

          </div>

        </div>

      </div>


      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-7xl px-5 py-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* ================= TEACHING AREA ================= */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">

            {/* Teacher Video */}
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">

              {/* Fake video/avatar placeholder */}
              <div className="text-center">

                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-indigo-400/30 bg-indigo-600/20 text-4xl">
                  👨‍🏫
                </div>

                <p className="mt-4 font-semibold">
                  AI Teacher
                </p>

                <div className="mt-2 flex items-center justify-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                  <span className="text-sm text-slate-400">
                    Teaching
                  </span>

                </div>

              </div>


              {/* Video controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">

                <span className="rounded-lg bg-black/40 px-3 py-2 text-xs text-slate-300">
                  AI Teacher
                </span>

                <button
                  type="button"
                  className="rounded-lg bg-black/40 px-3 py-2 text-sm"
                >
                  🔊 Voice
                </button>

              </div>

            </div>


            {/* Teaching Content */}
            <div className="p-6 sm:p-8">

              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">

                {currentLesson.type === "explain" && "🧠 Explanation"}

                {currentLesson.type === "example" && "💡 Example"}

                {currentLesson.type === "question" && "❓ Question"}

                {currentLesson.type === "adapt" && "🎯 Personalized Learning"}

              </div>

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                {currentLesson.title}
              </h1>


              {/* Explanation */}
              {(currentLesson.type === "explain" ||
                currentLesson.type === "example" ||
                currentLesson.type === "adapt") && (

                <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                  {currentLesson.content}
                </p>

              )}


              {/* Question */}
              {currentLesson.type === "question" && (

                <div className="mt-6">

                  <p className="leading-7 text-slate-300">
                    {currentLesson.question}
                  </p>


                  <div className="mt-5 space-y-3">

                    {currentLesson.options.map((option) => (

                      <button
                        key={option}
                        type="button"
                        disabled={answered}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                          selectedAnswer === option
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-white/10 bg-slate-800 hover:border-indigo-400"
                        } ${
                          answered &&
                          option === currentLesson.correctAnswer
                            ? "border-green-500 bg-green-500/10"
                            : ""
                        }`}
                      >
                        {option}
                      </button>

                    ))}

                  </div>


                  {!answered && (

                    <button
                      type="button"
                      onClick={handleAnswer}
                      disabled={!selectedAnswer}
                      className="mt-5 rounded-xl bg-indigo-600 px-6 py-3
                      font-semibold transition hover:bg-indigo-700
                      disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Check Answer
                    </button>

                  )}


                  {answered && (

                    <div className="mt-5 rounded-xl border border-white/10 bg-slate-800 p-4">

                      {selectedAnswer === currentLesson.correctAnswer ? (
                        <p className="text-green-400">
                          ✓ Correct! Good understanding.
                        </p>
                      ) : (
                        <p className="text-red-400">
                          ✗ Not quite. Let's review the concept.
                        </p>
                      )}

                    </div>

                  )}

                </div>

              )}


              {/* Next */}
              {currentLesson.type !== "question" && (

                <button
                  type="button"
                  onClick={
                    currentStep === lessonSteps.length - 1
                      ? finishLesson
                      : handleNext
                  }
                  className="mt-7 rounded-xl bg-indigo-600 px-7 py-3
                  font-semibold transition hover:bg-indigo-700"
                >
                  {currentStep === lessonSteps.length - 1
                    ? "Finish Lesson"
                    : "Continue →"}
                </button>

              )}


              {currentLesson.type === "question" && answered && (

                <button
                  type="button"
                  onClick={
                    currentStep === lessonSteps.length - 1
                      ? finishLesson
                      : handleNext
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-7 py-3
                  font-semibold transition hover:bg-indigo-700"
                >
                  {currentStep === lessonSteps.length - 1
                    ? "Finish Lesson"
                    : "Continue →"}
                </button>

              )}

            </div>

          </section>


          {/* ================= SIDEBAR ================= */}
          <aside className="space-y-5">

            {/* Lesson Info */}
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
                  value={lessonData.time}
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
                  title="Demonstrate"
                  active={currentStep >= 1}
                />

                <Process
                  number="03"
                  title="Question"
                  active={currentStep >= 2}
                />

                <Process
                  number="04"
                  title="Adapt"
                  active={currentStep >= 3}
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