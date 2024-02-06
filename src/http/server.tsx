import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { z } from "zod";

const app = fastify();
const prisma = new PrismaClient();

app.listen({ port: 3333 }).then(() => {
	console.log("HTTP Server is running on port 3333");
});

app.post("/polls", async (request) => {
	const PollBodySchema = z.object({
		title: z.string(),
	});

	const { title } = PollBodySchema.parse(request.body);

	const poll = await prisma.poll.create({
		data: {
			title,
		},
	});

	return { pollId: poll.id };
});
