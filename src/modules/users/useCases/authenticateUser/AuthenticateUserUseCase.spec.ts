import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IAuthenticateUserResponseDTO } from "./IAuthenticateUserResponseDTO";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";
import bcryptjs from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  async compare(): Promise<boolean> {
    return await new Promise(resolve => resolve(true))
  }
}))

jest.mock('jsonwebtoken', () => ({
  sign(): string {
    return "token_user"
  }
}))

const makeFakeUserAuthentiqueData = (): any => ({
  email: 'valid_email@mail.com',
  password: 'valid_password'
})

const makeFakeAccount = (): User => ({
  id: 'valid_id',
  name: 'valid_name',
  email: 'valid_email@mail.com',
  password: 'hashed_password',
  statement: [],
  created_at: new Date(),
  updated_at: new Date()
})

const makeFakeUserLogged = (): IAuthenticateUserResponseDTO => ({
  user: {
    id: 'valid_id',
    name: 'valid_name',
    email: 'valid_email@mail.com'
  },
  token: 'token_user'
})

interface SutTypes {
  sut: AuthenticateUserUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository
}

const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const sut = new AuthenticateUserUseCase(usersRepositoryInMemory);

  return { sut, usersRepositoryInMemory }
}

describe('AuthenticateUser Usecase', () => {
  it('Should return an user on success', async () => {
    const { sut, usersRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'findByEmail').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    const account = await sut.execute(makeFakeUserAuthentiqueData())
    expect(account).toEqual(makeFakeUserLogged())
  })

  it('Should not be able authentique an user with incorrect email', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findByEmail').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute(makeFakeUserAuthentiqueData())
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it('Should not be able authentique an user with incorrect password', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findByEmail').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
      const compareSpy = jest.spyOn(bcryptjs, 'compare') as unknown as jest.Mock<
        ReturnType<(key: boolean) => Promise<boolean>>,
        Parameters<(key: boolean) => Promise<boolean>>
      >
      compareSpy.mockReturnValueOnce(new Promise((resolve) => resolve(false)))
      await sut.execute(makeFakeUserAuthentiqueData())
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })
})
