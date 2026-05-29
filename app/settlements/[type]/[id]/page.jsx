"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Handshake } from "lucide-react";
import SettlementForm from "./components/settlement-form";

export default function SettlementPage() {
	const params = useParams();
	const router = useRouter();
	const { type, id } = params;

	const { data, isLoading } = useConvexQuery(
		api.settlements.getSettlementData,
		{
			entityType: type,
			entityId: id,
		},
	);

	// Sleek native skeleton loader that mimics the page structure
	if (isLoading) {
		return (
			<div className="container max-w-lg mx-auto py-8 px-4 sm:px-6 flex flex-col gap-6">
				<div className="w-20 h-8 bg-muted/60 animate-pulse rounded-md" />
				<div className="flex items-center gap-4 mt-2">
					<div className="h-16 w-16 sm:h-20 sm:w-20 bg-muted/60 animate-pulse rounded-2xl shrink-0" />
					<div className="space-y-3 w-full">
						<div className="h-8 w-3/4 bg-muted/60 animate-pulse rounded-md" />
						<div className="h-4 w-1/2 bg-muted/60 animate-pulse rounded-md" />
					</div>
				</div>
				<div className="w-full h-[400px] bg-muted/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 animate-pulse rounded-xl mt-4" />
			</div>
		);
	}

	// Function to handle after successful settlement creation
	const handleSuccess = () => {
		// Redirect based on type
		if (type === "user") {
			router.push(`/person/${id}`);
		} else if (type === "group") {
			router.push(`/groups/${id}`);
		}
	};

	return (
		<div className="container max-w-lg mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<Button
				variant="ghost"
				size="sm"
				className="mb-6 hover:-translate-x-1 transition-transform text-muted-foreground hover:text-foreground"
				onClick={() => router.back()}>
				<ArrowLeft className="h-4 w-4 mr-2" />
				Back
			</Button>

			<div className="mb-8 flex items-center gap-4 sm:gap-5">
				<div className="bg-primary/10 dark:bg-primary/20 p-3.5 sm:p-4 rounded-2xl shadow-sm border border-primary/20 dark:border-primary/20 shrink-0">
					<Handshake className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-1">
						Record a settlement
					</h1>
					<p className="text-muted-foreground mt-1.5 font-medium">
						{type === "user"
							? `Settling up with ${data?.counterpart?.name}`
							: `Settling up in ${data?.group?.name}`}
					</p>
				</div>
			</div>

			<Card className="border dark:bg-slate-900/40 dark:border-slate-800 shadow-sm overflow-hidden rounded-xl">
				<CardHeader className="bg-muted/30 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 pb-4">
					<div className="flex items-center gap-3">
						{type === "user" ? (
							<Avatar className="h-10 w-10 border shadow-sm">
								<AvatarImage
									src={data?.counterpart?.imageUrl}
								/>
								<AvatarFallback className="bg-muted">
									{data?.counterpart?.name?.charAt(0) || "?"}
								</AvatarFallback>
							</Avatar>
						) : (
							<div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg border border-primary/10">
								<Users className="h-5 w-5 text-primary" />
							</div>
						)}
						<CardTitle className="text-lg font-semibold text-foreground/90">
							{type === "user"
								? data?.counterpart?.name
								: data?.group?.name}
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-4 sm:p-6">
					<SettlementForm
						entityType={type}
						entityData={data}
						onSuccess={handleSuccess}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
