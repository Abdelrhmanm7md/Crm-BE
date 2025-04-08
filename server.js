import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dbConnection from "./database/DBConnection.js";
import { init } from "./src/modules/index.js";
import { globalError } from "./src/utils/middleWare/globalError.js";
import cron from "node-cron";

import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import helmet from "helmet";
import xssSanitizer from "./src/utils/middleWare/sanitization.js";
import { logModel } from "./database/models/log.model.js";

const app = express();
const httpServer = createServer(app); // ✅ Correct

const io = new Server(httpServer, {
  cors: {
    origin: "*", // for dev IP, set explicitly if needed
    credentials: true,
  },
});

// ✅ Middlewares
const corsOptions = {
  origin: "*", // In dev only — see previous message if using credentials
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(mongoSanitize());
app.use(xssSanitizer);
app.use(helmet());

// DB
dbConnection();

init(app);

app.use(globalError);

app.use((err, req, res, next) => {
  if (err.code === 'ENOTFOUND') {
    return res.status(500).send('Network error, please try again later.');
  }
  res.status(500).send(err.message);
});

// Cron job to delete logs
cron.schedule('0 0 * * *', async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const result = await logModel.deleteMany({ createdAt: { $lt: sevenDaysAgo } });
    console.log(`Deleted ${result.deletedCount} old logs.`);
  } catch (error) {
    console.error('Error deleting old logs:', error);
  }
});

// ✅ One unified server listening
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});

export const sio = io;
