import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scale Group HQ",
  description:
    "Holding company dashboard for Scale group — Finance, HR, Marketing consolidated view",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-navy-950">
        {children}
      </body>
    </html>
  );
}
