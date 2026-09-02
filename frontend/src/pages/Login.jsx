import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const INITIAL_FORM = {
  email: "",
  password: "",
};

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      setError("Email address is too long.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      setError("Password is too long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({
        email,
        password,
      });

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response from the server.");
      }

      if (!data.token || typeof data.token !== "string") {
        throw new Error(
          "Login succeeded but no authentication token was received."
        );
      }

      if (!data.user || typeof data.user !== "object") {
        throw new Error(
          "Login succeeded but user information was not received."
        );
      }

      /*
       * The token is currently stored in localStorage to match
       * the authentication architecture used by the rest of
       * your frontend.
       *
       * Important:
       * For stronger security, an httpOnly secure cookie-based
       * authentication system is preferable because JavaScript
       * cannot read httpOnly cookies.
       */
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      /*
       * Keep the preference only if you actually implement
       * persistent-login behavior later.
       */
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      console.error("Login error:", requestError);

      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to login. Please try again.";

      setError(
        message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <main className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              to="/"
              aria-label="Go to home"
              className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              AI
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Login to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                inputMode="email"
                maxLength={MAX_EMAIL_LENGTH}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                maxLength={MAX_PASSWORD_LENGTH}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={loading}
                  className="h-4 w-4 rounded accent-indigo-600"
                />

                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Register */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?

            <Link
              to="/register"
              className="ml-2 font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;