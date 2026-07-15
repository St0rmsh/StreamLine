import axios from "axios";
import config from "../config/config.js";

const BASE_URL = "https://api.assemblyai.com/v2";

export async function transcribeVideo(audioUrl) {
    try {
        const cleanUrl = audioUrl.split("?")[0];
        console.log("📝 Sending to AssemblyAI:", cleanUrl);

        const { data } = await axios.post(
            `${BASE_URL}/transcript`,
            {
                audio_url: cleanUrl
            },
            {
                headers: {
                    authorization: config.ASSEMBLY_API_KEY
                }
            }
        );

        const transcriptId = data.id;

        // 🎯 Step 2: poll for result
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
            console.log("💡 Tip: AssemblyAI 400 usually means the URL is inaccessible or improperly formatted.");
        }
        return null;
    }
}