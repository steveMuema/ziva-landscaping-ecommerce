"use client";

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/navbar";
import ChatAgent from "@/components/ChatAgent";

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <ChatAgent />
      <main className="flex-1 flex flex-col min-h-0 pb-20 sm:pb-24">{children}</main>
    </div>
  );
}
