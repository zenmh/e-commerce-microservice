import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const parsedBody = UserCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ message: parsedBody.error.errors });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        authUserId: parsedBody.data.authUserId,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const user = await prisma.user.create({
      data: parsedBody.data,
    });

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};
