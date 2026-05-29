import { query } from "./_generated/server";
import { internal } from "./_generated/api";

// Get user balances
export const getUserBalances = query({
	handler: async (ctx) => {
		const user = await ctx.runQuery(internal.users.getCurrentUser);

		/* ───────────── 1‑to‑1 expenses (no groupId) ───────────── */
		// OPTIMIZATION: Filter out group expenses at the database level before collecting
		const expenses = await ctx.db
			.query("expenses")
			.filter((q) => q.eq(q.field("groupId"), undefined))
			.collect();

		// Filter for user involvement in memory (since we have to check inside the splits array)
		const userExpenses = expenses.filter(
			(e) =>
				e.paidByUserId === user._id ||
				e.splits.some((s) => s.userId === user._id),
		);

		/* tallies */
		let youOwe = 0;
		let youAreOwed = 0;
		const balanceByUser = {};

		for (const e of userExpenses) {
			const isPayer = e.paidByUserId === user._id;
			const mySplit = e.splits.find((s) => s.userId === user._id);

			if (isPayer) {
				for (const s of e.splits) {
					if (s.userId === user._id || s.paid) continue;
					youAreOwed += s.amount;
					(balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed +=
						s.amount;
				}
			} else if (mySplit && !mySplit.paid) {
				youOwe += mySplit.amount;
				(balanceByUser[e.paidByUserId] ??= {
					owed: 0,
					owing: 0,
				}).owing += mySplit.amount;
			}
		}

		/* ───────────── 1‑to‑1 settlements (no groupId) ───────────── */
		// OPTIMIZATION: Push filtering to the DB level
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
				youOwe -= s.amount;
				(balanceByUser[s.receivedByUserId] ??= {
					owed: 0,
					owing: 0,
				}).owing -= s.amount;
			} else {
				youAreOwed -= s.amount;
				(balanceByUser[s.paidByUserId] ??= {
					owed: 0,
					owing: 0,
				}).owed -= s.amount;
			}
		}

		/* build lists for UI */
		const youOweList = [];
		const youAreOwedByList = [];
		for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
			const net = owed - owing;
			if (net === 0) continue;
			const counterpart = await ctx.db.get(uid);
			const base = {
				userId: uid,
				name: counterpart?.name ?? "Unknown",
				imageUrl: counterpart?.imageUrl,
				amount: Math.abs(net),
			};
			net > 0 ? youAreOwedByList.push(base) : youOweList.push(base);
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

		// OPTIMIZATION: Don't collect all groups in the app. Just filter them in memory after fetching.
		// Note: If you want to scale to massive amounts of groups, consider updating your schema
		// to have a dedicated "groupMembers" table so you can use .withIndex() here.
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
					.withIndex("by_group", (q) => q.eq("groupId", group._id)) // OPTIMIZATION: Use the by_group index here!
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
