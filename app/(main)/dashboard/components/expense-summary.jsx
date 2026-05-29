"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

// Custom Tooltip for Recharts to support Tailwind Dark Mode perfectly
const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-background/95 border dark:border-slate-800 p-3 rounded-lg shadow-xl backdrop-blur-sm animate-in zoom-in-95 duration-200">
				<p className="text-sm font-medium text-muted-foreground mb-1">
					{label} Spending
				</p>
				<p className="text-xl font-bold text-primary">
					{formatRupee(payload[0].value)}
				</p>
			</div>
		);
	}
	return null;
};

export function ExpenseSummary({ monthlySpending, totalSpent }) {
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	// Format monthly data for chart
	const chartData =
		monthlySpending?.map((item) => {
			const date = new Date(item.month);
			return {
				name: monthNames[date.getMonth()],
				amount: item.total,
			};
		}) || [];

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth();

	// Safely find the current month's data rather than relying on array index
	const currentMonthData = monthlySpending?.find(
		(item) => new Date(item.month).getMonth() === currentMonth,
	);
	const thisMonthTotal = currentMonthData?.total || 0;

	return (
		<Card className="border dark:bg-slate-900/40 dark:border-slate-800">
			<CardHeader className="pb-4 border-b dark:border-slate-800/60 mb-6">
				<CardTitle className="text-lg">Expense Summary</CardTitle>
			</CardHeader>

			<CardContent>
				{/* Highlight Boxes */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					<div className="group relative overflow-hidden rounded-xl border bg-background dark:bg-slate-900/50 p-5 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all duration-300">
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
								This Month
							</p>
							<Calendar className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
						</div>
						<h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
							{formatRupee(thisMonthTotal)}
						</h3>
					</div>

					<div className="group relative overflow-hidden rounded-xl border bg-background dark:bg-slate-900/50 p-5 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-300">
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
								This Year
							</p>
							<CalendarDays className="h-4 w-4 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
						</div>
						<h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
							{formatRupee(totalSpent || 0)}
						</h3>
					</div>
				</div>

				{/* Chart Area - Fixed Height to prevent ResponsiveContainer collapse */}
				<div className="h-[300px] w-full mt-4">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={chartData}
							margin={{
								top: 10,
								right: 10,
								left: 10,
								bottom: 0,
							}}>
							<defs>
								<linearGradient
									id="colorAmount"
									x1="0"
									y1="0"
									x2="0"
									y2="1">
									<stop
										offset="5%"
										stopColor="#3b82f6"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="#3b82f6"
										stopOpacity={0.4}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="rgba(150, 150, 150, 0.2)"
							/>
							<XAxis
								dataKey="name"
								axisLine={false}
								tickLine={false}
								tick={{ fontSize: 12, fill: "currentColor" }}
								className="text-muted-foreground text-xs"
								dy={10}
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fontSize: 12, fill: "currentColor" }}
								className="text-muted-foreground text-xs"
								tickFormatter={(value) => formatRupee(value)}
							/>
							<Tooltip
								content={<CustomTooltip />}
								cursor={{ fill: "rgba(150, 150, 150, 0.1)" }}
							/>
							<Bar
								dataKey="amount"
								fill="url(#colorAmount)"
								radius={[4, 4, 0, 0]}
								maxBarSize={50}
								animationDuration={1000}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<p className="text-xs text-muted-foreground text-center mt-4">
					Monthly spending breakdown for {currentYear}
				</p>
			</CardContent>
		</Card>
	);
}
