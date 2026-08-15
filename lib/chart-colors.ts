// Paleta de charts — validada con scripts/validate_palette.js de la skill dataviz.
// Un solo hue de marca para series únicas; orden categórico fijo (no ciclado) para
// series múltiples (ej. métodos de pago), tomado del set validado por defecto.

export const singleSeriesColor = { light: "#EE7FAC", dark: "#F49AC1" };

export const categoricalPalette = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"],
};

export const chartChrome = {
  light: { grid: "#e1e0d9", axis: "#898781", surface: "#fffbf7" },
  dark: { grid: "#2c2c2a", axis: "#b3a8bd", surface: "#2a2530" },
};
