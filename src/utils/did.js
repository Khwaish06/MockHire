const axios = require('axios');

// Your base64 API key string, format: base64(:API_KEY)
const API_KEY_BASE64 =  process.env.DID_API_KEY;

// ✅ Working version of createTalkingVideo
const createTalkingVideo = async (text) => {
  const options = {
    method: 'POST',
    url: 'https://api.d-id.com/talks',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: API_KEY_BASE64
    },
    data: {
      source_url: 'https://www.shutterstock.com/image-photo/smiling-businesswoman-looking-camera-webcam-600w-1302585136.jpg',
      script: {
        type: 'text',
        input: text
      }
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error creating video:', error.response?.data || error.message);
    throw error;
  }
};


// 2️⃣ Function to poll and get final video URL
const getVideoUrl = async (res) => {
  const talkId = res.id;

  const poll = async () => {
    try {
      const response = await axios.get(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            accept: 'application/json',
            authorization: API_KEY_BASE64  // ✅ fixed line
          }
        }
      );

      const data = response.data;

      if (data.status === 'done') {
        return data.result_url;
      } else if (data.status === 'error') {
        throw new Error(data.error);
      } else {
        console.log('⏳ Still processing...');
        return new Promise(resolve => setTimeout(resolve, 3000)).then(poll);
      }
    } catch (error) {
      console.error('Error polling video URL:', error.response?.data || error.message);
      throw error;
    }
  };

  return poll();
};

// ✅ Export both functions
module.exports = { createTalkingVideo, getVideoUrl };

