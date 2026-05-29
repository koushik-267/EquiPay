import { Inter } from "next/font/google";
import Header from "@/components/header";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "EquiPay",
	description: "Track, split, and settle — the equitable way.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/logos/logo-e-3.png" sizes="any" />
			</head>
			<body
				className={`${inter.className} dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange>
					<ClerkThemeProvider>
						<ConvexClientProvider>
							<Header />
							<main className="min-h-screen pt-16">
								{children}
								<Toaster richColors />
							</main>
						</ConvexClientProvider>
					</ClerkThemeProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
