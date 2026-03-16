const axios = require("axios");

const AUTH =
  "Basic a2FtYWwuMTk3OW1lZW51QGdtYWlsLmNvbQ:tNRDsY9E7kfPu6KcjreiQ";

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
        Authorization: AUTH,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  return response.data.id;
};

const getVideoUrl = async (talkId) => {
  const response = await axios.get(
    `https://api.d-id.com/talks/${talkId}`,
    {
      headers: {
        Authorization: AUTH,
        Accept: "application/json",
      },
    }
  );

  return response.data.result_url;
};

module.exports = { createTalkingVideo, getVideoUrl };