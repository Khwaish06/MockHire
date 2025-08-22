MockHire – AI-Powered Mock Interview Platform

Practice AI-powered mock interviews tailored to your role & resume. Get real-time feedback, boost your confidence, and ace your next interview!

Demo

Watch the full demo of MockHire in action:
View the demo video

(Tip: Embed a GIF or screenshot here as well to make the README more visually engaging.)

Features
Authentication & Security

Secure login using Google OAuth

JWT-based authorization for session handling

Traditional email/password signup option (if implemented)

Interview Setup

Role selection: Frontend, Backend, Fullstack, HR, Technical, Behavioral, or Custom

Upload resume to tailor interview questions to your background

Pick your interview type (e.g., technical, behavioral)

Interactive Interview Experience

AI-generated questions (powered by OpenAI API)

Speech-to-text recognition, allowing spoken responses

Option to request hints

Time-tracked like real interviews

Built-in coding editor supporting JavaScript, Python, C++, Java (if available)

AI Feedback & Scoring

Real-time analysis of spoken or written answers

Constructive strengths & improvement feedback

Scores for each response, plus an overall interview summary report

Smart Integrations

OpenAI API → Question generation & evaluation

D-ID API → AI interviewer avatars (if used in the project)

Google OAuth → Seamless login experience

Speech-to-Text API → Voice-based user interaction

Tech Stack
Layer	Technologies
Frontend	React.js
Backend/Auth	Node.js, Express, JWT
AI / NLP	OpenAI API, D-ID API (for avatars)
Speech Processing	Speech-to-Text API (e.g., Google Cloud STT)
Database	(Specify—e.g., MongoDB, Firebase, etc.)
Getting Started
1. Clone the Repo
git clone https://github.com/Khwaish06/MockHire.git
cd MockHire

2. Install Dependencies
npm install

3. Setup Environment Variables

Create a .env file at the project root with the following (adjust based on what your app actually uses):

OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
DID_API_KEY=your_did_api_key

4. Run the App
npm start

Roadmap / Future Enhancements

 Progress tracking dashboard (review performance over multiple sessions)

 Multi-language interview support (for non-English speakers)

 Resume parsing (to auto-tailor questions by extracting skills/experience)

 Enhanced AI interviewer avatars (via D-ID or other visual APIs)

 Analytics and performance insights over time

Contributing

Contributions are welcome! To contribute:

Fork the repository.

Create your feature branch (git checkout -b feature-name).

Commit your changes (git commit -m "Detailed commit message").

Push to the branch (git push origin feature-name).

Open a pull request and describe your changes.
Feel free to open an issue first to discuss larger enhancements or changes.

License

This project is licensed under the MIT License. See the LICENSE
 file for full details.

Credits

Built with ❤️ by Khwaish Goel — GitHub
