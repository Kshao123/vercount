import { NextRequest } from "next/server";
import kv from "@/storage";
import logger from "@/lib/logger";
import { EXPIRATION_TIME_POST } from "@/lib/get-busuanzi-data";
import { createClient } from "redis";

enum HandleTypes {
  REMOVE = 10,
  DELETE = 20,
  UPDATE = 30,
  GET = 40,
  GET_SETS = 41,
  GET_ALL = 49,
  SET = 50,
  SET_ALL = 51,
  SET_ALL_EX = 52,
}

interface HandleRedisType {
  type: HandleTypes;
  REDIS_KEY?: string;
  REDIS_URL: string;
  redisData?: Record<string, any>;
}

async function handleSetRedis(
  type: HandleTypes,
  redisData: HandleRedisType["redisData"],
) {
  if (!redisData) {
    throw new Error("handleSetRedis: redisData is missing");
  }

  switch (type) {
    case HandleTypes.SET: {
      await kv.set(redisData.REDIS_KEY, redisData.REDIS_VALUE, { EX: EXPIRATION_TIME_POST });
      break;
    }
    case HandleTypes.SET_ALL: {
      await kv.mSet(redisData);
      break;
    }
    case HandleTypes.SET_ALL_EX: {
      logger.debug("handleSetRedis: setAllEx");

      const multi = kv.multi();
      for (const [key, value] of Object.entries(redisData)) {
        multi.set(key, value, { EX: EXPIRATION_TIME_POST });
      }
      try {
        await multi.exec();
      } catch (error) {
        throw new Error(`handleSetRedis: in batch exec -> ${error}`);
      }
      break;
    }
    default:
      break;
  }
}

async function scanSet(key: string, redis: any) {
  let cursor = 0;
  const ips = [];
  do {
    const { cursor: nextCursor, members } = await redis.sScan(key, cursor, { count: 1000 });
    cursor = nextCursor;
    ips.push(...members);
  } while (cursor !== 0);

  return ips;
}

async function batchGetSets(key: string) {
  try {
    const redis = await createClient({ url: process.env.REDIS_URL }).connect();
    const ips = await scanSet(key, redis);
    redis.disconnect();
    return ips;
  } catch (error) {
    throw new Error(`【batchGetSets】key: ${key}; Error ${error}`);
  }
}

const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { REDIS_URL, type } = (data || {}) as HandleRedisType;

  if (isProduction && (!REDIS_URL || REDIS_URL !== process.env.REDIS_URL)) {
    return Response.json(
      { error: "Missing params REDIS_URL" },
      { status: 403 },
    );
  }

  try {
    logger.info(`current processing -->`, type);

    switch (type) {
      case HandleTypes.SET: {
        await handleSetRedis(type, data);
        break;
      }
      case HandleTypes.SET_ALL: {
        await handleSetRedis(type, data.redisData);
        break;
      }
      case HandleTypes.SET_ALL_EX: {
        await handleSetRedis(type, data.redisData);
        break;
      }
      case HandleTypes.GET_SETS: {
        const ips = await batchGetSets(data.REDIS_KEY);
        return Response.json({ ips, success: true });
      }
      default:
        break;
    }
  } catch (error: any) {
    logger.error(`${error.name}: ${error.message}`);
    return Response.json({ error: `Server Error: ${error}` }, { status: 500 });
  }

  logger.info(`processing finished -->`, type);
  return Response.json({ success: true, message: "OK" });
}
