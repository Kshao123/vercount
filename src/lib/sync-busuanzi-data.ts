import logger from "@/lib/logger";

export default async function syncBusuanziData(host: string, path: string, protocol: string) {
  const url =
    "https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback_777487655111";
  const headers = {
    Referer: `${protocol}//${host}${path}`,
    Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
  };
  logger.debug(
    `Sending request from busuanzi for host: ${protocol}//${host}${path}`,
  );

  try {
    fetch(url, {
      method: "GET",
      headers,
    });
    logger.debug(`Request sent successfully for host: ${protocol}//${host}${path}`);
  } catch (e) {
    logger.error(
      `Request failed for host: ${protocol}//${host}${path}. Error: ${e}`,
    );
  }
}
