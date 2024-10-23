"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const prisma_1 = __importDefault(require("@/prisma"));
const schemas_1 = require("@/schemas");
const createUser = async (req, res, next) => {
    try {
        const parsedBody = schemas_1.UserCreateSchema.safeParse(req.body);
        if (!parsedBody.success) {
            return res.status(400).json({ message: parsedBody.error.errors });
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: {
                authUserId: parsedBody.data.authUserId,
            },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }
        const user = await prisma_1.default.user.create({
            data: parsedBody.data,
        });
        return res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
//# sourceMappingURL=createUser.js.map