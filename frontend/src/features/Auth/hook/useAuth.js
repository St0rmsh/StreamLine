import { useDispatch } from "react-redux";
import { setUser, setLoading, setError, setAuthChecked } from "../authSlice";
import { loginUser, registerUser, getMe, logoutUser, verifyOTP, resendOtp } from "../service/api.service";
import { toast } from "react-hot-toast";



export const useAuth = () => {

  const dispatch = useDispatch();


  const handleRegister = async ({ name, username, email, password }) => {
    try {
      dispatch(setLoading(true));
      const response = await registerUser({ name, username, email, password });

      toast.success("Registration successful!");
      return response;

    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toast.error(message);
      dispatch(setError(message));

      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };


  const handleLogin = async ({ email, password }) => {
    try {
      dispatch(setLoading(true));
      const response = await loginUser({ email, password });
      dispatch(setUser(response.user));
      toast.success("Login successful!");
      return response;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toast.error(message);
      dispatch(setError(message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  const handleLogout = async () => {
    try {
      dispatch(setLoading(true));
      const response = await logoutUser();
      dispatch(setUser(null));
      toast.success("Logged out successfully");
      return response;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to log out";
      toast.error(message);
      dispatch(setError(error));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  const handleGetMe = async () => {
    try {
      dispatch(setLoading(true));

      const res = await getMe();

      dispatch(setUser(res.user));
    } catch (err) {
      dispatch(setUser(null));
    } finally {
      dispatch(setLoading(false));
      dispatch(setAuthChecked(true));
    }
  };

  const handleVerifyOTP = async ({ email, otp }) => {
    try {
      dispatch(setLoading(true));
      const response = await verifyOTP({ email, otp });
      dispatch(setUser(response.user));
      toast.success("OTP Verified Successfully!");
      return response;
    } catch (error) {
      const message = error?.response?.data?.message || "Invalid OTP";
      toast.error(message);
      dispatch(setError(error));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  const handleResendOTP = async (email) => {
    try {
      const response = await resendOtp(email);
      toast.success("New code sent");
      return response;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to resend code";
      toast.error(message);
      throw error;
    }
  }

  return {
    handleRegister,
    handleLogin,
    handleLogout,
    handleGetMe,
    handleVerifyOTP,
    handleResendOTP
  }
}