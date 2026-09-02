const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-teacher-qrj7.onrender.com/api";

const REQUEST_TIMEOUT = 30000;

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message:
      text ||
      `Request failed with status ${response.status}`,
  };
};

const request = async (endpoint, options = {}) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        signal: controller.signal,
      }
    );

    const data = await parseResponse(response);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const error = new Error(
        data?.message ||
          "Your session has expired. Please login again."
      );

      error.status = 401;

      throw error;
    }

    if (!response.ok) {
      const error = new Error(
        data?.message ||
          `Request failed with status ${response.status}`
      );

      error.status = response.status;

      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "The request timed out. Please try again."
      );

      timeoutError.code = "REQUEST_TIMEOUT";

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (userData) => {
  if (!userData || typeof userData !== "object") {
    throw new Error("Registration data is required.");
  }

  const name =
    typeof userData.name === "string"
      ? userData.name.trim()
      : "";

  const email =
    typeof userData.email === "string"
      ? userData.email.trim().toLowerCase()
      : "";

  const password =
    typeof userData.password === "string"
      ? userData.password
      : "";

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  return request("/auth/register", {
    method: "POST",

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
};

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (userData) => {
  if (!userData || typeof userData !== "object") {
    throw new Error("Login data is required.");
  }

  const email =
    typeof userData.email === "string"
      ? userData.email.trim().toLowerCase()
      : "";

  const password =
    typeof userData.password === "string"
      ? userData.password
      : "";

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  return request("/auth/login", {
    method: "POST",

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });
};

// =====================================================
// GET CURRENT USER
// =====================================================

export const getMe = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    const error = new Error(
      "Authentication token not found."
    );

    error.status = 401;

    throw error;
  }

  return request("/auth/me", {
    method: "GET",

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};