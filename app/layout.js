import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Fusion — Compare Multiple AI Models Side by Side",
  description:
    "Chat with GPT, Gemini, DeepSeek, Cohere, and more simultaneously. Compare AI responses side-by-side in one powerful interface.",
  keywords: "AI, chatbot, GPT, Gemini, DeepSeek, multi-model, comparison",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Provider>
            {children}
            <Toaster richColors position="top-center" />
          </Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
