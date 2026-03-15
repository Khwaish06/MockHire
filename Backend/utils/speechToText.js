export const getTranscription = () => {
  return new Promise((resolve) => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      resolve("Speech recognition failed.");
    };

    recognition.start();
  });
};
