import type { Prisma } from "@prisma/client";
import { INVENTORY_MOVEMENT_TYPE } from "@/lib/constants";

type TxClient = Prisma.TransactionClient;

/** Descuenta stock según la receta de cada producto vendido (si tiene una configurada en
 *  Stock → el producto no tiene receta, no se descuenta nada, no rompe la venta) y deja
 *  un registro en InventoryMovement para que se vea en Stock → Movimientos recientes. No
 *  bloquea la venta si el stock queda negativo — solo avisa vía el estado de Stock. */
export async function deductStockForSale(
  tx: TxClient,
  items: { productId: string; quantity: number }[],
  orderNumber: number,
  userId: string | null = null
) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  if (productIds.length === 0) return;

  const recipes = await tx.recipe.findMany({
    where: { productId: { in: productIds } },
    include: { items: true },
  });

  const recipesByProduct = new Map<string, typeof recipes>();
  for (const recipe of recipes) {
    if (!recipe.productId) continue;
    const list = recipesByProduct.get(recipe.productId) ?? [];
    list.push(recipe);
    recipesByProduct.set(recipe.productId, list);
  }

  for (const item of items) {
    const productRecipes = recipesByProduct.get(item.productId) ?? [];
    for (const recipe of productRecipes) {
      for (const recipeItem of recipe.items) {
        const consumed = recipeItem.quantity * item.quantity;
        if (consumed <= 0) continue;

        await tx.inventoryItem.update({
          where: { id: recipeItem.inventoryItemId },
          data: { currentStock: { decrement: consumed } },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: recipeItem.inventoryItemId,
            type: INVENTORY_MOVEMENT_TYPE.SALE,
            quantity: consumed,
            reason: `Venta pedido #${orderNumber}`,
            userId,
          },
        });
      }
    }
  }
}
