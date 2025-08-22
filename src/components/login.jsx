import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post("http://localhost:8000/api/user/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/setup");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Login failed. Try again.");
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // fetch profile from Google
        const googleUser = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userProfile = googleUser.data; // contains email, name, sub (googleId), etc.

        const res = await axios.post("http://localhost:8000/api/user/google-login", {
          name: userProfile.name,
          email: userProfile.email,
          googleId: userProfile.sub,
          mode: "login",
        });

        localStorage.setItem("token", res.data.token);
        navigate("/setup");
      } catch (err) {
        setErrorMsg("Google login failed.");
        console.error(err);
      }
    },
    onError: () => setErrorMsg("Google login failed."),
    flow: "implicit",
  });

  return (
    <div className="login-container">
      <div className="glass-card">
        <h2 className="main-title">Welcome Back!</h2>
        <p className="subtitle">Log in to continue your mock interviews</p>

        <form onSubmit={handleManualLogin}>
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errorMsg && <p className="error-text">{errorMsg}</p>}
          <button type="submit" className="start-btn">Log In</button>
        </form>

        <div className="google-login">
          <p>or log in with</p>
          <button className="google-btn" onClick={loginWithGoogle}>
            Log in with Google
          </button>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
