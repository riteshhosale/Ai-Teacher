import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function UploadMaterial() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FILE VALIDATION =================

  const handleFile = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    // Check extension
    const fileName = selectedFile.name.toLowerCase();
    const isPdfExtension = fileName.endsWith(".pdf");

    // Check MIME type
    const isPdfMime =
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/octet-stream";

    if (!isPdfExtension && !isPdfMime) {
      setError("Only PDF files are allowed.");
      return;
    }

    // 10 MB limit
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("PDF must be smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  // ================= FILE CHANGE =================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    handleFile(selectedFile);
  };

  // ================= DRAG & DROP =================

  const handleDrop = (e) => {
    e.preventDefault();

    setDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  // ================= UPLOAD =================

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      // IMPORTANT:
      // Backend uses upload.single("file")
      // Therefore frontend must also use "file".
      formData.append("file", file);

      const response = await fetch(`${API_URL}/material/upload`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        // Do NOT manually set Content-Type.
        // Browser automatically creates multipart/form-data.
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      console.log("Upload successful:", data);

      // Save processed material
      localStorage.setItem("uploadedMaterial", JSON.stringify(data.material));

      // Go to learning page
      navigate("/learn");
    } catch (error) {
      console.error("Upload error:", error);

      setError(error.message || "Unable to upload the material.");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-slate-200 bg-white">
        <div
          className="mx-auto flex h-16 max-w-7xl
          items-center justify-between px-5"
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center
              justify-center rounded-lg bg-indigo-600"
            >
              <span className="text-xs font-bold text-white">AI</span>
            </div>

            <span className="font-bold">
              AI
              <span className="text-indigo-600">Teacher</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm
            font-medium text-slate-600
            hover:bg-slate-100"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-3xl px-5 py-12">
        {/* Header */}

        <div className="text-center">
          <span
            className="rounded-full bg-indigo-50
            px-4 py-2 text-sm font-semibold
            text-indigo-600"
          >
            STUDY MATERIAL
          </span>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Upload your learning material
          </h1>

          <p className="mt-3 text-slate-500">
            Upload a PDF and let your AI Teacher learn from your study material.
          </p>
        </div>

        {/* ================= UPLOAD BOX ================= */}

        <div
          className="mt-10 rounded-2xl border
          border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={handleDrop}
            className={`rounded-2xl border-2
            border-dashed p-10 text-center
            transition ${
              dragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <div
              className="mx-auto flex h-16 w-16
              items-center justify-center
              rounded-2xl bg-indigo-100 text-3xl"
            >
              📄
            </div>

            <h2 className="mt-5 text-lg font-bold">
              {file ? file.name : "Drop your PDF here"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your computer
            </p>

            <label
              className="mt-6 inline-block
              cursor-pointer rounded-lg
              bg-indigo-600 px-5 py-3
              text-sm font-semibold text-white
              transition hover:bg-indigo-700"
            >
              Choose PDF
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <p className="mt-4 text-xs text-slate-400">
              PDF only · Maximum 10 MB
            </p>
          </div>

          {/* ================= SELECTED FILE ================= */}

          {file && (
            <div
              className="mt-5 flex items-center
              justify-between rounded-xl border
              border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10
                  items-center justify-center
                  rounded-lg bg-red-50"
                >
                  📄
                </div>

                <div>
                  <p
                    className="max-w-56 truncate
                    text-sm font-semibold sm:max-w-md"
                  >
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError("");
                }}
                className="text-sm font-medium
                text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}

          {/* ================= ERROR ================= */}

          {error && (
            <div
              className="mt-5 rounded-xl border
              border-red-200 bg-red-50 px-4 py-3
              text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* ================= UPLOAD BUTTON ================= */}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-6 w-full rounded-xl
            bg-indigo-600 px-6 py-3.5
            font-semibold text-white transition
            hover:bg-indigo-700
            disabled:cursor-not-allowed
            disabled:opacity-40"
          >
            {loading ? "Processing PDF..." : "Upload & Start Learning →"}
          </button>
        </div>

        {/* ================= WHAT HAPPENS ================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Info icon="📄" title="Upload" text="Upload your study material." />

          <Info
            icon="🧠"
            title="Understand"
            text="AI reads and understands the content."
          />

          <Info
            icon="👨‍🏫"
            title="Learn"
            text="Your AI Teacher teaches from it."
          />
        </div>
      </main>
    </div>
  );
}

// ================= INFO =================

function Info({ icon, title, text }) {
  return (
    <div
      className="rounded-xl border
      border-slate-200 bg-white p-5 text-center"
    >
      <div className="text-2xl">{icon}</div>

      <h3 className="mt-3 font-bold">{title}</h3>

      <p
        className="mt-1 text-xs
        leading-5 text-slate-500"
      >
        {text}
      </p>
    </div>
  );
}

export default UploadMaterial;
