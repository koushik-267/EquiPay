"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { FEATURES, STEPS, TESTIMONIALS } from "@/lib/landing";
import { motion } from "framer-motion";

// --- Animation Variants ---
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2, // Time between each item animating in
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export default function LandingPage() {
	return (
		<div className="flex flex-col">
			{/* ───── Hero ───── */}
			<section className="mt-5 pb-6 space-y-10 md:space-y-15 px-5">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={containerVariants}
					className="container mx-auto px-4 md:px-6 text-center space-y-6">
					<motion.div variants={itemVariants}>
						<Badge
							variant="outline"
							className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
							Split expenses. Simplify life.
						</Badge>
					</motion.div>

					<motion.h1
						variants={itemVariants}
						className="gradient-title mx-auto max-w-6xl text-4xl font-bold md:text-8xl">
						The smartest way to split expenses with friends
					</motion.h1>

					<motion.p
						variants={itemVariants}
						className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed">
						Track shared expenses, split bills effortlessly, and
						settle up quickly. Never worry about who owes who again.
					</motion.p>

					<motion.div
						variants={itemVariants}
						className="flex flex-col items-center gap-4 sm:flex-row justify-center">
						<Button
							asChild
							size="lg"
							className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
							<Link href="/dashboard">
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							size="lg"
							className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors">
							<Link href="#how-it-works">See How It Works</Link>
						</Button>
					</motion.div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6, duration: 0.7 }}
					className="container mx-auto max-w-5xl overflow-hidden rounded-xl shadow-xl dark:shadow-blue-900/10">
					<div className="gradient p-1 w-full h-[250px] sm:h-[350px] md:h-[450px] rounded-xl transition-all">
						<div className="relative w-full h-full rounded-lg overflow-hidden">
							<Image
								src="/hero4.png"
								alt="Hero"
								fill
								className="object-cover dark:brightness-90 transition-all"
								priority
							/>
						</div>
					</div>
				</motion.div>
			</section>

			{/* ───── Features ───── */}
			<section
				id="features"
				className="bg-gray-50 dark:bg-slate-900/30 py-20 transition-colors">
				<div className="container mx-auto px-4 md:px-6 text-center">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={containerVariants}>
						<motion.div variants={itemVariants}>
							<Badge
								variant="outline"
								className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
								Features
							</Badge>
							<h2 className="gradient-title mt-2 text-3xl md:text-4xl">
								Everything you need to split expenses
							</h2>
							<p className="mx-auto mt-3 max-w-175 text-gray-500 dark:text-gray-400 md:text-xl/relaxed">
								Our platform provides all the tools you need to
								handle shared expenses with ease.
							</p>
						</motion.div>

						<div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map(
								({ title, Icon, bg, color, description }) => (
									<motion.div
										key={title}
										variants={itemVariants}
										whileHover={{ y: -8, scale: 1.02 }} // Lifts the card up and scales it slightly
										whileTap={{ scale: 0.98 }} // Gives a nice physical "click" feel
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 20,
										}}>
										<Card className="h-full flex flex-col items-center space-y-4 p-6 text-center dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl transition-shadow dark:hover:shadow-blue-900/20">
											<div
												className={`rounded-full p-3 ${bg} dark:opacity-90`}>
												<Icon
													className={`h-6 w-6 ${color}`}
												/>
											</div>
											<h3 className="text-xl font-bold dark:text-slate-100">
												{title}
											</h3>
											<p className="text-gray-500 dark:text-gray-400">
												{description}
											</p>
										</Card>
									</motion.div>
								),
							)}
						</div>
					</motion.div>
				</div>
			</section>

			{/* ───── How it works ───── */}
			<section id="how-it-works" className="py-20 transition-colors">
				<div className="container mx-auto px-4 md:px-6 text-center">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={containerVariants}>
						<motion.div variants={itemVariants}>
							<Badge
								variant="outline"
								className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
								How It Works
							</Badge>
							<h2 className="gradient-title mt-2 text-3xl md:text-4xl">
								Splitting expenses has never been easier
							</h2>
							<p className="mx-auto mt-3 max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed">
								Follow these simple steps to start tracking and
								splitting expenses with friends.
							</p>
						</motion.div>

						<div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
							{STEPS.map(({ label, title, description }) => (
								<motion.div
									key={label}
									variants={itemVariants}
									className="flex flex-col items-center space-y-4 cursor-pointer"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 17,
									}}>
									<motion.div
										className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
										whileHover={{
											rotate: 10,
											backgroundColor: "#dbeafe",
										}} // Spins the number circle slightly!
									>
										{label}
									</motion.div>
									<h3 className="text-xl font-bold dark:text-slate-100">
										{title}
									</h3>
									<p className="text-gray-500 dark:text-gray-400 text-center">
										{description}
									</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			{/* ───── Testimonials ───── */}
			<section className="bg-gray-50 dark:bg-slate-900/30 py-20 transition-colors">
				<div className="container mx-auto px-4 md:px-6 text-center">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={containerVariants}>
						<motion.div variants={itemVariants}>
							<Badge
								variant="outline"
								className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
								Testimonials
							</Badge>
							<h2 className="gradient-title mt-2 text-3xl md:text-4xl">
								What our users are saying
							</h2>
						</motion.div>

						<div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
							{TESTIMONIALS.map(
								({ quote, name, role, image }) => (
									<motion.div
										key={name}
										variants={itemVariants}
										whileHover={{ y: -5, scale: 1.01 }}
										transition={{
											type: "spring",
											stiffness: 300,
										}}>
										<Card className="h-full flex flex-col justify-between dark:bg-slate-900/50 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
											<CardContent className="space-y-4 p-6">
												<p className="text-gray-500 dark:text-gray-300">
													"{quote}"
												</p>
												<div className="flex items-center space-x-3">
													<Avatar>
														<AvatarImage
															src={image}
															alt={name}
														/>
														<AvatarFallback className="uppercase dark:bg-slate-800 dark:text-slate-300">
															{name.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div className="text-left">
														<p className="text-sm font-medium dark:text-slate-100">
															{name}
														</p>
														<p className="text-sm text-muted-foreground dark:text-gray-400">
															{role}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								),
							)}
						</div>
					</motion.div>
				</div>
			</section>

			{/* ───── Call‑to‑Action ───── */}
			<motion.section
				initial={{ opacity: 0, scale: 0.95 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true, amount: 0.5 }}
				transition={{ duration: 0.5 }}
				className="py-20 gradient dark:bg-none dark:bg-slate-800 transition-all">
				<div className="container mx-auto px-4 md:px-6 text-center space-y-6">
					<h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white dark:text-slate-50">
						Ready to simplify expense sharing?
					</h2>
					<p className="mx-auto max-w-[600px] text-blue-100 dark:text-slate-300 md:text-xl/relaxed">
						Join thousands of users who have made splitting expenses
						stress-free.
					</p>
					<Button
						asChild
						size="lg"
						className="bg-blue-800 hover:bg-blue-900 text-white dark:bg-blue-600 dark:hover:bg-blue-700 border-none">
						<Link href="/dashboard">
							Get Started
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</motion.section>

			{/* ───── Footer ───── */}
			<footer className="border-t bg-gray-50 py-12 text-center text-sm text-muted-foreground dark:bg-slate-950 dark:border-slate-800 dark:text-gray-400 transition-colors">
				© {new Date().getFullYear()} EquiPay. All rights reserved.
				<p>Made with ❤️ by {"Koushik Chennupati"}.</p>
			</footer>
		</div>
	);
}
