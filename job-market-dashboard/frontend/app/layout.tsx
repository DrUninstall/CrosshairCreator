import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/app/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Market Skills Intelligence",
  description:
    "Analyze job market trends to discover in-demand skills, certifications, and degree requirements. Data for personal/research use only.",
  keywords: [
    "job market",
    "skills",
    "certifications",
    "career",
    "tech jobs",
    "data science",
    "software engineering",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-6">
            <div className="dashboard-container text-center text-sm text-muted-foreground">
              <p>Job Market Skills Intelligence Dashboard</p>
              <p className="mt-1">
                Data shown for personal/research use only. Not affiliated with any job board.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
