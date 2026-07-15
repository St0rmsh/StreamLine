import fs from "fs";
import path from "path";

export const saveTempFile = async (buffer, filename) => {
  const tempDir = path.join(process.cwd(), "temp");

  await fs.promises.mkdir(tempDir, { recursive: true });

  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const tempPath = path.join(tempDir, safeName);

  await fs.promises.writeFile(tempPath, buffer);

  return tempPath;
};