import userModel from "../models/user.models.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// 1️⃣ User created (signup)
export const createUser = async (req, res) => {
  try {
    const { email, username, password, image } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const newUser = await userModel.create({ email, username, password, image });

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, user: newUser, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2️⃣ User updated
export const updateUser = async (req, res) => {
  try {
    const { username, email, image } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id, // from verifyToken middleware
      { username, email, image },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ User deleted
export const deleteUser = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.user.id); // from verifyToken middleware
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
