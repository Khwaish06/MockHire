const axios = require("axios");

const EMAIL_BASE64 = "a2FtYWwuMTk3OW1lZW51QGdtYWlsLmNvbQ";
const API_KEY = "tNRDsY9E7kfPu6KcjreiQ";

const createTalkingVideo = async (text) => {
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
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      auth: {
        username: EMAIL_BASE64,
        password: API_KEY,
      },
    }
  );

  return response.data.id;
};

const getVideoUrl = async (talkId) => {
  while (true) {
    const response = await axios.get(
      `https://api.d-id.com/talks/${talkId}`,
      {
        auth: {
          username: EMAIL_BASE64,
          password: API_KEY,
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

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
};

module.exports = { createTalkingVideo, getVideoUrl };
