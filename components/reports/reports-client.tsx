"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { OrdersReportTab } from "@/components/reports/orders-report-tab";
import { ProductsReportTab } from "@/components/reports/products-report-tab";
import { FlavorsReportTab } from "@/components/reports/flavors-report-tab";
import { CustomersReportTab } from "@/components/reports/customers-report-tab";
import { StockReportTab } from "@/components/reports/stock-report-tab";
import { ProductionReportTab } from "@/components/reports/production-report-tab";
import { CashReportTab } from "@/components/reports/cash-report-tab";
import { PaymentMethodsReportTab } from "@/components/reports/payment-methods-report-tab";
import { ProfitReportTab } from "@/components/reports/profit-report-tab";
import { PromotionsReportTab } from "@/components/reports/promotions-report-tab";
import { getRangeForPreset } from "@/lib/date-range";
import { ORDER_CHANNEL } from "@/lib/constants";
import type { DateRange } from "@/lib/date-range";

const tabsWithoutRange = new Set(["stock", "promotions"]);

export function ReportsClient() {
  const [tab, setTab] = useState("sales-counter");
  const [range, setRange] = useState<DateRange>(() => getRangeForPreset("today"));

  return (
    <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
      <div className="flex flex-col gap-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          <TabsTrigger value="sales-counter">Ventas Mostrador</TabsTrigger>
          <TabsTrigger value="sales-self">Ventas Autoservicio</TabsTrigger>
          <TabsTrigger value="cancelled-counter">Cancelados Mostrador</TabsTrigger>
          <TabsTrigger value="cancelled-self">Cancelados Autoservicio</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="flavors">Sabores</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="production">Producción</TabsTrigger>
          <TabsTrigger value="cash">Caja</TabsTrigger>
          <TabsTrigger value="payments">Métodos de pago</TabsTrigger>
          <TabsTrigger value="profit">Ganancias</TabsTrigger>
          <TabsTrigger value="promotions">Promociones</TabsTrigger>
        </TabsList>
        </div>

        {!tabsWithoutRange.has(tab) && <DateRangeFilter onChange={setRange} />}
      </div>

      <div className="pt-4">
        <TabsContent value="sales-counter">
          <OrdersReportTab range={range} channel={ORDER_CHANNEL.COUNTER} cancelled={false} />
        </TabsContent>
        <TabsContent value="sales-self">
          <OrdersReportTab range={range} channel={ORDER_CHANNEL.SELF_SERVICE} cancelled={false} />
        </TabsContent>
        <TabsContent value="cancelled-counter">
          <OrdersReportTab range={range} channel={ORDER_CHANNEL.COUNTER} cancelled={true} />
        </TabsContent>
        <TabsContent value="cancelled-self">
          <OrdersReportTab range={range} channel={ORDER_CHANNEL.SELF_SERVICE} cancelled={true} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsReportTab range={range} />
        </TabsContent>
        <TabsContent value="flavors">
          <FlavorsReportTab range={range} />
        </TabsContent>
        <TabsContent value="customers">
          <CustomersReportTab range={range} />
        </TabsContent>
        <TabsContent value="stock">
          <StockReportTab range={range} />
        </TabsContent>
        <TabsContent value="production">
          <ProductionReportTab range={range} />
        </TabsContent>
        <TabsContent value="cash">
          <CashReportTab range={range} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentMethodsReportTab range={range} />
        </TabsContent>
        <TabsContent value="profit">
          <ProfitReportTab range={range} />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsReportTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
