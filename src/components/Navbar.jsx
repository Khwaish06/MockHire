// src/components/Navbar.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <FontAwesomeIcon icon={faUserTie} className="icon" />
          <span className="brand-name">MockHire</span>
        </div>
        <p className="tagline">Your AI-Powered Interview Partner 🚀</p>
      </div>
    </nav>
  );
};

export default Navbar;
