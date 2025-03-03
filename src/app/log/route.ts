import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  getPagePVBeforeData,
  getSitePVBeforeData,
  getSiteUVBeforeData,
} from "@/lib/get-before-data";
import { updatePagePV, updateSitePV, updateSiteUV } from "@/lib/update-data";
import syncBusuanziData from "@/lib/sync-busuanzi-data";
import logger from "@/lib/logger"; // Ensure this logger is configured for env-based logging
import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: Request) {
//   return redirect("/");
// }

const allowedOrigins = [
  "https://ksh7.com",
  "https://www.ksh7.com",
  "http://local.ksh7.com:4000"
];

const HandleResponse = (origin?: string) => ({
  json: (data: any, init?: ResponseInit) => {
    return Response.json(data, {
      ...init,
      headers: {
        ...init?.headers,
        ...(origin ? { "Access-Control-Allow-Origin": origin, } : undefined)
      },
    })
  }
})

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const Response = HandleResponse(origin!);

    if (!allowedOrigins.includes(origin!)) {
      return new NextResponse(null, { status: 403 });
    }

    const header = req.headers;
    const data = req;
    // const data = await req.json();

    if (!data.url) {
      logger.warn(`POST request with missing URL`, { status: 400 });
      return Response.json({ error: "Missing url" }, { status: 400 });
    }

    const clientHost =
      // 需自行在 Tencent Cdn 中增加回源头部 => $client_ip
      header.get("X-Custom-IP") ||
      header.get("X-Forwarded-For")?.split(",")[0] ||
      // req.ip ||
      header.get("X-Real-IP");

    // Use structured logging where possible for easier parsing
    logger.debug("Request details", {
      clientHost,
      realIp: header.get("X-Real-IP"),
      customIp: header.get("X-Custom-IP"),
      xForwardedHost: header.get("X-Forwarded-Host"),
      xForwardedFor: header.get("X-Forwarded-For"),
      // reqIp: req.ip,
    });

    if (!clientHost) {
      logger.warn(`POST request with missing client host`, { status: 400 });
      return Response.json({ error: "Missing host" }, { status: 400 });
    }

    const hosts = new URL(data.url);
    const url = hosts.searchParams.get("url");
    if (!url) {
      return Response.json({ error: "Missing params url" }, { status: 400 });
    }

    const parsedUrl = new URL(url);

    const [host, path, protocol] = [
      parsedUrl.host,
      parsedUrl.pathname.replace(/\/index(\.html?\/?)$/i, ""),
      parsedUrl.protocol,
    ];

    // logger.info(`Processing request`, { host, path, clientHost });

    // const [siteUVBefore, sitePVBefore, pagePVBefore] = await Promise.all([
    //   getSiteUVBeforeData(host, path, protocol),
    //   getSitePVBeforeData(host, path, protocol),
    //   getPagePVBeforeData(host, path, protocol),
    // ]);

    // logger.info(`Initial data`, {
    //   siteUVBefore,
    //   sitePVBefore,
    //   pagePVBefore,
    // });

    // let [siteUV, sitePVAfter, pagePVAfter] = await Promise.all([
    //   updateSiteUV(host, clientHost, protocol),
    //   updateSitePV(host, protocol),
    //   updatePagePV(host, path, protocol),
    // ]);

    // todo 减少 kv 的交互逻辑
    // www.ksh7.com
    // let [siteUVBefore, sitePVBefore, pagePVBefore, siteUV, sitePVAfter, pagePVAfter] = await Promise.all([
    //   getSiteUVBeforeData(host, path, protocol),
    //   getSitePVBeforeData(host, path, protocol),
    //   getPagePVBeforeData(host, path, protocol),
    //   updateSiteUV(host, clientHost, protocol),
    //   updateSitePV(host, protocol),
    //   updatePagePV(host, path, protocol),
    // ]);
    let [siteUVBefore, sitePVBefore, pagePVBefore, siteUV, sitePVAfter, pagePVAfter] = await Promise.all([
      getSiteUVBeforeData(host, path, protocol),
      // getSitePVBeforeData(host, path, protocol),
      0,0,
      // getPagePVBeforeData(host, path, protocol),
      updateSiteUV(host, clientHost, protocol),
      updateSitePV(host, protocol),
      updatePagePV(host, path, protocol),
    ]);

    let [siteUVAfter, isFirstUser] = siteUV || [];

    siteUVAfter += siteUVBefore;
    sitePVAfter += sitePVBefore;
    pagePVAfter += pagePVBefore;

    logger.info(`Data updated`, {
      host,
      path,
      siteUVAfter,
      sitePVAfter,
      pagePVAfter,
    });

    syncBusuanziData(host, path, protocol, isFirstUser);

    const dataDict = {
      site_uv: siteUVAfter,
      site_pv: sitePVAfter,
      page_pv: pagePVAfter,
    };
    return Response.json(dataDict);
  } catch (e) {
    logger.error(`Error processing request: ${e}`);
    return Response.json({ errorMessage: e }, { status: 500 });
  }
}

// export async function OPTIONS() {
//   const corsHeaders = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
//     "Access-Control-Allow-Headers": "*",
//   };
//   return NextResponse.json({ message: "OK" }, { headers: corsHeaders });
// }
