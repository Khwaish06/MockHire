# 🧑‍💼 MockHire – AI-Powered Mock Interview Platform
> Practice AI-powered mock interviews tailored to your role & resume. Get real-time feedback, boost your confidence, and ace your next interview!

---

## 🎥 Demo  
Watch the full demo of MockHire in action:  
[▶️ View the demo video](https://drive.google.com/file/d/1hxNrIS17-LRcRfdOiq9xVYyr087ZenvX/view)

---

## ✨ Features

### 🔐 Authentication & Security
- Secure login using **Google OAuth**
- **JWT-based** authorization for session handling
- Traditional **email/password** signup option (if implemented)

### 🛠️ Interview Setup
- Role selection: *Frontend, Backend, Fullstack, HR, Technical, Behavioral, or Custom*
- Upload resume to tailor interview questions to your background
- Pick your interview type (e.g., technical, behavioral)

### 🎤 Interactive Interview Experience
- **AI-generated** questions (powered by **OpenAI API**)
- **Speech-to-text recognition**, allowing spoken responses
- Option to request **hints**
- Time-tracked like real interviews
- Built-in **coding editor** supporting JavaScript, Python, C++, Java

### 📊 AI Feedback & Scoring
- Real-time **analysis of spoken or written answers**
- Constructive **strengths & improvement feedback**
- Scores for each response, plus an overall **interview summary report**

### 🤖 Smart Integrations
- **OpenAI API** → Question generation & evaluation  
- **D-ID API** → AI interviewer avatars (if used in the project)  
- **Google OAuth** → Seamless login experience  
- **Speech-to-Text API** → Voice-based user interaction  

---

## 🖥️ Tech Stack

| Layer             | Technologies                                  |
|-------------------|-----------------------------------------------|
| Frontend          | React.js                                      |
| Backend/Auth      | Node.js, Express, JWT                        |
| AI / NLP          | OpenAI API, D-ID API (for avatars)           |
| Speech Processing | Speech-to-Text API (e.g., Google Cloud STT)  |
| Database          | MongoDB                                       |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo  
```bash
git clone https://github.com/Khwaish06/MockHire.git
cd MockHire
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
DID_API_KEY=your_did_api_key
# Optional if using MongoDB:
MONGODB_URI=your_mongodb_connection_string
```

### 4️⃣ Run the App
```bash
npm start
```

---

## 📜 License
This project is licensed under the MIT License.

---

## 👨‍💻 Credits
Built with ❤️ by **Khwaish Goel**

