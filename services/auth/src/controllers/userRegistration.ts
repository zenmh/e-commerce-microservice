import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import { EMAIL_SERVICE, USER_SERVICE } from "@/config";

const generateVerificationCode = () => {
  const timestamp = new Date().getTime().toString();

  // generate a random 2-digit number
  const randomNum = Math.floor(10 + Math.random() * 90);

  // combine timestmp and random number and extract last 5 digits
  let code = (timestamp + randomNum).slice(-5);

  return code;
};

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const parsedBody = UserCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.errors });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parsedBody.data.password, salt);

    const user = await prisma.user.create({
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
    await axios.post(USER_SERVICE + "/users", {
      authUserId: user.id,
      name: user.name,
      email: user.email,
    });

    // generate verification code
    const code = generateVerificationCode();

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    // send verification email
    await axios.post(EMAIL_SERVICE + "/emails/send", {
      recipient: user.email,
      subject: "Email verification",
      body: "Your virification code is " + code,
      source: "user-registration",
    });

    return res
      .status(201)
      .json({
        message: "User created. Check your email for verification code",
        user,
      });
  } catch (error) {
    next(error);
  }
};
