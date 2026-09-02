import { useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_QUESTION_LENGTH = 2000;

function RealtimeTeacher({
  topic = "",
  level = "",
  language = "English",
  context = "",
}) {
  const requestControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
        requestControllerRef.current = null;
      }
    };
  }, []);

  const getToken = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please login first.");
    }

    return token;
  };

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();

    return {
      message: text || "Unexpected server response.",
    };
  };

  // =====================================================
  // START AI TEACHER SESSION
  // =====================================================

  const startTeacher = async () => {
    if (connecting || connected) {
      return;
    }

    let controller;

    try {
      setConnecting(true);
      setError("");

      const token = getToken();

      controller = new AbortController();
      requestControllerRef.current = controller;

      const response = await fetch(
        `${API_URL}/realtime/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: topic.trim(),
            level: level.trim(),
            language: language.trim(),
            context:
              typeof context === "string"
                ? context.trim()
                : "",
          }),
          signal: controller.signal,
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Could not create AI Teacher session."
        );
      }

      /*
       * IMPORTANT:
       *
       * The current backend response only creates/returns
       * session configuration.
       *
       * A real Gemini Live connection still needs to be
       * established here using the returned configuration.
       *
       * Do NOT treat the HTTP request itself as a Live
       * connection.
       */

      if (!mountedRef.current) {
        return;
      }

      setConnected(true);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error("AI Teacher session error:", err);

      if (mountedRef.current) {
        setConnected(false);
        setError(
          err?.message ||
            "Could not start AI Teacher."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestControllerRef.current === controller
      ) {
        setConnecting(false);
        requestControllerRef.current = null;
      }
    }
  };

  // =====================================================
  // STOP AI TEACHER
  // =====================================================

  const stopTeacher = () => {
    if (requestControllerRef.current) {
      requestControllerRef.current.abort();
      requestControllerRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
  };

  // =====================================================
  // ASK AI TEACHER / RAG
  // =====================================================

  const askTeacher = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || asking) {
      return;
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      setError(
        `Question must be ${MAX_QUESTION_LENGTH} characters or less.`
      );
      return;
    }

    let controller;

    try {
      setAsking(true);
      setAnswer(null);
      setError("");

      const token = getToken();

      controller = new AbortController();
      requestControllerRef.current = controller;

      const response = await fetch(
        `${API_URL}/rag/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            topic: topic.trim(),
            level: level.trim(),
            language: language.trim(),
            context:
              typeof context === "string"
                ? context.trim()
                : "",
          }),
          signal: controller.signal,
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to ask AI Teacher."
        );
      }

      /*
       * Keep this compatible with the current backend
       * only if /rag/ask actually returns:
       *
       * {
       *   result: {
       *     answer,
       *     example,
       *     checkQuestion,
       *     sources
       *   }
       * }
       *
       * If the backend returns a different shape, this
       * should be changed to match the actual controller.
       */

      if (!data?.result) {
        throw new Error(
          "AI Teacher returned no answer."
        );
      }

      if (mountedRef.current) {
        setAnswer(data.result);
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error("Ask Teacher error:", err);

      if (mountedRef.current) {
        setError(
          err?.message ||
            "I couldn't process that question right now."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestControllerRef.current === controller
      ) {
        setAsking(false);
        requestControllerRef.current = null;
      }
    }
  };

  const handleQuestionKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !asking
    ) {
      event.preventDefault();
      askTeacher();
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          AI TEACHER
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              AI Teacher
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Realtime learning
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? "bg-emerald-500"
                    : "bg-slate-300"
                }`}
              />

              <span className="text-sm text-slate-500">
                {connecting
                  ? "Connecting..."
                  : connected
                    ? "Session created"
                    : "Not connected"}
              </span>
            </div>
          </div>

          {!connected ? (
            <button
              type="button"
              onClick={startTeacher}
              disabled={connecting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting
                ? "Connecting..."
                : "Start teacher"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTeacher}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              End session
            </button>
          )}
        </div>

        {connected && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Teacher session initialized
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Ask questions below using your lesson
              material.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </section>

      {/* =====================================================
          RAG QUESTION ANSWERING
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Study assistant
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Ask about your material
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ask a question about your current lesson
            or uploaded study material.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);

              if (error) {
                setError("");
              }
            }}
            onKeyDown={handleQuestionKeyDown}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Ask a question..."
            disabled={asking}
            aria-label="Question for AI Teacher"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
          />

          <button
            type="button"
            onClick={askTeacher}
            disabled={
              asking || !question.trim()
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking ? "Thinking..." : "Ask"}
          </button>
        </div>

        <div className="mt-2 text-right text-xs text-slate-400">
          {question.length}/{MAX_QUESTION_LENGTH}
        </div>

        {/* =====================================================
            ANSWER
        ===================================================== */}

        {answer && (
          <article className="mt-6 border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                AI Teacher
              </p>

              {answer.answer && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Answer
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {answer.answer}
                  </p>
                </div>
              )}
            </div>

            {answer.example && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Example
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {answer.example}
                </p>
              </div>
            )}

            {answer.checkQuestion && (
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Check your understanding
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {answer.checkQuestion}
                </p>
              </div>
            )}

            {Array.isArray(answer.sources) &&
              answer.sources.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    Sources
                  </p>

                  <div className="mt-3 space-y-2">
                    {answer.sources.map(
                      (source, index) => {
                        if (
                          !source ||
                          typeof source !==
                            "object"
                        ) {
                          return null;
                        }

                        const fileName =
                          typeof source.fileName ===
                          "string"
                            ? source.fileName
                            : "Study material";

                        const chunkIndex =
                          source.chunkIndex;

                        return (
                          <div
                            key={`${fileName}-${chunkIndex ?? index}`}
                            className="text-sm text-slate-500"
                          >
                            {fileName}
                            {Number.isFinite(
                              Number(chunkIndex)
                            ) && (
                              <span className="ml-2 text-xs text-slate-400">
                                Section{" "}
                                {Number(chunkIndex) + 1}
                              </span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
          </article>
        )}
      </section>
    </div>
  );
}

export default RealtimeTeacher;