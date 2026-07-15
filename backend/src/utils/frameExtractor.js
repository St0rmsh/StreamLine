import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export async function extractFrames(videoPath, outputDir) {
  await fs.promises.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(path.join(outputDir, "frame-%03d.png"))
      .outputOptions([
        "-vf fps=0.5",
        "-s 224x224"
      ])
      .on("end", async () => {
        const files = await fs.promises.readdir(outputDir);

        const fullPaths = files.map(f => path.join(outputDir, f));

        setTimeout(async () => {
          try {
            await fs.promises.rm(outputDir, { recursive: true, force: true });
            console.log("🧹 Frames deleted:", outputDir);
          } catch (err) {
            console.error("Delete error:", err);
          }
        }, 20 * 60 * 1000);

        resolve(fullPaths);
      })
      .on("error", reject)
      .run();
  });
}