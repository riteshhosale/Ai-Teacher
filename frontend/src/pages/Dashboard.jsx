import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

function Dashboard() {
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const requests = [
        fetch(`${API_URL}/progress/summary`, {
          method: "GET",
          headers,
          signal: controller.signal,
        }),

        fetch(`${API_URL}/lessons`, {
          method: "GET",
          headers,
          signal: controller.signal,
        }),

        fetch(`${API_URL}/documents`, {
          method: "GET",
          headers,
          signal: controller.signal,
        }),
      ];

      const [
        summaryResponse,
        lessonsResponse,
        documentsResponse,
      ] = await Promise.all(requests);

      if (!mountedRef.current) {
        return;
      }

      // =====================================================
      // AUTH
      // =====================================================

      const unauthorized = [
        summaryResponse,
        lessonsResponse,
        documentsResponse,
      ].some(
        (response) => response.status === 401
      );

      if (unauthorized) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      // =====================================================
      // PARSE RESPONSE SAFELY
      // =====================================================

      const parseResponse = async (response) => {
        const contentType =
          response.headers.get("content-type") || "";

        if (
          !contentType
            .toLowerCase()
            .includes("application/json")
        ) {
          return {
            success: false,
            message:
              "Server returned an unexpected response.",
          };
        }

        try {
          return await response.json();
        } catch {
          return {
            success: false,
            message: "Invalid server response.",
          };
        }
      };

      const [
        summaryData,
        lessonsData,
        documentsData,
      ] = await Promise.all([
        parseResponse(summaryResponse),
        parseResponse(lessonsResponse),
        parseResponse(documentsResponse),
      ]);

      if (!mountedRef.current) {
        return;
      }

      // =====================================================
      // SUMMARY
      // =====================================================

      if (
        summaryResponse.ok &&
        summaryData?.success
      ) {
        setSummary(
          summaryData.summary &&
            typeof summaryData.summary === "object"
            ? summaryData.summary
            : {}
        );
      } else {
        setSummary({});
      }

      // =====================================================
      // LESSONS
      // =====================================================

      if (
        lessonsResponse.ok &&
        lessonsData?.success &&
        Array.isArray(lessonsData.lessons)
      ) {
        setLessons(lessonsData.lessons);
      } else {
        setLessons([]);
      }

      // =====================================================
      // DOCUMENTS
      // =====================================================

      if (
        documentsResponse.ok &&
        documentsData?.success &&
        Array.isArray(documentsData.documents)
      ) {
        setDocuments(documentsData.documents);
      } else {
        setDocuments([]);
      }

      // Show a general warning only when all requests failed.
      const allFailed =
        !summaryResponse.ok &&
        !lessonsResponse.ok &&
        !documentsResponse.ok;

      if (allFailed) {
        setError(
          "Unable to load your dashboard right now."
        );
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error("Dashboard error:", err);

      if (mountedRef.current) {
        setError(
          err?.message ||
            "Unable to load your dashboard."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        controllerRef.current === controller
      ) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;

    void loadDashboard();

    return () => {
      mountedRef.current = false;

      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [loadDashboard]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    localStorage.removeItem("token");

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div
            className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800"
            aria-hidden="true"
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const completedLessons =
    Number(summary?.completedLessons);

  const totalQuestions =
    Number(summary?.totalQuestions);

  const averageScore =
    Number(summary?.averageScore);

  const safeCompletedLessons =
    Number.isFinite(completedLessons) &&
    completedLessons >= 0
      ? completedLessons
      : 0;

  const safeTotalQuestions =
    Number.isFinite(totalQuestions) &&
    totalQuestions >= 0
      ? totalQuestions
      : 0;

  const safeAverageScore =
    Number.isFinite(averageScore)
      ? Math.min(
          100,
          Math.max(0, averageScore)
        )
      : 0;

  const nextTopic =
    typeof summary?.nextTopic === "string"
      ? summary.nextTopic.trim()
      : "";

  const weakTopics = Array.isArray(
    summary?.weakTopics
  )
    ? summary.weakTopics.filter(
        (topic) =>
          typeof topic === "string" &&
          topic.trim()
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            AI<span className="text-slate-500">Teacher</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/progress"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
            >
              Progress
            </Link>

            <Link
              to="/learning-path"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
            >
              Learning path
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-100 bg-white p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* =====================================================
            WELCOME
        ===================================================== */}

        <section>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Learning space
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Continue learning with your personalized AI
            Teacher.
          </p>
        </section>

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <DashboardAction
            to="/learn"
            title="Start learning"
            description="Choose a topic and create a personalized lesson."
            primary
          />

          <DashboardAction
            to="/upload"
            title="Upload material"
            description="Learn directly from your notes and study material."
          />

          <DashboardAction
            to="/learning-path"
            title="Learning path"
            description="See what you have learned and what comes next."
          />
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Lessons"
            value={safeCompletedLessons}
          />

          <StatCard
            title="Questions"
            value={safeTotalQuestions}
          />

          <StatCard
            title="Average score"
            value={`${Math.round(
              safeAverageScore
            )}%`}
          />

          <StatCard
            title="Study materials"
            value={documents.length}
          />
        </section>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* RECENT LESSONS */}

          <section className="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Recent lessons
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest learning activity
                </p>
              </div>

              <Link
                to="/progress"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                View all
              </Link>
            </div>

            {lessons.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-medium text-slate-900">
                  No lessons yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Start your first AI lesson.
                </p>

                <Link
                  to="/learn"
                  className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Start learning
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lessons
                  .slice(0, 5)
                  .map((lesson, index) => {
                    if (
                      !lesson ||
                      typeof lesson !==
                        "object"
                    ) {
                      return null;
                    }

                    const lessonId =
                      typeof lesson._id ===
                      "string"
                        ? lesson._id
                        : "";

                    if (!lessonId) {
                      return null;
                    }

                    const topic =
                      typeof lesson.topic ===
                      "string"
                        ? lesson.topic.trim()
                        : "Untitled lesson";

                    const level =
                      typeof lesson.level ===
                      "string"
                        ? lesson.level.trim()
                        : "";

                    const lessonLanguage =
                      typeof lesson.language ===
                      "string"
                        ? lesson.language.trim()
                        : "";

                    const questions =
                      Array.isArray(
                        lesson.questions
                      )
                        ? lesson.questions
                        : [];

                    const questionCount =
                      questions.length;

                    const rawScore =
                      Number(lesson.score);

                    const score =
                      Number.isFinite(
                        rawScore
                      )
                        ? Math.max(
                            0,
                            rawScore
                          )
                        : 0;

                    const percentage =
                      questionCount > 0
                        ? Math.min(
                            100,
                            Math.max(
                              0,
                              Math.round(
                                (score /
                                  questionCount) *
                                  100
                              )
                            )
                          )
                        : 0;

                    return (
                      <Link
                        key={lessonId}
                        to={`/lesson/${encodeURIComponent(
                          lessonId
                        )}`}
                        className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {topic}
                          </h3>

                          {(level ||
                            lessonLanguage) && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {[
                                level,
                                lessonLanguage,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {percentage}%
                            </p>

                            <p className="text-xs text-slate-400">
                              Score
                            </p>
                          </div>

                          <span
                            className="text-slate-400"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </section>

          {/* RECOMMENDATION */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Recommendation
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
              Keep learning
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {nextTopic
                ? `Your next recommended topic is ${nextTopic}.`
                : "Complete a lesson to receive a personalized recommendation."}
            </p>

            {weakTopics.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  Review
                </p>

                <div className="mt-3 space-y-2">
                  {weakTopics
                    .slice(0, 3)
                    .map(
                      (topic, index) => (
                        <p
                          key={`${topic}-${index}`}
                          className="text-sm text-slate-600"
                        >
                          {topic.trim()}
                        </p>
                      )
                    )}
                </div>
              </div>
            )}

            <Link
              to="/learn"
              className="mt-6 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Continue learning
            </Link>
          </section>
        </section>

        {/* =====================================================
            DOCUMENTS
        ===================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Study materials
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Documents available to your AI Teacher
              </p>
            </div>

            <Link
              to="/upload"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Upload
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                No study materials uploaded.
              </p>

              <Link
                to="/upload"
                className="mt-3 inline-block text-sm font-medium text-slate-800 underline underline-offset-4"
              >
                Upload your first PDF
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {documents
                .slice(0, 6)
                .map((document, index) => {
                  if (
                    !document ||
                    typeof document !==
                      "object"
                  ) {
                    return null;
                  }

                  const documentId =
                    typeof document._id ===
                    "string"
                      ? document._id
                      : `document-${index}`;

                  const originalName =
                    typeof document.originalName ===
                    "string"
                      ? document.originalName.trim()
                      : "Untitled document";

                  const pages = Number(
                    document.pages
                  );

                  const chunks = Number(
                    document.totalChunks
                  );

                  const safePages =
                    Number.isFinite(pages) &&
                    pages >= 0
                      ? pages
                      : 0;

                  const safeChunks =
                    Number.isFinite(chunks) &&
                    chunks >= 0
                      ? chunks
                      : 0;

                  return (
                    <div
                      key={documentId}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="truncate text-sm font-medium text-slate-900">
                        {originalName}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {safePages} pages ·{" "}
                        {safeChunks} chunks
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DashboardAction({
  to,
  title,
  description,
  primary = false,
}) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border p-6 transition ${
        primary
          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <p
            className={`mt-2 text-sm leading-6 ${
              primary
                ? "text-slate-300"
                : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>

        <span
          className={`text-xl transition group-hover:translate-x-1 ${
            primary
              ? "text-slate-400"
              : "text-slate-400"
          }`}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;