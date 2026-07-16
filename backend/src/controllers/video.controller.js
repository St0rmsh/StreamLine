import { uploadFile, uploadFromPath, getSignedUrl } from "../services/storage.service.js";
import videoModel from "../models/video.model.js";
import channelModel from "../models/channel.model.js";
import { SearchAndAskAI } from "../services/ai.service.js";
import { transcribeVideo } from "../services/transcription.service.js";
import { analyzeVideoForDeepFake } from "../services/VideoAi.service.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegpath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import fs from "fs";
import path from "path";
import { saveTempFile } from "../utils/save.temp.js";
import { convertToMp4 } from "../utils/convertVideo.js";

ffmpeg.setFfmpegPath(ffmpegpath);
ffmpeg.setFfprobePath(ffprobePath.path);

/** Safely delete a temp file */
const safeDelete = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn("⚠️ [CLEANUP] Could not delete:", filePath);
  }
};

/**
 * Background video processing — fire and forget.
 * Stream-based uploads, delete each file immediately after use.
 */
async function processVideoAsync({ videoId, tempVideoPath, title, description, fileName, thumbFileBuffer }) {
  console.log(`\n🎬 [PROCESS] Started for video ${videoId}`);
  let convertedPath = null;
  let tempThumbPath = null;

  try {
    await videoModel.findByIdAndUpdate(videoId, { status: "processing" });

    // 1. Convert to MP4
    console.log("🔄 [PROCESS] Converting to MP4...");
    convertedPath = await convertToMp4(tempVideoPath);
    safeDelete(tempVideoPath);

    // 2. Get duration
    const duration = await new Promise((resolve) => {
      ffmpeg.ffprobe(convertedPath, (err, meta) =>
        resolve(Math.floor(meta?.format?.duration || 0))
      );
    });

    // 3. Upload video
    console.log("📡 [PROCESS] Uploading video to ImageKit...");
    const uploadedVideo = await uploadFromPath(convertedPath, {
      filename: fileName.replace(/\.[^/.]+$/, ".mp4"),
      folder: "/videos"
    });
    safeDelete(convertedPath);
    convertedPath = null;
    console.log(`✅ [PROCESS] Video uploaded → ${uploadedVideo.url}`);

    // 4. Thumbnail
    let uploadedThumbnail;
    if (thumbFileBuffer) {
      uploadedThumbnail = await uploadFile({
        buffer: Buffer.from(thumbFileBuffer),
        filename: `thumb-${Date.now()}.png`,
        folder: "/thumbnails"
      });
    } else {
      uploadedThumbnail = { url: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" };
    }

    // 5. AI pipeline
    console.log("🤖 [PROCESS] Running AI pipeline...");
    const cleanUrl = uploadedVideo.url.split("?")[0];

    const [transcript, deepfakeScore] = await Promise.all([
      transcribeVideo(cleanUrl).catch(e => { console.warn("⚠️ Transcription:", e.message); return ""; }),
      analyzeVideoForDeepFake(cleanUrl).catch(e => { console.warn("⚠️ Deepfake:", e.message); return 0; })
    ]);

    const ai = await SearchAndAskAI({ title, description, transcript, deepfakeScore })
      .catch(e => { console.warn("⚠️ AI:", e.message); return { data: {} }; });
    const aiData = ai?.data || {};

    // 6. Mark ready
    await videoModel.findByIdAndUpdate(videoId, {
      videoUrl: uploadedVideo.url,
      thumbnail: uploadedThumbnail?.url,
      duration,
      isPublished: true,
      status: "ready",
      transcript,
      deepfakeScore,
      verification: { ...aiData, checkedAt: new Date() },
      aiGenerated: {
        isAi: aiData.aiDetection?.isAi || false,
        modelUsed: aiData.aiDetection?.modelUsed || "",
        confidence: aiData.aiDetection?.confidence || 0
      },
      trustScore: aiData.trustMeter?.score || 0,
      isFlagged: aiData.moderation?.isFlagged || false,
      flagReason: aiData.moderation?.reasons?.join(" | ") || null
    });

    console.log(`🎊 [PROCESS] Video ${videoId} is READY\n`);

  } catch (error) {
    console.error(`❌ [PROCESS] Failed for ${videoId}:`, error.message);
    await videoModel.findByIdAndUpdate(videoId, { status: "failed" });
  } finally {
    safeDelete(tempVideoPath);
    safeDelete(convertedPath);
    safeDelete(tempThumbPath);
  }
}

/**
 * ⚡️ UPLOAD VIDEO
 */
export const videoUpload = async (req, res) => {
  let tempVideoPath;

  try {
    const { title, description, isAiGenerated } = req.body;
    const file = req.files?.video?.[0];
    const thumbFile = req.files?.thumbnail?.[0];

    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    if (!req.user?.channel) return res.status(400).json({ message: "Create a channel first" });
    if (!file) return res.status(400).json({ message: "Video file is required" });
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    tempVideoPath = await saveTempFile(file.buffer, fileName);

    const video = await videoModel.create({
      title: title.trim(),
      description: description || "",
      isAiGenerated: isAiGenerated === "true" || isAiGenerated === true,
      videoUrl: "",
      thumbnail: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop",
      duration: 0,
      channel: req.user.channel,
      uploader: req.user._id,
      isPublished: false,
      status: "uploading"
    });

    await channelModel.findByIdAndUpdate(req.user.channel, { $inc: { videosCount: 1 } });

    processVideoAsync({
      videoId: video._id,
      tempVideoPath,
      title: title.trim(),
      description: description || "",
      fileName,
      thumbFileBuffer: thumbFile ? thumbFile.buffer : null
    });

    console.log(`✅ [UPLOAD] Video ${video._id} queued for background processing`);

    return res.status(201).json({
      success: true,
      message: "Video received. Processing in background.",
      video
    });

  } catch (err) {
    console.error("❌ [UPLOAD] Error:", err.message);
    safeDelete(tempVideoPath);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getVideo = async (req, res) => {
  try {
    const userId = req.user?._id;

    const video = await videoModel
      .findById(req.params.id)
      .populate("channel", "name handle avatar");

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.visibility === "private") {
      const isOwner = userId && video.uploader.toString() === userId.toString();
      if (!isOwner) {
        return res.status(403).json({
          message: "Access Denied: Private Signal"
        });
      }
    }

    video.videoUrl = getSignedUrl(video.videoUrl);
    video.thumbnail = getSignedUrl(video.thumbnail);
    if (video.hlsUrl) video.hlsUrl = getSignedUrl(video.hlsUrl);

    return res.status(200).json({ success: true, video });

  } catch (err) {
    console.error("Get video error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const userId = req.user?._id;

    const query = { status: { $in: ["ready", null] } };
    if (userId) {
      query.$or = [
        { visibility: "public", status: { $in: ["ready", null] } },
        { uploader: userId }
      ];
    } else {
      query.visibility = "public";
      query.status = { $in: ["ready", null] };
    }

    const videos = await videoModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name handle avatar");

    const total = await videoModel.countDocuments(query);

    const signedVideos = videos.map(v => {
      const doc = v.toObject();
      doc.videoUrl = getSignedUrl(doc.videoUrl);
      doc.thumbnail = getSignedUrl(doc.thumbnail);
      if (doc.hlsUrl) doc.hlsUrl = getSignedUrl(doc.hlsUrl);
      return doc;
    });

    return res.status(200).json({
      success: true,
      videos: signedVideos,
      page,
      total,
      hasMore: skip + videos.length < total
    });

  } catch (err) {
    console.error("Get all videos error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyVideos = async (req, res) => {
  try {
    const userId = req.user._id;
    const videos = await videoModel.find({ uploader: userId }).sort({ createdAt: -1 });
    const signedVideos = videos.map(v => {
      const doc = v.toObject();
      doc.videoUrl = getSignedUrl(doc.videoUrl);
      doc.thumbnail = getSignedUrl(doc.thumbnail);
      return doc;
    });
    return res.json({ success: true, videos: signedVideos });
  } catch (err) {
    console.error("Get my videos error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchVideos = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) return res.json({ success: true, videos: [] });

    const userId = req.user?._id;
    const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const query = {
      status: { $in: ["ready", null] },
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    };

    if (userId) {
      query.$and = [
        { $or: [{ visibility: "public" }, { uploader: userId }] }
      ];
    } else {
      query.visibility = "public";
    }

    const videos = await videoModel.find(query)
      .populate("channel", "name handle avatar")
      .limit(20);

    const signedVideos = videos.map(v => {
      const doc = v.toObject();
      doc.videoUrl = getSignedUrl(doc.videoUrl);
      doc.thumbnail = getSignedUrl(doc.thumbnail);
      return doc;
    });

    return res.status(200).json({ success: true, videos: signedVideos });

  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const deleteVideo = async (req, res) => {
  try {
    const video = await videoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await videoModel.findByIdAndDelete(req.params.id);

    if (video.channel) {
      await channelModel.findByIdAndUpdate(video.channel, { $inc: { videosCount: -1 } });
    }

    return res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    console.error("Delete video error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTrendingVideos = async (req, res) => {
  try {
    const videos = await videoModel.aggregate([
      { $match: { status: { $in: ["ready", null] }, visibility: "public" } },
      { $addFields: { score: { $add: ["$views", { $multiply: ["$likesCount", 2] }] } } },
      { $sort: { score: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "channels",
          localField: "channel",
          foreignField: "_id",
          as: "channel"
        }
      },
      { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } }
    ]);

    const signedVideos = videos.map(v => {
      v.videoUrl = getSignedUrl(v.videoUrl);
      v.thumbnail = getSignedUrl(v.thumbnail);
      return v;
    });
    return res.json({ success: true, videos: signedVideos });
  } catch (err) {
    console.error("Trending error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




/**
 * 🛠 UPDATE VIDEO (Studio metadata edit)
 */
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, visibility, isPublished } = req.body;
    const thumbFile = req.file;

    const video = await videoModel.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized edit attempt" });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (visibility) updates.visibility = visibility;
    if (isPublished !== undefined) updates.isPublished = isPublished === "true" || isPublished === true;

    if (thumbFile) {
      const uploaded = await uploadFile({
        buffer: thumbFile.buffer,
        filename: `update-${Date.now()}-${thumbFile.originalname}`,
        folder: "/thumbnails"
      });
      updates.thumbnail = uploaded.url;
    }

    const updatedVideo = await videoModel.findByIdAndUpdate(id, updates, { new: true });

    const doc = updatedVideo.toObject();
    doc.videoUrl = getSignedUrl(doc.videoUrl);
    doc.thumbnail = getSignedUrl(doc.thumbnail);

    return res.json({
      success: true,
      message: "Archives updated successfully",
      video: doc
    });

  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};