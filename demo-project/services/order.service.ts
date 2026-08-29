import { PaymentService } from './payment.service.js';
import { OrderRepository } from '../repositories/order.repository.js';

export class OrderService {
  private paymentService = new PaymentService();
  private orderRepo = new OrderRepository();

  async placeOrder(order: any) {
    const saved = await this.orderRepo.save(order);
    const paymentResult = await this.paymentService.processPayment(saved);
    if (paymentResult.success) {
      await this.updateOrderStatus(saved.id, 'paid');
    }
    return paymentResult;
  }

  async updateOrderStatus(orderId: string, status: string) {
    console.log(`Order ${orderId} updated to ${status}`);
  }
}
