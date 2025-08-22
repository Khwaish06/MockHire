import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./components/home.jsx";
import Login from "./components/login.jsx";
import Signup from "./components/signup.jsx";
import InterviewSetup from "./components/InterviewSetup.jsx";
import InterviewSession from "./components/dummytest.jsx";
import InterviewSummary from "./components/InterviewSummary.jsx";


function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup" element={<InterviewSetup />} />
          <Route path="/interview/:interviewId" element={<InterviewSession />} />
          <Route path="/summary/:interviewId" element={<InterviewSummary />} />

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
