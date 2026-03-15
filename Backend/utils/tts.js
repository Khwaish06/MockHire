// src/utils/tts.js
import axios from "axios";
import { Howl } from "howler";

let currentSound = null; // 🔇 Track and stop previous sound if needed

export const speakWithElevenLabs = async (text, onEndCallback = () => {}) => {
  try {
    // Stop any previously playing sound
    if (currentSound) {
      currentSound.stop();
      currentSound = null;
    }

    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${import.meta.env.VITE_ELEVENLABS_VOICE_ID}`,
      headers: {
        "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
      data: {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      },
    });

    const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);

    const sound = new Howl({
      src: [audioUrl],
      format: ["mp3"],
      html5: true,
      onend: () => {
        onEndCallback(); // ✅ call video stop when voice ends
        currentSound = null;
      },
      onplayerror: function () {
        sound.once("unlock", () => sound.play());
      },
    });

    currentSound = sound;
    sound.play();
  } catch (err) {
    console.error("❌ ElevenLabs TTS Error:", err);
    onEndCallback(); // Ensure video stops even if error happens
  }
};
