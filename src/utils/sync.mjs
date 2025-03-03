import {
  migrateOnline,
  BUSUANZI_URL,
  fetchBusuanziData,
  __dirname,
  COUNTS,
  getFile,
} from "./migrate.mjs";
import { syncToGist } from "./gist.mjs";
import { redisHandler } from "./services.mjs";

const isProduction = process.env.NODE_ENV === "production";
const SITE_URL =
  process.env.SITE_URL || isProduction
    ? "https://ksh7.com/"
    : "http://local.ksh7.com:4000/";
const ORIGIN_SITE_FILE = "origin-site.json";
const CURRENT_SITE_IP_FILE = "site-ip.json";

const { host } = new URL(SITE_URL);

async function syncFilesToGist(originSiteUvData, siteIps) {
  const config = {
    GIST_ID: "b3f461eb23fa0bebbc56b6f76062ef70",
    FILES: {
      [COUNTS]: JSON.parse(await getFile(COUNTS)),
      [ORIGIN_SITE_FILE]: originSiteUvData,
      [CURRENT_SITE_IP_FILE]: {
        length: siteIps.length,
        ips: siteIps,
      },
    },
    OPTIONS: {
      deleteOrphaned: true,
      description: "site uv sync",
    },
  };

  return await syncToGist(config.GIST_ID, config.FILES, config.OPTIONS);
}

async function syncRecentlyPosts() {
  await migrateOnline();
}

async function getCurrentSiteIps() {
  try {
    const response = await redisHandler({
      type: 41,
      REDIS_KEY: `site_uv:${host}`,
    });

    console.log(response, "getCurrentSiteIps");

    return response?.ips;
  } catch (error) {
    console.error(error, "getCurrentSiteIps");
    process.exit(1);
  }
}

async function getOriginSiteUvDate() {
  const headers = {
    Referer: SITE_URL,
    Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
  };

  return await fetchBusuanziData(BUSUANZI_URL, headers);
}

async function syncSiteUVToRedis(siteUV) {
  const response = await redisHandler({
    // type: 50,
    // REDIS_KEY: `site_uv_live:${host}`,
    // REDIS_VALUE: siteUV
    redisData: {
      [`site_uv_live:${host}`]: siteUV?.site_uv,
      [`site_pv:${host}`]: siteUV?.page_pv,
    },
    type: 52,
  });
  
  return response;
}

async function syncSiteUV() {
  const originSiteUvData = await getOriginSiteUvDate();
  const siteIps = await getCurrentSiteIps();

  if (isProduction) {
    await syncFilesToGist(originSiteUvData, siteIps);
  }
  
  await syncSiteUVToRedis(originSiteUvData?.site_uv);
}

async function sync() {
  await migrateOnline();

  await syncSiteUV();
}

sync();
