"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark" | "cyan" | "blue" | "system";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem={true}
      themes={['light', 'dark', 'cyan', 'blue']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();

  return {
    theme: (theme || "system") as Theme,
    systemTheme,
    setTheme: (t: Theme) => setTheme(t),
    toggleTheme: () => {
      // Legacy stub for any components historically toggling light/dark
      setTheme(theme === "light" ? "dark" : "light");
    }
  };
}
