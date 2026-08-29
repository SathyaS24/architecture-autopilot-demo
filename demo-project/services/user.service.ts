import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  private userRepo = new UserRepository();

  async getUser(id: string) {
    return this.userRepo.findById(id);
  }
}
