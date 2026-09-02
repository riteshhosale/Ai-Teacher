import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    level: "beginner",
    existingKnowledge: "",
    learningGoal: "Understand the topic",
    teachingStyle: "Simple and example-based",
    language: "English",
    availableTime: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login first.");
        }

        const response = await fetch(
          `${API_URL}/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        if (data.profile) {
          setProfile({
            name: data.profile.name || "",
            email: data.profile.email || "",
            level:
              data.profile.level || "beginner",
            existingKnowledge:
              data.profile.existingKnowledge || "",
            learningGoal:
              data.profile.learningGoal ||
              "Understand the topic",
            teachingStyle:
              data.profile.teachingStyle ||
              "Simple and example-based",
            language:
              data.profile.language || "English",
            availableTime:
              data.profile.availableTime || 30,
          });
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError(
          err.message || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            level: profile.level,
            existingKnowledge:
              profile.existingKnowledge,
            learningGoal:
              profile.learningGoal,
            teachingStyle:
              profile.teachingStyle,
            language: profile.language,
            availableTime:
              Number(profile.availableTime),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      if (data.profile) {
        setProfile((previous) => ({
          ...previous,
          ...data.profile,
          name: data.profile.name || previous.name,
          email: data.profile.email || previous.email,
        }));
      }

      setMessage(
        "Learning profile saved successfully."
      );
    } catch (err) {
      console.error("Update profile error:", err);

      setError(
        err.message || "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading learning profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}

        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            AI Teacher
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Learning Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Tell your AI Teacher how you prefer to learn.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >

          {/* Basic Information */}

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Basic Information
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={profile.name}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                />
              </div>

            </div>
          </div>

          {/* Level */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Current Learning Level
            </label>

            <select
              name="level"
              value={profile.level}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

          {/* Existing Knowledge */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              What do you already know?
            </label>

            <textarea
              name="existingKnowledge"
              value={profile.existingKnowledge}
              onChange={handleChange}
              rows={4}
              placeholder="Example: I know basic JavaScript but don't know Node.js."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Learning Goal */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Learning Goal
            </label>

            <textarea
              name="learningGoal"
              value={profile.learningGoal}
              onChange={handleChange}
              rows={3}
              placeholder="Example: I want to understand backend development."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Teaching Style */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Preferred Teaching Style
            </label>

            <select
              name="teachingStyle"
              value={profile.teachingStyle}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="Simple and example-based">
                Simple and example-based
              </option>

              <option value="Visual">
                Visual
              </option>

              <option value="Practical">
                Practical
              </option>

              <option value="Detailed">
                Detailed
              </option>

              <option value="Step-by-step">
                Step-by-step
              </option>
            </select>
          </div>

          {/* Language */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Preferred Language
            </label>

            <select
              name="language"
              value={profile.language}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

          {/* Available Time */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Available Learning Time
            </label>

            <select
              name="availableTime"
              value={profile.availableTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="15">
                15 minutes
              </option>

              <option value="30">
                30 minutes
              </option>

              <option value="45">
                45 minutes
              </option>

              <option value="60">
                60 minutes
              </option>

              <option value="90">
                90 minutes
              </option>
            </select>
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Success */}

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                ✓ {message}
              </p>
            </div>
          )}

          {/* Save */}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving Profile..."
              : "Save Learning Profile"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Profile;