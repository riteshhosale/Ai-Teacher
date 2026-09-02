import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const DEFAULT_LEVEL = "Beginner";

function clampProgress(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

function normalizeLearningPath(value) {
  if (!value || typeof value !== "object") {
    return {
      title: "Your Learning Path",
      message:
        "A learning path created from your performance and learning history.",
      overallProgress: 0,
      currentLevel: DEFAULT_LEVEL,
      topics: [],
    };
  }

  const topics = Array.isArray(value.topics)
    ? value.topics
        .filter((topic) => topic && typeof topic === "object")
        .map((topic, index) => ({
          id:
            topic._id ||
            topic.id ||
            topic.topicId ||
            `topic-${index}`,
          title:
            typeof topic.title === "string" && topic.title.trim()
              ? topic.title.trim()
              : `Topic ${index + 1}`,
          description:
            typeof topic.description === "string"
              ? topic.description
              : "",
          status:
            typeof topic.status === "string"
              ? topic.status.toLowerCase()
              : "upcoming",
          difficulty:
            typeof topic.difficulty === "string"
              ? topic.difficulty.toLowerCase()
              : "beginner",
          reason:
            typeof topic.reason === "string"
              ? topic.reason
              : "",
        }))
    : [];

  return {
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim()
        : "Your Learning Path",

    message:
      typeof value.message === "string" && value.message.trim()
        ? value.message.trim()
        : "A learning path created from your performance and learning history.",

    overallProgress: clampProgress(value.overallProgress),

    currentLevel:
      typeof value.currentLevel === "string" &&
      value.currentLevel.trim()
        ? value.currentLevel
        : DEFAULT_LEVEL,

    topics,
  };
}

function LearningPath() {
  const navigate = useNavigate();

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const loadLearningPath = useCallback(async (signal) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/recommendations/learning-path`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from the server.");
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load learning path."
        );
      }

      if (!data?.learningPath) {
        throw new Error(
          "The server did not return a learning path."
        );
      }

      setPath(normalizeLearningPath(data.learningPath));
    } catch (requestError) {
      if (requestError?.name === "AbortError") {
        return;
      }

      console.error("Learning path error:", requestError);

      setError(
        requestError?.message ||
          "Something went wrong while loading your learning path."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRetrying(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    void loadLearningPath(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadLearningPath]);

  const progress = useMemo(
    () => clampProgress(path?.overallProgress),
    [path?.overallProgress]
  );

  const handleRetry = async () => {
    if (retrying) {
      return;
    }

    const controller = new AbortController();

    try {
      setRetrying(true);
      await loadLearningPath(controller.signal);
    } finally {
      controller.abort();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div
          className="text-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
            aria-hidden="true"
          />

          <p className="mt-4 text-sm text-slate-500">
            Creating your learning path...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"
            aria-hidden="true"
          >
            !
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Unable to load your learning path
          </h1>

          <p
            className="mt-2 text-sm leading-6 text-red-600"
            role="alert"
          >
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retrying ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            aria-label="AI Teacher dashboard"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600"
              aria-hidden="true"
            >
              <span className="text-xs font-bold text-white">
                AI
              </span>
            </div>

            <span className="font-bold">
              AI<span className="text-indigo-600">Teacher</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* Header */}
        <section>
          <p className="text-sm font-semibold text-indigo-600">
            PERSONALIZED LEARNING
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {path?.title || "Your Learning Path"}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-500">
            {path?.message ||
              "A learning path created from your performance and learning history."}
          </p>
        </section>

        {/* Progress */}
        <section
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"
          aria-labelledby="progress-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                id="progress-heading"
                className="text-sm text-slate-500"
              >
                Overall Progress
              </p>

              <p className="mt-1 text-2xl font-bold">
                {progress}%
              </p>
            </div>

            <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
              {path?.currentLevel || DEFAULT_LEVEL}
            </div>
          </div>

          <div
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Overall learning progress"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Learning Path */}
        <section
          className="mt-8"
          aria-labelledby="path-heading"
        >
          <h2 id="path-heading" className="text-xl font-bold">
            Your Path
          </h2>

          {path?.topics?.length > 0 ? (
            <div className="relative mt-6">
              {/* Vertical line */}
              <div
                className="absolute bottom-8 left-6 top-8 w-px bg-slate-200"
                aria-hidden="true"
              />

              <div className="space-y-5">
                {path.topics.map((topic, index) => {
                  const completed = topic.status === "completed";
                  const current = topic.status === "current";

                  const difficultyClass =
                    topic.difficulty === "hard"
                      ? "bg-red-50 text-red-600"
                      : topic.difficulty === "medium"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-green-50 text-green-600";

                  return (
                    <article
                      key={topic.id}
                      className="relative flex gap-5"
                    >
                      {/* Circle */}
                      <div
                        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-slate-50 text-sm font-bold ${
                          completed
                            ? "bg-green-500 text-white"
                            : current
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-400"
                        }`}
                        aria-label={
                          completed
                            ? "Completed"
                            : current
                              ? "Current topic"
                              : `Upcoming topic ${index + 1}`
                        }
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 rounded-2xl border p-5 ${
                          current
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold">
                                {topic.title}
                              </h3>

                              {current && (
                                <span
                                  className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white"
                                  aria-current="step"
                                >
                                  CURRENT
                                </span>
                              )}
                            </div>

                            {topic.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {topic.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${difficultyClass}`}
                          >
                            {topic.difficulty}
                          </span>
                        </div>

                        {topic.reason && (
                          <div className="mt-4 rounded-xl bg-white/70 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Why this topic?
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {topic.reason}
                            </p>
                          </div>
                        )}

                        {current && (
                          <Link
                            to={`/learn?topic=${encodeURIComponent(
                              topic.title
                            )}`}
                            className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Start This Lesson →
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h3 className="font-semibold">
                No learning topics yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete a few lessons and assessments so your
                personalized learning path can be generated.
              </p>

              <Link
                to="/learn"
                className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Start Learning
              </Link>
            </div>
          )}
        </section>

        {/* Refresh */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retrying
              ? "Recalculating..."
              : "↻ Recalculate Learning Path"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default LearningPath;