import ImageKit from "@imagekit/nodejs";
import config from "../config/config.js";

const imagekit = new ImageKit({
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Uploads a file to ImageKit
 * @param {Object} params - { buffer, filename, folder }
 */
export const uploadFile = async ({ buffer, filename, folder = "/general" }) => {
  try {
    const result = await imagekit.files.upload({
      file: buffer,
      fileName: `${Date.now()}-${filename}`,
      folder: folder,
    });

    if (!result || !result.url) {
      throw new Error("ImageKit upload failed");
    }

    console.log("UPLOAD_SUCCESS", {
      url: result.url,
      fileId: result.fileId,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      ...result
    };
  } catch (error) {
    console.error("UPLOAD_FAILED", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Uploads large video files directly via HTTP (bypasses SDK timeout)
 * Uses a 30-minute timeout to handle very large files.
 */
export const uploadFromPath = async (filePath, { folder = "/videos", filename } = {}) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const FormData = (await import("form-data")).default;
    const axios = (await import("axios")).default;

    const fileStream = fs.createReadStream(filePath);
    const form = new FormData();

    const finalFileName = filename || path.basename(filePath);

    form.append("file", fileStream, { filename: finalFileName });
    form.append("fileName", finalFileName);
    form.append("folder", folder);

    // Build Basic Auth header from private key
    const authString = Buffer.from(`${config.IMAGEKIT_PRIVATE_KEY}:`).toString("base64");

    console.log(`📡 DIRECT_UPLOAD: Sending ${finalFileName} to ImageKit (no timeout limit)...`);

    const response = await axios.post(
      "https://upload.imagekit.io/api/v1/files/upload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Basic ${authString}`,
        },
        timeout: 30 * 60 * 1000, // 30 minutes — enough for any large video
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const result = response.data;
    if (!result || !result.url) {
      throw new Error("ImageKit upload returned no URL");
    }

    console.log(`✅ DIRECT_UPLOAD_SUCCESS: ${result.url}`);
    return result;

  } catch (error) {
    console.error("Large upload failed:", error.message || error);
    throw error;
  }
};

/**
 * Legacy compatibility name
 */
export const uploadToImageKit = async (file) => {
  return (await uploadFile({
    buffer: file.buffer,
    filename: file.originalname,
    folder: "/yt-clone"
  })).url;
};

/**
 * Deletes a file from ImageKit
 */
export const deleteFile = async (fileId) => {
  try {
    if (!fileId) return null;
    return await imagekit.files.delete(fileId);
  } catch (error) {
    console.error("Delete error:", error);
    return null;
  }
};

/**
 * Generates a signed URL for private assets
 */
export const getSignedUrl = (url) => {
  try {
    if (!url || !url.includes(config.IMAGEKIT_URL_ENDPOINT)) return url;

    // Extract path from full URL
    const path = url.split(config.IMAGEKIT_URL_ENDPOINT)[1];

    return imagekit.url({
      path: path,
      signed: true,
      expireSeconds: 3600 // 1 hour
    });
  } catch (e) {
    console.error("Signing error:", e);
    return url;
  }
};