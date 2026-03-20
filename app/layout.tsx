import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban - Organização de Tarefas",
  description: "Sistema de organização de tarefas multi-equipe estilo Kanban",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
