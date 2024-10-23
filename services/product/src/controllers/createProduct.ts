import { INVENTORY_URL } from "@/config";
import prisma from "@/prisma";
import { ProductCreateDTOSchema } from "@/schemas";
import axios from "axios";
import { Request, Response, NextFunction } from "express";

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: parsedBody.data.sku,
      },
    });

    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with the same sku already exists!" });
    }

    const product = await prisma.product.create({
      data: parsedBody.data,
    });

    console.log("Product created successfully", product.id);

    const { data: inventory } = await axios.post(
      INVENTORY_URL + "/inventories",
      { productId: product.id, sku: product.sku }
    );

    console.log("Inventory crated successfully", inventory.id);

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        inventoryId: inventory.id,
      },
    });

    console.log("Product updated successfully with inventory id", inventory.id);

    res.status(201).json({ ...product, inventoryId: inventory.id });
  } catch (error) {
    next(error);
  }
};

export default createProduct;
