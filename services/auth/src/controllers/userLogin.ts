import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { UserLoginSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";
import { AccountStatus, LoginAttempt } from "@prisma/client";

type CreateLoginHistory = {
  userId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: CreateLoginHistory) => {
  await prisma.loginHistory.create({
    data: info,
  });
};

export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) ?? req.ip ?? "";
    const userAgent = req.headers["user-agent"] ?? "";

    const parsedBody = UserLoginSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.errors });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      await createLoginHistory({
        userId: "Guest",
        userAgent,
        ipAddress,
        attempt: LoginAttempt.FAILED,
      });

      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(
      parsedBody.data.password,
      user.password
    );

    if (!isMatch) {
      await createLoginHistory({
        userId: user.id,
        userAgent,
        ipAddress,
        attempt: LoginAttempt.FAILED,
      });

      return res.status(400).json({ message: "Invalid credentials!" });
    }

    // Check if the user is verified
    if (!user.verified) {
      await createLoginHistory({
        userId: user.id,
        userAgent,
        ipAddress,
        attempt: LoginAttempt.FAILED,
      });

      return res.status(400).json({ message: "User not verified!" });
    }

    // check if the account is active
    if (user.status !== AccountStatus.ACTIVE) {
      await createLoginHistory({
        userId: user.id,
        userAgent,
        ipAddress,
        attempt: LoginAttempt.FAILED,
      });

      return res.status(400).json({
        message: "Your account is " + user.status.toLocaleLowerCase() + " !",
      });
    }

    // generate accesstoken
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET as Secret,
      { expiresIn: "2h" }
    );

    await createLoginHistory({
      userId: user.id,
      userAgent,
      ipAddress,
      attempt: LoginAttempt.SUCCESS,
    });

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};
