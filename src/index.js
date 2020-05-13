import { ApolloServer, gql } from 'apollo-server'
import { prisma } from '../prisma/generated/prisma-client'
import { hash, compare } from 'bcryptjs'
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
    user: User!
  }

  type Mutation {
    signUp(username: String!, password: String!): User!
    signIn(username: String!, password: String!): User!
    createPost(title: String!, description: String!): Post!
    editPost(title: String!, description: String!): Post!
    deletePost(postId: ID!): Post!
  }

  type Query {
    me: User
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
    async me(parent, args, { req, db, getUserId }) {
      const userId = getUserId(req)
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
  Post: {
    user: (parent, args, { db }) => db.post({ id: parent.id }).user()
  },
  Mutation: {
    async signIn(parent, args, { db }) {
      const user = await db.user({ username: args.username })
      if (!user) throw new Error('User does not exist')

      const isMatch = await compare(args.password, user.password)

      if (!isMatch) throw new Error('Invalid password')

      return user
    },
    async signUp(parent, args, { db }) {
      const userExists = await db.$exists.user({ username: args.username })

      if (userExists) throw new Error('User already exists!')

      const hashedPassword = await hash(args.password, 10)

      return db.createUser({
        username: args.username,
        password: hashedPassword
      })
    },
    createPost(parent, args, { req, db }) {
      // get the current user off the authorization headers
      const userId = getUserId(req)

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
      const userId = getUserId(req)

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
      const userId = getUserId(req)

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
