import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TeachingScene from "../components/TeachingScene";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function TeachingVideo() {
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Lesson ID is missing.");
      setLoading(false);
      return;
    }

    generateScenes();
  }, [id]);

  const generateScenes = async () => {
    try {
      setLoading(true);
      setGenerating(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(`${API_URL}/video/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate teaching video");
      }

      if (
        !data.videoPlan ||
        !Array.isArray(data.videoPlan.scenes) ||
        data.videoPlan.scenes.length === 0
      ) {
        throw new Error("No teaching scenes were generated.");
      }

      setPlan(data.videoPlan);
      setCurrentScene(0);
    } catch (err) {
      console.error("Teaching video error:", err);

      setError(err.message || "Unable to generate teaching video.");

      setPlan(null);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  if (loading || generating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full
            border-4 border-slate-200 border-t-indigo-600"
          />

          <p className="mt-4 font-semibold text-slate-900">
            Creating your AI teaching video...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Planning scenes and educational visuals
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="text-5xl">🎬</div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Unable to generate teaching video
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Something went wrong."}
          </p>

          <button
            type="button"
            onClick={generateScenes}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];

  if (scenes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">No teaching scenes available.</p>

          <button
            type="button"
            onClick={generateScenes}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Generate Again
          </button>
        </div>
      </div>
    );
  }

  const scene = scenes[Math.min(currentScene, scenes.length - 1)];

  const progress = ((currentScene + 1) / scenes.length) * 100;

  const previousScene = () => {
    if (currentScene > 0) {
      setCurrentScene((value) => value - 1);
    }
  };

  const nextScene = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene((value) => value + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/dashboard" className="font-bold text-slate-900">
            AI
            <span className="text-indigo-600">Teacher</span>
          </Link>

          <Link
            to={`/lesson/${id}`}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            ← Back to Lesson
          </Link>
        </div>
      </nav>

      {/* MAIN */}

      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            AI TEACHING VIDEO
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {plan.title || "AI Teaching Video"}
          </h1>

          <p className="mt-2 text-slate-500">
            {plan.description || "Learn through AI-generated teaching scenes."}
          </p>
        </div>

        {/* PROGRESS */}

        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Teaching progress</span>

            <span>{Math.round(progress)}%</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* CURRENT SCENE */}

        <TeachingScene scene={scene} language={plan.language || "English"} />

        {/* CONTROLS */}

        <div className="mt-5 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentScene === 0}
            onClick={previousScene}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-sm text-slate-500">
            Scene {currentScene + 1} / {scenes.length}
          </span>

          {currentScene < scenes.length - 1 ? (
            <button
              type="button"
              onClick={nextScene}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Next →
            </button>
          ) : (
            <Link
              to={`/lesson/${id}`}
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Take Assessment →
            </Link>
          )}
        </div>

        {/* SCENE TIMELINE */}

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Video Scenes
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {scenes.map((item, index) => (
              <button
                key={item.sceneNumber || index}
                type="button"
                onClick={() => setCurrentScene(index)}
                className={`rounded-xl border p-4 text-left transition ${
                  index === currentScene
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      index === currentScene
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title || `Scene ${index + 1}`}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.duration || 20}s · {item.visualType || "text"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeachingVideo;
