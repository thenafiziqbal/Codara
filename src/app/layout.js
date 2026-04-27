import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Codara — AI Code Intelligence",
  description:
    "Codara analyzes codebases, generates documentation, detects AI-written code, and issues verifiable health certificates.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport = {
  themeColor: "#04060f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen relative">
        <AuthProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
