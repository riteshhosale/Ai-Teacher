import { useCallback, useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_SCRIPT_LENGTH = 10000;

function SceneAudio({
  script,
  language = "English",
  autoPlay = false,
}) {
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }

    setAudioUrl("");
  }, []);

  const generateAudio = useCallback(async () => {
    const trimmedScript =
      typeof script === "string"
        ? script.trim()
        : "";

    if (!trimmedScript) {
      clearAudio();
      setError("");
      setLoading(false);
      return;
    }

    if (trimmedScript.length > MAX_SCRIPT_LENGTH) {
      setError(
        `Scene script must be ${MAX_SCRIPT_LENGTH} characters or less.`
      );
      clearAudio();
      return;
    }

    const requestId = ++requestIdRef.current;

    // Cancel previous request.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError("");

      clearAudio();

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/speech/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: trimmedScript,
            language:
              typeof language === "string" &&
              language.trim()
                ? language.trim()
                : "English",
          }),
          signal: controller.signal,
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!response.ok) {
        let message =
          "Failed to generate teacher voice.";

        if (contentType.includes("application/json")) {
          try {
            const data = await response.json();

            message =
              data?.message ||
              data?.error ||
              message;
          } catch {
            // Ignore malformed JSON.
          }
        } else {
          try {
            const textResponse =
              await response.text();

            if (textResponse.trim()) {
              message = textResponse.trim();
            }
          } catch {
            // Ignore response parsing failure.
          }
        }

        throw new Error(message);
      }

      // A successful speech endpoint should return audio.
      if (
        contentType &&
        !contentType.toLowerCase().startsWith("audio/")
      ) {
        throw new Error(
          "Speech service returned an unexpected response."
        );
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error(
          "The speech service returned an empty audio file."
        );
      }

      // Ignore stale requests.
      if (
        requestId !== requestIdRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      const url = URL.createObjectURL(blob);

      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      if (
        requestId !== requestIdRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      console.error(
        "Scene audio generation error:",
        err
      );

      clearAudio();

      setError(
        err?.message ||
          "Unable to generate teacher voice."
      );
    } finally {
      if (
        requestId === requestIdRef.current &&
        mountedRef.current
      ) {
        setLoading(false);
      }

      if (
        abortControllerRef.current === controller
      ) {
        abortControllerRef.current = null;
      }
    }
  }, [script, language, clearAudio]);

  // Generate audio whenever the scene script/language changes.
  useEffect(() => {
    mountedRef.current = true;

    generateAudio();

    return () => {
      requestIdRef.current += 1;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [generateAudio]);

  // Autoplay generated audio when requested.
  useEffect(() => {
    if (
      !autoPlay ||
      !audioUrl ||
      !audioRef.current
    ) {
      return;
    }

    const audio = audioRef.current;

    audio.play().catch(() => {
      // Browser autoplay restrictions are expected.
      console.info(
        "Browser blocked automatic audio playback."
      );
    });
  }, [audioUrl, autoPlay]);

  // Final unmount cleanup.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute("src");
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
      }
    };
  }, []);

  if (
    typeof script !== "string" ||
    !script.trim()
  ) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">
            Generating teacher voice
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {language || "English"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-4"
        role="alert"
      >
        <p className="text-sm font-medium text-slate-800">
          Teacher voice unavailable
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={generateAudio}
          className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">
          Teacher voice
        </span>

        <span className="text-xs text-slate-400">
          {language || "English"}
        </span>
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        className="w-full"
        src={audioUrl}
      >
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

export default SceneAudio;