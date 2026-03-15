import axios from 'axios';

// ✅ Base64 API Key
const API_KEY_BASE64 = 'Basic YTJoM1lXbHphSFpoYm5Ob2RVQm5iV0ZwYkM1amIyMDpYOFl5OGZCdG9VX05VckR4Q2JtR1g=';

// ✅ Function 1: Create talking video
export const createTalkingVideo = async (text) => {
  const options = {
    method: 'POST',
    url: 'https://api.d-id.com/talks',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: API_KEY_BASE64
    },
    data: {
      source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
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
    console.error('❌ Error creating video:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ Function 2: Poll for final video URL
export const getVideoUrl = async (res) => {
  const talkId = res.id;

  const poll = async () => {
    const options = {
      method: 'GET',
      url: `https://api.d-id.com/talks/${talkId}`,
      headers: {
        accept: 'application/json',
        authorization: API_KEY_BASE64
      }
    };

    try {
      const response = await axios.request(options);
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
      console.error('❌ Error polling video:', error.response?.data || error.message);
      throw error;
    }
  };

  return poll();
};
