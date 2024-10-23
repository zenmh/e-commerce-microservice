import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import createInventory from "./controller/createInventory";
import updateInventory from "./controller/updateInventory";
import getInventoryDetails from "./controller/getInventoryDetails";
import getInventoryById from "./controller/getInventoryById"; 
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// origin request blocker
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigin = ["http://localhost:8081", "http://127.0.0.1:8081"];
  const origin = req.headers.origin ?? "";

  if (allowedOrigin.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    next();
  } else {
    res.status(403).json({ message: "Forbidden!" });
  }
});

app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// routes
app
  .get("/inventories/:id/details", getInventoryDetails)
  .get("/inventories/:id", getInventoryById)
  .put("/inventories/:id", updateInventory)
  .post("/inventories", createInventory);

// 404 handler
app.use((_, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err, _, res: Response, __) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(
    process.env.SERVICE_NAME + "is running on http://localhost:" + port
  );
});
