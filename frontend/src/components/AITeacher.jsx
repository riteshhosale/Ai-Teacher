import { useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_TEXT_LENGTH = 10000;

function AITeacher({
  text,
  language = "English",
}) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  const audioUrlRef = useRef("");

  const getLanguageCode = () => {
    const selectedLanguage = String(language)
      .toLowerCase();

    if (selectedLanguage.includes("marathi")) {
      return "mr-IN";
    }

    if (
      selectedLanguage.includes("hindi") ||
      selectedLanguage.includes("hinglish")
    ) {
      return "hi-IN";
    }

    return "en-US";
  };

  const stopAudio = () => {
    const currentAudio = audioRef.current;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;

      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;

      currentAudio.removeAttribute("src");
      currentAudio.load();

      audioRef.current = null;
    }

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  };

  const playAudio = async (url) => {
    if (!url) {
      return;
    }

    stopAudio();

    const newAudio = new Audio(url);

    audioRef.current = newAudio;

    newAudio.onplay = () => {
      if (audioRef.current === newAudio) {
        setSpeaking(true);
      }
    };

    newAudio.onended = () => {
      if (audioRef.current === newAudio) {
        setSpeaking(false);
        audioRef.current = null;
      }
    };

    newAudio.onerror = () => {
      if (audioRef.current === newAudio) {
        console.error(
          "AI voice playback failed"
        );

        setSpeaking(false);
        audioRef.current = null;
        setError(
          "Unable to play the generated voice."
        );
      }
    };

    try {
      await newAudio.play();
    } catch (playError) {
      if (audioRef.current === newAudio) {
        console.error(
          "Audio playback error:",
          playError
        );

        setSpeaking(false);
        audioRef.current = null;

        setError(
          "Audio playback was blocked. Use the audio controls to play it."
        );
      }
    }
  };

  const generateVoice = async () => {
    if (loading) {
      return;
    }

    const trimmedText =
      typeof text === "string"
        ? text.trim()
        : "";

    if (!trimmedText) {
      setError(
        "There is no lesson text to speak."
      );
      return;
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      setError(
        `Lesson text is too long for voice generation. Maximum ${MAX_TEXT_LENGTH} characters.`
      );
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      stopAudio();

      abortControllerRef.current?.abort();

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      const response = await fetch(
        `${API_URL}/speech/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            text: trimmedText,
            language,
          }),

          signal: controller.signal,
        }
      );

      if (!response.ok) {
        let message =
          "Speech generation failed.";

        try {
          const data =
            await response.json();

          if (
            typeof data?.message ===
              "string" &&
            data.message.trim()
          ) {
            message = data.message;
          }
        } catch {
          // Non-JSON response.
        }

        throw new Error(message);
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType &&
        !contentType.toLowerCase().startsWith(
          "audio/"
        )
      ) {
        throw new Error(
          "Server returned an invalid audio response."
        );
      }

      const blob =
        await response.blob();

      if (!blob.size) {
        throw new Error(
          "AI returned empty audio."
        );
      }

      const newUrl =
        URL.createObjectURL(blob);

      const previousUrl =
        audioUrlRef.current;

      if (previousUrl) {
        URL.revokeObjectURL(
          previousUrl
        );
      }

      audioUrlRef.current = newUrl;

      setAudioUrl(newUrl);

      await playAudio(newUrl);
    } catch (requestError) {
      if (
        requestError?.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(
        "AI voice generation error:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to generate AI voice."
      );
    } finally {
      setLoading(false);
    }
  };

  const speakWithBrowser = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setError(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    const trimmedText =
      typeof text === "string"
        ? text.trim()
        : "";

    if (!trimmedText) {
      setError(
        "There is no lesson text to speak."
      );
      return;
    }

    setError("");
    stopAudio();

    const speech =
      new SpeechSynthesisUtterance(
        trimmedText
      );

    speech.lang =
      getLanguageCode();

    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onstart = () => {
      setSpeaking(true);
    };

    speech.onend = () => {
      setSpeaking(false);
    };

    speech.onerror = () => {
      setSpeaking(false);

      setError(
        "Browser voice playback failed."
      );
    };

    window.speechSynthesis.speak(
      speech
    );
  };

  const handleVoice = () => {
    if (speaking) {
      stopAudio();
      return;
    }

    if (audioUrl) {
      playAudio(audioUrl);
      return;
    }

    generateVoice();
  };

  const clearAudio = () => {
    stopAudio();

    const currentUrl =
      audioUrlRef.current;

    if (currentUrl) {
      URL.revokeObjectURL(
        currentUrl
      );
    }

    audioUrlRef.current = "";
    setAudioUrl("");
    setError("");
  };

  /*
   * Clear generated voice whenever
   * the lesson text changes.
   */
  useEffect(() => {
    clearAudio();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  /*
   * Cleanup when component unmounts.
   */
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();

      const currentAudio =
        audioRef.current;

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute(
          "src"
        );
        currentAudio.load();

        audioRef.current = null;
      }

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      const currentUrl =
        audioUrlRef.current;

      if (currentUrl) {
        URL.revokeObjectURL(
          currentUrl
        );

        audioUrlRef.current = "";
      }
    };
  }, []);

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Teacher */}
      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[320px]">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border ${
            speaking
              ? "border-slate-900"
              : "border-slate-200"
          } bg-slate-50 transition`}
          aria-hidden="true"
        >
          <span className="text-3xl">
            👨‍🏫
          </span>
        </div>

        <h2 className="mt-5 text-lg font-semibold text-slate-900">
          AI Teacher
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {loading
            ? "Generating voice..."
            : speaking
              ? "Speaking"
              : "Ready to teach"}
        </p>

        {/* Main control */}
        <button
          type="button"
          onClick={handleVoice}
          disabled={loading}
          aria-label={
            speaking
              ? "Stop AI teacher"
              : audioUrl
                ? "Play AI teacher voice"
                : "Generate AI teacher voice"
          }
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : speaking
              ? "Stop"
              : audioUrl
                ? "Play voice"
                : "Generate voice"}
        </button>

        {error && (
          <p
            role="alert"
            className="mt-4 max-w-md text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>

      {/* Generated audio */}
      {audioUrl && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Generated voice
            </p>

            <button
              type="button"
              onClick={clearAudio}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-900"
            >
              Clear
            </button>
          </div>

          <audio
            className="w-full"
            controls
            src={audioUrl}
            preload="metadata"
          />
        </div>
      )}

      {/* Browser fallback */}
      <div className="border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={speakWithBrowser}
          disabled={loading}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use browser voice instead
        </button>
      </div>
    </section>
  );
}

export default AITeacher;