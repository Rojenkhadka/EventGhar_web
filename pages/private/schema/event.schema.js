import { z } from "zod";

export const EventSchema = z.object({
	title: z.string()
		.min(5, { message: "Event name must be at least 5 characters" })
		.max(100, { message: "Event name must be less than 100 characters" })
		.regex(/^[a-zA-Z0-9\s\-&'.!]+$/, { message: "Event name contains invalid characters" })
		.refine((val) => val.trim().length >= 5, { message: "Event name cannot be just spaces" }),
	date: z.string()
		.min(1, { message: "Please select a date" })
		.refine((date) => {
			const selectedDate = new Date(date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return selectedDate >= today;
		}, { message: "Event date cannot be in the past" })
		.refine((date) => {
			const selectedDate = new Date(date);
			const oneYearFromNow = new Date();
			oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
			return selectedDate <= oneYearFromNow;
		}, { message: "Event date cannot be more than 1 year in the future" }),
	time: z.string()
		.min(1, { message: "Please select a time" })
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time format (HH:MM)" }),
	venue: z.string()
		.min(5, { message: "Venue must be at least 5 characters" })
		.max(200, { message: "Venue must be less than 200 characters" })
		.refine((val) => val.trim().length >= 5, { message: "Venue cannot be just spaces" }),
	description: z.string()
		.min(20, { message: "Description must be at least 20 characters" })
		.max(1000, { message: "Description must be less than 1000 characters" })
		.refine((val) => val.trim().length >= 20, { message: "Description cannot be just spaces" })
		.refine((val) => {
			const words = val.trim().split(/\s+/).filter(w => w.length > 0);
			return words.length >= 5;
		}, { message: "Description must contain at least 5 words" }),
	category: z.string()
		.min(1, { message: "Please select a category" })
		.refine((val) => ['General', 'Music', 'Tech', 'Sports', 'Food'].includes(val), { 
			message: "Please select a valid category" 
		}),
});
