"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	PlusCircle,
	Users,
	ChevronRight,
	Wallet,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { formatRupee } from "@/lib/utils";
import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";

export default function Dashboard() {
	const { data: balances, isLoading: balancesLoading } = useConvexQuery(
		api.dashboard.getUserBalances,
	);

	const { data: groups, isLoading: groupsLoading } = useConvexQuery(
		api.dashboard.getUserGroups,
	);

	const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
		api.dashboard.getTotalSpent,
	);

	const { data: monthlySpending, isLoading: monthlySpendingLoading } =
		useConvexQuery(api.dashboard.getMonthlySpending);

	const isLoading =
		balancesLoading ||
		groupsLoading ||
		totalSpentLoading ||
		monthlySpendingLoading;

	return (
		<div className="container mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{isLoading ? (
				<div className="w-full flex justify-center items-center h-[50vh]">
					<div className="w-full max-w-md opacity-70 flex justify-center">
						<BarLoader
							width={"100%"}
							color="#3b82f6"
							className="dark:!bg-slate-800"
						/>
					</div>
				</div>
			) : (
				<>
					{/* Header Section */}
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8">
						<div>
							<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-2">
								Dashboard
							</h1>
							<p className="text-muted-foreground mt-1 text-sm sm:text-base">
								Your financial overview and recent activity.
							</p>
						</div>
						<Button
							asChild
							className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 group">
							<Link href="/expenses/new">
								<PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
								Add expense
							</Link>
						</Button>
					</div>

					{/* Balance Overview Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<Card className="group overflow-hidden border bg-card dark:bg-slate-900/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 dark:border-slate-800">
							<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Balance
								</CardTitle>
								<div className="bg-primary/10 p-2 rounded-full dark:bg-primary/20">
									<Wallet className="h-4 w-4 text-primary" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold tracking-tight">
									{balances?.totalBalance > 0 ? (
										<span className="text-green-600 dark:text-green-500">
											+
											{formatRupee(
												balances?.totalBalance,
											)}
										</span>
									) : balances?.totalBalance < 0 ? (
										<span className="text-red-600 dark:text-red-500">
											-
											{formatRupee(
												Math.abs(
													balances?.totalBalance,
												),
											)}
										</span>
									) : (
										<span>{formatRupee(0)}</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground mt-2 font-medium">
									{balances?.totalBalance > 0
										? "You are owed money overall"
										: balances?.totalBalance < 0
											? "You owe money overall"
											: "You're all settled up!"}
								</p>
							</CardContent>
						</Card>

						<Card className="group overflow-hidden border bg-card dark:bg-slate-900/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 dark:border-slate-800">
							<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									You are owed
								</CardTitle>
								<div className="bg-green-100 p-2 rounded-full dark:bg-green-900/30">
									<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold tracking-tight text-green-600 dark:text-green-500">
									{formatRupee(balances?.youAreOwed)}
								</div>
								<p className="text-xs text-muted-foreground mt-2 font-medium">
									From{" "}
									{balances?.oweDetails?.youAreOwedBy
										?.length || 0}{" "}
									people
								</p>
							</CardContent>
						</Card>

						<Card className="group overflow-hidden border bg-card dark:bg-slate-900/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 dark:border-slate-800">
							<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									You owe
								</CardTitle>
								<div className="bg-red-100 p-2 rounded-full dark:bg-red-900/30">
									<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								{balances?.oweDetails?.youOwe?.length > 0 ? (
									<>
										<div className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">
											{formatRupee(balances?.youOwe)}
										</div>
										<p className="text-xs text-muted-foreground mt-2 font-medium">
											To{" "}
											{balances?.oweDetails?.youOwe
												?.length || 0}{" "}
											people
										</p>
									</>
								) : (
									<>
										<div className="text-3xl font-bold tracking-tight">
											{formatRupee(0)}
										</div>
										<p className="text-xs text-muted-foreground mt-2 font-medium">
											You don't owe anyone
										</p>
									</>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Main Dashboard Content */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left column */}
						<div className="lg:col-span-2 space-y-8">
							{/* Expense summary */}
							<div className="transition-all duration-300 hover:shadow-sm rounded-xl">
								<ExpenseSummary
									monthlySpending={monthlySpending}
									totalSpent={totalSpent}
								/>
							</div>
						</div>

						{/* Right column */}
						<div className="space-y-8">
							{/* Balance details */}
							<Card className="border dark:bg-slate-900/40 dark:border-slate-800">
								<CardHeader className="pb-3 border-b dark:border-slate-800/60 mb-4">
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">
											Balance Details
										</CardTitle>
										<Button
											variant="ghost"
											size="sm"
											asChild
											className="h-8 text-xs font-medium text-muted-foreground hover:text-primary group">
											<Link href="/contacts">
												View all
												<ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
											</Link>
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<BalanceSummary balances={balances} />
								</CardContent>
							</Card>

							{/* Groups */}
							<Card className="border dark:bg-slate-900/40 dark:border-slate-800 flex flex-col h-auto">
								<CardHeader className="pb-3 border-b dark:border-slate-800/60 mb-4">
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">
											Your Groups
										</CardTitle>
										<Button
											variant="ghost"
											size="sm"
											asChild
											className="h-8 text-xs font-medium text-muted-foreground hover:text-primary group">
											<Link href="/contacts">
												View all
												<ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
											</Link>
										</Button>
									</div>
								</CardHeader>
								<CardContent className="flex-grow">
									<GroupList groups={groups} />
								</CardContent>
								<CardFooter className="pt-4 border-t dark:border-slate-800/60">
									<Button
										variant="outline"
										asChild
										className="w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all">
										<Link href="/contacts?createGroup=true">
											<Users className="mr-2 h-4 w-4" />
											Create new group
										</Link>
									</Button>
								</CardFooter>
							</Card>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
