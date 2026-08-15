export function buildThemeStyleTag(theme: { primaryColor: string; secondaryColor: string; accentColor: string }) {
  const vars = `
    --primary: ${theme.primaryColor};
    --ring: ${theme.primaryColor};
    --sidebar-primary: ${theme.primaryColor};
    --sidebar-ring: ${theme.primaryColor};
    --secondary: ${theme.secondaryColor};
    --accent: ${theme.accentColor};
    --sidebar-accent: ${theme.accentColor};
    --chart-1: ${theme.primaryColor};
  `;
  return `:root { ${vars} } .dark { ${vars} }`;
}
