import { z } from "zod";

export const EventSchema = z.object({
	title: z.string().min(3, { message: "Event name is required" }),
	date: z.string().min(1, { message: "Date is required" }),
	time: z.string().min(1, { message: "Time is required" }),
	venue: z.string().min(3, { message: "Venue is required" }),
	description: z.string().min(5, { message: "Description is required" }),
	category: z.string().min(1, { message: "Category is required" }),
});
