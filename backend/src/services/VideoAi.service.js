import fs from "fs";
import { extractFrames } from "../utils/frameExtractor.js";
import { loadImageToTensor } from "../utils/imageLoader.js";
import {
  detectDeepFakeFromImage,
  loadDeepFakeModel
} from "./deepfake.service.js";

/**
 * Runs deepfake analysis on a LOCAL video file path.
 * IMPORTANT: This must be called BEFORE the local file is deleted,
 * i.e. right after ffmpeg conversion, not after upload to ImageKit.
 * Passing a remote URL here was previously causing a redundant
 * re-download from ImageKit for every upload, burning transformation
 * quota and coupling this step to ImageKit's availability.
 */
export async function analyzeVideoForDeepFake(localVideoPath) {
  if (!localVideoPath || !fs.existsSync(localVideoPath)) {
    console.warn("⚠️ [DEEPFAKE] Local file missing, skipping analysis:", localVideoPath);
    return 0;
  }

  await loadDeepFakeModel();

  const frameDir = `frames-${Date.now()}`;
  let frames = [];

  try {
    frames = await extractFrames(localVideoPath, frameDir);

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