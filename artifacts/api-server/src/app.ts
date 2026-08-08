import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Temporary: serve project ZIP for download
app.get("/api/download/swiftmove-project.zip", (_req, res) => {
  const path = require("path");
  const file = path.resolve("/home/runner/workspace/swiftmove-full.zip");
  res.download(file, "swiftmove-project.zip");
});

export default app;
