const axios = require("axios");

const BASE_URL =
  "https://api.synthesia.io/v2";

const headers = {
  Authorization:
    process.env.SYNTHESIA_API_KEY,

  "Content-Type":
    "application/json",
};


// ======================================
// CREATE AVATAR VIDEO
// ======================================

const generateAvatarVideo = async ({
  script,
  title,
}) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/videos`,
      {
        test: true,

        title:
          title ||
          "AI Teacher Lesson",

        visibility: "private",

        input: [
          {
            scriptText: script,

            avatar:
              process.env.SYNTHESIA_AVATAR_ID,

            background:
              "#F8FAFC",
          },
        ],
      },
      {
        headers,
      }
    );

    return {
      provider: "synthesia",

      providerVideoId:
        response.data.id,

      status: "processing",

      videoUrl: "",
    };

  } catch (error) {
    console.error(
      "Synthesia create video error:",
      error.response?.data ||
        error.message
    );

    throw new Error(
      "Failed to create avatar video"
    );
  }
};


// ======================================
// CHECK VIDEO STATUS
// ======================================

const getAvatarVideoStatus = async ({
  providerVideoId,
}) => {
  try {
    const response =
      await axios.get(
        `${BASE_URL}/videos/${providerVideoId}`,
        {
          headers,
        }
      );

    const data = response.data;

    let status = "processing";

    if (
      data.status === "complete"
    ) {
      status = "completed";
    }

    if (
      data.status === "failed"
    ) {
      status = "failed";
    }

    return {
      status,

      videoUrl:
        data.download || "",
    };

  } catch (error) {
    console.error(
      "Synthesia status error:",
      error.response?.data ||
        error.message
    );

    throw new Error(
      "Failed to check avatar video"
    );
  }
};


module.exports = {
  generateAvatarVideo,
  getAvatarVideoStatus,
};