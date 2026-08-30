import { IPaymentService } from './payment.interface.js';

export class PaymentService implements IPaymentService {
  async processPayment(order: any) {
    // PaymentService handles payment logic independently
    // and returns the transaction state.
    return { success: true };
  }
}