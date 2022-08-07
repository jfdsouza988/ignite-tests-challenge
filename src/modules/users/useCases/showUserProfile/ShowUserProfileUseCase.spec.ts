import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";
import { set, reset } from 'mockdate';
import { User } from "../../entities/User";
import { ShowUserProfileError } from "./ShowUserProfileError";

interface SutTypes {
  sut: ShowUserProfileUseCase;
  usersRepositoryInMemory: InMemoryUsersRepository
}

const makeFakeAccount = (): User => ({
  id: 'valid_id',
  name: 'valid_name',
  email: 'valid_email',
  password: 'hashed_password',
  statement: [],
  created_at: new Date(),
  updated_at: new Date()
})

const makeSut = (): SutTypes => {
  const usersRepositoryInMemory = new InMemoryUsersRepository();
  const sut = new ShowUserProfileUseCase(usersRepositoryInMemory);

  return { sut, usersRepositoryInMemory }
}

describe('ShowUserProfile Usecase', () => {
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('Should return an user on success', async () => {
    const { sut, usersRepositoryInMemory } = makeSut()
    jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(makeFakeAccount())))
    const account = await sut.execute('user_id')
    expect(account).toEqual(makeFakeAccount())
  })

  it('Should not be able list an user when the user is not found', () => {
    expect(async () => {
      const { sut, usersRepositoryInMemory } = makeSut()
      jest.spyOn(usersRepositoryInMemory, 'findById').mockReturnValueOnce(new Promise((resolve) => resolve(undefined)))
      await sut.execute('user_id')
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
})
