"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, Moon, Sun, Home } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function Header() {
	const { isLoading } = useStoreUser();
	const path = usePathname();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	const logoSrc =
		mounted && theme === "dark" ? "/logos/logo-5.png" : "/logos/logo-1.png";
	const logoHeightClass = mounted && theme === "dark" ? "h-11" : "h-13";

	return (
		<header className="fixed top-0 w-full border-b bg-white/95 dark:bg-gray-950/95 dark:border-gray-800 backdrop-blur z-50 supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-gray-950/60 transition-colors">
			<nav className="container mx-auto px-4 h-16 flex items-center justify-between">
				{/* Logo - Left */}
				<Link
					href="/"
					className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
					<Image
						src={logoSrc}
						alt="EquiPay Logo"
						width={200}
						height={60}
						className={`${logoHeightClass} w-auto object-contain`}
						priority
					/>
				</Link>

				{/* Everything Else - Right */}
				<div className="flex items-center gap-4 md:gap-6">
					{path === "/" && (
						<div className="hidden md:flex items-center gap-6">
							<Link
								href="#features"
								className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition">
								Features
							</Link>
							<Link
								href="#how-it-works"
								className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition">
								How It Works
							</Link>
						</div>
					)}

					{mounted && (
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								setTheme(theme === "dark" ? "light" : "dark")
							}
							className="w-9 h-9 rounded-full hover:text-blue-600 hover:border-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition">
							{theme === "dark" ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
						</Button>
					)}

					<div className="flex items-center gap-4">
						<Authenticated>
							{/* Dynamic Context-Aware Navigation Button */}
							{path === "/dashboard" ? (
								<Link href="/">
									<Button
										variant="outline"
										className="hidden md:inline-flex items-center gap-2 hover:text-blue-600 hover:border-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition shadow-sm">
										<Home className="h-4 w-4" />
										Home
									</Button>
									<Button
										variant="ghost"
										className="md:hidden w-10 h-10 p-0 hover:bg-muted">
										<Home className="h-4 w-4" />
									</Button>
								</Link>
							) : (
								<Link href="/dashboard">
									<Button
										variant="outline"
										className="hidden md:inline-flex items-center gap-2 hover:text-blue-600 hover:border-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition shadow-sm">
										<LayoutDashboard className="h-4 w-4" />
										Dashboard
									</Button>
									<Button
										variant="ghost"
										className="md:hidden w-10 h-10 p-0 hover:bg-muted">
										<LayoutDashboard className="h-4 w-4" />
									</Button>
								</Link>
							)}

							<UserButton
								appearance={{
									elements: {
										avatarBox:
											"w-9 h-9 border shadow-sm transition-transform hover:scale-105",
										userButtonPopoverCard:
											"shadow-xl dark:bg-gray-900 dark:border-gray-800 rounded-xl overflow-hidden",
										userPreviewMainIdentifier:
											"font-semibold dark:text-gray-100",
										userPreviewSecondaryIdentifier:
											"dark:text-gray-400",
									},
								}}
							/>
						</Authenticated>

						<Unauthenticated>
							<SignInButton forceRedirectUrl="/dashboard">
								<Button
									variant="ghost"
									className="font-medium dark:text-gray-200 dark:hover:bg-gray-800">
									Sign In
								</Button>
							</SignInButton>

							<SignUpButton forceRedirectUrl="/dashboard">
								<Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700">
									Get Started
								</Button>
							</SignUpButton>
						</Unauthenticated>
					</div>
				</div>
			</nav>

			{/* Sleek Native CSS Loading Bar (Replaced BarLoader) */}
			<div
				className={cn(
					"h-0.5 w-full bg-blue-600/0 transition-all duration-300",
					isLoading ? "bg-blue-600/100 animate-pulse" : "opacity-0",
				)}>
				<div
					className={cn(
						"h-full bg-blue-600 shadow-[0_0_10px_#2563eb]",
						isLoading
							? "w-full animate-[progress_1.5s_ease-in-out_infinite_alternate]"
							: "w-0",
					)}
				/>
			</div>
		</header>
	);
}
