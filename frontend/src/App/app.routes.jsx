import { createBrowserRouter } from "react-router-dom";

import Login from "../features/Auth/pages/Login";
import Register from "../features/Auth/pages/Register";
import VerifyOTP from "../features/Auth/pages/VerifyOTP";

import Layout from "../features/Project/components/layout/Layout";
import Home from "../features/Project/pages/Home";
import VideoPages from "../features/Project/pages/VideoPages";
import Dashboard from "../features/Project/pages/Dashboard";
import UploadPage from "../features/Project/pages/UploadPage";
import ChannelPage from "../features/Project/pages/ChannelPage";
import SearchPage from "../features/Project/pages/Search";
import ExplorePage from "../features/Project/pages/ExplorePage";
import SubscriptionsPage from "../features/Project/pages/SubscriptionsPage";
import HistoryPage from "../features/Project/pages/HistoryPage";
import Error from "../features/Project/components/layout/Error";
import Protected from "../features/Auth/components/Protected";

export const router = createBrowserRouter([

  // 🔓 PUBLIC AUTH ROUTES
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />
  },

  // 🌐 MAIN APP (public + optionally-auth pages)
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "video/:id", element: <VideoPages /> },
      { path: "search", element: <SearchPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "channel/:handle", element: <ChannelPage /> },
    ],
  },

  // 🔒 PROTECTED ROUTES (require login)
  {
    path: "/",
    element: (
      <Protected>
        <Layout />
      </Protected>
    ),
    children: [
      { path: "studio", element: <Dashboard /> },
      { path: "upload", element: <UploadPage /> },
      { path: "subscriptions", element: <SubscriptionsPage /> },
      { path: "history", element: <HistoryPage /> },
    ],
  },

  {
    path: "*",
    element: <Error />
  }

]);