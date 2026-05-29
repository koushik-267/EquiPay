import { query } from "./_generated/server";
import { v } from "convex/values";

// 1‑to‑1 debts netted against cases where the user
// was the payer and against settlements already made.
export const getUsersWithOutstandingDebts = query({
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		const result = [];

		// Load every 1‑to‑1 expense once (groupId === undefined)
		const expenses = await ctx.db
			.query("expenses")
			.filter((q) => q.eq(q.field("groupId"), undefined))
			.collect();

		// Load every 1‑to‑1 settlement once (groupId === undefined)
		const settlements = await ctx.db
			.query("settlements")
			.filter((q) => q.eq(q.field("groupId"), undefined))
			.collect();

		/* small cache so we don’t hit the DB for every name */
		const userCache = new Map();
		const getUser = async (id) => {
			if (!userCache.has(id)) userCache.set(id, await ctx.db.get(id));
			return userCache.get(id);
		};

		for (const user of users) {
			const ledger = new Map();

			/* ── 1) process every 1‑to‑1 expense ─────────────────────────────── */
			for (const exp of expenses) {
				if (exp.paidByUserId !== user._id) {
					const split = exp.splits.find(
						(s) => s.userId === user._id && !s.paid,
					);
					if (!split) continue;

					const entry = ledger.get(exp.paidByUserId) ?? {
						amount: 0,
						since: exp.date,
					};
					entry.amount += split.amount; // user owes
					entry.since = Math.min(entry.since, exp.date);
					ledger.set(exp.paidByUserId, entry);
				} else {
					for (const s of exp.splits) {
						if (s.userId === user._id || s.paid) continue;

						const entry = ledger.get(s.userId) ?? {
							amount: 0,
							since: exp.date,
						};
						entry.amount -= s.amount; // others owe user
						ledger.set(s.userId, entry);
					}
				}
			}

			/* ── 2) apply settlements the user PAID or RECEIVED ─────────────── */
			for (const st of settlements) {
				if (st.paidByUserId === user._id) {
					const entry = ledger.get(st.receivedByUserId);
					if (entry) {
						entry.amount -= st.amount;
						if (entry.amount === 0)
							ledger.delete(st.receivedByUserId);
						else ledger.set(st.receivedByUserId, entry);
					}
				} else if (st.receivedByUserId === user._id) {
					const entry = ledger.get(st.paidByUserId);
					if (entry) {
						entry.amount += st.amount;
						if (entry.amount === 0) ledger.delete(st.paidByUserId);
						else ledger.set(st.paidByUserId, entry);
					}
				}
			}

			/* ── 3) build debts[] list with only POSITIVE balances ──────────── */
			const debts = [];
			for (const [counterId, { amount, since }] of ledger) {
				if (amount > 0) {
					const counter = await getUser(counterId);
					debts.push({
						userId: counterId,
						name: counter?.name ?? "Unknown",
						amount,
						since,
					});
				}
			}

			if (debts.length) {
				result.push({
					_id: user._id,
					name: user.name,
					email: user.email,
					debts,
				});
			}
		}

		return result;
	},
});

// OPTIMIZED: Get users with expenses for AI insights
export const getUsersWithExpenses = query({
	handler: async (ctx) => {
		// 1. Calculate time
		const now = new Date();
		const oneMonthAgo = new Date(now);
		oneMonthAgo.setMonth(now.getMonth() - 1);
		const monthStart = oneMonthAgo.getTime();

		// 2. Fetch all recent expenses EXACTLY ONCE
		const allRecentExpenses = await ctx.db
			.query("expenses")
			.withIndex("by_date", (q) => q.gte("date", monthStart))
			.collect();

		// 3. Keep track of unique user IDs that appear in these expenses
		const activeUserIds = new Set();

		for (const expense of allRecentExpenses) {
			activeUserIds.add(expense.paidByUserId); // Add the payer
			for (const split of expense.splits) {
				activeUserIds.add(split.userId); // Add everyone in the split
			}
		}

		// 4. Resolve those specific IDs to actual user objects
		const result = [];
		for (const userId of activeUserIds) {
			const user = await ctx.db.get(userId);
			if (user) {
				result.push({
					_id: user._id,
					name: user.name,
					email: user.email,
				});
			}
		}

		return result;
	},
});

// Get a specific user's expenses for the past month
export const getUserMonthlyExpenses = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const now = new Date();
		const oneMonthAgo = new Date(now);
		oneMonthAgo.setMonth(now.getMonth() - 1);
		const monthStart = oneMonthAgo.getTime();

		const allExpenses = await ctx.db
			.query("expenses")
			.withIndex("by_date", (q) => q.gte("date", monthStart))
			.collect();

		const userExpenses = allExpenses.filter((expense) => {
			return (
				expense.paidByUserId === args.userId ||
				expense.splits.some((split) => split.userId === args.userId)
			);
		});

		return userExpenses.map((expense) => {
			const userSplit = expense.splits.find(
				(split) => split.userId === args.userId,
			);

			return {
				description: expense.description,
				category: expense.category,
				date: expense.date,
				amount: userSplit ? userSplit.amount : 0,
				isPayer: expense.paidByUserId === args.userId,
				isGroup: expense.groupId !== undefined,
			};
		});
	},
});
