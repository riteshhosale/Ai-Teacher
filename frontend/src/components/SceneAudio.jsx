import { useCallback, useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

function SceneAudio({
  script,
  language = "English",
  autoPlay = false,
}) {
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const requestIdRef = useRef(0);

  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateAudio = useCallback(async () => {
    if (!script?.trim()) {
      setAudioUrl("");
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      // Remove previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
      }

      setAudioUrl("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${API_URL}/speech/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: script.trim(),
          language: language || "English",
        }),
      });

      if (!response.ok) {
        let message = "Failed to generate teacher voice.";

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          } else if (data?.error) {
            message = data.error;
          }
        } catch {
          // Response was not JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The speech service returned an empty audio file.");
      }

      // Ignore an old request if scene/language changed
      if (requestId !== requestIdRef.current) {
        return;
      }

      const url = URL.createObjectURL(blob);

      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Scene audio generation error:", err);

      setAudioUrl("");
      setError(
        err?.message || "Unable to generate teacher voice."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [script, language]);

  useEffect(() => {
    if (!script?.trim()) {
      return;
    }

    generateAudio();

    return () => {
      requestIdRef.current += 1;
    };
  }, [generateAudio, script]);

  useEffect(() => {
    if (
      autoPlay &&
      audioUrl &&
      audioRef.current
    ) {
      audioRef.current.play().catch(() => {
        console.log("Browser blocked autoplay.");
      });
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
      }
    };
  }, []);

  if (!script?.trim()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

        <div>
          <p className="font-medium">
            Generating teacher voice...
          </p>

          <p className="text-xs text-slate-400">
            Language: {language || "English"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-medium text-red-700">
          Teacher voice unavailable
        </p>

        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={generateAudio}
          className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="w-full rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          AI Teacher Voice
        </span>

        <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
          {language || "English"}
        </span>
      </div>

      <audio
        ref={audioRef}
        controls
        preload="auto"
        className="w-full"
        src={audioUrl}
      />
    </div>
  );
}

export default SceneAudio;