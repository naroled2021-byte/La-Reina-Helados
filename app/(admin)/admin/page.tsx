import {
  DollarSign,
  CalendarRange,
  ClipboardList,
  Receipt,
  AlertTriangle,
  Factory,
  Wallet,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SalesByDayChart } from "@/components/dashboard/sales-by-day-chart";
import { RankingBarChart } from "@/components/dashboard/ranking-bar-chart";
import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { PeakHoursChart } from "@/components/dashboard/peak-hours-chart";
import { OrderStatusCards } from "@/components/dashboard/order-status-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { formatCompactCurrency } from "@/lib/format";
import { requirePermission } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const [session, data] = await Promise.all([requirePermission("dashboard.view"), getDashboardData()]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen en tiempo real de La Reina Helados</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Ventas de hoy" value={formatCompactCurrency(data.salesToday)} icon={DollarSign} />
        <KpiCard label="Ventas del mes" value={formatCompactCurrency(data.salesMonth)} icon={CalendarRange} />
        <KpiCard label="Pedidos de hoy" value={String(data.ordersTodayCount)} icon={ClipboardList} />
        <KpiCard label="Ticket promedio" value={formatCompactCurrency(data.avgTicket)} icon={Receipt} />
        <KpiCard
          label="Stock crítico"
          value={String(data.criticalStock.length)}
          icon={AlertTriangle}
          tone={data.criticalStock.length > 0 ? "critical" : "default"}
          hint={data.criticalStock.length > 0 ? data.criticalStock.slice(0, 2).map((s) => s.name).join(", ") : undefined}
        />
        <KpiCard
          label="Producción pendiente"
          value={String(data.productionPendingCount)}
          icon={Factory}
          tone={data.productionPendingCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Caja actual"
          value={data.cashRegisterOpen ? formatCompactCurrency(data.cashCurrent) : "Cerrada"}
          icon={Wallet}
          tone={data.cashRegisterOpen ? "default" : "warning"}
        />
        <KpiCard label="Ganancia estimada" value={formatCompactCurrency(data.gananciaEstimada)} icon={TrendingUp} />
        <KpiCard label="Clientes nuevos (mes)" value={String(data.customersThisMonth)} icon={UserPlus} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Pedidos de hoy por estado</h2>
        <OrderStatusCards counts={data.statusCounts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Ventas por día" description="Últimos 7 días" className="lg:col-span-2">
          <SalesByDayChart data={data.salesByDay} />
        </ChartCard>
        <ChartCard title="Métodos de pago" description="Últimos 7 días">
          <PaymentMethodsChart data={data.paymentMethods.map((p) => ({ label: p.label, amount: p.amount }))} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Productos más vendidos" description="Últimos 30 días">
          <RankingBarChart data={data.topProducts} />
        </ChartCard>
        <ChartCard title="Sabores más vendidos" description="Últimos 30 días">
          <RankingBarChart data={data.topFlavors} />
        </ChartCard>
        <ChartCard title="Horarios de mayor venta" description="Últimos 7 días">
          <PeakHoursChart data={data.peakHours} />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Accesos rápidos</h2>
        <QuickActions permissions={session.user.permissions} />
      </div>
    </div>
  );
}
