import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocketServer } from "./lib/notifications";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

initSocketServer(io);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening with Socket.io");
});
