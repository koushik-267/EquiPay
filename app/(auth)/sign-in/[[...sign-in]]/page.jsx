import React from "react";
import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
	return <SignIn fallbackRedirectUrl="/dashboard" />;
};

export default SignInPage;
