import ffmpeg from "fluent-ffmpeg";

export async function convertToMp4(inputPath) {
  const outputPath = inputPath.replace(/\.[^/.]+$/, "") + "-converted.mp4";

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset ultrafast",
        "-crf 23",
        "-movflags +faststart"
      ])
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}