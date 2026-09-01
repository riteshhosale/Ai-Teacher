const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to register user");
    }

    return data;
  } catch (error) {
    console.error("Register API error:", error);

    throw error;
  }
};

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (userData) => {
  try {
    console.log("Login API:", `${API_URL}/auth/login`);

    console.log("Login data:", {
      email: userData.email,
    });

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    });

    console.log("Login status:", response.status);

    const data = await response.json();

    console.log("Login response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to login user");
    }

    return data;
  } catch (error) {
    console.error("Login API error:", error);

    throw error;
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

export const getMe = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user data");
    }

    return data;
  } catch (error) {
    console.error("GetMe API error:", error);

    throw error;
  }
};
