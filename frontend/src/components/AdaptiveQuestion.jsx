import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

function AdaptiveQuestion({
  lessonId,
  question,
  expectedAnswer,
  context,
  onNext,
}) {
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setEvaluation(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(
        `${API_URL}/adaptive/evaluate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            lessonId,
            question,
            studentAnswer: answer,
            expectedAnswer,
            context,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to evaluate answer"
        );
      }

      setEvaluation(data.evaluation);

    } catch (err) {
      console.error("Adaptive evaluation error:", err);

      setError(
        err.message ||
          "Unable to evaluate your answer."
      );
    } finally {
      setLoading(false);
    }
  };


  const continueLearning = () => {
    if (evaluation?.nextQuestion && onNext) {
      onNext(evaluation.nextQuestion);
    }

    setAnswer("");
    setEvaluation(null);
  };


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Question */}

      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-slate-500">
          Knowledge Check
        </p>

        <h2 className="text-xl font-semibold text-slate-900">
          {question}
        </h2>
      </div>


      {/* Answer */}

      {!evaluation && (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Explain your answer..."
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-300 p-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={submitAnswer}
            disabled={loading}
            className="mt-4 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "AI Teacher is evaluating..."
              : "Submit Answer"}
          </button>
        </>
      )}


      {/* Evaluation */}

      {evaluation && (
        <div className="mt-6 space-y-4">

          {/* Score */}

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">
                Score
              </span>

              <span className="text-2xl font-bold text-slate-900">
                {evaluation.score}/100
              </span>
            </div>
          </div>


          {/* Correct */}

          <div
            className={`rounded-xl p-4 ${
              evaluation.correct
                ? "bg-green-50"
                : "bg-red-50"
            }`}
          >
            <p
              className={`font-semibold ${
                evaluation.correct
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {evaluation.correct
                ? "✓ Correct"
                : "✗ Let's improve this"}
            </p>
          </div>


          {/* Understanding */}

          {evaluation.understood && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">
                What you understood
              </h3>

              <p className="mt-2 text-slate-600">
                {evaluation.understood}
              </p>
            </div>
          )}


          {/* Misconception */}

          {evaluation.misconception && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold text-orange-800">
                Misconception detected
              </h3>

              <p className="mt-2 text-orange-700">
                {evaluation.misconception}
              </p>
            </div>
          )}


          {/* Explanation */}

          {evaluation.explanation && (
            <div className="rounded-xl bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">
                AI Teacher Explanation
              </h3>

              <p className="mt-2 leading-7 text-blue-800">
                {evaluation.explanation}
              </p>
            </div>
          )}


          {/* Adaptive re-explanation */}

          {!evaluation.correct &&
            evaluation.reExplanation && (
              <div className="rounded-xl bg-purple-50 p-4">
                <h3 className="font-semibold text-purple-900">
                  Let's explain it differently
                </h3>

                <p className="mt-2 leading-7 text-purple-800">
                  {evaluation.reExplanation}
                </p>
              </div>
            )}


          {/* Analogy */}

          {!evaluation.correct &&
            evaluation.analogy && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <h3 className="font-semibold text-indigo-900">
                  Think of it this way
                </h3>

                <p className="mt-2 leading-7 text-indigo-800">
                  {evaluation.analogy}
                </p>
              </div>
            )}


          {/* Next question */}

          {evaluation.nextQuestion && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">
                Next Question
              </h3>

              <p className="mt-2 text-slate-600">
                {evaluation.nextQuestion}
              </p>
            </div>
          )}


          <button
            onClick={continueLearning}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
          >
            Continue Learning →
          </button>

        </div>
      )}
    </div>
  );
}

export default AdaptiveQuestion;