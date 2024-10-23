"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegistration = void 0;
const prisma_1 = __importDefault(require("@/prisma"));
const schemas_1 = require("@/schemas");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@/config");
const userRegistration = async (req, res, next) => {
    try {
        const parsedBody = schemas_1.UserCreateSchema.safeParse(req.body);
        if (!parsedBody.success) {
            return res.status(400).json({ errors: parsedBody.error.errors });
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: {
                email: parsedBody.data.email,
            },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(parsedBody.data.password, salt);
        const user = await prisma_1.default.user.create({
            data: {
                ...parsedBody.data,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                verified: true,
            },
        });
        console.log("User created", user);
        // Create the user profile
        await axios_1.default.post(config_1.USER_SERVICE + "/users", {
            authUserId: user.id,
            name: user.name,
            email: user.email,
        });
        // TODO: generate verification code
        // TODO: send verification email
        return res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.userRegistration = userRegistration;
//# sourceMappingURL=userRegistration.js.map