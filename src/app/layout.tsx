import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";
import Navbar from "./components/Navbar";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { AlertProvider } from "./components/AlertProvider";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SSO Playground",
  description: "OIDC and SAML Playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          window.addEventListener('pageshow', function(event) {
            if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
              window.location.reload();
            }
          });
        `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <Navbar />
            <AlertProvider>
              <Suspense fallback={<Skeleton count={10} />}>{children}</Suspense>
            </AlertProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
