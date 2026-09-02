import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "https://ai-teacher-qrj7.onrender.com/api";

function LearningPath() {
  const navigate = useNavigate();

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLearningPath = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/recommendations/learning-path`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load learning path");
      }

      setPath(data.learningPath);
    } catch (error) {
      console.error(error);

      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLearningPath();
  }, [loadLearningPath]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen
      items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10
          animate-spin rounded-full border-4
          border-slate-200
          border-t-indigo-600"
          />

          <p
            className="mt-4 text-sm
          text-slate-500"
          >
            Creating your learning path...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen
      items-center justify-center
      bg-slate-50 p-5"
      >
        <div
          className="rounded-2xl
        border border-red-200
        bg-white p-8 text-center"
        >
          <p className="text-red-600">{error}</p>

          <button
            onClick={loadLearningPath}
            className="mt-5 rounded-lg
            bg-indigo-600 px-5 py-2
            text-sm font-semibold
            text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}

      <nav
        className="border-b
      border-slate-200 bg-white"
      >
        <div
          className="mx-auto flex h-16
        max-w-6xl items-center
        justify-between px-5"
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9
            items-center justify-center
            rounded-lg bg-indigo-600"
            >
              <span
                className="text-xs
              font-bold text-white"
              >
                AI
              </span>
            </div>

            <span className="font-bold">
              AI
              <span className="text-indigo-600">Teacher</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2
            text-sm font-medium
            text-slate-600
            hover:bg-slate-100"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* MAIN */}

      <main
        className="mx-auto max-w-5xl
      px-5 py-10"
      >
        {/* HEADER */}

        <section>
          <p
            className="text-sm font-semibold
          text-indigo-600"
          >
            PERSONALIZED LEARNING
          </p>

          <h1
            className="mt-2 text-3xl
          font-bold"
          >
            {path?.title || "Your Learning Path"}
          </h1>

          <p
            className="mt-3 max-w-2xl
          text-slate-500"
          >
            {path?.message ||
              "A learning path created from your performance and learning history."}
          </p>
        </section>

        {/* PROGRESS */}

        <section
          className="mt-8 rounded-2xl
        border border-slate-200
        bg-white p-6"
        >
          <div
            className="flex items-center
          justify-between"
          >
            <div>
              <p
                className="text-sm
              text-slate-500"
              >
                Overall Progress
              </p>

              <p
                className="mt-1 text-2xl
              font-bold"
              >
                {path?.overallProgress || 0}%
              </p>
            </div>

            <div
              className="rounded-full
            bg-indigo-50 px-4 py-2
            text-sm font-semibold
            text-indigo-600"
            >
              {path?.currentLevel || "Beginner"}
            </div>
          </div>

          <div
            className="mt-5 h-3
          overflow-hidden rounded-full
          bg-slate-100"
          >
            <div
              className="h-full rounded-full
              bg-indigo-600 transition-all"
              style={{
                width: `${path?.overallProgress || 0}%`,
              }}
            />
          </div>
        </section>

        {/* LEARNING PATH */}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Your Path</h2>

          <div className="relative mt-6">
            {/* Vertical line */}

            <div
              className="absolute
            bottom-8 left-6 top-8
            w-px bg-slate-200"
            />

            <div className="space-y-5">
              {path?.topics?.map((topic, index) => {
                const completed = topic.status === "completed";

                const current = topic.status === "current";

                return (
                  <div
                    key={index}
                    className="relative flex
                      gap-5"
                  >
                    {/* Circle */}

                    <div
                      className={`relative z-10
                        flex h-12 w-12 shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border-4 border-slate-50
                        text-sm font-bold ${
                          completed
                            ? "bg-green-500 text-white"
                            : current
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-400"
                        }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    {/* Card */}

                    <div
                      className={`flex-1 rounded-2xl
                        border p-5 ${
                          current
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                    >
                      <div
                        className="flex
                        flex-col gap-3
                        sm:flex-row
                        sm:items-start
                        sm:justify-between"
                      >
                        <div>
                          <div
                            className="flex
                            flex-wrap items-center
                            gap-2"
                          >
                            <h3 className="font-bold">{topic.title}</h3>

                            {current && (
                              <span
                                className="rounded-full
                                bg-indigo-600 px-2.5 py-1
                                text-[10px] font-bold
                                text-white"
                              >
                                CURRENT
                              </span>
                            )}
                          </div>

                          <p
                            className="mt-2 text-sm
                            leading-6 text-slate-500"
                          >
                            {topic.description}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full
                            px-3 py-1 text-xs
                            font-semibold ${
                              topic.difficulty === "hard"
                                ? "bg-red-50 text-red-600"
                                : topic.difficulty === "medium"
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-green-50 text-green-600"
                            }`}
                        >
                          {topic.difficulty}
                        </span>
                      </div>

                      {topic.reason && (
                        <div
                          className="mt-4
                          rounded-xl bg-white/70
                          p-3"
                        >
                          <p
                            className="text-xs
                            font-semibold
                            text-slate-500"
                          >
                            Why this topic?
                          </p>

                          <p
                            className="mt-1 text-xs
                            leading-5 text-slate-500"
                          >
                            {topic.reason}
                          </p>
                        </div>
                      )}

                      {current && (
                        <Link
                          to="/learn"
                          className="mt-5 inline-block
                            rounded-lg bg-indigo-600
                            px-4 py-2.5 text-sm
                            font-semibold text-white
                            hover:bg-indigo-700"
                        >
                          Start This Lesson →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* REFRESH */}

        <div className="mt-8 text-center">
          <button
            onClick={loadLearningPath}
            className="rounded-lg border
            border-slate-200 bg-white
            px-5 py-2.5 text-sm
            font-semibold text-slate-600
            hover:bg-slate-50"
          >
            ↻ Recalculate Learning Path
          </button>
        </div>
      </main>
    </div>
  );
}

export default LearningPath;