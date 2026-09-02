import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message: text || `Request failed with status ${response.status}`,
  };
};

const clampPercentage = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
};

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const normalizeSummary = (summary = {}) => ({
  completedLessons: safeNumber(summary.completedLessons),
  totalQuestions: safeNumber(summary.totalQuestions),
  totalCorrect: safeNumber(summary.totalCorrect),
  averageScore: clampPercentage(summary.averageScore),
  nextTopic:
    typeof summary.nextTopic === "string"
      ? summary.nextTopic.trim()
      : "",
  weakTopics: Array.isArray(summary.weakTopics)
    ? summary.weakTopics
        .filter((topic) => typeof topic === "string")
        .map((topic) => topic.trim())
        .filter(Boolean)
    : [],
});

const normalizeHistory = (progress) => {
  if (!Array.isArray(progress)) {
    return [];
  }

  return progress
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id:
        typeof item._id === "string" && item._id
          ? item._id
          : `progress-${index}`,

      topic:
        typeof item.topic === "string" && item.topic.trim()
          ? item.topic.trim()
          : "Untitled lesson",

      level:
        typeof item.level === "string" && item.level.trim()
          ? item.level.trim()
          : "Unknown level",

      language:
        typeof item.language === "string" && item.language.trim()
          ? item.language.trim()
          : "Unknown language",

      percentage: clampPercentage(item.percentage),

      score: safeNumber(item.score),

      totalQuestions: safeNumber(item.totalQuestions),
    }));
};

function Progress() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async (signal) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setError("");

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const [summaryResponse, historyResponse] =
        await Promise.all([
          fetch(`${API_URL}/progress/summary`, {
            method: "GET",
            headers,
            signal,
          }),

          fetch(`${API_URL}/progress`, {
            method: "GET",
            headers,
            signal,
          }),
        ]);

      const summaryData = await parseResponse(summaryResponse);
      const historyData = await parseResponse(historyResponse);

      if (
        summaryResponse.status === 401 ||
        historyResponse.status === 401
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
        return;
      }

      const errors = [];

      if (!summaryResponse.ok) {
        errors.push(
          summaryData?.message ||
            "Unable to load progress summary."
        );
      }

      if (!historyResponse.ok) {
        errors.push(
          historyData?.message ||
            "Unable to load learning history."
        );
      }

      if (summaryResponse.ok && summaryData?.success) {
        setSummary(normalizeSummary(summaryData.summary));
      }

      if (historyResponse.ok && historyData?.success) {
        setHistory(normalizeHistory(historyData.progress));
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      }

      if (
        summaryResponse.ok &&
        summaryData?.success &&
        historyResponse.ok &&
        historyData?.success
      ) {
        setError("");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Load progress error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load learning progress."
      );
    }
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        await loadProgress(controller.signal);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [loadProgress]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
            aria-hidden="true"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading progress...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="AI Teacher dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-xs font-bold text-white">
                AI
              </span>
            </div>

            <span className="font-bold text-slate-900">
              AI<span className="text-indigo-600">Teacher</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-5 py-10">
        <header>
          <p className="text-sm font-semibold text-indigo-600">
            LEARNING ANALYTICS
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Your Learning Progress
          </h1>

          <p className="mt-2 text-slate-500">
            See what you've learned and where you can improve.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* STATS */}

        <section
          aria-label="Learning statistics"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Stat
            title="Lessons Completed"
            value={summary?.completedLessons ?? 0}
            icon="📚"
          />

          <Stat
            title="Questions Answered"
            value={summary?.totalQuestions ?? 0}
            icon="❓"
          />

          <Stat
            title="Correct Answers"
            value={summary?.totalCorrect ?? 0}
            icon="✓"
          />

          <Stat
            title="Average Score"
            value={`${summary?.averageScore ?? 0}%`}
            icon="📊"
          />
        </section>

        {/* RECOMMENDATION */}

        <section className="mt-8">
          <div className="rounded-2xl bg-slate-900 p-7 text-white">
            <p className="text-sm font-semibold text-slate-400">
              AI RECOMMENDATION
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Continue your learning
            </h2>

            <p className="mt-3 max-w-2xl text-slate-300">
              {summary?.nextTopic
                ? `Based on your recent lesson, we recommend learning ${summary.nextTopic}.`
                : "Complete a lesson to receive a personalized recommendation."}
            </p>

            <Link
              to={
                summary?.nextTopic
                  ? `/learn?topic=${encodeURIComponent(
                      summary.nextTopic
                    )}`
                  : "/learn"
              }
              className="mt-6 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {summary?.nextTopic
                ? "Start Recommended Lesson →"
                : "Start Learning →"}
            </Link>
          </div>
        </section>

        {/* WEAK TOPICS */}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Topics to Review
          </h2>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
            {summary?.weakTopics?.length ? (
              <div className="flex flex-wrap gap-3">
                {summary.weakTopics.map((topic) => (
                  <Link
                    key={topic}
                    to={`/learn?topic=${encodeURIComponent(topic)}`}
                    className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No weak topics yet. Complete more lessons to
                receive personalized feedback.
              </p>
            )}
          </div>
        </section>

        {/* HISTORY */}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Learning History
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">
                  No lessons completed yet.
                </p>

                <Link
                  to="/learn"
                  className="mt-4 inline-block font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Start your first lesson →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((item) => {
                  const isGood = item.percentage >= 70;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {item.topic}
                        </h3>

                        <p className="mt-1 text-sm capitalize text-slate-500">
                          {item.level} · {item.language}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-5">
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            {item.percentage}%
                          </p>

                          <p className="text-xs text-slate-400">
                            {item.score}/{item.totalQuestions}
                          </p>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isGood
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {isGood ? "Good" : "Needs Review"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <span
          className="text-xl"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default Progress;