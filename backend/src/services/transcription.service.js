import axios from "axios";
import fs from "fs";
import config from "../config/config.js";

const BASE_URL = "https://api.assemblyai.com/v2";

/**
 * Uploads a local file directly to AssemblyAI's own storage and returns
 * their internal upload URL. This avoids routing through ImageKit for
 * transcription, which was consuming ImageKit's video transformation
 * quota on every single upload.
 */
async function uploadToAssemblyAI(localFilePath) {
    const fileStream = fs.createReadStream(localFilePath);

    const { data } = await axios.post(
        `${BASE_URL}/upload`,
        fileStream,
        {
            headers: {
                authorization: config.ASSEMBLY_API_KEY,
                "content-type": "application/octet-stream"
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }
    );

    if (!data?.upload_url) {
        throw new Error("AssemblyAI upload did not return an upload_url");
    }

    return data.upload_url;
}

/**
 * Transcribes a LOCAL video/audio file.
 * IMPORTANT: This must be called while the local converted file still
 * exists, i.e. before it's deleted post-upload — same pattern as
 * deepfake analysis.
 */
export async function transcribeVideo(localFilePath) {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            console.warn("⚠️ [TRANSCRIBE] Local file missing, skipping:", localFilePath);
            return "";
        }

        console.log("📝 Uploading to AssemblyAI:", localFilePath);
        const uploadUrl = await uploadToAssemblyAI(localFilePath);

        const { data } = await axios.post(
            `${BASE_URL}/transcript`,
            {
                audio_url: uploadUrl
            },
            {
                headers: {
                    authorization: config.ASSEMBLY_API_KEY
                }
            }
        );

        const transcriptId = data.id;

        // Poll for result
        const maxAttempts = 60; // ~3 minutes at 3s intervals
        let attempts = 0;

        while (attempts < maxAttempts) {
            const res = await axios.get(
                `${BASE_URL}/transcript/${transcriptId}`,
                {
                    headers: {
                        authorization: config.ASSEMBLY_API_KEY
                    }
                }
            );

            if (res.data.status === "completed") {
                return res.data.text;
            }

            if (res.data.status === "error") {
                throw new Error(res.data.error || "Transcription failed");
            }

            attempts++;
            await new Promise(r => setTimeout(r, 3000));
        }

        throw new Error("Transcription timed out after polling limit");

    } catch (err) {
        console.error("Transcription error:", err.response?.data?.error || err.message);
        if (err.response?.status === 400) {
            console.log("💡 Tip: AssemblyAI 400 usually means the file is inaccessible or improperly formatted.");
        }
        return "";
    }
}