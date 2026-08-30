export interface IPaymentService {
  processPayment(order: any): Promise<{ success: boolean }>;
}
