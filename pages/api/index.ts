import {PrismaClient} from '@prisma/client'
import {createServer} from '@graphql-yoga/node' 
import {NextApiRequest, NextApiResponse} from 'next'
import {readFileSync} from 'fs'
import { join } from 'path'

import {Resolvers} from '../../types'
import prisma from '../../lib/prisma'

export type GraphQLContext = {
    prisma: PrismaClient
}

export async function createContext():Promise<GraphQLContext>{
    return {
        prisma
    }
}

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"),{
    encoding:"utf-8"
})

const resolvers:Resolvers = {
    Query:{
        cart(_, {id}){
            return{
                id,
                totalItems: 0
            }
        }
    }
}

const server = createServer<{
    req: NextApiRequest,
    res: NextApiResponse
}>({
    endpoint: "/api",
    schema:{
        resolvers,
        typeDefs
    },
    context: createContext()
})

export default server.requestListener;
