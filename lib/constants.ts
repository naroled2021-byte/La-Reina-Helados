// Valores permitidos para los campos "string-enum" del schema de Prisma
// (SQLite no soporta enums nativos de Prisma). Usar siempre estas constantes
// en vez de strings sueltos.

export const ROLES = {
  ADMIN: "Administrador",
  MANAGER: "Encargado",
  SELLER: "Vendedor",
  PRODUCTION: "Producción",
  CASHIER: "Caja",
} as const;

export const ORDER_TYPE = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
  DELIVERY: "DELIVERY",
} as const;

export const ORDER_STATUS = {
  RECEIVED: "RECEIVED",
  PREPARING: "PREPARING",
  READY: "READY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  READY: "Preparado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  RECEIVED: "#FBBF24",
  PREPARING: "#60A5FA",
  READY: "#A78BFA",
  DELIVERED: "#34D399",
  CANCELLED: "#F87171",
};

export const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Local",
  TAKEAWAY: "Retirar",
  DELIVERY: "Delivery",
};

export const ORDER_CHANNEL = {
  COUNTER: "COUNTER",
  SELF_SERVICE: "SELF_SERVICE",
} as const;

export const PAYMENT_METHOD = {
  CASH: "CASH",
  CARD: "CARD",
  TRANSFER: "TRANSFER",
  QR: "QR",
  MERCADOPAGO: "MERCADOPAGO",
  OTHER: "OTHER",
} as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  QR: "QR",
  MERCADOPAGO: "Mercado Pago",
  OTHER: "Otro",
};

export const INVENTORY_ITEM_TYPE = {
  FLAVOR: "FLAVOR",
  INGREDIENT: "INGREDIENT",
  PACKAGING: "PACKAGING",
  TOPPING: "TOPPING",
  BEVERAGE: "BEVERAGE",
  SUPPLY: "SUPPLY",
  FINISHED_PRODUCT: "FINISHED_PRODUCT",
} as const;

export const INVENTORY_MOVEMENT_TYPE = {
  IN: "IN",
  OUT: "OUT",
  ADJUSTMENT: "ADJUSTMENT",
  PRODUCTION: "PRODUCTION",
  SALE: "SALE",
  WASTE: "WASTE",
} as const;

export const INVENTORY_ITEM_TYPE_LABEL: Record<string, string> = {
  FLAVOR: "Sabor",
  INGREDIENT: "Materia prima",
  PACKAGING: "Envase",
  TOPPING: "Topping",
  BEVERAGE: "Bebida",
  SUPPLY: "Insumo",
  FINISHED_PRODUCT: "Producto terminado",
};

export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  IN: "Entrada",
  OUT: "Salida",
  WASTE: "Merma",
  ADJUSTMENT: "Ajuste manual",
  PRODUCTION: "Producción",
  SALE: "Venta",
};

export const PRODUCTION_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export const CASH_REGISTER_STATUS = {
  OPEN: "OPEN",
  CLOSING: "CLOSING",
  CLOSED: "CLOSED",
} as const;

export const CASH_MOVEMENT_TYPE = {
  SALE_CASH: "SALE_CASH",
  SALE_DIGITAL: "SALE_DIGITAL",
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

export const CASH_MOVEMENT_TYPE_LABEL: Record<string, string> = {
  SALE_CASH: "Venta en efectivo",
  SALE_DIGITAL: "Venta digital",
  INCOME: "Ingreso",
  EXPENSE: "Egreso",
};

export const PROMOTION_TYPE = {
  TWO_FOR_ONE: "TWO_FOR_ONE",
  THREE_FOR_TWO: "THREE_FOR_TWO",
  PERCENTAGE_DISCOUNT: "PERCENTAGE_DISCOUNT",
  QUANTITY_DISCOUNT: "QUANTITY_DISCOUNT",
  COMBO: "COMBO",
  TIME_OF_DAY: "TIME_OF_DAY",
  DAY_OF_WEEK: "DAY_OF_WEEK",
  LOYALTY: "LOYALTY",
} as const;

export const NOTIFICATION_TYPE = {
  LOW_STOCK: "LOW_STOCK",
  NEW_ORDER: "NEW_ORDER",
  DELAYED_ORDER: "DELAYED_ORDER",
  PRODUCTION_NEEDED: "PRODUCTION_NEEDED",
  SALE_COMPLETED: "SALE_COMPLETED",
  CASH_CLOSED: "CASH_CLOSED",
  CASH_DIFFERENCE: "CASH_DIFFERENCE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;

export const STOCK_STATUS = {
  NORMAL: "NORMAL",
  LOW: "LOW",
  CRITICAL: "CRITICAL",
  OUT: "OUT",
} as const;

export type StockStatus = keyof typeof STOCK_STATUS;

export function getStockStatus(current: number, min: number): StockStatus {
  if (current <= 0) return "OUT";
  if (current <= min * 0.5) return "CRITICAL";
  if (current <= min) return "LOW";
  return "NORMAL";
}

export const STOCK_STATUS_LABEL: Record<keyof typeof STOCK_STATUS, string> = {
  NORMAL: "Normal",
  LOW: "Bajo",
  CRITICAL: "Crítico",
  OUT: "Agotado",
};

export const STOCK_STATUS_COLOR: Record<keyof typeof STOCK_STATUS, string> = {
  NORMAL: "#34D399",
  LOW: "#FBBF24",
  CRITICAL: "#F97316",
  OUT: "#F87171",
};

export const PERMISSION_LABEL: Record<string, string> = {
  "dashboard.view": "Ver dashboard",
  "sales.create": "Registrar ventas",
  "orders.manage": "Gestionar pedidos",
  "products.manage": "Gestionar productos",
  "inventory.manage": "Gestionar stock",
  "production.manage": "Gestionar producción",
  "cash.manage": "Gestionar caja",
  "customers.manage": "Gestionar clientes",
  "employees.manage": "Gestionar empleados",
  "reports.view": "Ver reportes",
  "settings.manage": "Gestionar configuración",
};

export const PERMISSION_MODULE_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  sales: "Ventas",
  orders: "Pedidos",
  products: "Productos",
  inventory: "Stock",
  production: "Producción",
  cash: "Caja",
  customers: "Clientes",
  employees: "Empleados",
  reports: "Reportes",
  settings: "Configuración",
};

export const FLAVOR_CATEGORY_LABEL: Record<string, string> = {
  crema: "Crema",
  agua: "Agua",
  especial: "Especial",
};
