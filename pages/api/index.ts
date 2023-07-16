import {createServer} from '@graphql-yoga/node' 
import {readFileSync} from 'fs'
import { join } from 'path'
import {Resolvers} from '../../types'

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

const server = createServer({
    endpoint: "/api",
    schema:{
        resolvers,
        typeDefs
    }
})

export default server.requestListener;
