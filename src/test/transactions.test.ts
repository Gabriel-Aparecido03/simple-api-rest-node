import { expect,test ,beforeAll, afterAll,describe, it, beforeEach } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'
import { app } from '../app'

describe('Transactions routes',()=>{

  beforeAll(async ()=>{
    await app.ready()
  })
  
  afterAll(async ()=>{
    await app.close()
  } )

  beforeEach(()=>{
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })
  
  it('should be able to create a new transactions', async ()=>{
    await request(app.server)
      .post('/transactions')
      .send({
        title : 'New transaction',
        amount : 500,
        type : 'credit'
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({
        title : 'New transaction',
        amount : 500,
        type : 'credit'
      })
      
    const cookies = createTransactionsResponse.get('Set-Cookie')

    const listTransctionsREponse = await request(app.server)
      .get('/transactions')
      .set('Cookie',cookies)
      .expect(200)
    
      expect(listTransctionsREponse.body.transactions).toEqual([
        expect.objectContaining({
          title : 'New transaction',
          amount : 500,
        })
      ])
  })

  it('should be able to get spefic transaction', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({
        title : 'New transaction',
        amount : 500,
        type : 'credit'
      })
      
    const cookies = createTransactionsResponse.get('Set-Cookie')

    const listTransctionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie',cookies)
      .expect(200)
      
      const transactionId = listTransctionsResponse.body.transactions[0].id

      const listTransctionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie',cookies)
      .expect(200)

      expect(listTransctionResponse.body.transactions).toEqual(
        expect.objectContaining({
          title : 'New transaction',
          amount : 500,
        })
      )
  })

  it('should be able to get the summary', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({
        title : 'New transaction',
        amount : 500,
        type : 'credit'
      })
      
    const cookies = createTransactionsResponse.get('Set-Cookie')

    await request(app.server)
    .post('/transactions')
    .set('Cookie',cookies)
    .send({
      title : 'New transaction',
      amount : 500,
      type : 'debit'
    })
    

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie',cookies)
      .expect(200)
    
      expect(summaryResponse.body.summary).toEqual({ amount : 0})
  })
})
