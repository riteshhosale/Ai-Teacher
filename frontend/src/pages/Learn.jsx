import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Learn() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("English");
  const [time, setTime] = useState("30 minutes");
  const [learningMode, setLearningMode] = useState("Topic");

const handleStartLesson = async (e) => {
  e.preventDefault();

  if (!topic.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/lesson/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          level,
          language,
          time,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to generate lesson");
      return;
    }

    localStorage.setItem(
      "generatedLesson",
      JSON.stringify(data.lesson)
    );

    navigate("/lesson");

  } catch (error) {
    console.error(error);

    alert(
      "Unable to connect to the AI Teacher server"
    );
  }
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================= NAVBAR ================= */}
      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          <Link to="/dashboard" className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-bold text-white">
                AI
              </span>
            </div>

            <span className="text-lg font-bold">
              AI<span className="text-indigo-600">Teacher</span>
            </span>

          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium
            text-slate-600 hover:bg-slate-100"
          >
            ← Dashboard
          </Link>

        </div>

      </nav>


      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-5xl px-5 py-10">

        {/* Header */}
        <div className="text-center">

          <span className="inline-flex rounded-full bg-indigo-50
          px-4 py-2 text-sm font-semibold text-indigo-600">
            AI-POWERED LEARNING
          </span>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            What do you want to learn?
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Tell your AI Teacher what you want to learn.
            We'll create a learning experience based on your
            level, language, and available time.
          </p>

        </div>


        {/* ================= FORM ================= */}
        <form
          onSubmit={handleStartLesson}
          className="mx-auto mt-10 max-w-3xl"
        >

          <div className="rounded-2xl border border-slate-200
          bg-white p-6 shadow-sm sm:p-8">


            {/* Learning Mode */}
            <div>

              <label className="text-sm font-semibold text-slate-800">
                How do you want to learn?
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setLearningMode("Topic")}
                  className={`rounded-xl border p-4 text-left transition ${
                    learningMode === "Topic"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >

                  <div className="text-2xl">
                    📚
                  </div>

                  <p className="mt-2 font-semibold">
                    Learn a Topic
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Start from a topic or concept.
                  </p>

                </button>


                <button
                  type="button"
                  onClick={() => setLearningMode("Material")}
                  className={`rounded-xl border p-4 text-left transition ${
                    learningMode === "Material"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >

                  <div className="text-2xl">
                    📄
                  </div>

                  <p className="mt-2 font-semibold">
                    Study Material
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Learn from your uploaded material.
                  </p>

                </button>

              </div>

            </div>


            {/* Topic */}
            <div className="mt-7">

              <label className="text-sm font-semibold text-slate-800">
                Topic
              </label>

              <div className="mt-2">

                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. JavaScript Promises, Photosynthesis, Cyber Security"
                  required
                  className="w-full rounded-xl border border-slate-300
                  px-4 py-3.5 outline-none transition
                  focus:border-indigo-500 focus:ring-2
                  focus:ring-indigo-100"
                />

              </div>

              <p className="mt-2 text-xs text-slate-400">
                You can enter any subject or concept you want to understand.
              </p>

            </div>


            {/* Options */}
            <div className="mt-7 grid gap-5 sm:grid-cols-3">

              {/* Level */}
              <div>

                <label className="text-sm font-semibold text-slate-800">
                  Your Level
                </label>

                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-2 w-full rounded-xl border
                  border-slate-300 bg-white px-4 py-3
                  outline-none focus:border-indigo-500
                  focus:ring-2 focus:ring-indigo-100"
                >

                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>

                </select>

              </div>


              {/* Language */}
              <div>

                <label className="text-sm font-semibold text-slate-800">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-2 w-full rounded-xl border
                  border-slate-300 bg-white px-4 py-3
                  outline-none focus:border-indigo-500
                  focus:ring-2 focus:ring-indigo-100"
                >

                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Hinglish</option>

                </select>

              </div>


              {/* Time */}
              <div>

                <label className="text-sm font-semibold text-slate-800">
                  Available Time
                </label>

                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border
                  border-slate-300 bg-white px-4 py-3
                  outline-none focus:border-indigo-500
                  focus:ring-2 focus:ring-indigo-100"
                >

                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>

                </select>

              </div>

            </div>


            {/* Learning Experience Preview */}
            <div className="mt-7 rounded-xl bg-slate-50 p-5">

              <p className="text-sm font-semibold text-slate-800">
                Your AI Teacher will
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <Feature
                  icon="🧠"
                  text="Explain concepts at your level"
                />

                <Feature
                  icon="💡"
                  text="Use examples and demonstrations"
                />

                <Feature
                  icon="❓"
                  text="Ask questions to check understanding"
                />

                <Feature
                  icon="📊"
                  text="Evaluate and adapt your learning"
                />

              </div>

            </div>


            {/* Start Button */}
            <button
              type="submit"
              className="mt-7 w-full rounded-xl bg-indigo-600
              px-6 py-3.5 font-semibold text-white
              transition hover:bg-indigo-700
              focus:outline-none focus:ring-4
              focus:ring-indigo-100"
            >
              Start AI Lesson →
            </button>

          </div>

        </form>


        {/* Bottom info */}
        <div className="mx-auto mt-7 max-w-3xl text-center">

          <p className="text-xs leading-5 text-slate-400">
            Your lesson will be personalized according to your
            selected level, language, topic, and available time.
          </p>

        </div>

      </main>

    </div>
  );
}


/* ================= FEATURE ================= */

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3">

      <span className="text-lg">
        {icon}
      </span>

      <span className="text-sm text-slate-600">
        {text}
      </span>

    </div>
  );
}

export default Learn;