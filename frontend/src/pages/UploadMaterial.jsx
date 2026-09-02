import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function UploadMaterial() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    const fileName = selectedFile.name.trim().toLowerCase();

    const hasPdfExtension = fileName.endsWith(".pdf");

    /*
     * Browser MIME information is useful for UX validation,
     * but it is NOT a security boundary.
     *
     * The backend must independently validate the actual
     * uploaded file.
     */
    const hasPdfMime =
      selectedFile.type === "application/pdf";

    if (!hasPdfExtension || !hasPdfMime) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size <= 0) {
      setError("The selected PDF is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("PDF must be 10 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    handleFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    if (loading) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  const handleUpload = async () => {
    if (loading) {
      return;
    }

    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const controller = new AbortController();

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      /*
       * Backend:
       * upload.single("file")
       *
       * Therefore this field name must remain "file".
       */
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/material/upload`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          /*
           * Do NOT manually set Content-Type.
           * The browser adds multipart/form-data
           * with the correct boundary.
           */
          body: formData,

          signal: controller.signal,
        }
      );

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to upload PDF."
        );
      }

      if (!data?.success && !data?.material) {
        throw new Error(
          "Upload completed but the server returned an invalid response."
        );
      }

      /*
       * Do not store PDF content, chunks, embeddings, or
       * vector-search data in localStorage.
       *
       * If the backend returns only document metadata,
       * storing that metadata temporarily is technically
       * safe, but the backend should remain the source of truth.
       */
      if (data?.material) {
        localStorage.setItem(
          "uploadedMaterial",
          JSON.stringify(data.material)
        );
      }

      /*
       * Reset the input so the same file can be selected again
       * if the user returns to this page.
       */
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      navigate("/learn", { replace: true });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the material."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-xs font-bold text-white">
                AI
              </span>
            </div>

            <span className="font-bold">
              AI
              <span className="text-indigo-600">
                Teacher
              </span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* MAIN */}

      <main className="mx-auto max-w-3xl px-5 py-12">
        <header className="text-center">
          <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            STUDY MATERIAL
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Upload your learning material
          </h1>

          <p className="mt-3 text-slate-500">
            Upload a PDF and let your AI Teacher learn from
            your study material.
          </p>
        </header>

        {/* UPLOAD */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div
            onDragOver={(event) => {
              event.preventDefault();

              if (!loading) {
                setDragging(true);
              }
            }}
            onDragLeave={(event) => {
              /*
               * Prevent flickering when moving between
               * children inside the drop zone.
               */
              if (
                event.currentTarget === event.target
              ) {
                setDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
              dragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
              📄
            </div>

            <h2 className="mt-5 break-all text-lg font-bold text-slate-900">
              {file ? file.name : "Drop your PDF here"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your computer
            </p>

            <label
              className={`mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 ${
                loading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              Choose PDF

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
              />
            </label>

            <p className="mt-4 text-xs text-slate-400">
              PDF only · Maximum 10 MB
            </p>
          </div>

          {/* SELECTED FILE */}

          {file && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  📄
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="shrink-0 text-sm font-medium text-red-500 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* UPLOAD BUTTON */}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Processing PDF..."
              : "Upload & Start Learning →"}
          </button>
        </section>

        {/* PROCESS */}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Info
            icon="📄"
            title="Upload"
            text="Upload your study material."
          />

          <Info
            icon="🧠"
            title="Understand"
            text="AI processes the educational content."
          />

          <Info
            icon="👨‍🏫"
            title="Learn"
            text="Your AI Teacher teaches from it."
          />
        </section>
      </main>
    </div>
  );
}

function Info({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
      <div className="text-2xl" aria-hidden="true">
        {icon}
      </div>

      <h3 className="mt-3 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}

export default UploadMaterial;