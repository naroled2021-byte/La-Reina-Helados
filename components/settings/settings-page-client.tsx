"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "@/components/settings/general-tab";
import { AppearanceTab } from "@/components/settings/appearance-tab";
import { PaymentMethodsTab } from "@/components/settings/payment-methods-tab";
import { CategoriesTab } from "@/components/settings/categories-tab";
import { PromotionsTab } from "@/components/settings/promotions-tab";
import { PrintTab } from "@/components/settings/print-tab";
import type { CategoryRow, PaymentMethodRow, PromotionRow } from "@/components/settings/types";

export function SettingsPageClient({
  settingsMap,
  paymentMethods,
  categories,
  promotions,
}: {
  settingsMap: Record<string, string>;
  paymentMethods: PaymentMethodRow[];
  categories: CategoryRow[];
  promotions: PromotionRow[];
}) {
  return (
    <Tabs defaultValue="general">
      <TabsList className="flex-wrap">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        <TabsTrigger value="payments">Métodos de pago</TabsTrigger>
        <TabsTrigger value="categories">Categorías</TabsTrigger>
        <TabsTrigger value="promotions">Promociones</TabsTrigger>
        <TabsTrigger value="print">Impresión</TabsTrigger>
      </TabsList>

      <div className="pt-4">
        <TabsContent value="general">
          <GeneralTab settingsMap={settingsMap} />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab settingsMap={settingsMap} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentMethodsTab methods={paymentMethods} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab categories={categories} />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsTab promotions={promotions} />
        </TabsContent>
        <TabsContent value="print">
          <PrintTab settingsMap={settingsMap} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
