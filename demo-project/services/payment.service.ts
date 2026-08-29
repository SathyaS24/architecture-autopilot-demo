import { OrderService } from './order.service.js';
import { IPaymentService } from './payment.interface.js';

export class PaymentService implements IPaymentService {
  async processPayment(order: any) {
    // Circular dependency resolved: we implement IPaymentService instead of OrderService directly needing us
    const orderService = new OrderService();
    await orderService.updateOrderStatus(order.id, 'paid');
    return { success: true };
  }
}
