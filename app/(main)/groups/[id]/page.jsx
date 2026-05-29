"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft, Users } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { GroupBalances } from "@/components/group-balances";
import { GroupMembers } from "@/components/group-members";

export default function GroupExpensesPage() {
	const params = useParams();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("expenses");

	const { data, isLoading } = useConvexQuery(api.groups.getGroupExpenses, {
		groupId: params.id,
	});

	if (isLoading) {
		return (
			<div className="w-full flex justify-center items-center h-[50vh]">
				<div className="w-full max-w-md opacity-70 flex justify-center">
					{/* Restored to brand blue */}
					<BarLoader
						width={"100%"}
						color="#3b82f6"
						className="dark:!bg-slate-800"
					/>
				</div>
			</div>
		);
	}

	const group = data?.group;
	const members = data?.members || [];
	const expenses = data?.expenses || [];
	const settlements = data?.settlements || [];
	const balances = data?.balances || [];
	const userLookupMap = data?.userLookupMap || {};

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
					<div className="flex items-center gap-4 sm:gap-5">
						<div className="bg-primary/10 dark:bg-primary/20 p-4 sm:p-5 rounded-2xl shadow-sm border border-primary/20 dark:border-primary/20 shrink-0">
							<Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-1">
								{group?.name}
							</h1>
							{group?.description && (
								<p className="text-muted-foreground font-medium">
									{group.description}
								</p>
							)}
							<p className="text-sm text-muted-foreground mt-1.5 flex items-center">
								<span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2" />
								{members.length} members
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button
							asChild
							variant="outline"
							className="active:scale-95 transition-all shadow-sm dark:border-slate-700 dark:bg-slate-900/50 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10">
							<Link href={`/settlements/group/${params.id}`}>
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

			{/* Grid layout for group details */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				<div className="lg:col-span-2">
					<Card className="h-full border dark:bg-slate-900/40 dark:border-slate-800 shadow-sm overflow-hidden">
						<CardHeader className="pb-3 border-b dark:border-slate-800/60 bg-muted/30 dark:bg-transparent">
							<CardTitle className="text-lg font-semibold">
								Group Balances
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<GroupBalances balances={balances} />
						</CardContent>
					</Card>
				</div>

				<div>
					<Card className="h-full border dark:bg-slate-900/40 dark:border-slate-800 shadow-sm overflow-hidden">
						<CardHeader className="pb-3 border-b dark:border-slate-800/60 bg-muted/30 dark:bg-transparent">
							<CardTitle className="text-lg font-semibold">
								Members
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6 p-0 sm:p-6">
							<GroupMembers members={members} />
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Tabs for expenses and settlements */}
			<Tabs
				defaultValue="expenses"
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6">
				<TabsList className="grid w-full sm:w-[400px] grid-cols-2 p-1 bg-muted/50 dark:bg-slate-800/50">
					<TabsTrigger
						value="expenses"
						className="rounded-sm transition-all data-[state=active]:text-primary">
						Expenses ({expenses.length})
					</TabsTrigger>
					<TabsTrigger
						value="settlements"
						className="rounded-sm transition-all data-[state=active]:text-primary">
						Settlements ({settlements.length})
					</TabsTrigger>
				</TabsList>

				<div className="rounded-xl border dark:border-slate-800 bg-card dark:bg-slate-900/40 p-1 shadow-sm">
					<TabsContent
						value="expenses"
						className="m-0 focus-visible:outline-none focus-visible:ring-0 p-4">
						<ExpenseList
							expenses={expenses}
							showOtherPerson={true}
							isGroupExpense={true}
							userLookupMap={userLookupMap}
						/>
					</TabsContent>

					<TabsContent
						value="settlements"
						className="m-0 focus-visible:outline-none focus-visible:ring-0 p-4">
						<SettlementList
							settlements={settlements}
							isGroupSettlement={true}
							userLookupMap={userLookupMap}
						/>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
