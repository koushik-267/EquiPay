"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { CategorySelector } from "./category-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { getAllCategories } from "@/lib/expense-categories";

// Form schema validation
const expenseSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
			message: "Amount must be a positive number",
		}),
	category: z.string().optional(),
	date: z.date(),
	paidByUserId: z.string().min(1, "Payer is required"),
	splitType: z.enum(["equal", "percentage", "exact"]),
	groupId: z.string().optional(),
});

export function ExpenseForm({ type = "individual", onSuccess }) {
	const [participants, setParticipants] = useState([]);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [splits, setSplits] = useState([]);

	// Mutations and queries
	const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
	const createExpense = useConvexMutation(api.expenses.createExpense);
	const categories = getAllCategories();

	// Set up form with validation
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			description: "",
			amount: "",
			category: "",
			date: new Date(),
			paidByUserId: currentUser?._id || "",
			splitType: "equal",
			groupId: undefined,
		},
	});

	// Watch for changes
	const amountValue = watch("amount");
	const paidByUserId = watch("paidByUserId");
	const splitType = watch("splitType");

	// When a user is added or removed, update the participant list
	useEffect(() => {
		if (participants.length === 0 && currentUser) {
			setParticipants([
				{
					id: currentUser._id,
					name: currentUser.name,
					email: currentUser.email,
					imageUrl: currentUser.imageUrl,
				},
			]);
			setValue("paidByUserId", currentUser._id);
		}
	}, [currentUser, participants, setValue]);

	// Handle form submission
	const onSubmit = async (data) => {
		try {
			const amount = parseFloat(data.amount);

			const formattedSplits = splits.map((split) => ({
				userId: split.userId,
				amount: split.amount,
				paid: split.userId === data.paidByUserId,
			}));

			const totalSplitAmount = formattedSplits.reduce(
				(sum, split) => sum + split.amount,
				0,
			);
			const tolerance = 0.01;

			if (Math.abs(totalSplitAmount - amount) > tolerance) {
				toast.error(
					`Split amounts don't add up to the total. Please adjust your splits.`,
				);
				return;
			}

			const groupId = type === "individual" ? undefined : data.groupId;

			await createExpense.mutate({
				description: data.description,
				amount: amount,
				category: data.category || "Other",
				date: data.date.getTime(),
				paidByUserId: data.paidByUserId,
				splitType: data.splitType,
				splits: formattedSplits,
				groupId,
			});

			toast.success("Expense created successfully!");
			reset();

			const otherParticipant = participants.find(
				(p) => p.id !== currentUser._id,
			);
			const otherUserId = otherParticipant?.id;

			if (onSuccess)
				onSuccess(type === "individual" ? otherUserId : groupId);
		} catch (error) {
			toast.error("Failed to create expense: " + error.message);
		}
	};

	if (!currentUser) return null;

	const inputClasses =
		"h-12 bg-background hover:bg-muted/30 dark:bg-slate-900/40 dark:border-slate-800 transition-colors focus-visible:ring-primary/30";

	const isCustomMode = splitType === "percentage" || splitType === "exact";

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-2">
			<div className="space-y-6">
				{/* Description and amount */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-2.5">
						<Label
							htmlFor="description"
							className="text-foreground/90 font-medium">
							Description
						</Label>
						<Input
							id="description"
							className={inputClasses}
							placeholder="Lunch, movie tickets, etc."
							{...register("description")}
						/>
						{errors.description && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{errors.description.message}
							</p>
						)}
					</div>

					<div className="space-y-2.5">
						<Label
							htmlFor="amount"
							className="text-foreground/90 font-medium">
							Amount
						</Label>
						<div className="relative">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
								₹
							</span>
							<Input
								id="amount"
								className={cn(inputClasses, "pl-8")}
								placeholder="0.00"
								type="number"
								step="0.01"
								min="0.01"
								{...register("amount")}
							/>
						</div>
						{errors.amount && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{errors.amount.message}
							</p>
						)}
					</div>
				</div>

				{/* Category and date */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-2.5">
						<Label
							htmlFor="category"
							className="text-foreground/90 font-medium">
							Category
						</Label>
						<CategorySelector
							categories={categories || []}
							onChange={(categoryId) => {
								if (categoryId) {
									setValue("category", categoryId);
								}
							}}
						/>
					</div>

					<div className="space-y-2.5">
						<Label className="text-foreground/90 font-medium">
							Date
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										inputClasses,
										"w-full justify-start text-left font-normal",
										!selectedDate &&
											"text-muted-foreground",
									)}>
									<CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
									{selectedDate ? (
										format(selectedDate, "PPP")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={(date) => {
										setSelectedDate(date);
										setValue("date", date);
									}}
									initialFocus
									className="p-3"
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Group selector (for group expenses) */}
				{type === "group" && (
					<div className="space-y-2.5">
						<Label className="text-foreground/90 font-medium">
							Group
						</Label>
						<GroupSelector
							onChange={(group) => {
								if (
									!selectedGroup ||
									selectedGroup.id !== group.id
								) {
									setSelectedGroup(group);
									setValue("groupId", group.id);

									if (
										group.members &&
										Array.isArray(group.members)
									) {
										setParticipants(group.members);
									}
								}
							}}
						/>
						{!selectedGroup && (
							<p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">
								Please select a group to continue
							</p>
						)}
					</div>
				)}

				{/* Participants (for individual expenses) */}
				{type === "individual" && (
					<div className="space-y-2.5">
						<Label className="text-foreground/90 font-medium">
							Participants
						</Label>
						<ParticipantSelector
							participants={participants}
							onParticipantsChange={setParticipants}
						/>
						{participants.length <= 1 && (
							<p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">
								Please add at least one other participant
							</p>
						)}
					</div>
				)}

				{/* Paid by selector */}
				<div className="space-y-2.5">
					<Label className="text-foreground/90 font-medium">
						Paid by
					</Label>
					<Select
						value={paidByUserId}
						onValueChange={(value) =>
							setValue("paidByUserId", value)
						}>
						<SelectTrigger className={inputClasses}>
							<SelectValue placeholder="Select who paid" />
						</SelectTrigger>
						<SelectContent className="dark:bg-slate-900 dark:border-slate-800 shadow-xl rounded-xl">
							{participants.map((participant) => (
								<SelectItem
									key={participant.id}
									value={participant.id}
									className="cursor-pointer focus:bg-primary/5 dark:focus:bg-primary/10 focus:text-primary transition-colors py-2.5 my-0.5 rounded-lg">
									<span className="font-medium text-foreground/90">
										{participant.id === currentUser._id
											? "You"
											: participant.name}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.paidByUserId && (
						<p className="text-xs text-red-500 font-medium mt-1">
							{errors.paidByUserId.message}
						</p>
					)}
				</div>

				{/* Split type using sleek nested tabs */}
				<div className="space-y-3">
					<Label className="text-foreground/90 font-medium">
						Split type
					</Label>

					<Tabs
						value={isCustomMode ? "custom" : "equal"}
						onValueChange={(value) => {
							if (value === "equal") {
								setValue("splitType", "equal");
							} else {
								setValue("splitType", "exact");
							}
						}}
						className="w-full">
						<TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 dark:bg-slate-800/50 mb-2 rounded-lg">
							<TabsTrigger
								value="equal"
								className="rounded-md transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm">
								Equal
							</TabsTrigger>
							<TabsTrigger
								value="custom"
								className="rounded-md transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm">
								Custom
							</TabsTrigger>
						</TabsList>

						<div className="rounded-xl border border-transparent dark:border-slate-800/50 bg-transparent dark:bg-slate-950/20 sm:p-2 mt-2">
							<TabsContent
								value="equal"
								className="m-0 focus-visible:outline-none focus-visible:ring-0">
								<p className="text-sm text-center text-muted-foreground mb-4 px-2">
									Split equally among all participants
								</p>
								<SplitSelector
									type="equal"
									amount={parseFloat(amountValue) || 0}
									participants={participants}
									paidByUserId={paidByUserId}
									onSplitsChange={setSplits}
								/>
							</TabsContent>

							<TabsContent
								value="custom"
								className="m-0 focus-visible:outline-none focus-visible:ring-0">
								{/* Nested Inner Tabs for Custom Options */}
								<Tabs
									value={
										splitType === "percentage"
											? "percentage"
											: "exact"
									}
									onValueChange={(value) =>
										setValue("splitType", value)
									}
									className="w-full">
									<div className="flex flex-col gap-3 mb-4 px-2 pt-3">
										{/* Full-width Nested Toggle */}
										<TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 dark:bg-slate-800/60 rounded-lg">
											<TabsTrigger
												value="exact"
												className="rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
												Amount
											</TabsTrigger>
											<TabsTrigger
												value="percentage"
												className="rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
												Percentage
											</TabsTrigger>
										</TabsList>

										{/* Centered Descriptive Text Below */}
										<p className="text-sm text-center text-muted-foreground mt-1">
											{splitType === "exact"
												? "Enter exact amounts"
												: "Split by percentage"}
										</p>
									</div>

									<TabsContent
										value="exact"
										className="m-0 focus-visible:outline-none focus-visible:ring-0">
										<SplitSelector
											type="exact"
											amount={
												parseFloat(amountValue) || 0
											}
											participants={participants}
											paidByUserId={paidByUserId}
											onSplitsChange={setSplits}
										/>
									</TabsContent>

									<TabsContent
										value="percentage"
										className="m-0 focus-visible:outline-none focus-visible:ring-0">
										<SplitSelector
											type="percentage"
											amount={
												parseFloat(amountValue) || 0
											}
											participants={participants}
											paidByUserId={paidByUserId}
											onSplitsChange={setSplits}
										/>
									</TabsContent>
								</Tabs>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</div>

			<div className="flex justify-end pt-4 border-t dark:border-slate-800">
				<Button
					type="submit"
					size="lg"
					className="w-full sm:w-auto px-8 h-12 text-md shadow-md transition-all hover:shadow-lg"
					disabled={
						isSubmitting ||
						participants.length <= 1 ||
						(type === "group" && !selectedGroup)
					}>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-5 w-5 animate-spin" />
							Creating Expense...
						</>
					) : (
						<>
							<CheckCircle2 className="mr-2 h-5 w-5" />
							Create Expense
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
