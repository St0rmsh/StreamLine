import { createCanvas, loadImage } from "canvas";

export async function loadImageToTensor(path) {
  const img = await loadImage(path);

  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}