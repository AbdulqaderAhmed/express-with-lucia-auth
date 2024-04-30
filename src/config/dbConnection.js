import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    const connect = await mongoose.connect(process.env.DB_CONNECTION);
    if (connect) {
      console.log(
        `Database connection established at host:${connect.connection.host} with name:${connect.connection.name}`
      );
    }
  } catch (error) {
    console.log(error);
  }
};
