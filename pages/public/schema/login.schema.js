import { z } from "zod";

export const LoginSchema = z.object({
	email: z.string().email({ message: "Invalid email address" }),
	password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, { message: "Full name is required." })
      .min(2, { message: "Full name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
