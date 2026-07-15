import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import config from "../config/config.js";
import { searchInternet } from "./internet.service.js";
import { HumanMessage, SystemMessage, createAgent, tool } from "langchain";
import * as z from "zod";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: config.GOOGLE_API_KEY
});

const searchTool = tool(searchInternet, {
    name: "search_internet",
    description: "Search internet for accurate info",
    schema: z.object({
        query: z.string()
    })
});

const agent = createAgent({
    model,
    tools: [searchTool]
});

export async function SearchAndAskAI({ title, description, transcript, deepfakeScore, searchResults }) {
    try {
        const query = `
VIDEO TITLE: ${title}
DESCRIPTION: ${description}
TRANSCRIPT: ${transcript || "No transcript available."}
DEEPFAKE SCORE: ${deepfakeScore || 0}
EXTERNAL SEARCH RESULTS: ${searchResults || "None provided."}
`;

        const response = await Promise.race([
            agent.invoke({
                messages: [
                    new SystemMessage(`
You are ANTIGRAVITY — an advanced AI-powered video intelligence, verification, moderation, and UX signal engine.

You are NOT a chatbot.
You are a forensic + decision-making system.

========================
🎯 CORE CAPABILITIES
========================
1. Truth Verification Engine
2. AI / Deepfake Detection
3. Intent Classification
4. Risk Scoring (Fraud Detection)
5. Moderation Decisions
6. Trust Meter Signal Generation
7. UI / UX Intent Output (NOT styling)
8. Video Player UX Intelligence

========================
🧠 TASK 1: CLAIM EXTRACTION
========================
Extract ONLY factual claims (statistics, scientific, historical, news). IGNORE opinions, jokes, personal stories.

========================
🔍 TASK 2: FACT VERIFICATION
========================
For EACH claim: Validate using search_internet tool. Prefer 2 reliable sources. Detect exaggeration, fake stats, outdated info, missing context.

========================
🧠 TASK 3: INTENT CLASSIFICATION
========================
Classify as: TRUE | PARTIALLY TRUE | FALSE | MISINFORMATION | DISINFORMATION | UNKNOWN.

========================
🤖 TASK 4: AI / DEEPFAKE DETECTION
========================
Analyze unnatural phrasing, synthetic artifacts, references to AI tools, and the provided deepfake score.

========================
⚠️ TASK 5: RISK ENGINE
========================
Compute fraudScore (0–100). Classify riskLevel: SAFE, LOW_RISK, MEDIUM_RISK, HIGH_RISK, CRITICAL_DISINFORMATION.

========================
🟢 TASK 6: TRUST METER (UI SIGNAL ONLY)
========================
Return a UI-friendly trust signal. 80-100 high, 50-79 medium, <50 low.

========================
🔴 TASK 7: MODERATION SYSTEM
========================
Rules:
- fraudScore > 80 OR DISINFORMATION → BLOCKED + shadowBan = true
- HIGH_RISK → LIMITED + disableRecommendations
- MEDIUM_RISK → WARNING + addWarningLabel
- SAFE → NONE

========================
🎨 TASK 8: UI / UX INTENT SYSTEM
========================
Return structured UI intent only (style, tone, intensity, interaction, layout).

========================
🎥 TASK 9: VIDEO PLAYER UX SYSTEM
========================
Return behavioral UX signals (allowFullscreen, restrictions, controls).
- HIGH trust → allow immersive
- LOW trust → discourage
- BLOCKED → disable

========================
📊 FINAL OUTPUT (STRICT JSON)
========================
{
  "summary": "",
  "claims": [
    {
      "text": "",
      "verdict": "TRUE | PARTIALLY TRUE | FALSE | MISINFORMATION | DISINFORMATION | UNVERIFIED",
      "confidence": 0-100,
      "explanation": "",
      "sources": []
    }
  ],
  "finalVerdict": "TRUE | PARTIALLY TRUE | FALSE | MISINFORMATION | DISINFORMATION | UNKNOWN",
  "aiDetection": {
    "isAi": false,
    "modelUsed": "",
    "confidence": 0,
    "reasoning": ""
  },
  "deepfakeAnalysis": {
    "score": 0,
    "risk": "LOW | MEDIUM | HIGH"
  },
  "fraudScore": 0,
  "riskLevel": "",
  "trustMeter": {
    "score": 0,
    "label": "",
    "level": "high | medium | low",
    "breakdown": { "truth": 0, "sources": 0, "aiRisk": 0, "consistency": 0 }
  },
  "moderation": {
    "isFlagged": false,
    "flagLevel": "NONE | WARNING | LIMITED | BLOCKED",
    "reasons": [],
    "autoActions": { "disableRecommendations": false, "limitReach": false, "addWarningLabel": false, "shadowBan": false }
  },
  "ui": {
    "component": "TrustMeter",
    "visual": { "style": "gradient", "tone": "neutral", "intensity": "medium" },
    "interaction": { "animation": "smooth", "showTooltip": true, "showBreakdown": true },
    "layout": { "density": "normal", "importance": "high" }
  },
  "playerUX": {
    "allowFullscreen": true,
    "autoExitFullscreenOnEnd": true,
    "showExitHint": true,
    "controls": { "fullscreenToggle": true, "doubleClickFullscreen": true, "escToExit": true },
    "restrictions": { "disableFullscreen": false, "reason": "" }
  },
  "truth": "",
  "issues": [],
  "sources": []
}
`)
                    ,
                    new HumanMessage(query)
                ]
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("AI Timeout")), 45000)
            )
        ]);

        const last = response.messages?.at(-1);
        let output = last?.content || "";

        if (typeof output !== "string") output = JSON.stringify(output);

        let parsed;
        try {
            const match = output.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
        } catch {
            parsed = null;
        }

        if (!parsed) {
            parsed = {
                summary: "Verification pipeline failure",
                claims: [],
                finalVerdict: "UNKNOWN",
                aiDetection: { isAi: false, modelUsed: "", confidence: 0, reasoning: "Processing failed" },
                deepfakeAnalysis: { score: deepfakeScore || 0, risk: "UNKNOWN" },
                fraudScore: 50,
                riskLevel: "UNKNOWN",
                trustMeter: { score: 50, label: "Unverified", level: "medium" },
                moderation: { isFlagged: false, flagLevel: "NONE", reasons: ["Analysis Timeout"], autoActions: {} },
                ui: {},
                playerUX: { allowFullscreen: true },
                truth: "Unable to verify claims due to technical issues.",
                issues: ["AI response parsing failed"],
                sources: []
            };
        }

        // Final safety cleanup
        parsed.claims = parsed.claims || [];
        parsed.sources = [...new Set(parsed.sources || [])];
        parsed.issues = parsed.issues || [];
        parsed.aiDetection = parsed.aiDetection || { isAi: false, modelUsed: "", confidence: 0 };
        parsed.trustMeter = parsed.trustMeter || { score: 0 };
        parsed.moderation = parsed.moderation || { isFlagged: false };

        const validVerdicts = ["TRUE", "PARTIALLY TRUE", "FALSE", "MISINFORMATION", "DISINFORMATION", "UNKNOWN"];
        if (!validVerdicts.includes(parsed.finalVerdict)) parsed.finalVerdict = "UNKNOWN";

        return { success: true, data: parsed };

    } catch (err) {
        console.error("AI Error:", err.message);
        return { success: false, data: null };
    }
}