"use client";

import { useRouter } from "next/navigation";
import { ExpenseForm } from "./components/expense-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt } from "lucide-react";

export default function NewExpensePage() {
	const router = useRouter();

	return (
		<div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="mb-8">
				<Button
					variant="ghost"
					size="sm"
					className="mb-6 hover:-translate-x-1 transition-transform text-muted-foreground hover:text-foreground"
					onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>

				<div className="flex items-center gap-4 sm:gap-5">
					<div className="bg-primary/10 dark:bg-primary/20 p-3.5 sm:p-4 rounded-2xl shadow-sm border border-primary/20 dark:border-primary/20 shrink-0">
						<Receipt className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-1">
							Add an expense
						</h1>
						<p className="text-muted-foreground mt-1.5 font-medium">
							Record a new expense to split with others
						</p>
					</div>
				</div>
			</div>

			<Card className="border dark:bg-slate-900/40 dark:border-slate-800 shadow-sm overflow-hidden rounded-xl">
				<CardContent className="p-4 sm:p-6">
					<Tabs className="w-full" defaultValue="individual">
						<TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 dark:bg-slate-800/50 mb-6 rounded-lg">
							<TabsTrigger
								value="individual"
								className="rounded-md transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm">
								Individual Expense
							</TabsTrigger>
							<TabsTrigger
								value="group"
								className="rounded-md transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm">
								Group Expense
							</TabsTrigger>
						</TabsList>

						<div className="rounded-xl border border-transparent dark:border-slate-800/50 bg-transparent dark:bg-slate-950/20 p-1 sm:p-2">
							<TabsContent
								value="individual"
								className="m-0 focus-visible:outline-none focus-visible:ring-0">
								<ExpenseForm
									type="individual"
									onSuccess={(id) =>
										router.push(`/person/${id}`)
									}
								/>
							</TabsContent>
							<TabsContent
								value="group"
								className="m-0 focus-visible:outline-none focus-visible:ring-0">
								<ExpenseForm
									type="group"
									onSuccess={(id) =>
										router.push(`/groups/${id}`)
									}
								/>
							</TabsContent>
						</div>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
