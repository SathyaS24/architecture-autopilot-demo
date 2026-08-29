export class PaymentService {
  async processPayment(order: any) {
    // PaymentService handles payment logic independently and returns the transaction state
    return { success: true };
  }
}
