import express from "express";
import { home } from "../controller/home.controller.js";

export const homeRoute = express.Router();

homeRoute.get("/", home);
