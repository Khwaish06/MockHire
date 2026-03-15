const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user
const registerUser = async (req, res) => {
try {
const { name, email, password } = req.body;

if (!name || !email || !password) {
  return res.status(400).json({ message: "All fields are required" });
}

const normalizedEmail = email.toLowerCase();

const existingUser = await User.findOne({ email: normalizedEmail });

if (existingUser) {
  return res.status(400).json({ message: "User already exists" });
}

const hashedPassword = await bcrypt.hash(password, 10);

const newUser = await User.create({
  name,
  email: normalizedEmail,
  password: hashedPassword
});

const token = jwt.sign(
  { id: newUser._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.status(201).json({
  token,
  user: {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email
  }
});


} catch (error) {
console.error("Register error:", error);
res.status(500).json({ message: "Server error during registration" });
}
};

// Manual login
const loginUser = async (req, res) => {
try {
const { email, password } = req.body;


const normalizedEmail = email.toLowerCase();

const user = await User.findOne({ email: normalizedEmail });

if (!user) {
  return res.status(401).json({ message: "Invalid credentials" });
}

if (!user.password) {
  return res.status(400).json({
    message: "This account was created using Google. Please login with Google."
  });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}

const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.status(200).json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});


} catch (error) {
console.error("Login error:", error);
res.status(500).json({ message: "Server error during login" });
}
};

// Google login
const googleLogin = async (req, res) => {
try {
const { tokenId } = req.body;


if (!tokenId) {
  return res.status(400).json({ message: "Google token required" });
}

const ticket = await client.verifyIdToken({
  idToken: tokenId,
  audience: process.env.GOOGLE_CLIENT_ID
});

const payload = ticket.getPayload();

const { email, name, sub: googleId } = payload;

let user = await User.findOne({ email });

if (!user) {
  user = await User.create({
    name,
    email,
    googleId
  });
}

const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.status(200).json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});


} catch (error) {
console.error("Google login error:", error);


res.status(500).json({
  message: "Google authentication failed"
});


}
};

module.exports = {
registerUser,
loginUser,
googleLogin
};
