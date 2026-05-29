"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { formatRupee } from "@/lib/utils";

export default function PersonExpensesPage() {
	const params = useParams();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("expenses");

	const { data, isLoading } = useConvexQuery(
		api.expenses.getExpensesBetweenUsers,
		{ userId: params.id },
	);

	if (isLoading) {
		return (
			<div className="w-full flex justify-center items-center h-[50vh]">
				<div className="w-full max-w-md opacity-70 flex justify-center">
					<BarLoader
						width={"100%"}
						color="#3b82f6"
						className="dark:!bg-slate-800"
					/>
				</div>
			</div>
		);
	}

	const otherUser = data?.otherUser;
	const expenses = data?.expenses || [];
	const settlements = data?.settlements || [];
	const balance = data?.balance || 0;

	return (
		<div className="container mx-auto py-8 px-4 sm:px-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="mb-8">
				<Button
					variant="ghost"
					size="sm"
					className="mb-6 hover:-translate-x-1 transition-transform text-muted-foreground hover:text-foreground"
					onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>

				<div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-background/20 shadow-sm">
							<AvatarImage
								src={otherUser?.imageUrl}
								className="object-cover"
							/>
							<AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
								{otherUser?.name?.charAt(0) || "?"}
							</AvatarFallback>
						</Avatar>
						<div>
							<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-1">
								{otherUser?.name}
							</h1>
							<p className="text-muted-foreground font-medium">
								{otherUser?.email}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button
							asChild
							variant="outline"
							className="active:scale-95 transition-all shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
							<Link href={`/settlements/user/${params.id}`}>
								<ArrowLeftRight className="mr-2 h-4 w-4 text-primary" />
								Settle up
							</Link>
						</Button>
						<Button
							asChild
							className="active:scale-95 transition-all shadow-sm group">
							<Link href={`/expenses/new`}>
								<PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
								Add expense
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Balance card */}
			<Card className="mb-8 border dark:bg-slate-900/40 dark:border-slate-800 shadow-sm overflow-hidden">
				<CardHeader className="pb-3 border-b dark:border-slate-800/60 bg-muted/30 dark:bg-transparent">
					<CardTitle className="text-lg font-semibold">
						Current Balance
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="space-y-1">
							{balance === 0 ? (
								<>
									<p className="text-lg font-medium text-foreground/90">
										You are all settled up
									</p>
									<p className="text-sm text-muted-foreground">
										No outstanding balances with{" "}
										{otherUser?.name}.
									</p>
								</>
							) : balance > 0 ? (
								<>
									<p className="text-lg text-muted-foreground">
										<span className="font-semibold text-foreground">
											{otherUser?.name}
										</span>{" "}
										owes you
									</p>
								</>
							) : (
								<>
									<p className="text-lg text-muted-foreground">
										You owe{" "}
										<span className="font-semibold text-foreground">
											{otherUser?.name}
										</span>
									</p>
								</>
							)}
						</div>
						<div
							className={`text-3xl sm:text-4xl font-bold tracking-tight ${
								balance > 0
									? "text-green-600 dark:text-green-500"
									: balance < 0
										? "text-red-600 dark:text-red-500"
										: "text-foreground"
							}`}>
							{formatRupee(Math.abs(balance))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs for expenses and settlements */}
			<Tabs
				defaultValue="expenses"
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6">
				<TabsList className="grid w-full sm:w-[400px] grid-cols-2 p-1 bg-muted/50 dark:bg-slate-800/50">
					<TabsTrigger
						value="expenses"
						className="rounded-sm transition-all">
						Expenses ({expenses.length})
					</TabsTrigger>
					<TabsTrigger
						value="settlements"
						className="rounded-sm transition-all">
						Settlements ({settlements.length})
					</TabsTrigger>
				</TabsList>

				<div className="rounded-xl border dark:border-slate-800 bg-card dark:bg-slate-900/40 p-1 shadow-sm">
					<TabsContent
						value="expenses"
						className="m-0 focus-visible:outline-none focus-visible:ring-0 p-4">
						<ExpenseList
							expenses={expenses}
							showOtherPerson={false}
							otherPersonId={params.id}
							userLookupMap={
								otherUser ? { [otherUser.id]: otherUser } : {}
							}
						/>
					</TabsContent>

					<TabsContent
						value="settlements"
						className="m-0 focus-visible:outline-none focus-visible:ring-0 p-4">
						<SettlementList
							settlements={settlements}
							userLookupMap={
								otherUser ? { [otherUser.id]: otherUser } : {}
							}
						/>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
