import { requirePermission } from "@/lib/auth-helpers";
import { getSettingsPageData } from "@/lib/queries/settings";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export default async function ConfiguracionPage() {
  await requirePermission("settings.manage");

  const { settingsMap, paymentMethods, categories, promotions } = await getSettingsPageData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Datos del negocio, apariencia, pagos, categorías y más</p>
      </div>

      <SettingsPageClient
        settingsMap={settingsMap}
        paymentMethods={paymentMethods.map((m) => ({ id: m.id, key: m.key, label: m.label, enabled: m.enabled }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, order: c.order, active: c.active }))}
        promotions={promotions.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          value: p.value,
          minQuantity: p.minQuantity,
          daysOfWeek: p.daysOfWeek,
          startDate: p.startDate?.toISOString() ?? null,
          endDate: p.endDate?.toISOString() ?? null,
          active: p.active,
        }))}
      />
    </div>
  );
}
