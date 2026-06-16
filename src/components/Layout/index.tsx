import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar />
      <TopBar title={title} />
      <main className="ml-60 p-6">
        {children}
      </main>
    </div>
  );
}
