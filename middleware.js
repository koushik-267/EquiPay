import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/expenses(.*)",
	"/contacts(.*)",
	"/groups(.*)",
	"/person(.*)",
	"/settlements(.*)",
]);

const isPublicAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	const { userId, redirectToSignIn } = await auth();

	// 1. LOGGED IN: If they try to access auth pages, bump them to the dashboard
	if (userId && isPublicAuthRoute(req)) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// 2. LOGGED OUT: If they try to access a protected route, bump them to sign-in
	if (!userId && isProtectedRoute(req)) {
		return redirectToSignIn();
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
