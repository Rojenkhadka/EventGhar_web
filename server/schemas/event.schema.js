import { z } from 'zod';

export const EventSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters'),
	date: z.string().min(1, 'Date is required'),
	time: z.string().min(1, 'Time is required'),
	venue: z.string().min(3, 'Venue must be at least 3 characters'),
	description: z.string().min(10, 'Description must be at least 10 characters'),
	category: z.string().optional(),
};
