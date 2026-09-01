import { useEffect, useState } from "react";
import PropTypes from "prop-types";

function AITeacher({
  text,
  language = "English",
}) {
  const [speaking, setSpeaking] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [audioUrl, setAudioUrl] =
    useState("");

  const [audio, setAudio] =
    useState(null);

  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  // =====================================================
  // LANGUAGE
  // =====================================================

  const getLanguageCode = () => {
    const selectedLanguage =
      String(language).toLowerCase();

    if (
      selectedLanguage.includes(
        "hindi"
      )
    ) {
      return "hi-IN";
    }

    if (
      selectedLanguage.includes(
        "marathi"
      )
    ) {
      return "mr-IN";
    }

    if (
      selectedLanguage.includes(
        "hinglish"
      )
    ) {
      return "hi-IN";
    }

    return "en-US";
  };

  // =====================================================
  // SETUP AUDIO HANDLERS
  // =====================================================

  const setupAudioHandlers = (audioElement) => {
    audioElement.onplay = () => {
      setSpeaking(true);
    };

    audioElement.onended = () => {
      setSpeaking(false);
    };

    audioElement.onerror = () => {
      console.error(
        "Gemini audio playback failed"
      );

      setSpeaking(false);
    };
  };

  // =====================================================
  // STOP AUDIO
  // =====================================================

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  };

  // =====================================================
  // PLAY GEMINI AUDIO
  // =====================================================

  const playGeminiAudio = async () => {
    if (!audioUrl) {
      return;
    }

    try {
      stopAudio();

      const newAudio =
        new Audio(audioUrl);

      setAudio(newAudio);

      setupAudioHandlers(newAudio);

      await newAudio.play();

    } catch (error) {
      console.error(
        "Audio playback error:",
        error
      );

      setSpeaking(false);
    }
  };

  // =====================================================
  // GENERATE GEMINI VOICE
  // =====================================================

  const generateVoice = async () => {
    try {
      if (!text?.trim()) {
        alert(
          "There is no lesson text to speak."
        );

        return;
      }

      setLoading(true);

      stopAudio();

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        alert(
          "Please login first."
        );

        return;
      }

      console.log(
        "Generating Gemini AI voice..."
      );

      const response =
        await fetch(
          `${API_URL}/speech/generate`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              text,
              language,
            }),
          }
        );

      if (!response.ok) {
        let message =
          "Speech generation failed";

        try {
          const data =
            await response.json();

          message =
            data.message ||
            message;

        } catch {
          // Response was not JSON
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      if (!blob.size) {
        throw new Error(
          "Gemini returned empty audio"
        );
      }

      // Remove previous URL
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      const url =
        URL.createObjectURL(blob);

      setAudioUrl(url);

      console.log(
        "Gemini voice generated successfully"
      );

      // Play immediately
      const newAudio =
        new Audio(url);

      setAudio(newAudio);

      setupAudioHandlers(newAudio);

      await newAudio.play();

    } catch (error) {

      console.error(
        "Gemini voice generation error:",
        error
      );

      alert(
        error.message ||
          "Failed to generate AI voice"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BROWSER TTS FALLBACK
  // =====================================================

  const speakWithBrowser = () => {
    if (
      !("speechSynthesis" in window)
    ) {
      alert(
        "Text-to-speech is not supported in this browser."
      );

      return;
    }

    if (!text?.trim()) {
      return;
    }

    stopAudio();

    const speech =
      new SpeechSynthesisUtterance(
        text
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
    };

    window.speechSynthesis.speak(
      speech
    );
  };

  // =====================================================
  // STOP / PLAY
  // =====================================================

  const handleVoice = () => {
    if (speaking) {
      stopAudio();
      return;
    }

    // If Gemini audio already exists,
    // play it without generating again.
    if (audioUrl) {
      playGeminiAudio();
      return;
    }

    generateVoice();
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl, audio]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900">

      {/* =================================================
          TEACHER AREA
      ================================================= */}

      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">

        {/* Background */}

        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

        {/* =================================================
            TEACHER
        ================================================= */}

        <div className="relative z-10 text-center">

          <div
            className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 ${
              speaking
                ? "border-green-400 shadow-lg shadow-green-500/30"
                : "border-white/10"
            } bg-indigo-600/20 transition-all duration-300`}
          >
            <span className="text-6xl">
              👨‍🏫
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold">
            AI Teacher
          </h3>

          <div className="mt-2 flex items-center justify-center gap-2">

            <span
              className={`h-2 w-2 rounded-full ${
                speaking
                  ? "animate-pulse bg-green-400"
                  : loading
                  ? "animate-pulse bg-yellow-400"
                  : "bg-slate-500"
              }`}
            />

            <span className="text-sm text-slate-400">

              {loading
                ? "Generating AI voice..."
                : speaking
                ? "Speaking..."
                : "Ready to teach"}

            </span>

          </div>

        </div>

        {/* =================================================
            CONTROLS
        ================================================= */}

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">

          <span className="rounded-lg bg-black/40 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            Gemini AI Teacher
          </span>

          <div className="flex gap-2">

            {!speaking ? (

              <button
                type="button"
                onClick={
                  handleVoice
                }
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Generating..."
                  : audioUrl
                  ? "▶ Play AI Voice"
                  : "🎙️ Generate AI Voice"}
              </button>

            ) : (

              <button
                type="button"
                onClick={
                  stopAudio
                }
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 backdrop-blur transition hover:bg-red-500/30"
              >
                ⏹ Stop
              </button>

            )}

          </div>

        </div>

      </div>

      {/* =================================================
          AUDIO PLAYER
      ================================================= */}

      {audioUrl && (

        <div className="border-t border-white/10 bg-slate-950 p-4">

          <div className="mb-2 flex items-center justify-between">

            <p className="text-xs font-semibold text-slate-400">
              Gemini AI Voice
            </p>

            <button
              type="button"
              onClick={() => {
                stopAudio();

                if (audioUrl) {
                  URL.revokeObjectURL(
                    audioUrl
                  );
                }

                setAudioUrl("");
                setAudio(null);
              }}
              className="text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>

          </div>

          <audio
            className="w-full"
            controls
            src={audioUrl}
          />

        </div>

      )}

      {/* =================================================
          OPTIONAL BROWSER FALLBACK
      ================================================= */}

      <div className="border-t border-white/10 px-4 py-3">

        <button
          type="button"
          onClick={
            speakWithBrowser
          }
          className="text-xs text-slate-500 transition hover:text-indigo-400"
        >
          Use browser voice instead
        </button>

      </div>

    </div>
  );
}

AITeacher.propTypes = {
  text: PropTypes.string.isRequired,
  language: PropTypes.string,
};

export default AITeacher;