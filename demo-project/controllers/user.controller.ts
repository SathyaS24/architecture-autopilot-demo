import { UserService } from '../services/user.service.js';
// Layer violation: Controller directly importing UserRepository (bypassing service layer)
import { UserRepository } from '../repositories/user.repository.js';

export class UserController {
  private userService = new UserService();
  private userRepo = new UserRepository();

  async getUser(id: string) {
    // Correct way
    return this.userService.getUser(id);
  }

  async getRawUser(id: string) {
    // Violation way
    return this.userRepo.findById(id);
  }
}
