import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ROLES,
  ORDER_TYPE,
  ORDER_STATUS,
  ORDER_CHANNEL,
  PAYMENT_METHOD,
  INVENTORY_ITEM_TYPE,
  CASH_MOVEMENT_TYPE,
  PRODUCTION_STATUS,
  PROMOTION_TYPE,
  NOTIFICATION_TYPE,
} from "../lib/constants";

const db = new PrismaClient();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickMany<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Limpiando base de datos...");
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.notification.deleteMany(),
    db.cashMovement.deleteMany(),
    db.cashRegister.deleteMany(),
    db.payment.deleteMany(),
    db.orderItemFlavor.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.coupon.deleteMany(),
    db.promotionProduct.deleteMany(),
    db.promotion.deleteMany(),
    db.productionItem.deleteMany(),
    db.production.deleteMany(),
    db.recipeItem.deleteMany(),
    db.recipe.deleteMany(),
    db.inventoryMovement.deleteMany(),
    db.customer.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.flavor.deleteMany(),
    db.inventoryItem.deleteMany(),
    db.supplier.deleteMany(),
    db.paymentMethodConfig.deleteMany(),
    db.setting.deleteMany(),
    db.user.deleteMany(),
    db.role.deleteMany(),
    db.permission.deleteMany(),
  ]);

  // ---------- Roles y permisos ----------
  console.log("Creando roles y permisos...");
  const permissionKeys = [
    "dashboard.view",
    "sales.create",
    "orders.manage",
    "products.manage",
    "inventory.manage",
    "production.manage",
    "cash.manage",
    "customers.manage",
    "employees.manage",
    "reports.view",
    "settings.manage",
  ];
  const permissions = await Promise.all(
    permissionKeys.map((key) => db.permission.create({ data: { key } }))
  );
  const permByKey = Object.fromEntries(permissions.map((p) => [p.key, p]));

  const roleDefs: Record<string, string[]> = {
    [ROLES.ADMIN]: permissionKeys,
    [ROLES.MANAGER]: [
      "dashboard.view",
      "sales.create",
      "orders.manage",
      "products.manage",
      "inventory.manage",
      "production.manage",
      "cash.manage",
      "customers.manage",
      "reports.view",
    ],
    [ROLES.SELLER]: ["dashboard.view", "sales.create", "orders.manage", "customers.manage"],
    [ROLES.PRODUCTION]: ["dashboard.view", "production.manage", "inventory.manage", "orders.manage"],
    [ROLES.CASHIER]: ["dashboard.view", "sales.create", "cash.manage"],
  };

  const roles: Record<string, { id: string }> = {};
  for (const [name, keys] of Object.entries(roleDefs)) {
    roles[name] = await db.role.create({
      data: {
        name,
        permissions: { connect: keys.map((k) => ({ id: permByKey[k].id })) },
      },
    });
  }

  // ---------- Usuarios ----------
  console.log("Creando usuarios...");
  const passwordHash = await bcrypt.hash("helados123", 10);
  const userDefs = [
    { name: "Ana Administradora", email: "admin@lareinahelados.com", role: ROLES.ADMIN },
    { name: "Marcos Encargado", email: "encargado@lareinahelados.com", role: ROLES.MANAGER },
    { name: "Sofía Vendedora", email: "vendedor@lareinahelados.com", role: ROLES.SELLER },
    { name: "Lucas Producción", email: "produccion@lareinahelados.com", role: ROLES.PRODUCTION },
    { name: "Julia Caja", email: "caja@lareinahelados.com", role: ROLES.CASHIER },
  ];
  const users: Record<string, { id: string; name: string }> = {};
  for (const u of userDefs) {
    users[u.role] = await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        roleId: roles[u.role].id,
        lastLoginAt: daysAgo(randInt(0, 3)),
      },
    });
  }

  // ---------- Categorías ----------
  console.log("Creando categorías...");
  const categoryNames = [
    "Helado",
    "Vasitos",
    "Cucuruchos",
    "Palitos",
    "Bombones",
    "Tortas heladas",
    "Postres",
    "Combos",
    "Bebidas",
    "Otros",
  ];
  const categories: Record<string, { id: string }> = {};
  for (let i = 0; i < categoryNames.length; i++) {
    categories[categoryNames[i]] = await db.category.create({
      data: { name: categoryNames[i], order: i },
    });
  }

  // ---------- Sabores ----------
  console.log("Creando sabores...");
  const flavorDefs: { name: string; category: string; popular?: boolean }[] = [
    { name: "Dulce de leche", category: "crema", popular: true },
    { name: "Chocolate", category: "crema", popular: true },
    { name: "Frutilla", category: "agua", popular: true },
    { name: "Vainilla", category: "crema" },
    { name: "Limón", category: "agua" },
    { name: "Menta granizada", category: "crema", popular: true },
    { name: "Cookies", category: "crema" },
    { name: "Pistacho", category: "crema" },
    { name: "Crema americana", category: "crema" },
    { name: "Frutos del bosque", category: "agua" },
    { name: "Banana split", category: "crema" },
    { name: "Coco", category: "crema" },
    { name: "Maracuyá", category: "agua" },
    { name: "Chocolate amargo", category: "crema" },
    { name: "Dulce de leche granizado", category: "crema", popular: true },
    { name: "Marroc", category: "crema" },
    { name: "Sambayón", category: "crema" },
    { name: "Mascarpone", category: "crema" },
    { name: "Chocolate blanco", category: "crema" },
    { name: "Naranja", category: "agua" },
  ];

  const flavors: { id: string; name: string }[] = [];
  for (const f of flavorDefs) {
    const stock = randInt(2, 15);
    const min = 8;
    const inv = await db.inventoryItem.create({
      data: {
        name: `Sabor: ${f.name}`,
        type: INVENTORY_ITEM_TYPE.FLAVOR,
        unit: "kg",
        currentStock: stock,
        minStock: min,
        maxStock: 20,
        cost: randInt(1800, 3200),
      },
    });
    const flavor = await db.flavor.create({
      data: {
        name: f.name,
        category: f.category,
        popular: !!f.popular,
        inventoryItemId: inv.id,
      },
    });
    flavors.push(flavor);
  }

  // ---------- Insumos, envases, toppings, bebidas ----------
  console.log("Creando insumos e inventario general...");
  const supplier1 = await db.supplier.create({
    data: { name: "Distribuidora Láctea SRL", contactName: "Pablo Ríos", phone: "11-4444-1111" },
  });
  const supplier2 = await db.supplier.create({
    data: { name: "Envases del Sur", contactName: "Carla Gómez", phone: "11-4444-2222" },
  });

  const otherInventory = [
    { name: "Leche entera", type: INVENTORY_ITEM_TYPE.INGREDIENT, unit: "l", stock: 40, min: 50, supplier: supplier1 },
    { name: "Crema de leche", type: INVENTORY_ITEM_TYPE.INGREDIENT, unit: "l", stock: 18, min: 20, supplier: supplier1 },
    { name: "Azúcar", type: INVENTORY_ITEM_TYPE.INGREDIENT, unit: "kg", stock: 60, min: 30, supplier: supplier1 },
    { name: "Cucuruchos simples", type: INVENTORY_ITEM_TYPE.PACKAGING, unit: "unidad", stock: 120, min: 100, supplier: supplier2 },
    { name: "Vasos chicos", type: INVENTORY_ITEM_TYPE.PACKAGING, unit: "unidad", stock: 30, min: 100, supplier: supplier2 },
    { name: "Potes 1/4 kg", type: INVENTORY_ITEM_TYPE.PACKAGING, unit: "unidad", stock: 80, min: 60, supplier: supplier2 },
    { name: "Potes 1/2 kg", type: INVENTORY_ITEM_TYPE.PACKAGING, unit: "unidad", stock: 45, min: 60, supplier: supplier2 },
    { name: "Chips de chocolate", type: INVENTORY_ITEM_TYPE.TOPPING, unit: "kg", stock: 5, min: 3, supplier: supplier1 },
    { name: "Granas de colores", type: INVENTORY_ITEM_TYPE.TOPPING, unit: "kg", stock: 4, min: 3, supplier: supplier1 },
    { name: "Salsa de chocolate", type: INVENTORY_ITEM_TYPE.TOPPING, unit: "l", stock: 6, min: 4, supplier: supplier1 },
    { name: "Salsa de dulce de leche", type: INVENTORY_ITEM_TYPE.TOPPING, unit: "l", stock: 2, min: 4, supplier: supplier1 },
    { name: "Agua mineral", type: INVENTORY_ITEM_TYPE.BEVERAGE, unit: "unidad", stock: 24, min: 20 },
    { name: "Gaseosa línea Cola", type: INVENTORY_ITEM_TYPE.BEVERAGE, unit: "unidad", stock: 18, min: 20 },
    { name: "Servilletas", type: INVENTORY_ITEM_TYPE.SUPPLY, unit: "paquete", stock: 15, min: 10 },
    { name: "Cucharitas", type: INVENTORY_ITEM_TYPE.SUPPLY, unit: "paquete", stock: 12, min: 10 },
  ];
  for (const item of otherInventory) {
    await db.inventoryItem.create({
      data: {
        name: item.name,
        type: item.type,
        unit: item.unit,
        currentStock: item.stock,
        minStock: item.min,
        maxStock: item.min * 2,
        cost: randInt(50, 500),
        supplierId: item.supplier?.id,
      },
    });
  }

  // ---------- Productos ----------
  console.log("Creando productos...");
  const productDefs = [
    { name: "Cucurucho 1 bocha", category: "Cucuruchos", price: 2500, allowsFlavors: true, maxFlavors: 1 },
    { name: "Cucurucho 2 bochas", category: "Cucuruchos", price: 3500, allowsFlavors: true, maxFlavors: 2 },
    { name: "Vasito 1 bocha", category: "Vasitos", price: 2200, allowsFlavors: true, maxFlavors: 1 },
    { name: "Vasito 2 bochas", category: "Vasitos", price: 3200, allowsFlavors: true, maxFlavors: 2 },
    { name: "Vasito 3 bochas", category: "Vasitos", price: 4200, allowsFlavors: true, maxFlavors: 3 },
    { name: "Pote 1/4 kg", category: "Helado", price: 4800, allowsFlavors: true, maxFlavors: 2 },
    { name: "Pote 1/2 kg", category: "Helado", price: 8500, allowsFlavors: true, maxFlavors: 3 },
    { name: "Pote 1 kg", category: "Helado", price: 15500, allowsFlavors: true, maxFlavors: 4 },
    { name: "Palito Bombón Helado", category: "Palitos", price: 2000 },
    { name: "Bombón Suizo", category: "Bombones", price: 1800 },
    { name: "Torta Helada Chica", category: "Tortas heladas", price: 12000, allowsFlavors: true, maxFlavors: 2 },
    { name: "Torta Helada Grande", category: "Tortas heladas", price: 21000, allowsFlavors: true, maxFlavors: 3 },
    { name: "Copa Postre Especial", category: "Postres", price: 5200 },
    { name: "Combo Familiar (1kg + 4 conos)", category: "Combos", price: 19500, allowsFlavors: true, maxFlavors: 4 },
    { name: "Agua mineral 500ml", category: "Bebidas", price: 1500 },
  ];
  const products: { id: string; name: string; price: number; allowsFlavors: boolean }[] = [];
  for (const p of productDefs) {
    const prod = await db.product.create({
      data: {
        name: p.name,
        categoryId: categories[p.category].id,
        price: p.price,
        cost: Math.round(p.price * 0.4),
        allowsFlavors: !!p.allowsFlavors,
        maxFlavors: p.maxFlavors ?? 0,
      },
    });
    products.push(prod);
  }

  // ---------- Clientes ----------
  console.log("Creando clientes...");
  const customerNames = [
    "Martina López",
    "Juan Pérez",
    "Camila Fernández",
    "Diego Sosa",
    "Valentina Ruiz",
    "Nicolás Torres",
    "Florencia Díaz",
    "Tomás Romero",
    "Agustina Molina",
    "Franco Acosta",
  ];
  const customers: { id: string; name: string }[] = [];
  for (const name of customerNames) {
    const c = await db.customer.create({
      data: {
        name,
        phone: `11-${randInt(4000, 4999)}-${randInt(1000, 9999)}`,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
        points: randInt(0, 500),
        lastPurchaseAt: daysAgo(randInt(0, 20)),
      },
    });
    customers.push(c);
  }

  // ---------- Métodos de pago ----------
  console.log("Configurando métodos de pago...");
  const paymentMethods = [
    { key: PAYMENT_METHOD.CASH, label: "Efectivo" },
    { key: PAYMENT_METHOD.CARD, label: "Tarjeta" },
    { key: PAYMENT_METHOD.TRANSFER, label: "Transferencia" },
    { key: PAYMENT_METHOD.QR, label: "QR" },
    { key: PAYMENT_METHOD.MERCADOPAGO, label: "Mercado Pago" },
    { key: PAYMENT_METHOD.OTHER, label: "Otro", enabled: false },
  ];
  for (let i = 0; i < paymentMethods.length; i++) {
    const m = paymentMethods[i];
    await db.paymentMethodConfig.create({
      data: { key: m.key, label: m.label, enabled: m.enabled ?? true, order: i },
    });
  }

  // ---------- Configuración general ----------
  console.log("Creando configuración...");
  const settings: [string, string, string][] = [
    ["business.name", "La Reina Helados", "general"],
    ["business.currency", "ARS", "general"],
    ["business.taxRate", "21", "general"],
    ["theme.primaryColor", "#F7A8C4", "appearance"],
    ["theme.secondaryColor", "#8FE3E0", "appearance"],
    ["theme.accentColor", "#B9A8F7", "appearance"],
  ];
  for (const [key, value, group] of settings) {
    await db.setting.create({ data: { key, value, group } });
  }

  // ---------- Caja ----------
  console.log("Abriendo caja...");
  const cashRegister = await db.cashRegister.create({
    data: {
      openedById: users[ROLES.CASHIER].id,
      openingAmount: 20000,
      status: "OPEN",
    },
  });

  // ---------- Pedidos, pagos y movimientos de caja ----------
  console.log("Creando pedidos demo...");
  let orderNumber = 1041;
  let counterChannelNumber = 0;
  let selfServiceChannelNumber = 0;
  const customerStats = new Map<string, { totalSpent: number; lastPurchaseAt: Date }>();
  const statusesPast = [ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED];
  const statusesToday = [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED];
  const orderTypes = [ORDER_TYPE.DINE_IN, ORDER_TYPE.TAKEAWAY, ORDER_TYPE.DELIVERY];
  const paymentMethodValues = [PAYMENT_METHOD.CASH, PAYMENT_METHOD.CARD, PAYMENT_METHOD.TRANSFER, PAYMENT_METHOD.QR, PAYMENT_METHOD.MERCADOPAGO];

  for (let i = 0; i < 20; i++) {
    const isToday = i >= 15; // últimos 5 pedidos son de hoy
    const dayOffset = isToday ? 0 : randInt(1, 13);
    const status = isToday ? pick(statusesToday) : pick(statusesPast);
    const type = pick(orderTypes);
    const customer = Math.random() > 0.3 ? pick(customers) : null;
    const seller = pick(Object.values(users));

    const itemCount = randInt(1, 3);
    const chosenProducts = pickMany(products, itemCount);
    let subtotal = 0;
    const itemsData: {
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      format: string | null;
      flavorIds: string[];
    }[] = [];

    for (const prod of chosenProducts) {
      const qty = randInt(1, 2);
      const lineSubtotal = prod.price * qty;
      subtotal += lineSubtotal;
      itemsData.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.price,
        subtotal: lineSubtotal,
        format: prod.allowsFlavors ? prod.name : null,
        flavorIds: prod.allowsFlavors ? pickMany(flavors, randInt(1, 2)).map((f) => f.id) : [],
      });
    }

    const discount = Math.random() > 0.8 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount;
    const createdAt = daysAgo(dayOffset, randInt(10, 21), randInt(0, 59));
    const channel = Math.random() > 0.7 ? ORDER_CHANNEL.SELF_SERVICE : ORDER_CHANNEL.COUNTER;
    const channelNumber =
      channel === ORDER_CHANNEL.SELF_SERVICE ? ++selfServiceChannelNumber : ++counterChannelNumber;

    const order = await db.order.create({
      data: {
        number: orderNumber++,
        channelNumber,
        type,
        status,
        channel,
        customerId: customer?.id,
        servedById: seller.id,
        subtotal,
        discount,
        total,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: itemsData.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.subtotal,
            format: it.format,
            flavors: it.flavorIds.length
              ? { create: it.flavorIds.map((flavorId) => ({ flavorId })) }
              : undefined,
          })),
        },
      },
    });

    if (status !== ORDER_STATUS.CANCELLED) {
      const method = pick(paymentMethodValues);
      await db.payment.create({
        data: { orderId: order.id, method, amount: total, createdAt },
      });

      if (isToday) {
        await db.cashMovement.create({
          data: {
            cashRegisterId: cashRegister.id,
            type: method === PAYMENT_METHOD.CASH ? CASH_MOVEMENT_TYPE.SALE_CASH : CASH_MOVEMENT_TYPE.SALE_DIGITAL,
            amount: total,
            description: `Venta pedido #${order.number}`,
            userId: seller.id,
            orderId: order.id,
            createdAt,
          },
        });
      }

      if (customer) {
        const prev = customerStats.get(customer.id);
        customerStats.set(customer.id, {
          totalSpent: (prev?.totalSpent ?? 0) + total,
          lastPurchaseAt: prev && prev.lastPurchaseAt > createdAt ? prev.lastPurchaseAt : createdAt,
        });
      }
    }
  }

  for (const [customerId, stats] of customerStats) {
    await db.customer.update({
      where: { id: customerId },
      data: { totalSpent: stats.totalSpent, lastPurchaseAt: stats.lastPurchaseAt },
    });
  }

  await db.cashMovement.create({
    data: {
      cashRegisterId: cashRegister.id,
      type: CASH_MOVEMENT_TYPE.EXPENSE,
      amount: 3500,
      description: "Compra de servilletas y cucharitas",
      userId: users[ROLES.CASHIER].id,
    },
  });
  await db.cashMovement.create({
    data: {
      cashRegisterId: cashRegister.id,
      type: CASH_MOVEMENT_TYPE.INCOME,
      amount: 5000,
      description: "Reposición de caja chica",
      userId: users[ROLES.CASHIER].id,
    },
  });

  // ---------- Producción ----------
  console.log("Registrando producción...");
  const production = await db.production.create({
    data: {
      status: PRODUCTION_STATUS.IN_PROGRESS,
      createdById: users[ROLES.PRODUCTION].id,
      notes: "Producción según sugerencia de stock crítico",
    },
  });
  const criticalFlavors = pickMany(flavors, 5);
  for (const f of criticalFlavors) {
    await db.productionItem.create({
      data: {
        productionId: production.id,
        flavorId: f.id,
        quantityPlanned: randInt(5, 10),
        quantityProduced: randInt(0, 5),
        waste: randInt(0, 1),
      },
    });
  }

  // ---------- Promociones ----------
  console.log("Creando promociones...");
  const promo1 = await db.promotion.create({
    data: {
      name: "2x1 en Cucuruchos los Miércoles",
      type: PROMOTION_TYPE.TWO_FOR_ONE,
      daysOfWeek: "WED",
      active: true,
    },
  });
  await db.promotionProduct.create({
    data: { promotionId: promo1.id, productId: products[0].id },
  });

  await db.promotion.create({
    data: {
      name: "10% off en compras mayores a $10.000",
      type: PROMOTION_TYPE.PERCENTAGE_DISCOUNT,
      value: 10,
      active: true,
    },
  });

  const promoLoyalty = await db.promotion.create({
    data: {
      name: "Clientes frecuentes: 15% off",
      type: PROMOTION_TYPE.LOYALTY,
      value: 15,
      active: true,
    },
  });
  await db.coupon.create({
    data: {
      code: "BIENVENIDA10",
      promotionId: promoLoyalty.id,
      discountType: "PERCENTAGE",
      discountValue: 10,
      usageLimit: 100,
      active: true,
    },
  });

  // ---------- Notificaciones ----------
  console.log("Creando notificaciones...");
  await db.notification.create({
    data: {
      type: NOTIFICATION_TYPE.LOW_STOCK,
      title: "Stock crítico",
      message: "Varios sabores están por debajo del stock mínimo.",
      link: "/admin/inventario",
      userId: users[ROLES.ADMIN].id,
    },
  });
  await db.notification.create({
    data: {
      type: NOTIFICATION_TYPE.NEW_ORDER,
      title: "Nuevo pedido",
      message: `Pedido #${orderNumber - 1} recibido.`,
      link: "/admin/pedidos",
      userId: users[ROLES.SELLER].id,
    },
  });

  console.log("Seed completado con éxito.");
  console.log("\nUsuarios demo (contraseña: helados123):");
  for (const u of userDefs) console.log(`  ${u.role.padEnd(14)} ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
