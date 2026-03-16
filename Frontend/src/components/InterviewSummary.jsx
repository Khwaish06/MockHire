
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./InterviewSummary.css";

const InterviewSummary = () => {
  const API = import.meta.env.VITE_BACKEND_URL;

  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [totalScore, setTotalScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState("");
  const [ques, setQues] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No auth token found");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API}/api/feedback/summary/${interviewId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setTotalScore(res.data.totalScore || 0);
        setAiFeedback(res.data.aiFeedback || "No feedback generated.");
        setQues(res.data.totalQuestions || 0);

      } catch (err) {
        console.error(
          "❌ Error fetching summary:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    if (API && interviewId) {
      fetchSummary();
    }
  }, [interviewId, API]);

  const getScoreColor = () => {
    if (ques === 0) return "red";

    const avg = totalScore / ques;

    if (avg >= 8) return "green";
    if (avg >= 5) return "yellow";
    return "red";
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="glass-card summary-card">
          <h2>Generating AI summary...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="glass-card summary-card">

        <h1 className="main-title">Interview Summary</h1>

        <div className={`score-circle ${getScoreColor()}`}>
          <span className="score-value">{totalScore}</span>
          <span className="score-label">Total Score</span>
        </div>

        <div className="ai-feedback-box">
          <h3>AI Feedback</h3>
          <p>{aiFeedback}</p>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>

      </div>
    </div>
  );
};

export default InterviewSummary;

