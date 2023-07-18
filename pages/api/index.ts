import { PrismaClient } from '@prisma/client';
import { createServer } from '@graphql-yoga/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import currencyFormatter from 'currency-formatter';

import { Resolvers } from '../../types';
import prisma from '../../lib/prisma';

const currencyCode = 'USD';

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
