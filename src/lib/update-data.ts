import { kv } from "@vercel/kv";
import { EXPIRATION_TIME } from "@/lib/get-busuanzi-data";
import logger from "@/lib/logger";

export async function updatePagePV(host: string, path: string) {
  logger.debug(`Updating page_pv for host: https://${host}${path}`);
  const pageKey = `page_pv:${host}${path}`;
  const livePageKey = `live_page_pv:${host}${path}`;

  const pagePV = await kv.incr(pageKey);
  logger.debug(
    `Page PV updated for host: https://${host}${path}, page_pv: ${pagePV}`,
  );

  await Promise.all([
    kv.expire(pageKey, EXPIRATION_TIME),
    kv.expire(livePageKey, EXPIRATION_TIME),
  ]);

  return pagePV;
}

export async function updateSitePV(host: string) {
  logger.debug(`Updating site_pv for host: https://${host}`);
  const siteKey = `site_pv:${host}`;
  const liveSiteKey = `site_pv_live:${host}`;

  // 该方法用于将指定键的值递增 1。如果键不存在，则会先将其初始化为 0，然后再递增
  const sitePV = await kv.incr(siteKey);
  logger.debug(`Site PV updated for host: https://${host}, site_pv: ${sitePV}`);

  await Promise.all([
    kv.expire(siteKey, EXPIRATION_TIME),
    kv.expire(liveSiteKey, EXPIRATION_TIME),
  ]);

  return sitePV;
}

export async function updateSiteUV(host: string, ip: string) {
  logger.debug(`Updating site_uv for host: https://${host}`);
  const siteKey = `site_uv:${host}`;
  const liveSiteKey = `site_uv_live:${host}`;

  // 该方法用于向集合（Set）中添加一个成员。如果成员已经存在于集合中，则不会重复添加
  const siteUVKey = await kv.sadd(siteKey, ip);
  // 该方法用于返回集合（Set）中的成员数量。在代码中
  const siteUV = await kv.scard(siteKey);
  logger.debug(
    `Site UV updated for host: https://${host}, site_uv: ${siteUV}, site_uv_key: ${siteUVKey}`,
  );

  await Promise.all([
    kv.expire(siteKey, EXPIRATION_TIME),
    kv.expire(liveSiteKey, EXPIRATION_TIME),
  ]);

  return siteUV;
}
