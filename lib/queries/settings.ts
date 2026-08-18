import { db } from "@/lib/db";

export const DEFAULT_THEME = {
  primaryColor: "#EE7FAC",
  secondaryColor: "#8FE3E0",
  accentColor: "#C3B3F0",
};

export async function getThemeSettings() {
  const rows = await db.setting.findMany({
    where: { key: { in: ["theme.primaryColor", "theme.secondaryColor", "theme.accentColor"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    primaryColor: map["theme.primaryColor"] || DEFAULT_THEME.primaryColor,
    secondaryColor: map["theme.secondaryColor"] || DEFAULT_THEME.secondaryColor,
    accentColor: map["theme.accentColor"] || DEFAULT_THEME.accentColor,
  };
}

export async function getTicketSettings() {
  const rows = await db.setting.findMany({
    where: {
      key: {
        in: [
          "business.name",
          "business.address",
          "business.phone",
          "print.ticketHeader",
          "print.ticketFooter",
          "print.paperWidth",
          "print.copies",
        ],
      },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    businessName: map["business.name"] || "La Reina Helados",
    address: map["business.address"] || "",
    phone: map["business.phone"] || "",
    ticketHeader: map["print.ticketHeader"] || "",
    ticketFooter: map["print.ticketFooter"] || "¡Gracias por tu compra!",
    paperWidth: map["print.paperWidth"] || "80mm",
    copies: Number(map["print.copies"]) || 2,
  };
}

export async function getSettingsPageData() {
  const [settings, paymentMethods, categories, promotions] = await Promise.all([
    db.setting.findMany(),
    db.paymentMethodConfig.findMany({ orderBy: { order: "asc" } }),
    db.category.findMany({ orderBy: { order: "asc" } }),
    db.promotion.findMany({ orderBy: { name: "asc" } }),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return { settingsMap, paymentMethods, categories, promotions };
}
