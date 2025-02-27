import { createClient, type RedisClientType, type SetOptions } from "redis"

export const redis =  await createClient({ url: process.env.REDIS_URL }).connect();

export default redis;

