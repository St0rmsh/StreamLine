import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx";
import { useEffect } from "react";
import { useAuth } from "../features/Auth/hook/useAuth";
import { useSelector } from "react-redux";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../features/Project/context/ThemeContext";

function App() {
  const { handleGetMe } = useAuth();
  const { loading, isAuthChecked } = useSelector((state) => state.auth);

  useEffect(() => {
    handleGetMe();
  }, []);

  // ⏳ Global loader only during the initial hydration check, not on every subsequent loading flag flip
  if (!isAuthChecked && loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#0c0c22]">
        <Loader className="animate-spin text-indigo-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;