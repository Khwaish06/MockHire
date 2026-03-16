
const axios = require("axios");

const DID_API_KEY = process.env.DID_API_KEY;

// Create talking avatar video
const createTalkingVideo = async (text) => {
  try {
    const response = await axios.post(
      "https://api.d-id.com/talks",
      {
        source_url:
          "https://www.shutterstock.com/image-photo/smiling-businesswoman-looking-camera-webcam-600w-1302585136.jpg",
        script: {
          type: "text",
          input: text,
        },
      },
      {
        headers: {
          Authorization: DID_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return response.data.id;

  } catch (error) {
    console.error(
      "❌ Error creating video:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Poll D-ID until video is ready
const getVideoUrl = async (talkId) => {

  const poll = async () => {
    try {

      const response = await axios.get(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            Authorization:  DID_API_KEY,
            Accept: "application/json",
          },
        }
      );

      const data = response.data;

      if (data.status === "done") {
        return data.result_url;
      }

      if (data.status === "error") {
        throw new Error("D-ID video generation failed");
      }

      console.log("⏳ Video processing...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return poll();

    } catch (error) {
      console.error(
        "❌ Error polling video URL:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  return poll();
};

module.exports = { createTalkingVideo, getVideoUrl };

