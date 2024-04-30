import express from "express";
import dotenv from "dotenv";
import { dbConnection } from "./config/dbConnection.js";
import { Lucia, TimeSpan } from "lucia";
import { adapter } from "./models/auth.model.js";
import { authRoute } from "./router/auth.route.js";
import { homeRoute } from "./router/home.route.js";
import { GitHub } from "arctic";

dotenv.config();
dbConnection();

const port = process.env.SERVER_PORT;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: false,
    },
  },
  sessionExpiresIn: new TimeSpan(20, "m"),
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      githubId: attributes.github_id,
    };
  },
});

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID,
  process.env.GITHUB_CLIENT_SECRET
);

app.use("/api/auth", authRoute);
app.use("/api/home", homeRoute);

app.listen(port, () => {
  console.log(`Server starts at http://localhost:${port}`);
});
