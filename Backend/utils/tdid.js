import { createTalkingVideo, getVideoUrl } from './did.js';

const test = async () => {
  try {
    const text = 'Hello, this is my AI talking!';
    const res = await createTalkingVideo(text);
    console.log('🎬 Video created:', res);

    const videoUrl = await getVideoUrl(res);
    console.log('✅ Final video URL:', videoUrl);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
};

test();
