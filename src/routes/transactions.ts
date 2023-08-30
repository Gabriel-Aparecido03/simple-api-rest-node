import { randomUUID } from "crypto"
import { knex } from "../database"
import { z } from 'zod'
import { FastifyInstance } from "fastify"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

export async function transactionsRoutes(app: FastifyInstance) {

  /* app.addHook('preHandler',async (request,reply) =>{}) // Global Middleware inside plugin */

  app.get('/', { preHandler : [checkSessionIdExists]}, async (request,reply)=> {

    const { sessionId } = request.cookies

    const transactions = await knex('transactions')
      .where('session_id',sessionId)
      .select()

    return { transactions }

  })

  app.get('/summary', { preHandler : [checkSessionIdExists]} ,async (request) => {
    const { sessionId } = request.cookies
    const summary = await knex('transactions').sum('amount',{ as : 'amount' })
      .where('session_id',sessionId)
      .first()
    return { summary }
  }) 

  app.get('/:id',async (request) => {
    const getTransactionsParamsSchema = z.object({
      id : z.string().uuid()
    })
    const { sessionId } = request.cookies
    const { id } = getTransactionsParamsSchema.parse(request.params)

    const transactions = await knex('transactions')
      .where({id,session_id : sessionId})
      .first()

    return { transactions }
  })

  app.post('/' , async (request,reply) => {

    const createTransactionBodySchema = z.object({
      title : z.string(),
      amount : z.number(),
      type : z.enum(['credit','debit'])
    })

    const { title,amount,type } = createTransactionBodySchema.parse(request.body)
    
    let sessionId = request.cookies.sessionId

    if(!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId',sessionId,{
        path : '/',
        maxAge : 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    await knex('transactions').insert({
      id : randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id : sessionId
    })

    reply.status(201).send()
  })
}