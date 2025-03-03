const isProduction = process.env.NODE_ENV === "production";

// only sync to gist
const isSyncLocal = Number(process.env.SYNC_LOCAL || process.env.SYNC_LOCAL) === 1;
const isSyncDevelopment = Number(process.env.SYNC_DEV) === 1;

export async function redisHandler(data) {
  if (isSyncLocal) {
    return;
  }

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
    console.error("redisHandler: ", error);
    process.exit(1);
  }
}
