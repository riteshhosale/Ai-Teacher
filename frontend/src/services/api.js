const API_URL =
  "https://ai-teacher-qrj7.onrender.com/api";

// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (userData) => {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to register user"
    );
  }

  return data;
};

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (userData) => {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to login user"
    );
  }

  return data;
};

// =====================================================
// GET CURRENT USER
// =====================================================

export const getMe = async () => {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Authentication token not found"
    );
  }

  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch user data"
    );
  }

  return data;
};