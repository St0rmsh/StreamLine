import channelModel from "../models/channel.model.js";
import userModel from "../models/user.model.js";
import videoModel from "../models/video.model.js";
import { uploadFile, getSignedUrl } from "../services/storage.service.js";

/**
 * ✅ Create Channel
 */
export const createChannel = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        let { name, handle, description } = req.body;

        if (!name || !handle) {
            return res.status(400).json({ message: "Name and handle required" });
        }

        handle = handle.toLowerCase().trim();

        const handleRegex = /^[a-z0-9_]{3,30}$/;
        if (!handleRegex.test(handle)) {
            return res.status(400).json({
                message: "Handle must be 3-30 chars, lowercase, no spaces"
            });
        }

        const existingChannel = await channelModel.findOne({ owner: userId });
        if (existingChannel) {
            return res.status(400).json({ message: "User already has a channel" });
        }

        const handleExists = await channelModel.findOne({ handle });
        if (handleExists) {
            return res.status(409).json({ message: "Handle already taken" });
        }

        let avatarUrl = "";
        let bannerUrl = "";

        if (req.files?.avatar) {
            const uploaded = await uploadFile({
                buffer: req.files.avatar[0].buffer,
                filename: req.files.avatar[0].originalname,
                folder: "/channels/avatars"
            });
            avatarUrl = uploaded.url;
        }

        if (req.files?.banner) {
            const uploaded = await uploadFile({
                buffer: req.files.banner[0].buffer,
                filename: req.files.banner[0].originalname,
                folder: "/channels/banners"
            });
            bannerUrl = uploaded.url;
        }

        const channel = await channelModel.create({
            name,
            handle,
            description,
            avatar: avatarUrl,
            banner: bannerUrl,
            owner: userId
        });

        await userModel.findByIdAndUpdate(userId, {
            $set: { channel: channel._id }
        });

        return res.status(201).json({ success: true, channel });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * ✅ Get My Channel
 */
export const getMyChannel = async (req, res) => {
    try {
        const userId = req.user?._id;

        const channel = await channelModel.findOne({ owner: userId });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const doc = channel.toObject();
        doc.avatar = getSignedUrl(doc.avatar);
        doc.banner = getSignedUrl(doc.banner);

        return res.status(200).json({ success: true, channel: doc });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * ✅ Get Channel by Handle
 */
export const getChannelByHandle = async (req, res) => {
    try {
        const handle = req.params.handle.toLowerCase();

        const channel = await channelModel
            .findOne({ handle })
            .populate("owner", "username avatar");

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const doc = channel.toObject();
        doc.avatar = getSignedUrl(doc.avatar);
        doc.banner = getSignedUrl(doc.banner);

        return res.status(200).json({ success: true, channel: doc });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * ✅ Update Channel
 */
export const updateChannel = async (req, res) => {
  try {
    const userId = req.user?._id;

    const channel = await channelModel.findOne({ owner: userId });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const { name, description } = req.body;

    let avatarUrl = channel.avatar;
    let bannerUrl = channel.banner;

    if (req.files?.avatar) {
      const uploaded = await uploadFile({
        buffer: req.files.avatar[0].buffer,
        filename: req.files.avatar[0].originalname,
        folder: "/channels/avatars"
      });
      avatarUrl = uploaded.url;
    }

    if (req.files?.banner) {
      const uploaded = await uploadFile({
        buffer: req.files.banner[0].buffer,
        filename: req.files.banner[0].originalname,
        folder: "/channels/banners"
      });
      bannerUrl = uploaded.url;
    }

    const updated = await channelModel.findByIdAndUpdate(
      channel._id,
      {
        name: name?.trim(),
        description: description?.trim(),
        avatar: avatarUrl,
        banner: bannerUrl
      },
      { new: true }
    );

    // ✅ SYNC WITH USER MODEL
    await userModel.findByIdAndUpdate(userId, {
        avatar: avatarUrl,
        banner: bannerUrl
    });

    const doc = updated.toObject();
    doc.avatar = getSignedUrl(doc.avatar);
    doc.banner = getSignedUrl(doc.banner);

    return res.status(200).json({
      success: true,
      channel: doc
    });

  } catch (err) {
    console.error("Channel update error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


/**
 * ✅ Get Channel Videos
 */
export const getChannelVideos = async (req, res) => {
    try {
        const handle = req.params.handle.toLowerCase();

        const channel = await channelModel.findOne({ handle });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const userId = req.user?._id;
        const isOwner = userId && channel.owner.toString() === userId.toString();

        const query = { channel: channel._id, status: { $in: ["ready", null] } };
        if (!isOwner) {
            query.visibility = "public";
        }

        const videos = await videoModel.find(query).sort({ createdAt: -1 });

        const signedVideos = videos.map(v => {
            const doc = v.toObject();
            doc.videoUrl = getSignedUrl(doc.videoUrl);
            doc.thumbnail = getSignedUrl(doc.thumbnail);
            return doc;
        });

        return res.status(200).json({ success: true, videos: signedVideos });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};