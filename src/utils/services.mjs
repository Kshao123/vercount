const isProduction = process.env.NODE_ENV === "production";

// only sync to gist
const isSyncLocal = Number(process.env.SYNC_LOCAL) === 1;

export async function redisHandler(data) {
  if (isSyncLocal) {
    return;
  }

  try {
    const response = await fetch(
      isProduction
        ? "https://busuanzi.ksh7.com/redis"
        : "http://localhost:3000/redis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    ).then((res) => res.json());

    return response;
  } catch (error) {
    console.error("redisHandler: ", error);
    process.exit(1);
  }
}
