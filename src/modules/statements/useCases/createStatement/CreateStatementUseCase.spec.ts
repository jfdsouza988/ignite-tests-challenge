import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";
import { Statement, OperationType } from '../../entities/Statement'
import { User } from "../../../users/entities/User";
import { set, reset } from 'mockdate';
import { CreateStatementError } from "./CreateStatementError";

const makeFakeStatementData = (): ICreateStatementDTO => ({
  user_id: 'valid_user_id',
  type: OperationType.DEPOSIT,
  description: 'valid_description',
  amount: 10
})

const makeFakeAccount = (): User => ({
  id: 'valid_user_id',
  name: 'valid_name',
  email: 'valid_email',
  password: 'hashed_password',
  statement: [],
  created_at: new Date(),
  updated_at: new Date()
})

const makeFakeStatement = (): Statement => ({
  id: 'valid_id',
  user_id: 'valid_user_id',
  user: makeFakeAccount(),
  description: 'valid_description',
  amount: 10,
  type: OperationType.DEPOSIT,
  created_at: new Date(),
  updated_at: new Date()
})

interface SutTypes {
  sut: CreateStatementUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository,
  statementRepositoryInMemory: InMemoryStatementsRepository
}

const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const statementRepositoryInMemory = new InMemoryStatementsRepository();
  const sut = new CreateStatementUseCase(usersRepositoryInMemory, statementRepositoryInMemory);

  return { sut, usersRepositoryInMemory, statementRepositoryInMemory }
}

describe('CreateStatement Usecase', () => {
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('Should return an user on success', async () => {
    const { sut, usersRepositoryInMemory, statementRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    jest.spyOn(statementRepositoryInMemory, 'create').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeStatement())))
    const statement = await sut.execute(makeFakeStatementData())
    expect(statement).toEqual(makeFakeStatement())
  })

  it('Should not be able create statement when user was not found', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute(makeFakeStatementData())
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })

  it('Should not be able create statement when user was insufficient funds and type is withdraw', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory, statementRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
      jest.spyOn(statementRepositoryInMemory, 'getUserBalance').mockReturnValueOnce(new Promise((resolve) => resolve({ balance: 5 })))
      await sut.execute({
        user_id: 'valid_user_id',
        type: OperationType.WITHDRAW,
        description: 'valid_description',
        amount: 10
      })
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })
})
