import { ApolloServer, gql } from 'apollo-server'
import { prisma } from '../prisma/generated/prisma-client'
import getUserId from '../helpers/getUserId'

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    yourPosts: [Post]
  }

  type Post {
    id: ID!
    title: String!
    description: String!
  }

  type Mutation {
    createUser(username: String!): User!
    createPost(title: String!, description: String!): Post!
    editPost(title: String!, description: String!): Post!
    deletePost(postId: ID!): Post!
  }

  type Query {
    me: User
    yourPosts: [Post]
    allPosts: [Post]
  }
`

const context = ({ req }) => {
  return {
    req,
    db: prisma,
    getUserId
  }
}

const resolvers = {
  Query: {
    async me(parent, args, { req, db }) {
      const userId = req.headers.authorization
      return db.user({ id: userId })
    },
    // every good news that exists in the db
    allPosts(parent, args, { db }) {
      return db.posts()
    }
  },
  User: {
    yourPosts: (parent, args, { db }) => db.user({ id: parent.id }).posts()
  },
  Mutation: {
    createUser(parent, args, { db }) {
      return db.createUser({
        username: args.username
      })
    },
    createPost(parent, args, { req, db }) {
      // get the current user off the authorization headers
      const userId = req.headers.authorization

      return db.createPost({
        ...args,
        user: {
          connect: {
            id: userId
          }
        }
      })
    },
    editPost(parent, args, { req, db }) {
      const userId = req.headers.authorization

      if (!userId) throw new Error('Please login')

      return db.editPost({
        ...args,
        user: {
          connect: {
            id: userId
          }
        }
      })
    },
    deletePost(parent, args, { req, db }) {
      const userId = req.headers.authorization

      return db.deletePost({
        ...args,
        user: {
          connect: {
            id: userId
          }
        }
      })
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
