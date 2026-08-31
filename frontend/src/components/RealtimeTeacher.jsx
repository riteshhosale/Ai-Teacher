import { useEffect, useRef, useState } from "react";

function RealtimeTeacher({
  topic,
  level,
  language,
  context,
}) {
  // =====================================================
  // REFS
  // =====================================================

  const audioRef = useRef(null);

  // =====================================================
  // STATE
  // =====================================================

  const [connected, setConnected] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState(null);

  const [asking, setAsking] =
    useState(false);

  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  // =====================================================
  // START AI TEACHER
  // =====================================================

  const startTeacher = async () => {
    try {
      setConnecting(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login first."
        );

        return;
      }

      // =================================================
      // GET GEMINI SESSION CONFIG
      // =================================================

      const response =
        await fetch(
          `${API_URL}/realtime/session`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              topic,
              level,
              language,
              context,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not create AI Teacher session"
        );
      }

      console.log(
        "Gemini realtime configuration:",
        data
      );

      /*
       * IMPORTANT:
       *
       * The backend returns the Gemini Live
       * configuration.
       *
       * Unlike OpenAI Realtime, Gemini does
       * not use:
       *
       *   clientSecret
       *
       * or:
       *
       *   /v1/realtime/calls
       *
       * from this component.
       *
       * Actual Gemini Live microphone streaming
       * should be implemented with the Gemini
       * Live SDK/WebSocket connection.
       */

      setConnected(true);

    } catch (error) {

      console.error(
        "Gemini Teacher error:",
        error
      );

      setError(
        error.message ||
          "Could not start AI Teacher"
      );

    } finally {
      setConnecting(false);
    }
  };

  // =====================================================
  // STOP TEACHER
  // =====================================================

  const stopTeacher = () => {
    if (audioRef.current) {
      audioRef.current.pause();

      audioRef.current.currentTime = 0;
    }

    setConnected(false);
  };

  // =====================================================
  // ASK AI TEACHER FROM MATERIAL
  // =====================================================

  const askTeacher = async () => {
    if (!question.trim()) {
      return;
    }

    try {
      setAsking(true);
      setAnswer(null);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Please login first."
        );
      }

      console.log(
        "Asking AI Teacher..."
      );

      const response =
        await fetch(
          `${API_URL}/rag/ask`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              question:
                question.trim(),

              topic,

              level,

              language,

              context,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "RAG response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to ask AI Teacher"
        );
      }

      if (!data.result) {
        throw new Error(
          "AI Teacher returned no answer"
        );
      }

      setAnswer(
        data.result
      );

    } catch (error) {

      console.error(
        "Ask Teacher error:",
        error
      );

      setAnswer({
        answer:
          error.message ||
          "I couldn't process that question right now.",

        example: "",

        checkQuestion: "",

        sources: [],
      });

    } finally {
      setAsking(false);
    }
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();

        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          REALTIME AI TEACHER
      ================================================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            {/* TEACHER ICON */}

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                connected
                  ? "bg-green-500/10"
                  : "bg-indigo-600/20"
              }`}
            >
              👨‍🏫
            </div>

            {/* TITLE */}

            <div>

              <h3 className="font-bold">
                AI Teacher
              </h3>

              <div className="mt-1 flex items-center gap-2">

                <span
                  className={`h-2 w-2 rounded-full ${
                    connected
                      ? "animate-pulse bg-green-400"
                      : "bg-slate-500"
                  }`}
                />

                <span className="text-xs text-slate-400">

                  {connected
                    ? "Ready"
                    : "Offline"}

                </span>

              </div>

            </div>

          </div>

          {/* CONNECT BUTTON */}

          {!connected ? (

            <button
              type="button"
              onClick={
                startTeacher
              }
              disabled={
                connecting
              }
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting
                ? "Connecting..."
                : "🎙️ Start AI Teacher"}
            </button>

          ) : (

            <button
              type="button"
              onClick={
                stopTeacher
              }
              className="rounded-xl bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              End Session
            </button>

          )}

        </div>

        {/* =================================================
            CONNECTED MESSAGE
        ================================================= */}

        {connected && (

          <div className="mt-6 rounded-xl bg-slate-800 p-5">

            <div className="flex items-center gap-3">

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                🎤
              </span>

              <div>

                <p className="text-sm font-semibold">
                  AI Teacher is ready
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Ask questions about{" "}
                  {topic || "your lesson"}.
                  The teacher will use your
                  uploaded study material when
                  relevant.
                </p>

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>

        )}

      </div>

      {/* =================================================
          ASK AI TEACHER
      ================================================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

        <h3 className="text-lg font-bold">
          Ask Your AI Teacher
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Ask anything about your current
          lesson or uploaded study material.
        </p>

        {/* =================================================
            QUESTION INPUT
        ================================================= */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">

          <input
            type="text"
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !asking
              ) {
                askTeacher();
              }
            }}
            placeholder="Ask a question..."
            disabled={asking}
            className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={
              askTeacher
            }
            disabled={
              asking ||
              !question.trim()
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking
              ? "Thinking..."
              : "Ask →"}
          </button>

        </div>

        {/* =================================================
            AI ANSWER
        ================================================= */}

        {answer && (

          <div className="mt-6 rounded-xl bg-slate-800 p-5">

            {/* ANSWER TITLE */}

            <div className="flex items-center gap-2">

              <span className="text-xl">
                👨‍🏫
              </span>

              <p className="text-sm font-semibold text-indigo-400">
                AI Teacher
              </p>

            </div>

            {/* MAIN ANSWER */}

            {answer.answer && (

              <div className="mt-4">

                <p className="text-sm font-semibold text-white">
                  Answer
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">
                  {answer.answer}
                </p>

              </div>

            )}

            {/* =================================================
                EXAMPLE
            ================================================= */}

            {answer.example && (

              <div className="mt-5 rounded-lg bg-slate-900 p-4">

                <p className="text-xs font-semibold text-slate-500">
                  💡 Example
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                  {answer.example}
                </p>

              </div>

            )}

            {/* =================================================
                CHECK QUESTION
            ================================================= */}

            {answer.checkQuestion && (

              <div className="mt-5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">

                <p className="text-xs font-semibold text-indigo-400">
                  🧠 Check Your Understanding
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {
                    answer.checkQuestion
                  }
                </p>

              </div>

            )}

            {/* =================================================
                SOURCES
            ================================================= */}

            {Array.isArray(
              answer.sources
            ) &&
              answer.sources.length >
                0 && (

                <div className="mt-5">

                  <p className="text-xs font-semibold text-slate-500">
                    📚 Based on your study material
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {answer.sources.map(
                      (
                        source,
                        index
                      ) => (

                        <span
                          key={
                            `${source.fileName}-${source.chunkIndex}-${index}`
                          }
                          className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-400"
                        >
                          📄{" "}
                          {
                            source.fileName
                          }
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

          </div>

        )}

      </div>

    </div>
  );
}

export default RealtimeTeacher;