"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, User, ChevronRight } from "lucide-react";
import { CreateGroupModal } from "./_components/create-group-modal";

export default function ContactsPage() {
	const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);

	// Check for the createGroup parameter when the component mounts
	useEffect(() => {
		const createGroupParam = searchParams.get("createGroup");

		if (createGroupParam === "true") {
			setIsCreateGroupModalOpen(true);
			const url = new URL(window.location.href);
			url.searchParams.delete("createGroup");
			router.replace(url.pathname + url.search);
		}
	}, [searchParams, router]);

	if (isLoading) {
		return (
			<div className="container mx-auto py-12 flex justify-center items-center h-[50vh]">
				{/* Adjusted BarLoader wrapper for better dark mode blending */}
				<div className="w-full max-w-md opacity-70">
					<BarLoader
						width={"100%"}
						color="#3b82f6"
						className="dark:!bg-slate-800"
					/>
				</div>
			</div>
		);
	}

	const { users, groups } = data || { users: [], groups: [] };

	return (
		<div className="container mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-10">
				<div>
					<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 pb-2">
						Contacts
					</h1>
					<p className="text-muted-foreground mt-1 text-sm sm:text-base">
						Manage your network and shared expenses.
					</p>
				</div>
				<Button
					onClick={() => setIsCreateGroupModalOpen(true)}
					className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">
					<Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
					Create Group
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Individual Contacts Column */}
				<section>
					<div className="flex items-center mb-5 text-foreground/80 dark:text-foreground/90">
						<User className="mr-2 h-5 w-5 text-blue-500" />
						<h2 className="text-xl font-semibold tracking-tight">
							People
						</h2>
					</div>

					{users.length === 0 ? (
						<Card className="border-dashed border-2 bg-transparent shadow-none dark:border-slate-800">
							<CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center">
								<User className="h-10 w-10 mb-3 opacity-20" />
								<p>
									No contacts yet. Add an expense with someone
									to see them here.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="flex flex-col gap-3">
							{users.map((user) => (
								<Link key={user.id} href={`/person/${user.id}`}>
									<Card className="group overflow-hidden border bg-card dark:bg-slate-900/40 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 dark:hover:border-primary/50 transition-all duration-300 cursor-pointer">
										<CardContent className="p-4 sm:p-5">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/20 transition-colors duration-300">
														<AvatarImage
															src={user.imageUrl}
															className="object-cover"
														/>
														<AvatarFallback className="bg-primary/10 text-primary font-semibold">
															{user.name.charAt(
																0,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col">
														<p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
															{user.name}
														</p>
														<p className="text-sm text-muted-foreground">
															{user.email}
														</p>
													</div>
												</div>
												<ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					)}
				</section>

				{/* Groups Column */}
				<section>
					<div className="flex items-center mb-5 text-foreground/80 dark:text-foreground/90">
						<Users className="mr-2 h-5 w-5 text-purple-500" />
						<h2 className="text-xl font-semibold tracking-tight">
							Groups
						</h2>
					</div>

					{groups.length === 0 ? (
						<Card className="border-dashed border-2 bg-transparent shadow-none dark:border-slate-800">
							<CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center">
								<Users className="h-10 w-10 mb-3 opacity-20" />
								<p>
									No groups yet. Create a group to start
									tracking shared expenses.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="flex flex-col gap-3">
							{groups.map((group) => (
								<Link
									key={group.id}
									href={`/groups/${group.id}`}>
									<Card className="group overflow-hidden border bg-card dark:bg-slate-900/40 hover:-translate-y-1 hover:shadow-md hover:border-purple-500/40 dark:hover:border-purple-500/50 transition-all duration-300 cursor-pointer">
										<CardContent className="p-4 sm:p-5">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl group-hover:scale-105 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-all duration-300">
														<Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
													</div>
													<div className="flex flex-col">
														<p className="font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
															{group.name}
														</p>
														<p className="text-sm text-muted-foreground flex items-center mt-0.5">
															<span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
															{group.memberCount}{" "}
															members
														</p>
													</div>
												</div>
												<ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>

			<CreateGroupModal
				isOpen={isCreateGroupModalOpen}
				onClose={() => setIsCreateGroupModalOpen(false)}
				onSuccess={(groupId) => {
					router.push(`/groups/${groupId}`);
				}}
			/>
		</div>
	);
}
