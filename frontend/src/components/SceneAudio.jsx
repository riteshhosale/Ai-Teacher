import { useCallback, useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://ai-teacher-qrj7.onrender.com/api";

function SceneAudio({ script, language, autoPlay = false }) {
  const audioRef = useRef(null);
  const latestAudioUrlRef = useRef("");

  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateAudio = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/speech/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: script,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (latestAudioUrlRef.current) {
        URL.revokeObjectURL(latestAudioUrlRef.current);
      }

      latestAudioUrlRef.current = url;
      setAudioUrl(url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [language, script]);

  useEffect(() => {
    if (!script) {
      return undefined;
    }

    let isCancelled = false;

    const run = async () => {
      if (isCancelled) {
        return;
      }

      await generateAudio();
    };

    void run();

    return () => {
      isCancelled = true;

      if (latestAudioUrlRef.current) {
        URL.revokeObjectURL(latestAudioUrlRef.current);
        latestAudioUrlRef.current = "";
      }
    };
  }, [generateAudio, script]);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => {
        console.log("Browser blocked autoplay");
      });
    }
  }, [audioUrl, autoPlay]);

  if (loading) {
    return (
      <div
        className="flex items-center gap-3
      text-sm text-slate-500"
      >
        <div
          className="h-5 w-5 animate-spin
        rounded-full border-2
        border-slate-200
        border-t-indigo-600"
        />
        Generating teacher voice...
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return <audio ref={audioRef} controls className="w-full" src={audioUrl} />;
}

export default SceneAudio;
