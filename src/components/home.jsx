// src/components/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';
import Navbar from "./Navbar.jsx"; // Import the Navbar component
import "./home.css";

const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleDrag = () => {
    navigate("/setup");
  };

  return (
    <>
      <Navbar /> {/* Navbar placed at the top */}
      <div className="home-container">
        <div className="glass-card">
          <h1 className="main-title">
            <FontAwesomeIcon icon={faUserTie} /> Welcome to MockHire
          </h1>
          <p className="subtitle">
            Practice AI-powered mock interviews based on your role & resume.
            Boost your confidence!
          </p>

          {!isLoggedIn ? (
            <button className="start-btn" onClick={handleGetStarted}>
              Get Started
            </button>
          ) : (
            <>
              <button className="start-btn" onClick={handleLogout}>
                Logout
              </button>
              <button className="start-btn" onClick={handleDrag}>
                Schedule Interview
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
