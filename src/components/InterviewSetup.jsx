// src/components/InterviewSetup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./interviewsetup.css";

const InterviewSetup = () => {
  const [role, setRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedRole = role === "custom" ? customRole.trim() : role;
    if (!selectedRole || !interviewType) {
      alert("Please fill all required fields.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("role", selectedRole);
    formData.append("interviewType", interviewType);
    formData.append("isCustomRole", role === "custom" ? "true" : "false");
    if (resume) formData.append("resume", resume);

    // ✅ Debug: log formData entries
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User token not found. Please log in again.");
      }

      const res = await axios.post("http://localhost:8000/api/interview/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const { videoUrl, interview } = res.data;

      navigate(`/interview/${interview._id}`, {
        state: { interviewId: interview._id, videoUrl },
      });
    } catch (err) {
      console.error("Interview creation error:", err.response?.data || err.message);
      alert("Failed to create interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="glass-card">
        <h2 className="main-title">Interview Setup</h2>
        <p className="subtitle">Select your preferences to begin</p>

        <form className="setup-form" onSubmit={handleSubmit}>
          <label>
            Select Role:
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">--Select--</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="fullstack">Fullstack</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {role === "custom" && (
            <label>
              Enter Custom Role:
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          )}

          <label>
            Interview Type:
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">--Select--</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Coding">Coding</option>
              <option value="Behavioral">Behavioral</option>
            </select>
          </label>

          <label>
            Upload Resume (optional):
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
              disabled={loading}
            />
            {resume && <p style={{ fontSize: "0.9rem", marginTop: "4px" }}>📄 {resume.name}</p>}
          </label>

          <button className="start-btn" type="submit" disabled={loading}>
            {loading ? "Starting..." : "Start Interview"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetup;

