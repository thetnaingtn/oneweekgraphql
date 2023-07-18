import { Cart, PrismaClient } from '@prisma/client';

export async function findOrCreateCart(
  prisma: PrismaClient,
  id: string
): Promise<Cart> {
  let cart;

  cart = await prisma.cart.findUnique({
    where: {
      id,
    },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { id },
    });
  }
  return cart;
}
