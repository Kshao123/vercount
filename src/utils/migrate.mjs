// 只记录 post 的，加上 html 的，再将 index.html replace
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { redisHandler } from "./services.mjs";

export const SITE_MAP = "sitemap.xml";
export const COUNTS = "counts.json";
export const BUSUANZI_URL =
  "https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback_777487655111";
const isProduction = process.env.NODE_ENV === "production";

export const __dirname = import.meta.dirname;

console.log(__dirname, "__dirname");

export async function saveFile(name, value) {
  await fs.writeFile(path.join(__dirname, `./files/${name}`), value, "utf8");
}

export async function getFile(name) {
  return await fs.readFile(path.join(__dirname, `./files/${name}`), "utf8");
}

function getRedisKey(url) {
  const urlConstants = new URL(url);
  const { host, pathname, protocol } = urlConstants;
  const realPath = pathname.replace(/\/index(\.html?\/?)$/i, "");
  // return [`live_page_pv:${host}${realPath}`, host, pathname, protocol];
  return [`page_pv:${host}${realPath}`, host, pathname, protocol];
}

export async function fetchBusuanziData(url, headers) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    console.log(headers?.Referer, attempt, "fetchBusuanziData");
    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });
      if (response.ok) {
        const dataStr = await response.text();
        const dataDict = JSON.parse(dataStr.substring(34, dataStr.length - 13));
        console.log(dataDict, headers?.Referer);
        return dataDict;
      } else {
        console.log(`Non-200 response: ${response.status}`, headers?.Referer);
      }
    } catch (e) {
      console.error(`Attempt ${attempt + 1} failed: ${e}`, headers?.Referer);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second
    }
  }
  return null;
}

function parseUrlsFromSiteMap(sitemap) {
  const $ = cheerio.load(sitemap, {
    xmlMode: true,
  });

  const urls = $("loc")
    .map((index, item) => {
      return $(item).text();
    })
    .get();
  const filteredUrls = urls
    .filter((url) => url.includes("post"))
    .map((url) => {
      const nextUrl = isProduction ? url : url.replace('https://ksh7.com', 'http://local.ksh7.com:4000');
      return [
        nextUrl,
        // `${url}index.html`,
      ];
    });

  return filteredUrls;
}

export async function getPostUrls(sitemap = 'https://ksh7.com/sitemap.xml') {
  try {
    const response = await fetch(sitemap);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }
    const dataStr = await response.text();
    await saveFile(SITE_MAP, dataStr);
    return parseUrlsFromSiteMap(dataStr);
  } catch (error) {
    console.log("get site map error", error);
  }
}

/**
 * 当前 count 逻辑是，获取 不算子 之前的数据存为 before 使用 live 做 key
 * 自己计数的做为当前的，为 after，返回两者相加的数据
 * 缓存都是 30 天
 */
async function updateCountLoop(urls) {
  const countEntries = {};
  const delayTime = 2500; // 1 秒，单位为毫秒

  for (let i = 0; i < urls.length; i++) {
    const current = urls[i];
    const [url, htmlUrl] = current;
    const [key, host, path, protocol] = getRedisKey(url);
    const getHeaders = (isHtml) => {
      return {
        Referer: isHtml
          ? `${protocol}//${host}${path}index.html`
          : `${protocol}//${host}${path}`,
        Cookie: "busuanziId=89D15D1F66D2494F91FB315545BF9C2A",
      };
    };

    const item = { key, pagePv: 0, htmlPv: 0, rootPagePv: 0 };
    countEntries[key] = item;

    if (isProduction) {
      item.htmlPv = fetchBusuanziData(BUSUANZI_URL, getHeaders(true)).then(
        (res) => {
          countEntries[key].htmlPv = res.page_pv;
        },
      );
    }

    item.rootPagePv = fetchBusuanziData(BUSUANZI_URL, getHeaders()).then(
      (res) => {
        countEntries[key].rootPagePv = res.page_pv;
      },
    );

    // 每两个迭代后延迟 1 秒
    if ((i + 1) % 2 === 0) {
      await new Promise((resolve) => setTimeout(() => resolve(), delayTime));
    }
  }

  const errorPageKeys = [];

  for (const key in countEntries) {
    const item = countEntries[key];
    if (item.htmlPv instanceof Promise) {
      try {
        await item.htmlPv;
      } catch (error) {
        errorPageKeys.push({ key: item.key, reason: error, fields: "htmlPv" });
      }
    }

    if (item.rootPagePv instanceof Promise) {
      try {
        await item.rootPagePv;
      } catch (error) {
        errorPageKeys.push({
          key: item.key,
          reason: error,
          fields: "rootPagePv",
        });
      }
    }
    
    if (isProduction) {
      countEntries[item.key].pagePv = item.htmlPv + item.rootPagePv;
    } else {
      countEntries[item.key].pagePv = item.rootPagePv;
    }
  }

  console.log(errorPageKeys, "errorPageKeys");
  return countEntries;
}

async function transformCountData(counts) {
  return Object.entries(counts).reduce((acc, item) => {
    const [key, countItem] = item;
    acc[key] = countItem.pagePv;
    return acc;
  }, {});
}

async function setRedisKv(data) {
  await redisHandler({
    redisData: data,
    type: 52,
  });
}

/**
 * local files 迁移步骤：
 * 根据 todo 顺序来
 */
export async function migrateLocal() {
  // const sitemap = await getFile(SITE_MAP);
  // 从 sitemap 中获取所有 post url
  // const filteredUrls = parseUrlsFromSiteMap(sitemap);

  // const counts = await updateCountLoop(filteredUrls.slice(0, 4));
  // todo 2 获取对应在 busaunzi 的数据
  // const counts = await updateCountLoop(filteredUrls);
  // saveFile(COUNTS, JSON.stringify(counts));

  // todo 3
  const counts = JSON.parse(await getFile(COUNTS));
  console.log(counts);

  // 将 busaunzi 的数据转为 redis 格式
  const redisData = await transformCountData(counts);

  console.log(redisData);
  // await setRedisKv(redisData);

  console.log("migrate done");
}

export async function migrateOnline(config) {
  const { sitemap } = config || {};
  
  const filteredUrls = await getPostUrls(sitemap);

  const counts = await updateCountLoop(filteredUrls);
  await saveFile(COUNTS, JSON.stringify(counts));

  console.log(counts);

  // 将 busaunzi 的数据转为 redis 格式
  const redisData = await transformCountData(counts);

  console.log(redisData);
  await setRedisKv(redisData, true);

  console.log("migrate done");
}

// migrate();
