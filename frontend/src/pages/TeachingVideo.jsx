import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import TeachingScene from "../components/TeachingScene";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const POLL_DELAY = 5000;

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message:
      text || `Request failed with status ${response.status}`,
  };
};

const normalizeScenes = (scenes) => {
  if (!Array.isArray(scenes)) {
    return [];
  }

  return scenes
    .filter((scene) => scene && typeof scene === "object")
    .map((scene, index) => ({
      ...scene,
      sceneNumber:
        Number.isFinite(Number(scene.sceneNumber))
          ? Number(scene.sceneNumber)
          : index + 1,

      title:
        typeof scene.title === "string" && scene.title.trim()
          ? scene.title.trim()
          : `Scene ${index + 1}`,

      duration:
        Number.isFinite(Number(scene.duration)) &&
        Number(scene.duration) > 0
          ? Number(scene.duration)
          : 20,

      visualType:
        typeof scene.visualType === "string" &&
        scene.visualType.trim()
          ? scene.visualType.trim()
          : "text",

      script:
        typeof scene.script === "string"
          ? scene.script
          : "",

      onScreenText:
        typeof scene.onScreenText === "string"
          ? scene.onScreenText
          : "",
    }));
};

const normalizePlan = (videoPlan) => {
  if (!videoPlan || typeof videoPlan !== "object") {
    return null;
  }

  const scenes = normalizeScenes(videoPlan.scenes);

  if (scenes.length === 0) {
    return null;
  }

  return {
    ...videoPlan,

    title:
      typeof videoPlan.title === "string" &&
      videoPlan.title.trim()
        ? videoPlan.title.trim()
        : "AI Teaching Video",

    description:
      typeof videoPlan.description === "string"
        ? videoPlan.description
        : "",

    language:
      typeof videoPlan.language === "string" &&
      videoPlan.language.trim()
        ? videoPlan.language
        : "English",

    scenes,
  };
};

const normalizeVideo = (video) => {
  if (!video || typeof video !== "object") {
    return null;
  }

  return {
    ...video,

    _id:
      typeof video._id === "string"
        ? video._id
        : null,

    status:
      typeof video.status === "string"
        ? video.status.toLowerCase()
        : "unknown",

    videoUrl:
      typeof video.videoUrl === "string" &&
      video.videoUrl.trim()
        ? video.videoUrl
        : "",

    error:
      typeof video.error === "string"
        ? video.error
        : "",
  };
};

function TeachingVideo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const [avatarVideo, setAvatarVideo] = useState(null);
  const [avatarError, setAvatarError] = useState("");

  const pollTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const generationRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }, [navigate]);

  const pollVideoStatus = useCallback(
    async (videoId, signal) => {
      if (!videoId || signal?.aborted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response = await fetch(
          `${API_URL}/video/status/${encodeURIComponent(videoId)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        const data = await parseResponse(response);

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to check video status."
          );
        }

        const video = normalizeVideo(data?.video);

        if (!video) {
          throw new Error("Video status not found.");
        }

        if (!mountedRef.current || signal?.aborted) {
          return;
        }

        setAvatarVideo(video);

        if (video.status === "completed") {
          stopPolling();
          setAvatarError("");
          return;
        }

        if (video.status === "failed") {
          stopPolling();

          setAvatarError(
            video.error ||
              "Avatar video generation failed."
          );

          return;
        }

        // Continue polling only after the previous request
        // has finished.
        pollTimeoutRef.current = setTimeout(() => {
          void pollVideoStatus(videoId, signal);
        }, POLL_DELAY);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Video polling error:", err);

        if (mountedRef.current) {
          setAvatarError(
            err instanceof Error
              ? err.message
              : "Unable to check avatar video status."
          );
        }
      }
    },
    [handleUnauthorized, stopPolling]
  );

  const generateScenes = useCallback(async () => {
    if (generationRef.current) {
      return;
    }

    if (!id) {
      setError("Lesson ID is missing.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      handleUnauthorized();
      return;
    }

    const controller = new AbortController();

    generationRef.current = true;

    try {
      setGenerating(true);
      setLoading(true);
      setError("");
      setAvatarError("");

      stopPolling();

      const response = await fetch(`${API_URL}/video/generate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: id,
        }),
        signal: controller.signal,
      });

      const data = await parseResponse(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to generate teaching video."
        );
      }

      const normalizedPlan = normalizePlan(data?.videoPlan);

      if (!normalizedPlan) {
        throw new Error(
          "No valid teaching scenes were generated."
        );
      }

      if (!mountedRef.current) {
        return;
      }

      setPlan(normalizedPlan);
      setCurrentScene(0);

      const video = normalizeVideo(data?.video);

      if (video) {
        setAvatarVideo(video);

        if (
          video.status === "processing" &&
          video._id
        ) {
          void pollVideoStatus(
            video._id,
            controller.signal
          );
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Teaching video error:", err);

      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to generate teaching video."
        );

        setPlan(null);
      }
    } finally {
      generationRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setGenerating(false);
      }
    }

    return () => {
      controller.abort();
    };
  }, [
    handleUnauthorized,
    id,
    pollVideoStatus,
    stopPolling,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    let cleanupRequest;

    const start = async () => {
      cleanupRequest = await generateScenes();
    };

    void start();

    return () => {
      mountedRef.current = false;
      stopPolling();

      if (typeof cleanupRequest === "function") {
        cleanupRequest();
      }
    };
  }, [generateScenes, stopPolling]);

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Unable to generate teaching video
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Lesson ID is missing.
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading || generating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
            aria-hidden="true"
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
          <h2 className="text-xl font-bold text-slate-900">
            Unable to generate teaching video
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Something went wrong."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void generateScenes()}
              disabled={generating}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "Trying..." : "Try Again"}
            </button>

            <Link
              to={`/lesson/${id}`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scenes = Array.isArray(plan.scenes)
    ? plan.scenes
    : [];

  if (scenes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">
            No teaching scenes available.
          </p>

          <button
            type="button"
            onClick={() => void generateScenes()}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Generate Again
          </button>
        </div>
      </div>
    );
  }

  const safeSceneIndex = Math.min(
    Math.max(currentScene, 0),
    scenes.length - 1
  );

  const scene = scenes[safeSceneIndex];

  const progress =
    ((safeSceneIndex + 1) / scenes.length) * 100;

  const handleNext = () => {
    if (safeSceneIndex < scenes.length - 1) {
      setCurrentScene((value) => value + 1);
    }
  };

  const handlePrevious = () => {
    if (safeSceneIndex > 0) {
      setCurrentScene((value) => value - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="font-bold text-slate-900"
          >
            AI<span className="text-indigo-600">Teacher</span>
          </Link>

          <Link
            to={`/lesson/${id}`}
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
          >
            ← Back to Lesson
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* HEADER */}

        <header className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            AI TEACHING VIDEO
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {plan.title}
          </h1>

          <p className="mt-2 text-slate-500">
            {plan.description ||
              "Learn this topic through AI-generated educational scenes."}
          </p>
        </header>

        {/* AVATAR PROCESSING */}

        {avatarVideo?.status === "processing" && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div
                className="h-8 w-8 shrink-0 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
                aria-hidden="true"
              />

              <div>
                <h2 className="font-semibold text-slate-900">
                  AI Teacher video is generating
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your AI teacher is preparing the lesson.
                  This may take a few minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AVATAR ERROR */}

        {avatarError && (
          <div
            role="alert"
            className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm font-medium text-red-700">
              {avatarError}
            </p>
          </div>
        )}

        {/* COMPLETED VIDEO */}

        {avatarVideo?.status === "completed" &&
          avatarVideo?.videoUrl && (
            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">
                  AI Teacher Video
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Watch the complete AI-generated lesson.
                </p>
              </div>

              <div className="bg-black">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full"
                  src={avatarVideo.videoUrl}
                >
                  Your browser does not support video
                  playback.
                </video>
              </div>
            </section>
          )}

        {/* SCENE PROGRESS */}

        <section aria-label="Teaching progress" className="mb-6">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Teaching progress</span>

            <span>{Math.round(progress)}%</span>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* CURRENT SCENE */}

        <TeachingScene
          scene={scene}
          language={plan.language || "English"}
        />

        {/* CONTROLS */}

        <div className="mt-5 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={safeSceneIndex === 0}
            onClick={handlePrevious}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-sm text-slate-500">
            Scene {safeSceneIndex + 1} / {scenes.length}
          </span>

          {safeSceneIndex < scenes.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Next →
            </button>
          ) : (
            <Link
              to={`/lesson/${id}`}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Take Assessment →
            </Link>
          )}
        </div>

        {/* SCENE TIMELINE */}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Video Scenes
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {scenes.map((item, index) => (
              <button
                key={`${item.sceneNumber || "scene"}-${index}`}
                type="button"
                onClick={() => setCurrentScene(index)}
                aria-current={
                  index === safeSceneIndex
                    ? "step"
                    : undefined
                }
                className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                  index === safeSceneIndex
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      index === safeSceneIndex
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.duration}s · {item.visualType}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default TeachingVideo;