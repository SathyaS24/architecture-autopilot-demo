import { OrderService } from './order.service.js';

export class PaymentService {
  async processPayment(order: any) {
    // Circular dependency: PaymentService imports OrderService
    const orderService = new OrderService();
    await orderService.updateOrderStatus(order.id, 'paid');
    return { success: true };
  }
}
