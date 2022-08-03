import express from "express";
const app = express();
import cors from "cors";
import bodyParser from "body-parser";
require("dotenv").config();

import authRoutes from "./routes/auth";

import {connectToRedisServer} from "./services/redisActions";

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.use("/api/auth", authRoutes);

app.listen(8000, async () => {
    console.log("Ready on 8000");
    await connectToRedisServer();
    console.log("Redis connected");
})