import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm'
import TransactionsRepository from '../repositories/TransactionsRepository'
import Category from '../models/Category'
import Transaction from '../models/Transaction';

interface RequestDTO {
  title   : string;
  type    : 'income' | 'outcome';
  value   : number;
  category: string;
}
class CreateTransactionService {
  public async execute({ title, type, value, category }:RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance()
      if (total < value) {
        throw new AppError('You do not have enough balance')
      }  
    }
    //====--  ---   ----    -----    ----   ---  --====
    const categoryRepository = getRepository(Category)
    let categoria = await categoryRepository.findOne({ where :{ title: category }})
    if (!categoria) {
      categoria = categoryRepository.create({ title: category })
      await categoryRepository.save(categoria)
    }
    //====--  ---   ----    -----    ----   ---  --====
    const transaction = transactionsRepository.create({
      title, type, value, category: categoria,
    })
    await transactionsRepository.save(transaction)
    return transaction
  }
}

export default CreateTransactionService;
