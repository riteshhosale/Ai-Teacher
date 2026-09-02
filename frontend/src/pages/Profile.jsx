import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  level: "beginner",
  existingKnowledge: "",
  learningGoal: "Understand the topic",
  teachingStyle: "Simple and example-based",
  language: "English",
  availableTime: 30,
};

const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

const VALID_TEACHING_STYLES = [
  "Simple and example-based",
  "Visual",
  "Practical",
  "Detailed",
  "Step-by-step",
];

const VALID_LANGUAGES = ["English", "Hindi", "Marathi"];

const VALID_TIMES = [15, 30, 45, 60, 90];

const MAX_KNOWLEDGE_LENGTH = 5000;
const MAX_GOAL_LENGTH = 1000;

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message: text || `Request failed with status ${response.status}`,
  };
};

const normalizeProfile = (data = {}) => {
  const availableTime = Number(data.availableTime);

  return {
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    level: VALID_LEVELS.includes(data.level)
      ? data.level
      : DEFAULT_PROFILE.level,

    existingKnowledge:
      typeof data.existingKnowledge === "string"
        ? data.existingKnowledge
        : "",

    learningGoal:
      typeof data.learningGoal === "string" &&
      data.learningGoal.trim()
        ? data.learningGoal
        : DEFAULT_PROFILE.learningGoal,

    teachingStyle: VALID_TEACHING_STYLES.includes(data.teachingStyle)
      ? data.teachingStyle
      : DEFAULT_PROFILE.teachingStyle,

    language: VALID_LANGUAGES.includes(data.language)
      ? data.language
      : DEFAULT_PROFILE.language,

    availableTime: VALID_TIMES.includes(availableTime)
      ? availableTime
      : DEFAULT_PROFILE.availableTime,
  };
};

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await parseResponse(response);

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load learning profile."
          );
        }

        if (data?.profile) {
          setProfile(normalizeProfile(data.profile));
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Load profile error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load learning profile."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const validateProfile = () => {
    const existingKnowledge = profile.existingKnowledge.trim();
    const learningGoal = profile.learningGoal.trim();
    const availableTime = Number(profile.availableTime);

    if (!VALID_LEVELS.includes(profile.level)) {
      return "Please select a valid learning level.";
    }

    if (existingKnowledge.length > MAX_KNOWLEDGE_LENGTH) {
      return `Existing knowledge must be ${MAX_KNOWLEDGE_LENGTH} characters or less.`;
    }

    if (!learningGoal) {
      return "Please enter your learning goal.";
    }

    if (learningGoal.length > MAX_GOAL_LENGTH) {
      return `Learning goal must be ${MAX_GOAL_LENGTH} characters or less.`;
    }

    if (!VALID_TEACHING_STYLES.includes(profile.teachingStyle)) {
      return "Please select a valid teaching style.";
    }

    if (!VALID_LANGUAGES.includes(profile.language)) {
      return "Please select a valid language.";
    }

    if (!VALID_TIMES.includes(availableTime)) {
      return "Please select a valid learning time.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const controller = new AbortController();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: profile.level,
          existingKnowledge: profile.existingKnowledge.trim(),
          learningGoal: profile.learningGoal.trim(),
          teachingStyle: profile.teachingStyle,
          language: profile.language,
          availableTime: Number(profile.availableTime),
        }),
        signal: controller.signal,
      });

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update learning profile."
        );
      }

      if (data?.profile) {
        setProfile((previous) => ({
          ...previous,
          ...normalizeProfile(data.profile),
        }));
      }

      setMessage("Learning profile saved successfully.");
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Update profile error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save learning profile."
      );
    } finally {
      if (!controller.signal.aborted) {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
            aria-hidden="true"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading learning profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-600">
            AI Teacher
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Learning Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Tell your AI Teacher how you prefer to learn.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Basic Information
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={profile.name}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                />
              </div>
            </div>
          </section>

          <div>
            <label
              htmlFor="level"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Current Learning Level
            </label>

            <select
              id="level"
              name="level"
              value={profile.level}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="existingKnowledge"
                className="block text-sm font-medium text-slate-700"
              >
                What do you already know?
              </label>

              <span className="text-xs text-slate-400">
                {profile.existingKnowledge.length}/{MAX_KNOWLEDGE_LENGTH}
              </span>
            </div>

            <textarea
              id="existingKnowledge"
              name="existingKnowledge"
              value={profile.existingKnowledge}
              onChange={handleChange}
              maxLength={MAX_KNOWLEDGE_LENGTH}
              rows={4}
              placeholder="Example: I know basic JavaScript but don't know Node.js."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="learningGoal"
                className="block text-sm font-medium text-slate-700"
              >
                Learning Goal
              </label>

              <span className="text-xs text-slate-400">
                {profile.learningGoal.length}/{MAX_GOAL_LENGTH}
              </span>
            </div>

            <textarea
              id="learningGoal"
              name="learningGoal"
              value={profile.learningGoal}
              onChange={handleChange}
              maxLength={MAX_GOAL_LENGTH}
              rows={3}
              placeholder="Example: I want to understand backend development."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="teachingStyle"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Preferred Teaching Style
            </label>

            <select
              id="teachingStyle"
              name="teachingStyle"
              value={profile.teachingStyle}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="Simple and example-based">
                Simple and example-based
              </option>
              <option value="Visual">Visual</option>
              <option value="Practical">Practical</option>
              <option value="Detailed">Detailed</option>
              <option value="Step-by-step">Step-by-step</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="language"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Preferred Language
            </label>

            <select
              id="language"
              name="language"
              value={profile.language}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="availableTime"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Available Learning Time
            </label>

            <select
              id="availableTime"
              name="availableTime"
              value={profile.availableTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving Profile..." : "Save Learning Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Profile;