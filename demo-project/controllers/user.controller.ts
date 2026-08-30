import { UserService } from '../services/user.service.js';

export class UserController {
  private userService = new UserService();

  async getUser(id: string) {
    // Correct way
    return this.userService.getUser(id);
  }

  async getRawUser(id: string) {
    // Correct layered way: delegated through UserService to resolve layer violation
    return this.userService.getRawUser(id);
  }
}
