import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { set, reset } from 'mockdate';
import { GetBalanceError } from "./GetBalanceError";

const makeFakeAccount = (): User => ({
  id: 'valid_user_id',
  name: 'valid_name',
  email: 'valid_email',
  password: 'hashed_password',
  statement: [],
  created_at: new Date(),
  updated_at: new Date()
})

const makeFakeStatementWithBalance = (): any => {
  return {
    statement: [
      {
        id: 'valid_id',
        user_id: 'valid_user_id',
        user: makeFakeAccount(),
        description: 'valid_description',
        amount: 10,
        type: OperationType.DEPOSIT,
        created_at: new Date(),
        updated_at: new Date()
      }
    ],
    balance: 5
  }
}

interface SutTypes {
  sut: GetBalanceUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository,
  statementRepositoryInMemory: InMemoryStatementsRepository
}

const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const statementRepositoryInMemory = new InMemoryStatementsRepository();
  const sut = new GetBalanceUseCase(statementRepositoryInMemory, usersRepositoryInMemory);

  return { sut, usersRepositoryInMemory, statementRepositoryInMemory }
}

describe('GetBalance Usecase', () => {
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('Should return balance on success', async () => {
    const { sut, usersRepositoryInMemory, statementRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    jest.spyOn(statementRepositoryInMemory, 'getUserBalance').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeStatementWithBalance())))
    const statement = await sut.execute({ user_id: 'valid_user_id' })
    expect(statement).toEqual(makeFakeStatementWithBalance())
  })

  it('Should not be able balance when user was not found', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute({ user_id: 'valid_user_id' })
    }).rejects.toBeInstanceOf(GetBalanceError)
  })
})
