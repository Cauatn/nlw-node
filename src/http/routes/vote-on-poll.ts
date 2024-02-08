import { z } from "zod";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (request, reply) => {
    const createVotePollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    /* Dado vindo da URL requisição */
    const { pollId } = voteOnPollParams.parse(request.params);
    /* Dado vindo do corpo da requisição */
    const { pollOptionId } = createVotePollBody.parse(request.body);

    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (
        userPreviousVoteOnPoll &&
        userPreviousVoteOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id,
          },
        });
        return reply.status(200).send({ message: "Vote updated." });
      } else if (userPreviousVoteOnPoll) {
        return reply
          .status(400)
          .send({ message: "User already voted on this poll." });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        pollOptionId,
        sessionId,
        pollId,
      },
    });

    return reply.status(201).send();
  });
}
