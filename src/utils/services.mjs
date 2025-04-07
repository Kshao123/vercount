const isProduction = process.env.NODE_ENV === "production";

// only sync to gist
const isSyncLocal =
  Number(process.env.SYNC_LOCAL || process.env.SYNC_LOCAL) === 1;
const isSyncDevelopment = Number(process.env.SYNC_DEV) === 1;

export async function redisHandler(data, maxRetries = 3) {
  if (isSyncLocal) {
    return;
  }

  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        isProduction || isSyncDevelopment
          ? "https://busuanzi.ksh7.com/redis"
          : "http://localhost:3000/redis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            REDIS_URL: process.env.REDIS_URL,
          }),
        },
      ).then((res) => res.json());

      return response;
    } catch (error) {
      lastError = error;
      console.error(`redisHandler attempt ${attempt + 1} failed:`, error);

      console.error("redisHandler: all attempts failed");
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt)),
        ); // 指数退避
      }
    }
  }
}
