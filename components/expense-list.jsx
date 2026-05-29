"use client";

import { useState } from "react";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { Trash2, Receipt, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExpenseList({
	expenses,
	showOtherPerson = true,
	isGroupExpense = false,
	otherPersonId = null,
	userLookupMap = {},
}) {
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
	const deleteExpense = useConvexMutation(api.expenses.deleteExpense);

	// State to handle the beautiful delete modal
	const [expenseToDelete, setExpenseToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	if (!expenses || !expenses.length) {
		return (
			<div className="text-center py-10 px-4 bg-muted/30 dark:bg-slate-800/20 rounded-xl border border-dashed dark:border-slate-800 flex flex-col items-center transition-all animate-in fade-in duration-500">
				<div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mb-3 opacity-80">
					<Receipt className="h-6 w-6 text-primary" />
				</div>
				<p className="text-foreground/90 font-medium">
					No expenses found
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Add an expense to start tracking your shared costs.
				</p>
			</div>
		);
	}

	const getUserDetails = (userId) => {
		return {
			name:
				userId === currentUser?._id
					? "You"
					: userLookupMap[userId]?.name || "Other User",
			imageUrl: null,
			id: userId,
		};
	};

	const canDeleteExpense = (expense) => {
		if (!currentUser) return false;
		return (
			expense.createdBy === currentUser._id ||
			expense.paidByUserId === currentUser._id
		);
	};

	// The new sleek delete handler
	const confirmDelete = async () => {
		if (!expenseToDelete) return;

		setIsDeleting(true);
		try {
			await deleteExpense.mutate({ expenseId: expenseToDelete._id });
			toast.success("Expense deleted successfully");
		} catch (error) {
			toast.error("Failed to delete expense: " + error.message);
		} finally {
			setIsDeleting(false);
			setExpenseToDelete(null); // Close the modal
		}
	};

	return (
		<>
			<div className="flex flex-col gap-3 animate-in fade-in duration-500">
				{expenses.map((expense) => {
					const payer = getUserDetails(expense.paidByUserId, expense);
					const isCurrentUserPayer =
						expense.paidByUserId === currentUser?._id;
					const category = getCategoryById(expense.category);
					const CategoryIcon = getCategoryIcon(category.id);
					const showDeleteOption = canDeleteExpense(expense);

					return (
						<Card
							className="group overflow-hidden border bg-card dark:bg-slate-900/40 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-200"
							key={expense._id}>
							<CardContent className="p-4 sm:p-5">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									{/* Left Side: Icon & Details */}
									<div className="flex items-start sm:items-center gap-3.5">
										<div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-full group-hover:scale-105 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-200 shrink-0">
											<CategoryIcon className="h-5 w-5 text-primary" />
										</div>

										<div>
											<h3 className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
												{expense.description}
											</h3>
											<div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
												<span className="font-medium text-muted-foreground/80">
													{format(
														new Date(expense.date),
														"MMM d, yyyy",
													)}
												</span>
												{showOtherPerson && (
													<>
														<span className="w-1 h-1 rounded-full bg-border" />
														<span className="truncate max-w-[200px]">
															{isCurrentUserPayer
																? "You"
																: payer.name}{" "}
															paid
														</span>
													</>
												)}
											</div>
										</div>
									</div>

									{/* Right Side: Amount & Actions */}
									<div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-2">
										<div className="sm:text-right flex flex-row-reverse sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 sm:gap-0 w-full sm:w-auto">
											<div className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
												{formatRupee(expense.amount)}
											</div>

											{isGroupExpense ? (
												<Badge
													variant="secondary"
													className="mt-1 dark:bg-slate-800">
													Group expense
												</Badge>
											) : (
												<div className="text-xs font-medium mt-1">
													{isCurrentUserPayer ? (
														<span className="text-green-600 dark:text-green-500">
															You paid
														</span>
													) : (
														<span className="text-red-600 dark:text-red-500">
															{payer.name} paid
														</span>
													)}
												</div>
											)}
										</div>

										{showDeleteOption && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors opacity-80 group-hover:opacity-100"
												onClick={() =>
													setExpenseToDelete(expense)
												} // Trigger Modal here
											>
												<Trash2 className="h-4 w-4" />
												<span className="sr-only">
													Delete expense
												</span>
											</Button>
										)}
									</div>
								</div>

								{/* Bottom: Splits Info */}
								<div className="mt-4 pt-3 border-t dark:border-slate-800/60">
									<div className="flex gap-2 flex-wrap">
										{expense.splits.map((split, idx) => {
											const splitUser = getUserDetails(
												split.userId,
												expense,
											);
											const isCurrentUser =
												split.userId ===
												currentUser?._id;
											const shouldShow =
												showOtherPerson ||
												(!showOtherPerson &&
													(split.userId ===
														currentUser?._id ||
														split.userId ===
															otherPersonId));

											if (!shouldShow) return null;

											return (
												<Badge
													key={idx}
													variant={
														split.paid
															? "outline"
															: "secondary"
													}
													className={`flex items-center gap-1.5 py-1 shadow-sm ${
														!split.paid
															? "dark:bg-slate-800 border-transparent"
															: "dark:border-slate-700 text-muted-foreground"
													}`}>
													<Avatar className="h-4 w-4 border border-background/20">
														<AvatarImage
															src={
																splitUser.imageUrl
															}
															className="object-cover"
														/>
														<AvatarFallback className="text-[8px] bg-primary/10 text-primary font-medium">
															{splitUser.name?.charAt(
																0,
															) || "?"}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium">
														{isCurrentUser
															? "You"
															: splitUser.name}
														:{" "}
														{formatRupee(
															split.amount,
														)}
													</span>
												</Badge>
											);
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* --- THE NEW DELETE MODAL --- */}
			<AlertDialog
				open={!!expenseToDelete}
				onOpenChange={(isOpen) => !isOpen && setExpenseToDelete(null)}>
				<AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800 sm:max-w-md animate-in zoom-in-95 duration-200">
					<AlertDialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full shrink-0">
								<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
							</div>
							<AlertDialogTitle className="text-xl">
								Delete Expense?
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-foreground/80 pt-2">
							Are you sure you want to delete{" "}
							<strong className="text-foreground">
								{expenseToDelete?.description}
							</strong>{" "}
							for{" "}
							<strong>
								{expenseToDelete
									? formatRupee(expenseToDelete.amount)
									: ""}
							</strong>
							?
							<br />
							<br />
							This will remove it from everyone's balances and
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-6 border-t dark:border-slate-800/60 pt-4">
						<AlertDialogCancel className="active:scale-95 transition-transform">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={isDeleting}
							className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 active:scale-95 transition-all shadow-sm">
							{isDeleting ? "Deleting..." : "Yes, Delete Expense"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
