import z from "zod";

export const ProductSchema=z.object({
    productName:z.string().nonempty({message:"Product Name required"}),
    productPrice:z.string().nonempty({message:"Price is required"})
})