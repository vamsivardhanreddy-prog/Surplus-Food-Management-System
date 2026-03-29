import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load .env file from project root
try {
  const dotenv = require("dotenv");
  const path = require("path");
  const { fileURLToPath } = require("url");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
} catch(e) {}

import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initSocketServer } from "./lib/notifications.js";

const port = Number(process.env.PORT) || 5000;

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io"
});

initSocketServer(io);

httpServer.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening with Socket.io");
});