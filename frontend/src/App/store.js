import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/Auth/authSlice.js";
import videoReducer from "../features/Project/ytSlice.js";

export const store = configureStore({
  reducer: {
    video: videoReducer,
    auth: authReducer,
  }
})