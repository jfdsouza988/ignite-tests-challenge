import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";
import { set, reset } from 'mockdate';
import { CreateUserError } from "./CreateUserError";
import bcryptjs from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  async hash(): Promise<string> {
    return await new Promise(resolve => resolve('hashed_password'))
  }
}))

const makeFakeUserData = (): ICreateUserDTO => ({
  name: 'valid_name',
  email: 'valid_email',
  password: 'valid_password'
})

const makeFakeAccount = (): User => ({
  id: 'valid_id',
  name: 'valid_name',
  email: 'valid_email',
  password: 'hashed_password',
  statement: [],
  created_at: new Date(),
  updated_at: new Date()
})

interface SutTypes {
  sut: CreateUserUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository
}

const salt = 8
const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const sut = new CreateUserUseCase(usersRepositoryInMemory);

  return { sut, usersRepositoryInMemory }
}

describe('CreateUser Usecase', () => {
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('Should return an user on success', async () => {
    const { sut, usersRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'create').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    const account = await sut.execute(makeFakeUserData())
    expect(account).toEqual(makeFakeAccount())
  })

  it('Should not be able create an user already exists', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findByEmail').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
      await sut.execute(makeFakeUserData())
    }).rejects.toBeInstanceOf(CreateUserError)
  })

  it('Should call bcrypt with correct values', async () => {
    const { sut } = makeSut()
    const hashSpy = jest.spyOn(bcryptjs, 'hash')
    await sut.execute(makeFakeUserData())
    expect(hashSpy).toHaveBeenCalledWith('valid_password', salt)
  })

  it('Should call UserRepository to create user with correct values', async () => {
    const { sut, usersRepositoryInMemory } = makeSut()
    const createSpy = jest.spyOn(usersRepositoryInMemory, 'create').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    await sut.execute(makeFakeUserData())
    expect(createSpy).toHaveBeenCalledWith({
      name: 'valid_name',
      email: 'valid_email',
      password: 'hashed_password'
    })
  })
})
