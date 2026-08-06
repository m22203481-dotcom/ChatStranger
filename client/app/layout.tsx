import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import { AnonymousAuthProvider } from "@/contexts/AnonymousAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
  },

  twitter: {
    card: "summary_large_image",
    title: "ChatStranger - talk to Strangers Online Instantly",
    description:
      "Meet new people instantly through anonymous conversations and interest-based matching.",
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
            <AnonymousAuthProvider>{children}</AnonymousAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
