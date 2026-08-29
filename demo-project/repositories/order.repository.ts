export class OrderRepository {
  async save(order: any) {
    return { ...order, status: 'saved' };
  }
}
