import { createClient, type RedisClientType, type SetOptions } from "redis"

export const redis =  await createClient({ url: process.env.REDIS_URL })
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

export default redis;

