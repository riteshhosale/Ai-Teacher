import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_TOPIC_LENGTH = 200;

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {
        message: "Server returned invalid JSON.",
      };
    }
  }

  const text = await response.text();

  return {
    message:
      text ||
      `Request failed with status ${response.status}`,
  };
};

const getDocumentId = (document) => {
  if (!document) return null;

  const id =
    document.documentId ||
    document._id ||
    document.id;

  if (!id) return null;

  // MongoDB ObjectId or string ID
  if (typeof id === "object" && id.$oid) {
    return id.$oid;
  }

  return String(id);
};

const normalizeDocuments = (data) => {
  const documents =
    data?.documents ||
    data?.materials ||
    data?.data ||
    [];

  if (!Array.isArray(documents)) {
    return [];
  }

  return documents
    .map((document) => {
      if (!document || typeof document !== "object") {
        return null;
      }

      const documentId = getDocumentId(document);

      if (!documentId) {
        return null;
      }

      return {
        ...document,
        documentId,
      };
    })
    .filter(Boolean);
};

function Learn() {
  const navigate = useNavigate();
  const location = useLocation();

  const mountedRef = useRef(true);
  const documentsControllerRef = useRef(null);
  const lessonControllerRef = useRef(null);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [language, setLanguage] = useState("English");
  const [time, setTime] = useState("30");
  const [learningMode, setLearningMode] = useState("general");

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [loadingDocuments, setLoadingDocuments] =
    useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // ----------------------------------------
  // Load topic from Learning Path
  // ----------------------------------------

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topicFromUrl = params.get("topic");

    if (topicFromUrl && mountedRef.current) {
      setTopic(topicFromUrl.slice(0, MAX_TOPIC_LENGTH));
    }
  }, [location.search]);

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      documentsControllerRef.current?.abort();
      lessonControllerRef.current?.abort();
    };
  }, []);

  // ----------------------------------------
  // Load uploaded documents
  // ----------------------------------------

  useEffect(() => {
    const loadDocuments = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      documentsControllerRef.current?.abort();

      const controller = new AbortController();
      documentsControllerRef.current = controller;

      setLoadingDocuments(true);

      try {
        const response = await fetch(
          `${API_URL}/documents`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await parseResponse(response);

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          if (mountedRef.current) {
            navigate("/login", { replace: true });
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load uploaded materials."
          );
        }

        const normalizedDocuments =
          normalizeDocuments(data);

        if (mountedRef.current) {
          setDocuments(normalizedDocuments);
        }
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        if (mountedRef.current) {
          setError(
            requestError.message ||
              "Failed to load uploaded materials."
          );
        }
      } finally {
        if (
          mountedRef.current &&
          !controller.signal.aborted
        ) {
          setLoadingDocuments(false);
        }
      }
    };

    loadDocuments();
  }, [navigate]);

  // ----------------------------------------
  // Select document
  // ----------------------------------------

  const handleDocumentSelect = (document) => {
    setError("");

    if (!document) {
      setSelectedDocument(null);
      return;
    }

    const documentId = getDocumentId(document);

    if (!documentId) {
      setError(
        "This uploaded material does not have a valid document ID."
      );
      setSelectedDocument(null);
      return;
    }

    setSelectedDocument({
      ...document,
      documentId,
    });
  };

  // ----------------------------------------
  // Generate lesson
  // ----------------------------------------

  const handleGenerateLesson = async (event) => {
    event?.preventDefault();

    setError("");

    const normalizedTopic = topic.trim();

    if (!normalizedTopic) {
      setError("Please enter a topic.");
      return;
    }

    if (normalizedTopic.length > MAX_TOPIC_LENGTH) {
      setError(
        `Topic must be ${MAX_TOPIC_LENGTH} characters or less.`
      );
      return;
    }

    const isMaterialMode =
      learningMode === "material" ||
      learningMode === "document";

    /*
     * IMPORTANT:
     * Always extract a real documentId.
     *
     * Do NOT send only selectedDocument.
     */
    const documentId = getDocumentId(selectedDocument);

    if (isMaterialMode && !documentId) {
      setError(
        "Please select an uploaded material before generating a lesson."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    lessonControllerRef.current?.abort();

    const controller = new AbortController();
    lessonControllerRef.current = controller;

    setGenerating(true);

    try {
      /*
       * IMPORTANT:
       * documentId is explicitly included here.
       *
       * This is what fixes:
       * "documentId is required"
       */
      const payload = {
        topic: normalizedTopic,
        level,
        language,
        time,
        learningMode,
        documentId: documentId || null,
      };

      console.log("[Lesson] Generation payload:", {
        topic: payload.topic,
        level: payload.level,
        language: payload.language,
        time: payload.time,
        learningMode: payload.learningMode,
        documentId: payload.documentId,
      });

      const response = await fetch(
        `${API_URL}/lesson/generate`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (mountedRef.current) {
          navigate("/login", { replace: true });
        }

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to generate lesson."
        );
      }

      if (!data) {
        throw new Error(
          "The server returned an empty response."
        );
      }

      /*
       * Store the generated lesson.
       *
       * RAG chunks/embeddings are NOT stored here.
       */
      const generatedLesson =
        data.lesson ||
        data.generatedLesson ||
        data.data ||
        data;

      if (!generatedLesson) {
        throw new Error(
          "No lesson was returned by the server."
        );
      }

      if (mountedRef.current) {
        localStorage.setItem(
          "generatedLesson",
          JSON.stringify(generatedLesson)
        );

        /*
         * Only store source references/metadata if
         * the backend returns them.
         *
         * Never store Chroma chunks/embeddings here.
         */
        if (Array.isArray(data.sources)) {
          localStorage.setItem(
            "lessonSources",
            JSON.stringify(data.sources)
          );
        } else {
          localStorage.removeItem("lessonSources");
        }

        /*
         * Keep the document ID available for the lesson.
         */
        if (documentId) {
          localStorage.setItem(
            "lessonDocumentId",
            documentId
          );
        } else {
          localStorage.removeItem("lessonDocumentId");
        }

        /*
         * Prefer the lesson ID returned by backend.
         */
        const lessonId =
          generatedLesson?._id ||
          generatedLesson?.id ||
          data?.lessonId;

        if (!lessonId) {
          throw new Error(
            "Lesson generated, but no lesson ID was returned."
          );
        }

        navigate(`/lesson/${lessonId}`);
      }
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      if (mountedRef.current) {
        setError(
          requestError.message ||
            "Something went wrong while generating the lesson."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        !controller.signal.aborted
      ) {
        setGenerating(false);
      }
    }
  };

  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Create a Lesson
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Choose a topic and learning preferences.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleGenerateLesson}
            className="space-y-6"
          >
            {/* Topic */}

            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Topic
              </label>

              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) =>
                  setTopic(
                    event.target.value.slice(
                      0,
                      MAX_TOPIC_LENGTH
                    )
                  )
                }
                placeholder="e.g. JavaScript Promises"
                maxLength={MAX_TOPIC_LENGTH}
                disabled={generating}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

            {/* Learning Mode */}

            <div>
              <label
                htmlFor="learningMode"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Learning Mode
              </label>

              <select
                id="learningMode"
                value={learningMode}
                onChange={(event) => {
                  setLearningMode(event.target.value);
                  setError("");

                  if (
                    event.target.value !== "material" &&
                    event.target.value !== "document"
                  ) {
                    setSelectedDocument(null);
                  }
                }}
                disabled={generating}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              >
                <option value="general">
                  General Learning
                </option>

                <option value="material">
                  Uploaded Material
                </option>
              </select>
            </div>

            {/* Uploaded Material */}

            {(learningMode === "material" ||
              learningMode === "document") && (
              <div>
                <label
                  htmlFor="document"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Uploaded Material
                </label>

                {loadingDocuments ? (
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500">
                    Loading uploaded materials...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    No uploaded material found.
                  </div>
                ) : (
                  <select
                    id="document"
                    value={
                      selectedDocument
                        ? getDocumentId(selectedDocument) || ""
                        : ""
                    }
                    onChange={(event) => {
                      const document =
                        documents.find(
                          (item) =>
                            getDocumentId(item) ===
                            event.target.value
                        );

                      handleDocumentSelect(
                        document || null
                      );
                    }}
                    disabled={generating}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    <option value="">
                      Select uploaded material
                    </option>

                    {documents.map((document) => {
                      const documentId =
                        getDocumentId(document);

                      const name =
                        document.originalName ||
                        document.fileName ||
                        document.name ||
                        "Untitled material";

                      return (
                        <option
                          key={documentId}
                          value={documentId}
                        >
                          {name}
                        </option>
                      );
                    })}
                  </select>
                )}

                {selectedDocument && (
                  <p className="mt-2 text-xs text-slate-500">
                    Document ID:{" "}
                    {getDocumentId(selectedDocument)}
                  </p>
                )}
              </div>
            )}

            {/* Preferences */}

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="level"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Level
                </label>

                <select
                  id="level"
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value)
                  }
                  disabled={generating}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="beginner">
                    Beginner
                  </option>
                  <option value="intermediate">
                    Intermediate
                  </option>
                  <option value="advanced">
                    Advanced
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Language
                </label>

                <select
                  id="language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  disabled={generating}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="English">
                    English
                  </option>
                  <option value="Hindi">
                    Hindi
                  </option>
                  <option value="Marathi">
                    Marathi
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Time
                </label>

                <select
                  id="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  disabled={generating}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>

            {/* Generate */}

            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating
                ? "Generating lesson..."
                : "Generate Lesson"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Learn;