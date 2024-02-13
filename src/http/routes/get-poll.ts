import z, { object } from "zod";
import { prisma } from "../../lib/prisma";
import fastify, { FastifyInstance } from "fastify";
import { redis } from "../../lib/redis";
import { title } from "node:process";

export async function getPoll (app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, reply) => {
        const getPollParams= z.object({
            pollId: z.string().uuid()
        }) 

        const { pollId } = getPollParams.parse(request.params) 

        const poll = await prisma.poll.findUnique ({
            where: {
                id: pollId
            },
            include: {
                PollOption: {
                    select: {
                        id: true,
                        
                        title: true
                    }
                }
            }
        })

        if (!poll) {
            return reply.status(400).send({message: 'Poll not found'})
        }
        const result = await redis.zrange(pollId, 0,-1, 'WITHSCORES')
        console.log('--------------------------');
        
       const votes = result.reduce((obj, line, index) => {
        if ( index % 2 === 0 ) {
            const score = result[index + 1]
            Object.assign(obj, { [line]: Number(score) })

        }
        return obj
       }, {} as Record<string, number>)
       console.log(votes);
       
        

        return reply.send({
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.PollOption.map(opntion => {
                    return {
                        id: opntion.id,
                        title: opntion.title,
                        score: (opntion.id in votes) ? votes[opntion.id] : 0,
                    }
                })
            }
        })
    })

}