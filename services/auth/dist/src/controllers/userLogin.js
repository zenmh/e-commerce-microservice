"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLogin = void 0;
const prisma_1 = __importDefault(require("@/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const schemas_1 = require("@/schemas");
const client_1 = require("@prisma/client");
const createLoginHistory = async (info) => {
    await prisma_1.default.loginHistory.create({
        data: info,
    });
};
const userLogin = async (req, res, next) => {
    try {
        const ipAddress = req.headers["x-forwarded-for"] ?? req.ip ?? "";
        const userAgent = req.headers["user-agent"] ?? "";
        const parsedBody = schemas_1.UserLoginSchema.safeParse(req.body);
        if (!parsedBody.success) {
            return res.status(400).json({ errors: parsedBody.error.errors });
        }
        const user = await prisma_1.default.user.findUnique({
            where: {
                email: parsedBody.data.email,
            },
        });
        if (!user) {
            await createLoginHistory({
                userId: "Guest",
                userAgent,
                ipAddress,
                attempt: client_1.LoginAttempt.FAILED,
            });
            return res.status(400).json({ message: "Invalid credentials!" });
        }
        const isMatch = await bcryptjs_1.default.compare(parsedBody.data.password, user.password);
        if (!isMatch) {
            await createLoginHistory({
                userId: user.id,
                userAgent,
                ipAddress,
                attempt: client_1.LoginAttempt.FAILED,
            });
            return res.status(400).json({ message: "Invalid credentials!" });
        }
        // Check if the user is verified
        if (!user.verified) {
            await createLoginHistory({
                userId: user.id,
                userAgent,
                ipAddress,
                attempt: client_1.LoginAttempt.FAILED,
            });
            return res.status(400).json({ message: "User not verified!" });
        }
        // check if the account is active
        if (user.status !== client_1.AccountStatus.ACTIVE) {
            await createLoginHistory({
                userId: user.id,
                userAgent,
                ipAddress,
                attempt: client_1.LoginAttempt.FAILED,
            });
            return res.status(400).json({
                message: "Your account is " + user.status.toLocaleLowerCase() + " !",
            });
        }
        // generate accesstoken
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
        await createLoginHistory({
            userId: user.id,
            userAgent,
            ipAddress,
            attempt: client_1.LoginAttempt.SUCCESS,
        });
        return res.status(200).json({
            accessToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.userLogin = userLogin;
//# sourceMappingURL=userLogin.js.map