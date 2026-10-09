"use server";

import { requirePermission } from "@/lib/auth-helpers";
import type { DateRange } from "@/lib/date-range";
import * as reports from "@/lib/queries/reports";
import { getOrderDetail } from "@/lib/queries/orders";

export async function fetchSalesReport(range: DateRange, channel: string) {
  await requirePermission("reports.view");
  return reports.getSalesReport({ ...range, channel });
}

export async function fetchCancelledOrdersReport(range: DateRange, channel: string) {
  await requirePermission("reports.view");
  return reports.getCancelledOrdersReport({ ...range, channel });
}

export async function fetchOrderDetail(orderId: string) {
  await requirePermission("reports.view");
  return getOrderDetail(orderId);
}

export async function fetchProductsReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getProductsReport(range);
}

export async function fetchFlavorsReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getFlavorsReport(range);
}

export async function fetchCustomersReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getCustomersReport(range);
}

export async function fetchStockReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getStockReport(range);
}

export async function fetchProductionReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getProductionReport(range);
}

export async function fetchCashReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getCashReport(range);
}

export async function fetchPaymentMethodsReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getPaymentMethodsReport(range);
}

export async function fetchProfitReport(range: DateRange) {
  await requirePermission("reports.view");
  return reports.getProfitReport(range);
}

export async function fetchPromotionsReport() {
  await requirePermission("reports.view");
  return reports.getPromotionsReport();
}
