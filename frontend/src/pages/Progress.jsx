import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "https://ai-teacher-qrj7.onrender.com/api";

function Progress() {
  const [summary, setSummary] = useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const [summaryResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/progress/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const summaryData = await summaryResponse.json();

      const historyData = await historyResponse.json();

      if (summaryData.success) {
        setSummary(summaryData.summary);
      }

      if (historyData.success) {
        setHistory(historyData.progress);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProgress();
  }, [loadProgress]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen
      items-center justify-center
      bg-slate-50"
      >
        <p className="text-slate-500">Loading progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================= NAVBAR ================= */}

      <nav
        className="border-b
      border-slate-200 bg-white"
      >
        <div
          className="mx-auto flex h-16
        max-w-7xl items-center
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
              AI<span className="text-indigo-600">Teacher</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2
            text-sm font-medium
            text-slate-600
            hover:bg-slate-100"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <main
        className="mx-auto max-w-7xl
      px-5 py-10"
      >
        <div>
          <p
            className="text-sm font-semibold
          text-indigo-600"
          >
            LEARNING ANALYTICS
          </p>

          <h1
            className="mt-2 text-3xl
          font-bold"
          >
            Your Learning Progress
          </h1>

          <p className="mt-2 text-slate-500">
            See what you've learned and where you can improve.
          </p>
        </div>

        {/* ================= STATS ================= */}

        <div
          className="mt-8 grid gap-5
        sm:grid-cols-2 lg:grid-cols-4"
        >
          <Stat
            title="Lessons Completed"
            value={summary?.completedLessons || 0}
            icon="📚"
          />

          <Stat
            title="Questions Answered"
            value={summary?.totalQuestions || 0}
            icon="❓"
          />

          <Stat
            title="Correct Answers"
            value={summary?.totalCorrect || 0}
            icon="✓"
          />

          <Stat
            title="Average Score"
            value={`${summary?.averageScore || 0}%`}
            icon="📊"
          />
        </div>

        {/* ================= RECOMMENDATION ================= */}

        <section className="mt-8">
          <div
            className="rounded-2xl
          bg-indigo-600 p-7 text-white"
          >
            <p
              className="text-sm
            font-semibold text-indigo-200"
            >
              AI RECOMMENDATION
            </p>

            <h2
              className="mt-2 text-2xl
            font-bold"
            >
              Continue your learning
            </h2>

            <p
              className="mt-3
            text-indigo-100"
            >
              {summary?.nextTopic
                ? `Based on your recent lesson, we recommend learning ${summary.nextTopic}.`
                : "Complete a lesson to receive a personalized recommendation."}
            </p>

            <Link
              to="/learn"
              className="mt-6 inline-block
              rounded-lg bg-white px-5 py-3
              text-sm font-semibold
              text-indigo-600
              hover:bg-indigo-50"
            >
              Start Next Lesson →
            </Link>
          </div>
        </section>

        {/* ================= WEAK TOPICS ================= */}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Topics to Review</h2>

          <div
            className="mt-4 rounded-2xl
          border border-slate-200
          bg-white p-6"
          >
            {summary?.weakTopics?.length ? (
              <div className="flex flex-wrap gap-3">
                {summary.weakTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full
                      bg-orange-50 px-4 py-2
                      text-sm font-medium
                      text-orange-600"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p
                className="text-sm
              text-slate-500"
              >
                No weak topics yet. Complete more lessons to receive
                personalized feedback.
              </p>
            )}
          </div>
        </section>

        {/* ================= HISTORY ================= */}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Learning History</h2>

          <div
            className="mt-4
          overflow-hidden rounded-2xl
          border border-slate-200
          bg-white"
          >
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No lessons completed yet.</p>

                <Link
                  to="/learn"
                  className="mt-4 inline-block
                  font-semibold text-indigo-600"
                >
                  Start your first lesson →
                </Link>
              </div>
            ) : (
              <div
                className="divide-y
              divide-slate-100"
              >
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col
                    gap-4 p-5 sm:flex-row
                    sm:items-center
                    sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{item.topic}</h3>

                      <p
                        className="mt-1
                      text-sm text-slate-500"
                      >
                        {item.level} · {item.language}
                      </p>
                    </div>

                    <div
                      className="flex
                    items-center gap-5"
                    >
                      <div className="text-right">
                        <p className="font-bold">{item.percentage}%</p>

                        <p
                          className="text-xs
                        text-slate-400"
                        >
                          {item.score}/{item.totalQuestions}
                        </p>
                      </div>

                      <div
                        className={`rounded-full
                        px-3 py-1 text-xs
                        font-semibold ${
                          item.percentage >= 70
                            ? "bg-green-50 text-green-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {item.percentage >= 70 ? "Good" : "Needs Review"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================= STAT ================= */

function Stat({ title, value, icon }) {
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

export default Progress;
