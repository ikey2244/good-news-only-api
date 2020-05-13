export default function getUserId(req) {
  if (!req.headers.authorization) throw new Error('You must be logged in to do that')
  return req.headers.authorization.replace('Bearer ', '')
}
