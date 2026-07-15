import fs from "fs";
import { extractFrames } from "../utils/frameExtractor.js";
import { loadImageToTensor } from "../utils/imageLoader.js";
import {
  detectDeepFakeFromImage,
  loadDeepFakeModel
} from "./deepfake.service.js";

export async function analyzeVideoForDeepFake(videoPath) {
  await loadDeepFakeModel();

  const frameDir = `frames-${Date.now()}`;
  let frames = [];

  try {
    frames = await extractFrames(videoPath, frameDir);

    let total = 0;
    let count = 0;

    for (const frame of frames.slice(0, 5)) {
      try {
        const img = await loadImageToTensor(frame);
        const score = detectDeepFakeFromImage(img);

        total += score;
        count++;

      } catch (err) {
        console.log("Frame error:", err.message);
      }
    }

    return count ? total / count : 0;

  } catch (err) {
    console.error("Deepfake analysis error:", err.message);
    return 0;

  } finally {
    try {
      if (frames.length) {
        await Promise.all(
          frames.map(f =>
            fs.existsSync(f) ? fs.promises.unlink(f) : null
          )
        );
      }

      if (fs.existsSync(frameDir)) {
        await fs.promises.rm(frameDir, {
          recursive: true,
          force: true
        });
      }

    } catch (cleanupErr) {
      console.log("Cleanup error:", cleanupErr.message);
    }
  }
}