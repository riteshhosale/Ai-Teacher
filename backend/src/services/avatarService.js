const axios = require("axios");

const DID_API_URL = "https://api.d-id.com";

const getHeaders = () => {
  if (!process.env.DID_API_KEY) {
    throw new Error(
      "DID_API_KEY is missing from backend/.env"
    );
  }

  return {
    Authorization: `Basic ${process.env.DID_API_KEY}`,
    "Content-Type": "application/json",
  };
};

const getVoiceId = (language) => {
  const normalizedLanguage = String(
    language || "English"
  ).toLowerCase();

  if (normalizedLanguage.includes("marathi")) {
    return (
      process.env.DID_MARATHI_VOICE_ID ||
      process.env.DID_VOICE_ID ||
      "en-US-JennyNeural"
    );
  }

  if (normalizedLanguage.includes("hindi")) {
    return (
      process.env.DID_HINDI_VOICE_ID ||
      process.env.DID_VOICE_ID ||
      "en-US-JennyNeural"
    );
  }

  return (
    process.env.DID_ENGLISH_VOICE_ID ||
    process.env.DID_VOICE_ID ||
    "en-US-JennyNeural"
  );
};

/**
 * Generate AI Teacher video using D-ID Talks API.
 *
 * @param {Object} params
 * @param {String} params.title
 * @param {Array} params.scenes
 * @param {String} params.language
 */
const generateAvatarVideo = async ({
  title,
  scenes,
  language = "English",
}) => {
  if (!process.env.DID_SOURCE_URL) {
    throw new Error(
      "DID_SOURCE_URL is missing from backend/.env"
    );
  }

  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error(
      "At least one teaching scene is required"
    );
  }

  const validScenes = scenes.filter(
    (scene) =>
      scene &&
      typeof scene.script === "string" &&
      scene.script.trim()
  );

  if (validScenes.length === 0) {
    throw new Error(
      "No valid scene scripts were found"
    );
  }

  /*
   * D-ID Talks creates one video from one script.
   *
   * Therefore, combine the lesson scenes into one
   * continuous AI Teacher script.
   */
  const combinedScript = validScenes
    .map((scene) => scene.script.trim())
    .join("\n\n");

  const voiceId = getVoiceId(language);

  const payload = {
    source_url: process.env.DID_SOURCE_URL,

    script: {
      type: "text",
      input: combinedScript,

      provider: {
        type: "microsoft",
        voice_id: voiceId,
      },
    },

    name: title || "AI Teacher Lesson",
  };

  try {
    console.log("Creating D-ID AI Teacher video...");

    const response = await axios.post(
      `${DID_API_URL}/talks`,
      payload,
      {
        headers: getHeaders(),
      }
    );

    console.log(
      "D-ID video created:",
      response.data.id
    );

    return {
      provider: "d-id",
      providerVideoId: response.data.id,
      status: "processing",
    };
  } catch (error) {
    console.error(
      "D-ID video generation error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.description ||
        "Failed to generate D-ID video"
    );
  }
};

/**
 * Get D-ID video generation status.
 */
const getAvatarVideoStatus = async ({
  providerVideoId,
}) => {
  if (!providerVideoId) {
    throw new Error(
      "providerVideoId is required"
    );
  }

  try {
    const response = await axios.get(
      `${DID_API_URL}/talks/${providerVideoId}`,
      {
        headers: getHeaders(),
      }
    );

    const data = response.data;

    console.log(
      "D-ID video status:",
      data.status
    );

    if (data.status === "done") {
      return {
        status: "completed",
        videoUrl: data.result_url || null,
        duration: data.duration || null,
        error: null,
      };
    }

    if (
      data.status === "error" ||
      data.status === "rejected"
    ) {
      return {
        status: "failed",
        videoUrl: null,
        duration: null,
        error:
          data.error ||
          data.message ||
          "D-ID video generation failed",
      };
    }

    return {
      status: "processing",
      videoUrl: null,
      duration: null,
      error: null,
    };
  } catch (error) {
    console.error(
      "D-ID status error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.description ||
        "Failed to retrieve D-ID video status"
    );
  }
};

module.exports = {
  generateAvatarVideo,
  getAvatarVideoStatus,
};