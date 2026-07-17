import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && !window.location.pathname.includes("/login")) {
        }
        return Promise.reject(err);
    }
);


// =======================
// 🎥 VIDEO APIs
// =======================

export const uploadVideo = (formData, config = {}) => {
    return api.post("/api/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config
    });
};

export const getMyVideos = () => {
    return api.get("/api/video/me");
};

export const getAllVideos = () => {
    return api.get("/api/video");
};

export const getTrendingVideos = () => {
    return api.get("/api/video/trending");
};

export const searchVideos = (query) => {
    return api.get(`/api/video/search?q=${encodeURIComponent(query)}`);
};

export const getVideoById = (id) => {
    return api.get(`/api/video/${id}`);
};

export const addView = (videoId) => {
    return api.post(`/api/video/${videoId}/view`);
};

export const updateWatchTime = async (videoId, time, duration) => {
    return api.post(`/api/video/${videoId}/watch`, {
        videoId,
        time,
        duration
    });
};

export const getWatchTime = (videoId) => {
    return api.get(`/api/video/${videoId}/watch`);
};

export const updateVideo = (id, data) => {
    const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    return api.patch(`/api/video/${id}`, data, { headers });
};

export const deleteVideo = (id) => {
    return api.delete(`/api/video/${id}`);
};

export const getStudioStats = () => {
    return api.get("/api/analytics/studio");
};



export const getSubscriptionsFeed = () => {
    return api.get("/api/subscription/feed");
};

export const getWatchHistory = () => {
    return api.get("/api/video/history");
};

export const clearWatchHistory = () => {
    return api.delete("/api/video/history");
};

export const removeWatchHistoryEntry = (entryId) => {
    return api.delete(`/api/video/history/${entryId}`);
};


// =======================
// 💬 COMMENT APIs
// =======================

export const addComment = (videoId, text, parentId = null) => {
    return api.post(`/api/comment/${videoId}/comment`, { text, parentId });
};

export const getComments = (videoId) => {
    return api.get(`/api/comment/${videoId}`);
};

export const deleteComment = (commentId) => {
    return api.delete(`/api/comment/${commentId}`);
};

export const reactToComment = (commentId, emoji) =>
    api.post(`/api/comment/${commentId}/react`, { emoji });

// Creator dashboard: recent top-level comments across ALL of the creator's own videos
export const getCreatorRecentComments = (limit = 6) => {
    return api.get(`/api/comment/creator/recent?limit=${limit}`);
};


// =======================
// ❤️ LIKE / REACTION APIs
// =======================

export const toggleReaction = (videoId, type) => {
    return api.post(`/api/like/${videoId}/react`, { type });
};

export const getUserReaction = (videoId) => {
    return api.get(`/api/like/${videoId}/me`);
};


// =======================
// 📺 CHANNEL APIs
// =======================

export const createChannel = (formData) => {
    return api.post("/api/channel/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export const getMyChannel = () => {
    return api.get("/api/channel/me");
};

export const getChannelByHandle = (handle) => {
    return api.get(`/api/channel/${handle}`);
};

export const getChannelVideos = (handle) => {
    return api.get(`/api/channel/${handle}/videos`);
};

export const updateChannel = (formData) => {
    return api.put("/api/channel/update", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
};


// =======================
// 🔔 SUBSCRIPTION APIs
// =======================

export const toggleSubscribe = (channelId) => {
    return api.post(`/api/subscription/${channelId}/toggle`);
};

export const getSubscribersCount = (channelId) => {
    return api.get(`/api/subscription/${channelId}/count`);
};

export const getUserSubscriptions = () => {
    return api.get("/api/subscription/me");
};

export const getChannelSubscribers = (channelId) => {
    return api.get(`/api/subscription/${channelId}/list`);
};

export const isSubscribed = (channelId) => {
    return api.get(`/api/subscription/${channelId}/is-subscribed`);
};

export default api;