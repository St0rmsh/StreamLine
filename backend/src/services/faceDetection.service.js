import * as faceapi from "@vladmandic/face-api";
import canvas from "canvas";

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

export async function loadFaceModel() {
    if (modelsLoaded) return;
    await faceapi.nets.tinyFaceDetector.loadFromDisk("./models");
    modelsLoaded = true;
    console.log("✅ Face model loaded");
}

export async function detectFaces(img) {
    await loadFaceModel();
    return await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
    );
}