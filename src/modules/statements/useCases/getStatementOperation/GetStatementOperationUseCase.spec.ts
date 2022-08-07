import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { set, reset } from 'mockdate';
import { User } from "../../../users/entities/User";
import { Statement, OperationType } from "../../entities/Statement";
import { GetStatementOperationError } from "./GetStatementOperationError";

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
  id: 'valid_statement_id',
  user_id: 'valid_user_id',
  user: makeFakeAccount(),
  description: 'valid_description',
  amount: 10,
  type: OperationType.DEPOSIT,
  created_at: new Date(),
  updated_at: new Date()
})

interface SutTypes {
  sut: GetStatementOperationUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository,
  statementRepositoryInMemory: InMemoryStatementsRepository
}

const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const statementRepositoryInMemory = new InMemoryStatementsRepository();
  const sut = new GetStatementOperationUseCase(usersRepositoryInMemory, statementRepositoryInMemory);

  return { sut, usersRepositoryInMemory, statementRepositoryInMemory }
}

describe('GetStatementOperation Usecase', () => {
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('Should return StatementOperation on success', async () => {
    const { sut, usersRepositoryInMemory, statementRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    jest.spyOn(statementRepositoryInMemory, 'findStatementOperation').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeStatement())))
    const statement = await sut.execute({ user_id: 'valid_user_id', statement_id: 'valid_statement_id' })
    expect(statement).toEqual(makeFakeStatement())
  })

  it('Should not be able return StatementOperation when user was not found', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute({ user_id: 'valid_user_id', statement_id: 'valid_statement_id' })
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
  })

  it('Should not be able return StatementOperation when stament not exists', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory, statementRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
      jest.spyOn(statementRepositoryInMemory, 'findStatementOperation').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute({ user_id: 'valid_user_id', statement_id: 'valid_statement_id' })
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  })
})
