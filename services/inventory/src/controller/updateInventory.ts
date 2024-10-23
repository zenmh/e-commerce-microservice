import prisma from "@/prisma";
import { InventoryUpdateDTOSchema } from "@/schemas";
import { ActionType } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({ where: { id } });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const parsedBody = InventoryUpdateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json(parsedBody.error.errors);
    }

    const lastHistory = await prisma.history.findFirst({
      where: { inventoryId: id },
      orderBy: { createdAt: "desc" },
    });

    let newQuantity = inventory.quantity;

    if (parsedBody.data.actionType === ActionType.IN) {
      newQuantity += parsedBody.data.quantity;
    } else if (parsedBody.data.actionType === ActionType.OUT) {
      newQuantity -= parsedBody.data.quantity;
    } else {
      return res.status(400).json({ message: "Invalid action type" });
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        histories: {
          create: {
            actionType: parsedBody.data.actionType,
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: lastHistory?.newQuantity ?? 0,
            newQuantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    return res.status(201).json(updatedInventory);
  } catch (error) {
    next(error);
  }
};

export default updateInventory;
