import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { Loader } from "lucide-react";

const Protected = ({ children }) => {
  const { user, isAuthChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  // ⏳ Wait until auth is checked
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0c0c22]">
        <Loader className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  // ❌ Only redirect AFTER check, and remember where they were headed
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default Protected;