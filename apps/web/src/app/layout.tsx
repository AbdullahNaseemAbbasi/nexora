import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora — AI-Powered Project Management",
  description:
    "Nexora is a multi-tenant SaaS platform for AI-powered project management. Manage teams, projects, and tasks with intelligent AI assistance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
