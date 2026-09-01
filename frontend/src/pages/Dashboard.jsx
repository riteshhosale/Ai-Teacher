import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      // =================================================
      // CHECK LOGIN
      // =================================================

      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // =================================================
      // LOAD ALL DATA
      // =================================================

      const [summaryResponse, lessonsResponse, documentsResponse] =
        await Promise.all([
          fetch(`${API_URL}/progress/summary`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/lessons`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/documents`, {
            method: "GET",
            headers,
          }),
        ]);

      // =================================================
      // HANDLE AUTH ERROR
      // =================================================

      if (
        summaryResponse.status === 401 ||
        lessonsResponse.status === 401 ||
        documentsResponse.status === 401
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      // =================================================
      // READ RESPONSES
      // =================================================

      const summaryData = await summaryResponse.json();

      const lessonsData = await lessonsResponse.json();

      const documentsData = await documentsResponse.json();

      // =================================================
      // SUMMARY
      // =================================================

      if (summaryData.success) {
        setSummary(summaryData.summary || {});
      }

      // =================================================
      // LESSONS
      // =================================================

      if (lessonsData.success) {
        setLessons(
          Array.isArray(lessonsData.lessons) ? lessonsData.lessons : [],
        );
      }

      // =================================================
      // DOCUMENTS
      // =================================================

      if (documentsData.success) {
        setDocuments(
          Array.isArray(documentsData.documents) ? documentsData.documents : [],
        );
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");

    navigate("/login");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="flex min-h-screen
        items-center justify-center
        bg-slate-50"
      >
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10
            animate-spin rounded-full
            border-4 border-slate-200
            border-t-indigo-600"
          />

          <p
            className="mt-4 text-sm
            text-slate-500"
          >
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav
        className="border-b
        border-slate-200 bg-white"
      >
        <div
          className="mx-auto flex h-16
          max-w-7xl items-center
          justify-between px-5"
        >
          {/* LOGO */}

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

          {/* NAVIGATION */}

          <div className="flex items-center gap-2">
            <Link
              to="/progress"
              className="hidden rounded-lg
              px-4 py-2 text-sm
              font-medium text-slate-600
              hover:bg-slate-100 sm:block"
            >
              Progress
            </Link>

            <Link
              to="/learning-path"
              className="hidden rounded-lg
              px-4 py-2 text-sm
              font-medium text-slate-600
              hover:bg-slate-100 sm:block"
            >
              Learning Path
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg
              px-4 py-2 text-sm
              font-medium text-slate-600
              hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main
        className="mx-auto max-w-7xl
        px-5 py-10"
      >
        {/* =================================================
            WELCOME
        ================================================= */}

        <section>
          <p
            className="text-sm font-semibold
            text-indigo-600"
          >
            YOUR LEARNING SPACE
          </p>

          <h1
            className="mt-2 text-3xl
            font-bold"
          >
            Welcome back
          </h1>

          <p className="mt-2 text-slate-500">
            Continue learning with your personalized AI Teacher.
          </p>
        </section>

        {/* =================================================
            ACTION CARDS
        ================================================= */}

        <section
          className="mt-8 grid gap-5
          md:grid-cols-3"
        >
          {/* START LEARNING */}

          <Link
            to="/learn"
            className="group rounded-2xl
            bg-indigo-600 p-7 text-white
            transition hover:bg-indigo-700"
          >
            <div
              className="flex items-start
              justify-between"
            >
              <div>
                <div
                  className="flex h-11 w-11
                  items-center justify-center
                  rounded-xl bg-white/10
                  text-xl"
                >
                  🧠
                </div>

                <h2
                  className="mt-5 text-2xl
                  font-bold"
                >
                  Start Learning
                </h2>

                <p
                  className="mt-2 max-w-md
                  text-sm leading-6
                  text-indigo-100"
                >
                  Choose a topic and let your AI Teacher create a personalized
                  lesson.
                </p>
              </div>

              <span
                className="text-2xl
                transition
                group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </Link>

          {/* UPLOAD */}

          <Link
            to="/upload"
            className="group rounded-2xl
            border border-slate-200
            bg-white p-7 transition
            hover:border-indigo-300
            hover:shadow-sm"
          >
            <div
              className="flex items-start
              justify-between"
            >
              <div>
                <div
                  className="flex h-11 w-11
                  items-center justify-center
                  rounded-xl bg-indigo-50
                  text-xl"
                >
                  📄
                </div>

                <h2
                  className="mt-5 text-2xl
                  font-bold"
                >
                  Upload Material
                </h2>

                <p
                  className="mt-2 max-w-md
                  text-sm leading-6
                  text-slate-500"
                >
                  Upload your notes or textbook and learn directly from your own
                  study material.
                </p>
              </div>

              <span
                className="text-2xl
                text-slate-400 transition
                group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </Link>

          {/* LEARNING PATH */}

          <Link
            to="/learning-path"
            className="group rounded-2xl
            border border-slate-200
            bg-white p-7 transition
            hover:border-indigo-300
            hover:shadow-sm"
          >
            <div
              className="flex items-start
              justify-between"
            >
              <div>
                <div
                  className="flex h-11 w-11
                  items-center justify-center
                  rounded-xl bg-indigo-50
                  text-xl"
                >
                  🧭
                </div>

                <h2
                  className="mt-5 text-2xl
                  font-bold"
                >
                  Learning Path
                </h2>

                <p
                  className="mt-2 max-w-md
                  text-sm leading-6
                  text-slate-500"
                >
                  See your personalized journey and what you should learn next.
                </p>
              </div>

              <span
                className="text-2xl
                text-slate-400 transition
                group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </Link>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section
          className="mt-8 grid gap-5
          sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Lessons"
            value={summary?.completedLessons || 0}
            icon="📚"
          />

          <StatCard
            title="Questions"
            value={summary?.totalQuestions || 0}
            icon="❓"
          />

          <StatCard
            title="Average Score"
            value={`${summary?.averageScore || 0}%`}
            icon="📊"
          />

          <StatCard
            title="Study Materials"
            value={documents.length}
            icon="📄"
          />
        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <section
          className="mt-8 grid gap-6
          lg:grid-cols-3"
        >
          {/* =================================================
              RECENT LESSONS
          ================================================= */}

          <div
            className="rounded-2xl
            border border-slate-200
            bg-white lg:col-span-2"
          >
            <div
              className="flex items-center
              justify-between border-b
              border-slate-100 p-6"
            >
              <div>
                <h2 className="font-bold">Recent Lessons</h2>

                <p
                  className="mt-1 text-xs
                  text-slate-500"
                >
                  Your latest learning activity
                </p>
              </div>

              <Link
                to="/progress"
                className="text-sm
                font-semibold text-indigo-600"
              >
                View all
              </Link>
            </div>

            {lessons.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl">📚</div>

                <p
                  className="mt-3
                  font-semibold"
                >
                  No lessons yet
                </p>

                <p
                  className="mt-1 text-sm
                  text-slate-500"
                >
                  Start your first AI lesson.
                </p>

                <Link
                  to="/learn"
                  className="mt-4
                  inline-block rounded-lg
                  bg-indigo-600 px-4 py-2
                  text-sm font-semibold
                  text-white"
                >
                  Start Learning
                </Link>
              </div>
            ) : (
              <div
                className="divide-y
                divide-slate-100"
              >
                {lessons.slice(0, 5).map((lesson) => {
                  const totalQuestions = lesson.questions?.length || 0;

                  const score = Number(lesson.score) || 0;

                  const percentage =
                    totalQuestions > 0
                      ? Math.round((score / totalQuestions) * 100)
                      : 0;

                  return (
                    <Link
                      key={lesson._id}
                      to={`/lesson/${lesson._id}`}
                      className="flex
                        items-center
                        justify-between p-5
                        transition
                        hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <h3
                          className="truncate
                            font-semibold"
                        >
                          {lesson.topic}
                        </h3>

                        <p
                          className="mt-1
                            text-xs
                            text-slate-500"
                        >
                          {lesson.level}
                          {" · "}
                          {lesson.language}
                        </p>
                      </div>

                      <div
                        className="ml-4
                          flex items-center
                          gap-4"
                      >
                        <div className="text-right">
                          <p className="font-bold">{percentage}%</p>

                          <p
                            className="text-xs
                              text-slate-400"
                          >
                            Score
                          </p>
                        </div>

                        <span className="text-slate-400">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================
              AI RECOMMENDATION
          ================================================= */}

          <div
            className="rounded-2xl
            border border-slate-200
            bg-white p-6"
          >
            <div
              className="flex h-10 w-10
              items-center justify-center
              rounded-xl bg-indigo-50"
            >
              🎯
            </div>

            <p
              className="mt-5 text-xs
              font-semibold text-indigo-600"
            >
              AI RECOMMENDATION
            </p>

            <h2
              className="mt-2 text-xl
              font-bold"
            >
              Keep learning
            </h2>

            <p
              className="mt-3 text-sm
              leading-6 text-slate-500"
            >
              {summary?.nextTopic
                ? `Your next recommended topic is ${summary.nextTopic}.`
                : "Complete a lesson to receive a personalized recommendation."}
            </p>

            {summary?.weakTopics?.length > 0 && (
              <div className="mt-5">
                <p
                  className="text-xs
                  font-semibold
                  text-slate-500"
                >
                  Topics to review
                </p>

                <div
                  className="mt-3 flex
                  flex-wrap gap-2"
                >
                  {summary.weakTopics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full
                        bg-orange-50 px-3 py-1
                        text-xs font-medium
                        text-orange-600"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              to="/learn"
              className="mt-6 block
              rounded-xl bg-indigo-600
              px-4 py-3 text-center
              text-sm font-semibold
              text-white hover:bg-indigo-700"
            >
              Continue Learning →
            </Link>
          </div>
        </section>

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        <section
          className="mt-8 rounded-2xl
          border border-slate-200
          bg-white"
        >
          <div
            className="flex items-center
            justify-between border-b
            border-slate-100 p-6"
          >
            <div>
              <h2 className="font-bold">Your Study Materials</h2>

              <p
                className="mt-1 text-xs
                text-slate-500"
              >
                Documents available to your AI Teacher
              </p>
            </div>

            <Link
              to="/upload"
              className="rounded-lg
              bg-indigo-50 px-4 py-2
              text-sm font-semibold
              text-indigo-600"
            >
              + Upload
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <p
                className="text-sm
                text-slate-500"
              >
                No study materials uploaded.
              </p>

              <Link
                to="/upload"
                className="mt-3
                inline-block text-sm
                font-semibold
                text-indigo-600"
              >
                Upload your first PDF →
              </Link>
            </div>
          ) : (
            <div
              className="grid gap-4 p-5
              sm:grid-cols-2 lg:grid-cols-3"
            >
              {documents.slice(0, 6).map((document) => (
                <div
                  key={document._id}
                  className="rounded-xl
                    border border-slate-200
                    p-4"
                >
                  <div
                    className="flex
                      items-start gap-3"
                  >
                    <div
                      className="flex h-10
                        w-10 shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-red-50"
                    >
                      📄
                    </div>

                    <div className="min-w-0">
                      <p
                        className="truncate
                          text-sm font-semibold"
                      >
                        {document.originalName}
                      </p>

                      <p
                        className="mt-1 text-xs
                          text-slate-500"
                      >
                        {document.pages || 0}
                        {" pages · "}
                        {document.totalChunks || 0}
                        {" chunks"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ title, value, icon }) {
  return (
    <div
      className="rounded-2xl
      border border-slate-200
      bg-white p-6"
    >
      <div
        className="flex items-center
        justify-between"
      >
        <p
          className="text-sm
          text-slate-500"
        >
          {title}
        </p>

        <span className="text-xl">{icon}</span>
      </div>

      <p
        className="mt-3 text-3xl
        font-bold"
      >
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
