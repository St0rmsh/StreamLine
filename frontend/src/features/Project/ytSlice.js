import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getVideoById,
  getAllVideos,
  addComment,
  getComments,
  toggleReaction,
  getUserReaction,
  deleteComment as deleteCommentApi,
  reactToComment as reactToCommentApi
} from "./services/ytapi.service";

// FETCH VIDEO
export const fetchVideo = createAsyncThunk(
  "video/fetchVideo",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getVideoById(id);
      return res.data.video;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// FETCH VIDEOS
export const fetchVideos = createAsyncThunk("video/fetchVideos", async (_, { rejectWithValue }) => {
  try {
    const res = await getAllVideos();
    return res.data.videos || [];
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

// FETCH COMMENTS
export const fetchComments = createAsyncThunk(
  "video/fetchComments",
  async (videoId, { rejectWithValue }) => {
    try {
      const res = await getComments(videoId);
      return res.data.comments || [];
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// ADD COMMENT (top-level or reply)
export const createComment = createAsyncThunk(
  "video/createComment",
  async ({ videoId, text, parentId = null }, { rejectWithValue }) => {
    try {
      const res = await addComment(videoId, text, parentId);
      return { comment: res.data.comment, parentId };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// DELETE COMMENT
export const removeComment = createAsyncThunk(
  "video/removeComment",
  async ({ commentId, parentId = null }, { rejectWithValue }) => {
    try {
      await deleteCommentApi(commentId);
      return { commentId, parentId };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// REACT TO COMMENT
export const reactToCommentThunk = createAsyncThunk(
  "video/reactToComment",
  async ({ commentId, emoji, parentId = null }, { rejectWithValue }) => {
    try {
      const res = await reactToCommentApi(commentId, emoji);
      return { commentId, parentId, reactions: res.data.reactions, userReaction: res.data.userReaction };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// REACT TO VIDEO (like/dislike)
export const reactVideo = createAsyncThunk(
  "video/reactVideo",
  async ({ videoId, type }, { rejectWithValue }) => {
    try {
      const res = await toggleReaction(videoId, type);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// USER REACTION
export const fetchUserReaction = createAsyncThunk(
  "video/fetchUserReaction",
  async (videoId, { rejectWithValue }) => {
    try {
      const res = await getUserReaction(videoId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const videoSlice = createSlice({
  name: "video",
  initialState: {
    video: null,
    videos: [],
    comments: [],
    liked: false,
    disliked: false,
    videoLoading: false,
    videosLoading: false,
    commentsLoading: false
  },

  reducers: {
    // 🔌 Socket-driven realtime updates (dispatched from components listening to sockets)
    applyRealtimeLikes: (state, action) => {
      const { likes, dislikes } = action.payload;
      if (state.video) {
        state.video.likesCount = likes;
        state.video.dislikesCount = dislikes;
      }
    },
    applyRealtimeCommentReaction: (state, action) => {
      const { commentId, reactions } = action.payload;
      const target = state.comments.find((c) => c._id === commentId);
      if (target) target.reactions = reactions;
      else {
        for (const c of state.comments) {
          const reply = c.replies?.find((r) => r._id === commentId);
          if (reply) { reply.reactions = reactions; break; }
        }
      }
    },
    applyRealtimeNewComment: (state, action) => {
      const { comment } = action.payload;
      if (!state.comments.some((c) => c._id === comment._id)) {
        state.comments.unshift({ ...comment, replies: [] });
      }
    },
    applyRealtimeReply: (state, action) => {
      const { comment, parentId } = action.payload;
      const parent = state.comments.find((c) => c._id === parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        if (!parent.replies.some((r) => r._id === comment._id)) {
          parent.replies.push(comment);
        }
      }
    },
    applyRealtimeViews: (state, action) => {
      if (state.video) state.video.views = action.payload.views;
    }
  },

  extraReducers: (builder) => {
    builder
      // fetchVideo
      .addCase(fetchVideo.pending, (state) => {
        state.video = null;
        state.videoLoading = true;
      })
      .addCase(fetchVideo.fulfilled, (state, action) => {
        state.videoLoading = false;
        const videoData = action.payload;
        if (!videoData?._id) {
          console.error("❌ Invalid video format:", videoData);
          return;
        }
        state.video = { ...videoData };
      })
      .addCase(fetchVideo.rejected, (state) => {
        state.videoLoading = false;
      })

      // fetchVideos
      .addCase(fetchVideos.pending, (state) => {
        state.videosLoading = true;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.videosLoading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state) => {
        state.videosLoading = false;
      })

      // fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state) => {
        state.commentsLoading = false;
      })

      // createComment
      .addCase(createComment.fulfilled, (state, action) => {
        const { comment, parentId } = action.payload;
        if (parentId) {
          const parent = state.comments.find((c) => c._id === parentId);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          state.comments.unshift({ ...comment, replies: [] });
        }
      })

      // removeComment
      .addCase(removeComment.fulfilled, (state, action) => {
        const { commentId, parentId } = action.payload;
        if (parentId) {
          const parent = state.comments.find((c) => c._id === parentId);
          if (parent) parent.replies = parent.replies.filter((r) => r._id !== commentId);
        } else {
          state.comments = state.comments.filter((c) => c._id !== commentId);
        }
      })

      // reactToCommentThunk
      .addCase(reactToCommentThunk.fulfilled, (state, action) => {
        const { commentId, parentId, reactions } = action.payload;
        if (parentId) {
          const parent = state.comments.find((c) => c._id === parentId);
          const reply = parent?.replies?.find((r) => r._id === commentId);
          if (reply) reply.reactions = reactions;
        } else {
          const target = state.comments.find((c) => c._id === commentId);
          if (target) target.reactions = reactions;
        }
      })

      // reactVideo
      .addCase(reactVideo.fulfilled, (state, action) => {
        const { likes, dislikes, userReaction } = action.payload;
        if (state.video) {
          state.video.likesCount = likes;
          state.video.dislikesCount = dislikes;
        }
        state.liked = userReaction === "LIKE";
        state.disliked = userReaction === "DISLIKE";
      })

      // fetchUserReaction
      .addCase(fetchUserReaction.fulfilled, (state, action) => {
        const r = action.payload?.reaction;
        state.liked = r === "LIKE";
        state.disliked = r === "DISLIKE";
      });
  }
});

export const {
  applyRealtimeLikes,
  applyRealtimeCommentReaction,
  applyRealtimeNewComment,
  applyRealtimeReply,
  applyRealtimeViews
} = videoSlice.actions;

export default videoSlice.reducer;