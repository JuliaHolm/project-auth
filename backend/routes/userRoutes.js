import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
dotenv.config();

// Create an instance of the Express router.
const router = express.Router();
const listEndpoints = require("express-list-endpoints");

// Function to generate a JWT token for user authentication.
const generateToken = (user) => {
  // Generate a JWT token containing the user's unique ID, with an optional secret key and a 24-hour expiration time.
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Token expires in 24 hours.
  });
};

// ----- ROUTES STARTS HERE -----

// Endpoint "/" to return documentation of API using Express List Endpoints.
router.get("/", (req, res) => {
  // Lists all endpoints registered with the router.
  const endpoints = listEndpoints(router);
  res.json({ endpoints });
});

// REGISTER ROUTE ENDPOINT - create a new user.
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    // Extract email, username and password from the request body
    const { username, password, email } = req.body;

    try {
      if (!username || !password || !email) {
        res.status(400);
        throw new Error("Please add all fields");
      }
      const existingUser = await UserModel.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        res.status(400);
        throw new Error(
          `user with ${
            existingUser.username === username ? "username" : "email"
          } already exists`
        );
      }
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
      });
      await newUser.save();
      res.status(201).json({
        success: true,
        response: {
          username: newUser.username,
          email: newUser.email,
          id: newUser._id,
          accessToken: newUser.accessToken,
        },
      });
    } catch (e) {
      // Handle any errors that occur during the registration process
      res.status(500).json({ success: false, response: e.message });
    }
  })
);

// SIGN-IN ROUTE ENDPOINT - authenticate a returning user.
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    // Extract email, username and password from the request body
    const { username, password } = req.body;
  })
);

// AUTHENTICATED ENDPOINT - only returns content if the Authorization header with the user's token was correct.
// Return a 401 or 403 with an error message if you try to access it without an Authentication access token or with an invalid token.
// 401 Unauthorized & 403 Forbidden

export default router;
