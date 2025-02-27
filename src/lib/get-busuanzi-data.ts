// import { kv } from "@vercel/kv";
import kv from '@/storage';
import logger from "@/lib/logger";

export const EXPIRATION_TIME = 60 * 60 * 24 * 30; // Adjust as needed
export const EXPIRATION_TIME_POST = 60 * 60 * 24 * 45;

const MAX_RETRIES = 3;
const BUSUANZI_URL =
  "https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback_777487655111";

async function fetchBusuanziData(url: string, headers: any) {
  logger.debug(headers, 'fetchBusuanziData.headers');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });
      if (response.ok) {
        const dataStr = await response.text();
        const dataDict = JSON.parse(dataStr.substring(34, dataStr.length - 13));
        logger.debug(dataDict);
        return dataDict;
      } else {
        logger.debug(`Non-200 response: ${response.status}`);
      }
    } catch (e) {
      logger.error(`Attempt ${attempt + 1} failed: ${e}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second
    }
  }
  return null;
}

export async function getBusuanziSiteUVData(host: string, path: string, protocol: string) {
  const headers = {
    Referer: `${protocol}//${host}/`,
    Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
  };

  const data = await fetchBusuanziData(BUSUANZI_URL, headers);
  if (data) {
    const siteUv = data.site_uv || 0;
    await kv.set(`site_uv_live:${host}`, siteUv, { EX: EXPIRATION_TIME });
    logger.debug(`UV data retrieved and stored for ${host}`);
    return siteUv;
  } else {
    await kv.set(`site_uv_live:${host}`, 0, {
      EX: EXPIRATION_TIME,
    });
    logger.error(
      `Max retries exceeded for ${host}. Defaulting UV values to 0.`,
    );
  }
}

export async function getBusuanziSitePVData(host: string, protocol: string) {
  const headers = {
    Referer: `${protocol}//${host}/`,
    Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
  };

  const data = await fetchBusuanziData(BUSUANZI_URL, headers);
  if (data) {
    const sitePv = data.site_pv || 0;
    await kv.set(`site_pv_live:${host}`, sitePv, { EX: EXPIRATION_TIME });
    logger.debug(`Site PV data retrieved and stored for ${host}`);
    return sitePv;
  } else {
    await kv.set(`site_pv_live:${host}`, 0, {
      EX: EXPIRATION_TIME,
    });
    logger.error(
      `Max retries exceeded for ${host}. Defaulting PV values to 0.`,
    );
  }
}

export async function getBusuanziPagePVData(host: string, path: string, protocol: string) {
  const headers = {
    Referer: `${protocol}//${host}${path}`,
    Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
  };

  const dataNoSlashResult = await fetchBusuanziData(BUSUANZI_URL, headers);
  // const dataSlash = await fetchBusuanziData(BUSUANZI_URL, {
  //   ...headers,
  //   Referer: `${headers["Referer"]}/`,
  // });

  // const [dataNoSlashResult, dataSlashResult] = await Promise.all([
  //   dataNoSlash,
  //   dataSlash,
  // ]);

  if (dataNoSlashResult) {
    const pagePv = dataNoSlashResult.page_pv || 0;
    await kv.set(`live_page_pv:${host}${path}`, pagePv, {
      EX: EXPIRATION_TIME,
    });
    logger.debug(
      `Page PV data retrieved and stored for ${host}${path}, ${pagePv}`,
    );
    return pagePv;
  }
  // else if (dataNoSlashResult || dataSlashResult) {
  //   const pagePv = (dataNoSlashResult || dataSlashResult).page_pv || 0;
  //   await kv.set(`live_page_pv:${host}${path}`, pagePv, {
  //     EX: EXPIRATION_TIME,
  //   });
  //   logger.error(
  //     `Max retries exceeded for ${host}${path}. Defaulting Page PV values to 0.`,
  //   );
  //   return pagePv;
  // }
  else {
    await kv.set(`live_page_pv:${host}${path}`, 0, { EX: EXPIRATION_TIME });
    logger.error(
      `Max retries exceeded for ${host}${path}. Defaulting Page PV values to 0.`,
    );
  }
}
