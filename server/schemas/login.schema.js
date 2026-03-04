import { z } from "zod";

const email = z
	.string()
	.trim()
	.min(1, { message: "Email is required." })
	.email({ message: "Enter a valid email address." });

const password = z
	.string()
	.min(1, { message: "Password is required." })
	.min(6, { message: "Password must be at least 6 characters." });

export const LoginSchema = z.object({
	email,
	password,
});

export const RegisterSchema = z
	.object({
		fullName: z
			.string()
			.trim()
			.min(1, { message: "Full name is required." })
			.min(2, { message: "Full name must be at least 2 characters." }),
		email,
		password,
		confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});
