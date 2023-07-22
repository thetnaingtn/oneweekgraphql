import { PrismaClient } from '@prisma/client';
import { GraphQLYogaError, createServer } from '@graphql-yoga/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import currencyFormatter from 'currency-formatter';

import { Resolvers } from '../../types';
import prisma from '../../lib/prisma';
import {
  findOrCreateCart,
  validateCartItems,
  currencyCode,
} from '../../lib/cart';
import { stripe } from '@/lib/stripe';
import { products } from '@/lib/product';

export type GraphQLContext = {
  prisma: PrismaClient;
};

export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}

const typeDefs = readFileSync(join(process.cwd(), 'schema.graphql'), {
  encoding: 'utf-8',
});

const resolvers: Resolvers = {
  Query: {
    async cart(_, { id }, { prisma }) {
      return findOrCreateCart(prisma, id);
    },
  },
  Mutation: {
    async addItem(_, { input }, { prisma }) {
      let cart = await findOrCreateCart(prisma, input.cartId);
      await prisma.cartItem.upsert({
        create: {
          name: input.name,
          cartId: cart.id,
          id: input.id,
          quantity: input.quantity || 1,
          price: input.price,
          image: input.image,
          description: input.description,
        },
        where: {
          id_cartId: { id: input.id, cartId: cart.id },
        },
        update: {
          quantity: {
            increment: input.quantity || 1,
          },
        },
      });

      return cart;
    },
    async deleteItem(_, { input }, { prisma }) {
      let { cartId } = await prisma.cartItem.delete({
        where: {
          id_cartId: { id: input.id, cartId: input.cartId },
        },
        select: {
          cartId: true,
        },
      });

      return findOrCreateCart(prisma, cartId);
    },
    async increaseItem(_, { input }, { prisma }) {
      let { cartId } = await prisma.cartItem.update({
        data: {
          quantity: {
            increment: 1,
          },
        },
        where: {
          id_cartId: { id: input.id, cartId: input.cartId },
        },
        select: {
          cartId: true,
        },
      });

      return findOrCreateCart(prisma, cartId);
    },
    async decreaseItem(_, { input }, { prisma }) {
      let { cartId } = await prisma.cartItem.update({
        data: {
          quantity: {
            decrement: 1,
          },
        },
        where: {
          id_cartId: { id: input.id, cartId: input.cartId },
        },
        select: {
          cartId: true,
        },
      });

      return await findOrCreateCart(prisma, cartId);
    },
    async createCheckoutSession(_, { input }, { prisma }) {
      const { cartId } = input;
      const cart = await prisma.cart.findUnique({
        where: {
          id: cartId,
        },
      });
      if (!cart) {
        throw new GraphQLYogaError('Invalid Cart');
      }

      const cartItems = await prisma.cart
        .findUnique({
          where: {
            id: cartId,
          },
        })
        .items();
      if (!cartItems || cartItems.length < 1) {
        throw new GraphQLYogaError('Cart is empty');
      }

      const line_items = validateCartItems(products, cartItems);

      const session = await stripe.checkout.sessions.create({
        success_url: `http://localhost:3000/thankyou?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3000/cart?cancelled=true`,
        line_items,
        metadata: {
          cartId: cart.id,
        },
        mode: 'payment',
      });

      return {
        id: session.id,
        url: session.url,
      };
    },
  },
  CartItem: {
    unitTotal(item) {
      let amount = item.price;
      return {
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
        amount,
      };
    },
    lineTotal(item) {
      let amount = item.price * item.quantity;
      return {
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
        amount,
      };
    },
  },
  Cart: {
    items: async ({ id }, _, { prisma }) => {
      let items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      return items;
    },
    totalItems: async ({ id }, _, { prisma }) => {
      let items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      return items.reduce((total, item) => total + item.quantity || 1, 0);
    },
    subTotal: async ({ id }, _, { prisma }) => {
      let items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();
      let amount =
        items.reduce((total, item) => total + item.quantity * item.price, 0) ??
        0;
      return {
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
        amount,
      };
    },
  },
};

const server = createServer<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({
  endpoint: '/api',
  schema: {
    resolvers,
    typeDefs,
  },
  context: createContext(),
});

export default server.requestListener;
