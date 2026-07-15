import * as tf from "@tensorflow/tfjs";

let model;

export async function loadDeepFakeModel() {
  if (!model) {
    model = await tf.loadLayersModel(
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
    );
    console.log("✅ Deepfake model loaded");
  }
}



export function detectDeepFakeFromImage(imageData) {
  if (!model) throw new Error("Model not loaded");

  return tf.tidy(() => {
    const tensor = tf.tensor(imageData.data)
      .reshape([imageData.height, imageData.width, 4])
      .slice([0, 0, 0], [-1, -1, 3])
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .toFloat()
      .div(255);

    const prediction = model.predict(tensor);
    const data = prediction.dataSync();

    return data[0];
  });
}