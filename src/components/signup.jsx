// src/components/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "./login.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleManualSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post("http://localhost:8000/api/user/register", {
        name,
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      navigate("/setup");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Signup failed.");
    }
  };

 const handleGoogleSignup = async (credentialResponse) => {
  try {
    const tokenId = credentialResponse.credential;

    const res = await axios.post("http://localhost:8000/api/user/google-login", {
      tokenId,
      mode: "signup",  // <- key part
    });

    localStorage.setItem("token", res.data.token);
    navigate("/setup");
  } catch (err) {
    setErrorMsg(err.response?.data?.error || "Google signup failed.");
  }
};


  return (
    <div className="login-container">
      <div className="glass-card">
        <h2 className="main-title">Join MockHire</h2>
        <p className="subtitle">Create your free account</p>

        <form onSubmit={handleManualSignup}>
          <input
            type="text"
            placeholder="Name"
            className="login-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <button type="submit" className="start-btn">
            Sign Up
          </button>
        </form>

        <div className="google-login">
          <p>or sign up with</p>
          <GoogleLogin onSuccess={handleGoogleSignup} onError={() => setErrorMsg("Google signup error")} />
        </div>

        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
