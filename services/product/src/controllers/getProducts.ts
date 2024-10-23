import prisma from "@/prisma";
import { Request, Response, NextFunction } from "express";

const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        inventoryId: true,
      },
    });

    // TODO: Implement pagination & filtering

    res.json({ data: products });
  } catch (error) {
    next(error);
  }
};

export default getProducts;
