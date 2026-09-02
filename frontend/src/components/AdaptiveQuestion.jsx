import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_ANSWER_LENGTH = 5000;

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
    if (loading) return;

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setError("Please enter your answer.");
      return;
    }

    if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
      setError(
        `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`
      );
      return;
    }

    if (!lessonId) {
      setError("Lesson information is missing.");
      return;
    }

    if (!question?.trim()) {
      setError("Question information is missing.");
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
            studentAnswer: trimmedAnswer,
            expectedAnswer,
            context,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to evaluate answer (${response.status}).`
        );
      }

      if (
        !data?.evaluation ||
        typeof data.evaluation !== "object"
      ) {
        throw new Error(
          "The evaluation response was invalid."
        );
      }

      setEvaluation(data.evaluation);
    } catch (err) {
      console.error(
        "Adaptive evaluation error:",
        err
      );

      setEvaluation(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to evaluate your answer."
      );
    } finally {
      setLoading(false);
    }
  };

  const continueLearning = () => {
    if (!evaluation) return;

    if (
      evaluation.nextQuestion &&
      typeof onNext === "function"
    ) {
      onNext(evaluation.nextQuestion);
    }

    setAnswer("");
    setEvaluation(null);
    setError("");
  };

  const score =
    typeof evaluation?.score === "number"
      ? Math.max(0, Math.min(100, evaluation.score))
      : null;

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          Knowledge check
        </p>

        <h2 className="text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
          {question}
        </h2>
      </div>

      {!evaluation && (
        <div>
          <label
            htmlFor="adaptive-answer"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Your answer
          </label>

          <textarea
            id="adaptive-answer"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Explain your answer in your own words..."
            rows={6}
            maxLength={MAX_ANSWER_LENGTH}
            disabled={loading}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {answer.length}/{MAX_ANSWER_LENGTH}
            </span>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-600"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={submitAnswer}
            disabled={loading || !answer.trim()}
            className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading
              ? "Evaluating..."
              : "Submit answer"}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="space-y-6">
          {/* Score */}
          <div className="flex items-end justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-sm text-slate-500">
                Evaluation
              </p>

              <p
                className={`mt-1 text-base font-semibold ${
                  evaluation.correct
                    ? "text-emerald-700"
                    : "text-slate-900"
                }`}
              >
                {evaluation.correct
                  ? "Correct"
                  : "Keep learning"}
              </p>
            </div>

            {score !== null && (
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                {score}
                <span className="ml-1 text-sm font-normal text-slate-400">
                  /100
                </span>
              </p>
            )}
          </div>

          {/* Understanding */}
          {evaluation.understood && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                What you understood
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {evaluation.understood}
              </p>
            </div>
          )}

          {/* Misconception */}
          {evaluation.misconception && (
            <div className="border-l-2 border-slate-300 pl-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Misconception
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {evaluation.misconception}
              </p>
            </div>
          )}

          {/* Explanation */}
          {evaluation.explanation && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Explanation
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {evaluation.explanation}
              </p>
            </div>
          )}

          {/* Re-explanation */}
          {!evaluation.correct &&
            evaluation.reExplanation && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  A different way to see it
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {evaluation.reExplanation}
                </p>
              </div>
            )}

          {/* Analogy */}
          {!evaluation.correct &&
            evaluation.analogy && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Think of it this way
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {evaluation.analogy}
                </p>
              </div>
            )}

          {/* Next question */}
          {evaluation.nextQuestion && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                Next
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {evaluation.nextQuestion}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={continueLearning}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Continue learning
          </button>
        </div>
      )}
    </section>
  );
}

export default AdaptiveQuestion;