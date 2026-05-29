import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { inngest } from "./client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/* Gemini model */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const spendingInsights = inngest.createFunction(
	{
		name: "Generate Spending Insights",
		id: "generate-spending-insights",
		triggers: [{ cron: "0 8 1 * *" }], // Updated to v4 syntax!
	},
	async ({ step }) => {
		/* ─── 1. Pull users with expenses this month ────────────────────── */
		const users = await step.run("Fetch users with expenses", async () => {
			return await convex.query(api.inngest.getUsersWithExpenses);
		});

		/* ─── 2. Iterate users & send insight email ─────────────────────── */
		const results = [];

		for (const user of users) {
			/* a. Pull last-month expenses (skip if none) */
			const expenses = await step.run(`Expenses · ${user._id}`, () =>
				convex.query(api.inngest.getUserMonthlyExpenses, {
					userId: user._id,
				}),
			);
			if (!expenses?.length) continue;

			/* b. Build JSON blob for the prompt */
			const expenseData = JSON.stringify({
				expenses,
				totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
				categories: expenses.reduce((cats, e) => {
					cats[e.category ?? "uncategorised"] =
						(cats[e.category] ?? 0) + e.amount;
					return cats;
				}, {}),
			});

			/* c. Prompt + AI call using step.ai.wrap */
			const prompt = `
As a financial analyst, review this user's spending data for the past month and provide insightful observations and suggestions.
Focus on spending patterns, category breakdowns, and actionable advice for better financial management.
Use a friendly, encouraging tone. 

IMPORTANT: All monetary values provided are in Indian Rupees (INR). Please format them appropriately (e.g., ₹1,500).
IMPORTANT: Return ONLY raw HTML code for the email body. Do NOT wrap your response in markdown formatting (do not use \`\`\`html).

User spending data:
${expenseData}

Provide your analysis in these sections:
<h2>1. Monthly Overview</h2>
<h2>2. Top Spending Categories</h2>
<h2>3. Unusual Spending Patterns (if any)</h2>
<h2>4. Saving Opportunities</h2>
<h2>5. Recommendations for Next Month</h2>
      `.trim();

			try {
				const aiResponse = await step.ai.wrap(
					"gemini",
					async (p) => model.generateContent(p),
					prompt,
				);

				let htmlBody =
					aiResponse.response.candidates[0]?.content.parts[0]?.text ??
					"";

				// Strip markdown block formatting just in case Gemini disobeys
				htmlBody = htmlBody
					.replace(/```html\n?/g, "")
					.replace(/```\n?/g, "")
					.trim();

				/* d. Send the email */
				await step.run(`Email · ${user._id}`, () =>
					convex.action(api.email.sendEmail, {
						to: user.email,
						subject: "Your Monthly EquiPay Financial Insights 📊",
						html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Your Monthly Financial Insights</h1>
                <p style="font-size: 16px;">Hi ${user.name},</p>
                <p style="font-size: 16px;">Here's your personalized spending analysis for the past month:</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                ${htmlBody}
              </div>
            `,
						apiKey: process.env.RESEND_API_KEY,
					}),
				);

				results.push({ userId: user._id, success: true });
			} catch (err) {
				results.push({
					userId: user._id,
					success: false,
					error: err.message,
				});
			}
		}

		/* ─── 3. Summary for the cron log ───────────────────────────────── */
		return {
			processed: results.length,
			success: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
		};
	},
);
