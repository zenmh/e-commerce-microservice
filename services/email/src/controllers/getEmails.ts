import prisma from "@/prisma";
import { Request, Response, NextFunction } from "express";

export const getEmails = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const emails = await prisma.email.findMany();

    res.json(emails);
  } catch (error) {
    next(error);
  }
};
