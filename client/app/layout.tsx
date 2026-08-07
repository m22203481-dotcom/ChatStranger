import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import { AnonymousAuthProvider } from "@/contexts/AnonymousAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Script from "next/script";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chatstranger.chat"),
  applicationName: "ChatStranger",

  title: "ChatStranger - Anonymous Chat With Strangers Online instantly",

  description:
    "ChatStranger is a free anonymous chat platform to talk with strangers online, meet new people, and start real-time conversations instantly.",

  keywords: [
    "anonymous chat",
    "chat with strangers",
    "talk to strangers online",
    "meet new people",
    "online chat",
    "make friends online",
    "random chat",
    "chat rooms",
    "anonymous messaging",
    "ChatStranger",
  ],
  icons: {
  icon: "/icon.png",
  apple: "/icon.png",
},
alternates: {
    canonical: "https://www.chatstranger.chat",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "ChatStranger - Anonymous Chat With Strangers Online instantly",
    description:
      "Meet new people instantly through anonymous conversations .",
    url: "https://www.chatstranger.chat",
    siteName: "ChatStranger",
    type: "website",
    images: [
  {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "ChatStranger",
  },
],
  },

  twitter: {
    card: "summary_large_image",
    title: "ChatStranger - talk to Strangers Online Instantly",
    description:
      "Meet new people instantly through anonymous conversations and interest-based matching.",
    images: ["/og-image.png"], 
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <AnonymousAuthProvider>
              {children}
              </AnonymousAuthProvider>
          </AuthProvider>
        </ThemeProvider>
       <Script
    src="https://www.googletagmanager.com/gtag/js?id=G-6SC7XQMG81"
    strategy="afterInteractive"
  />

  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-6SC7XQMG81');
    `}
  </Script>
      </body>
    </html>
  );
}
