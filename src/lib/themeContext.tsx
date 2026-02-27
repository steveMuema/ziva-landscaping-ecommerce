"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark" | "cyan" | "blue";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      themes={['light', 'dark', 'cyan', 'blue']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme } = useNextTheme();

  return {
    theme: (theme || "light") as Theme,
    setTheme: (t: Theme) => setTheme(t),
    toggleTheme: () => {
      // Legacy stub for any components historically toggling light/dark
      setTheme(theme === "light" ? "dark" : "light");
    }
  };
}
