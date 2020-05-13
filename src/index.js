import { ApolloServer, gql } from 'apollo-server'

// shape of data
const typeDefs = gql`
    type User {
      name: String!
    }

    type Query {
      user: User
    }
  `

// business logic
const resolvers = {
  Query: {
    user(parent, args, context) {
      // return the shape of the type
      // in this case we are querying for a user
      // whatever is returned must reflect the shape of the User type
      return {
        name: 'Isaac'
      }
    }
  }
}

// server configurations
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// npm run start will start the server on localhost:4000
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
