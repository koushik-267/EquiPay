import React from "react";
import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
	return <SignUp fallbackRedirectUrl="/dashboard" />;
};

export default SignUpPage;
