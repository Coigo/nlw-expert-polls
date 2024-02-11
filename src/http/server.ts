import fastify from "fastify";
import z from "zod";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const app = fastify()

app.post('/polls', async ({body}, reply) => {
    const createPollBody = z.object({
        title: z.string()
    })
    const {title} = createPollBody.parse(body)
    const poll = await prisma.poll.create({
        data: {
            title
        }
    })
    return reply.status(201).send({poll})
})

app.listen({ port: 3000 }).then(() => {
    console.log('Server running at port 3000');
})