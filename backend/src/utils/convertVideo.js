import ffmpeg from "fluent-ffmpeg";

export async function convertToMp4(inputPath) {
  const outputPath = inputPath.replace(/\.[^/.]+$/, "") + "-converted.mp4";

  return new Promise((resolve, reject) => {
   ffmpeg(inputPath)
   .videoCodec("libx264")
   .audioCodec("aac")
   .videoBitrate("2000k")
   .audioBitrate("128k")
   .fps(30)
   .outputOptions([
    "-preset fast",
    "-movflags +faststart",
    "-pix_fmt yuv420p"
   ])
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}