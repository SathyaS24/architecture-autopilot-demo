import { OrderService } from '../services/order.service.js';

export class OrderController {
  private orderService = new OrderService();

  async createOrder(order: any) {
    return this.orderService.placeOrder(order);
  }
}
