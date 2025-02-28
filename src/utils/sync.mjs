import {
  migrateOnline,
  BUSUANZI_URL,
  fetchBusuanziData,
  __dirname,
  COUNTS,
  getFile,
} from "./migrate.mjs";
import { syncToGist } from "./gist.mjs";

const isProduction = process.env.NODE_ENV === "production";
const SITE_URL =
  process.env.SITE_URL || isProduction
    ? "https://ksh7.com"
    : "http://local.ksh7.com:4000/";
const ORIGIN_SITE_FILE = "origin-site.json";
const CURRENT_SITE_IP_FILE = "site-ip.json";

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
  const { host } = new URL(SITE_URL);
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
        body: JSON.stringify({
          type: 41,
          REDIS_KEY: `site_uv:${host}`,
        }),
      },
    ).then((res) => res.json());
    
    console.log(response, 'getCurrentSiteIps');
    
    return response?.ips;
  } catch (error) {
    console.error(error, 'getCurrentSiteIps');
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

async function syncSiteUV() {
  const originSiteUvData = await getOriginSiteUvDate();
  const siteIps = await getCurrentSiteIps();

  return await syncFilesToGist(originSiteUvData, siteIps);
}

/**
 * 每 45 天，执行一次
 * 理论
 */
async function sync() {
  await migrateOnline();
  
  await syncSiteUV();
}

sync();
