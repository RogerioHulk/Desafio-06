import { getCustomRepository, getRepository, In } from 'typeorm'
import csvParse from 'csv-parse'
import fs from 'fs'
import Transaction from '../models/Transaction';
import Category from '../models/Category'

interface CSVTransaction {
  title   : string;
  type    : 'income' | 'outcome';
  value   : number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {

    const categories:string[] = []
    const transactions:CSVTransaction[] = []

    const conteudo = fs.createReadStream(filePath)
    const atributos = csvParse({
      delimiter: ',',
      from_line: 2,
    })
    const lidos = conteudo.pipe(atributos)
    lidos.on('data', async linha => {
      const {title, type, value, category } = linha.map((cell: string) =>
        cell.trim(),
      )
      if (!title || !type || !value) return
      categories.push(category)
      transactions.push({title, type, value, category})
    })
    //====--  ---   ----    -----    ----   ---  --====
    await new Promise(resolve => lidos.on('end', resolve))

    const categoriesRepository = getRepository(Category)
    const existentes = await categoriesRepository.find({
      where : { title: In(categories), }
    })
    //====--  ---   ----    -----    ----   ---  --====
    const titulos = existentes.map((item: Category) => item.title)
    const addTitulos = categories.
          filter(item => !titulos.includes(item)).
          filter((value, index, self) => self.indexOf(value) === index)
    //====--  ---   ----    -----    ----   ---  --====
    const newCategories = categoriesRepository.create(
      addTitulos.map(title => ({ title, }))
    )
    await categoriesRepository.save(newCategories)
    const todasCategories = [...newCategories, ...existentes]
    //====--  ---   ----    -----    ----   ---  --====
    //====--  ---   ----    -----    ----   ---  --====
    const transactionsRepository = getRepository(Transaction)
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: todasCategories.find(
          category => category.title === transaction.category,
        )
      }))
    )
    //====--  ---   ----    -----    ----   ---  --====
    await transactionsRepository.save(createdTransactions)
    await fs.promises.unlink(filePath)
    return createdTransactions
  }
}

export default ImportTransactionsService;
