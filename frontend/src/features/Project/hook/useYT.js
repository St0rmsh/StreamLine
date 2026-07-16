import { useDispatch, useSelector } from "react-redux";
import {
  fetchVideo,
  fetchVideos,
  fetchComments,
  createComment,
  removeComment,
  reactToCommentThunk,
  reactVideo,
  fetchUserReaction,
  applyRealtimeLikes,
  applyRealtimeCommentReaction,
  applyRealtimeNewComment,
  applyRealtimeReply,
  applyRealtimeViews
} from "../ytSlice";

export const useYT = () => {
  const dispatch = useDispatch();

  const videoState = useSelector((state) => state?.video);

  if (!videoState) {
    return {
      video: null,
      videos: [],
      comments: [],
      liked: false,
      disliked: false,
      videoLoading: false,
      videosLoading: false,
      commentsLoading: false,

      fetchVideo: () => {},
      fetchVideos: () => {},
      fetchComments: () => {},
      createComment: () => {},
      removeComment: () => {},
      reactToComment: () => {},
      reactVideo: () => {},
      fetchUserReaction: () => {},
      applyRealtimeLikes: () => {},
      applyRealtimeCommentReaction: () => {},
      applyRealtimeNewComment: () => {},
      applyRealtimeReply: () => {},
      applyRealtimeViews: () => {}
    };
  }

  return {
    video: videoState.video,
    videos: videoState.videos,
    comments: videoState.comments,
    liked: videoState.liked,
    disliked: videoState.disliked,
    videoLoading: videoState.videoLoading,
    videosLoading: videoState.videosLoading,
    commentsLoading: videoState.commentsLoading,

    fetchVideo: (id) => dispatch(fetchVideo(id)),
    fetchVideos: () => dispatch(fetchVideos()),
    fetchComments: (id) => dispatch(fetchComments(id)),
    createComment: (data) => dispatch(createComment(data)),
    removeComment: (data) => dispatch(removeComment(data)),
    reactToComment: (data) => dispatch(reactToCommentThunk(data)),
    reactVideo: (data) => dispatch(reactVideo(data)),
    fetchUserReaction: (id) => dispatch(fetchUserReaction(id)),

    applyRealtimeLikes: (data) => dispatch(applyRealtimeLikes(data)),
    applyRealtimeCommentReaction: (data) => dispatch(applyRealtimeCommentReaction(data)),
    applyRealtimeNewComment: (data) => dispatch(applyRealtimeNewComment(data)),
    applyRealtimeReply: (data) => dispatch(applyRealtimeReply(data)),
    applyRealtimeViews: (data) => dispatch(applyRealtimeViews(data))
  };
};