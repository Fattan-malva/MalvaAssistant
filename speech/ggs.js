import gTTS from "gtts";
import fs from "fs";

export async function textToSpeech(text, outputPath = "./output.mp3") {
  return new Promise((resolve, reject) => {
    try {
      const tts = new gTTS(text, "id"); // "id" = bahasa indonesia

      tts.save(outputPath, function (err) {
        if (err) {
          console.error("TTS error:", err);
          return reject(err);
        }
        resolve(outputPath);
      });
    } catch (error) {
      console.error("TTS error:", error);
      reject(error);
    }
  });
}
