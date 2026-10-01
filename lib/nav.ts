import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  IceCreamCone,
  Snowflake,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Factory,
  Wallet,
  Users,
  UserCog,
  BarChart3,
  Settings,
  MonitorSmartphone,
  Store,
  ShieldCheck,
  Power,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  available: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view", available: true },
  { label: "Ventas", href: "/admin/ventas", icon: ShoppingCart, permission: "sales.create", available: true },
  { label: "Mostrador", href: "/mostrador", icon: Store, permission: "sales.create", available: true },
  { label: "Desactivar Autoservicio", href: "/admin/desactivar-autoservicio", icon: Power, available: true },
  { label: "Pedidos", href: "/admin/pedidos", icon: ClipboardList, permission: "orders.manage", available: true },
  { label: "Productos", href: "/admin/productos", icon: IceCreamCone, permission: "products.manage", available: true },
  { label: "Sabores", href: "/admin/sabores", icon: Snowflake, permission: "products.manage", available: true },
  { label: "Stock", href: "/admin/stock", icon: Boxes, permission: "inventory.manage", available: true },
  { label: "Producción", href: "/admin/produccion", icon: Factory, permission: "production.manage", available: true },
  { label: "Caja", href: "/admin/caja", icon: Wallet, permission: "cash.manage", available: true },
  { label: "Clientes", href: "/admin/clientes", icon: Users, permission: "customers.manage", available: true },
  { label: "Empleados", href: "/admin/empleados", icon: UserCog, permission: "employees.manage", available: true },
  { label: "Reportes", href: "/admin/reportes", icon: BarChart3, permission: "reports.view", available: true },
  { label: "Auditoría", href: "/admin/auditoria", icon: ShieldCheck, permission: "audit.view", available: true },
  { label: "Autoservicio", href: "/autoservicio", icon: MonitorSmartphone, available: true },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings, permission: "settings.manage", available: true },
];
