import express, { NextFunction, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import reteLimit from "express-rate-limit";
import { configureRoutes } from "./utils";

dotenv.config();

const app = express();

app.use(helmet());

const limiter = reteLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (_, res) => {
    res
      .status(429)
      .json({ message: "Too many requests, please try again later" });
  },
});

app.use("/api", limiter);

app.use(morgan("dev"));
app.use(express.json());

// TODO: Auth middleware

// Routes
configureRoutes(app);

app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// 404 handler
app.use((_, res: Response) => {
  res.status(404).json({ message: "Not found!" });
});

// Error handler
app.use((err, _, res: Response, __) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error!" });
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("API gateway is running on http://localhost:" + port);
});
