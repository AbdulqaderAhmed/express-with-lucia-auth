import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import mongoose from "mongoose";

export const User = mongoose.model(
  "users",
  new mongoose.Schema(
    {
      username: {
        type: String,
        required: true,
      },
      password: {
        type: String,
      },
      github_id: {
        type: String,
      },
    },
    { timestamps: true }
  )
);

const Session = mongoose.model(
  "Session",
  new mongoose.Schema(
    {
      user_id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
      },
    },
    { timestamps: true }
  )
);

export const adapter = new MongodbAdapter(
  mongoose.connection.collection("sessions"),
  mongoose.connection.collection("users")
);
