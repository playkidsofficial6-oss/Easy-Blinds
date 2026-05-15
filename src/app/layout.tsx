import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandProvider } from "@/components/providers/brand-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Important for "app-like" feel on iPad
};

export const metadata: Metadata = {
  title: "MeasurePro - The Operating System for Curtain Businesses",
  description: "The all-in-one platform for modern curtain and blind businesses. Manage measurements, quotes, and installations with unparalleled ease.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MeasurePro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <BrandProvider>
              {children}
              <Toaster />
            </BrandProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
