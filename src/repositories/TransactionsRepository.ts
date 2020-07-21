import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
  
    const transactions = await this.find()
    const income = transactions.reduce((soma, cada) => {
      if (cada.type === 'income') return soma += (cada.value);
      else return soma}, 0);
    //====----------------------------------------------====  
    const outcome = transactions.reduce((soma, cada) => {
      if (cada.type === 'outcome') return soma += (cada.value);
      else return soma}, 0);
    //====----------------------------------------------====  
    const total  = income - outcome
    const transation = { income, outcome, total }
    return transation 
  }
}

export default TransactionsRepository;
