import express from "express";
import {
  gitSignIn,
  signin,
  signout,
  signup,
} from "../controller/auth.controller.js";

export const authRoute = express.Router();

authRoute.post("/register", signup);
authRoute.post("/login", signin);
authRoute.get("/logout", signout);
authRoute.get("/github", gitSignIn);
authRoute.get("/github/callback", gitSignIn);
