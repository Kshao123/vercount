import logger from "@/lib/logger";

export async function syncBusuanziDataRemote(
  host: string,
  path: string,
  protocol: string,
  isFirstUser?: number,
) {
  await fetch(
    process.env.NODE_ENV === "production"
      ? "https://busuanzi.ksh7.com/sync"
      : "http://local.ksh7.com:3000/sync",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host,
        path,
        protocol,
        isFirstUser,
      }),
    },
  );
}

export async function syncBusuanziDataLocal(
  host: string,
  path: string,
  protocol: string,
  isFirstUser?: number,
) {
  syncBusuanziData(host, path, protocol, isFirstUser);
  return new Promise(resolve => {
    setTimeout(resolve, 30);
  });
}

export default async function syncBusuanziData(
  host: string,
  path: string,
  protocol: string,
  isFirstUser?: number,
) {
  const url =
    "https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback_777487655111";
  const headers: Record<string, any> = {
    Referer: `${protocol}//${host}${path}`,
  };

  // 如果不是第一次访问，则添加 Cookie，同步 busuanzi
  // 有 cookie 则当前和 busuanzi 同时 +1，反之都不加
  if (!isFirstUser) {
    headers["Cookie"] = "busuanziId=2B13C109D79D4BB5B4195A57E61D3086";
  }

  logger.debug(
    `Sending request from busuanzi for host: ${protocol}//${host}${path}`,
  );

  try {
    await fetch(url, {
      method: "GET",
      headers,
    });
    logger.debug(
      `Request sent successfully for host: ${protocol}//${host}${path}`,
    );
  } catch (e) {
    logger.error(
      `Request failed for host: ${protocol}//${host}${path}. Error: ${e}`,
    );
  }
}
