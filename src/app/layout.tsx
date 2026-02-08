import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKIM Voice | Record, Transcribe & Analyze",
  description: "Record or upload audio, get live transcription, summary, sentiment analysis, and translation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
