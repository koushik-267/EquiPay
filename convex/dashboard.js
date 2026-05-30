import { query } from "./_generated/server";
import { internal } from "./_generated/api";

// Get user balances
export const getUserBalances = query({
	handler: async (ctx) => {
		const user = await ctx.runQuery(internal.users.getCurrentUser);

		/* ───────────── 1‑to‑1 expenses (no groupId) ───────────── */
		const expenses = await ctx.db
			.query("expenses")
			.filter((q) => q.eq(q.field("groupId"), undefined))
			.collect();

		const userExpenses = expenses.filter(
			(e) =>
				e.paidByUserId === user._id ||
				e.splits.some((s) => s.userId === user._id),
		);
		const balances = {};

		for (const e of userExpenses) {
			const isPayer = e.paidByUserId === user._id;
			const mySplit = e.splits.find((s) => s.userId === user._id);

			if (isPayer) {
				for (const s of e.splits) {
					if (s.userId === user._id || s.paid) continue;
					balances[s.userId] = (balances[s.userId] || 0) + s.amount;
				}
			} else if (mySplit && !mySplit.paid) {
				balances[e.paidByUserId] =
					(balances[e.paidByUserId] || 0) - mySplit.amount;
			}
		}

		/* ───────────── 1‑to‑1 settlements (no groupId) ───────────── */
		const settlements = await ctx.db
			.query("settlements")
			.filter((q) =>
				q.and(
					q.eq(q.field("groupId"), undefined),
					q.or(
						q.eq(q.field("paidByUserId"), user._id),
						q.eq(q.field("receivedByUserId"), user._id),
					),
				),
			)
			.collect();

		for (const s of settlements) {
			if (s.paidByUserId === user._id) {
				// I paid them -> increases my net balance against them
				balances[s.receivedByUserId] =
					(balances[s.receivedByUserId] || 0) + s.amount;
			} else {
				// They paid me -> decreases my net balance against them
				balances[s.paidByUserId] =
					(balances[s.paidByUserId] || 0) - s.amount;
			}
		}

		/* build lists for UI and calculate global totals AFTER netting */
		let youOwe = 0;
		let youAreOwed = 0;
		const youOweList = [];
		const youAreOwedByList = [];

		for (const [uid, net] of Object.entries(balances)) {
			// FIXED: Ignore perfectly settled balances AND ignore self-splits
			if (net === 0 || uid === user._id) continue;

			const counterpart = await ctx.db.get(uid);
			const base = {
				userId: uid,
				name: counterpart?.name ?? "Unknown",
				imageUrl: counterpart?.imageUrl,
				amount: Math.abs(net), // Pass absolute value to the UI
			};

			if (net > 0) {
				youAreOwed += net;
				youAreOwedByList.push(base);
			} else {
				youOwe += Math.abs(net);
				youOweList.push(base);
			}
		}

		youOweList.sort((a, b) => b.amount - a.amount);
		youAreOwedByList.sort((a, b) => b.amount - a.amount);

		return {
			youOwe,
			youAreOwed,
			totalBalance: youAreOwed - youOwe,
			oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
		};
	},
});

// Get total spent in the current year
export const getTotalSpent = query({
	handler: async (ctx) => {
		const user = await ctx.runQuery(internal.users.getCurrentUser);

		const currentYear = new Date().getFullYear();
		const startOfYear = new Date(currentYear, 0, 1).getTime();

		const expenses = await ctx.db
			.query("expenses")
			.withIndex("by_date", (q) => q.gte("date", startOfYear))
			.collect();

		const userExpenses = expenses.filter(
			(expense) =>
				expense.paidByUserId === user._id ||
				expense.splits.some((split) => split.userId === user._id),
		);

		let totalSpent = 0;

		userExpenses.forEach((expense) => {
			const userSplit = expense.splits.find(
				(split) => split.userId === user._id,
			);
			if (userSplit) {
				totalSpent += userSplit.amount;
			}
		});

		return totalSpent;
	},
});

// Get monthly spending
export const getMonthlySpending = query({
	handler: async (ctx) => {
		const user = await ctx.runQuery(internal.users.getCurrentUser);

		const currentYear = new Date().getFullYear();
		const startOfYear = new Date(currentYear, 0, 1).getTime();

		const allExpenses = await ctx.db
			.query("expenses")
			.withIndex("by_date", (q) => q.gte("date", startOfYear))
			.collect();

		const userExpenses = allExpenses.filter(
			(expense) =>
				expense.paidByUserId === user._id ||
				expense.splits.some((split) => split.userId === user._id),
		);

		const monthlyTotals = {};

		for (let i = 0; i < 12; i++) {
			const monthDate = new Date(currentYear, i, 1);
			monthlyTotals[monthDate.getTime()] = 0;
		}

		userExpenses.forEach((expense) => {
			const date = new Date(expense.date);
			const monthStart = new Date(
				date.getFullYear(),
				date.getMonth(),
				1,
			).getTime();

			const userSplit = expense.splits.find(
				(split) => split.userId === user._id,
			);
			if (userSplit) {
				monthlyTotals[monthStart] =
					(monthlyTotals[monthStart] || 0) + userSplit.amount;
			}
		});

		const result = Object.entries(monthlyTotals).map(([month, total]) => ({
			month: parseInt(month),
			total,
		}));

		result.sort((a, b) => a.month - b.month);

		return result;
	},
});

// Get groups for the current user
export const getUserGroups = query({
	handler: async (ctx) => {
		const user = await ctx.runQuery(internal.users.getCurrentUser);

		const allGroups = await ctx.db.query("groups").collect();
		const groups = allGroups.filter((group) =>
			group.members.some((member) => member.userId === user._id),
		);

		const enhancedGroups = await Promise.all(
			groups.map(async (group) => {
				const expenses = await ctx.db
					.query("expenses")
					.withIndex("by_group", (q) => q.eq("groupId", group._id))
					.collect();

				let balance = 0;

				expenses.forEach((expense) => {
					if (expense.paidByUserId === user._id) {
						expense.splits.forEach((split) => {
							if (split.userId !== user._id && !split.paid) {
								balance += split.amount;
							}
						});
					} else {
						const userSplit = expense.splits.find(
							(split) => split.userId === user._id,
						);
						if (userSplit && !userSplit.paid) {
							balance -= userSplit.amount;
						}
					}
				});

				const settlements = await ctx.db
					.query("settlements")
					.withIndex("by_group", (q) => q.eq("groupId", group._id))
					.filter((q) =>
						q.or(
							q.eq(q.field("paidByUserId"), user._id),
							q.eq(q.field("receivedByUserId"), user._id),
						),
					)
					.collect();

				settlements.forEach((settlement) => {
					if (settlement.paidByUserId === user._id) {
						balance += settlement.amount;
					} else {
						balance -= settlement.amount;
					}
				});

				return {
					...group,
					id: group._id,
					balance,
				};
			}),
		);

		return enhancedGroups;
	},
});
