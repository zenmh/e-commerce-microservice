import prisma from "@/prisma";
import jwt from "jsonwebtoken";
import { EmailVerificationSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";
import { AccountStatus, VerificationStatus } from "@prisma/client";
import axios from "axios";
import { EMAIL_SERVICE } from "@/config";

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const parsedBody = EmailVerificationSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.errors });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // find the verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: parsedBody.data.code,
      },
    });

    if (!verificationCode) {
      return res.status(400).json({ message: "Invalid verification code!" });
    }

    // if the code has expired
    if (verificationCode.expiredAt < new Date()) {
      return res.status(400).json({ message: "Verification code expired!" });
    }

    // update user status to verified
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verified: true,
        status: AccountStatus.ACTIVE,
      },
    });

    // update verification code status
    await prisma.verificationCode.update({
      where: {
        id: verificationCode.id,
      },
      data: {
        status: VerificationStatus.USED,
        verifiedAt: new Date(),
      },
    });

    // send success email
    await axios.post(EMAIL_SERVICE + "/emails/send", {
      to: user.email,
      subject: "Email verified",
      text: "Your email has been verified successfully",
      source: "verify-email",
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};
