"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const getUserById_1 = require("./controllers/getUserById");
const createUser_1 = require("./controllers/createUser");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
// origin request blocker
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const allowedOrigin = ["http://localhost:8081", "http://127.0.0.1:8081"];
//   const origin = req.headers.origin ?? "";
//   if (allowedOrigin.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     next();
//   } else {
//     res.status(403).json({ message: "Forbidden!" });
//   }
// });
app.get("/health", (_, res) => {
    res.status(200).json({ status: "UP" });
});
// routes
app.get("/users/:id", getUserById_1.getUserById).post("/users", createUser_1.createUser);
// 404 handler
app.use((_, res) => {
    res.status(404).json({ message: "Not found" });
});
// Error handler
app.use((err, _, res, __) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});
const port = process.env.PORT;
app.listen(port, () => {
    console.log(process.env.SERVICE_NAME + "is running on http://localhost:" + port);
});
//# sourceMappingURL=index.js.map