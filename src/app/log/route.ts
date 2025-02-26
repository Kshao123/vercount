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

export async function GET(req: NextRequest) {
  const header = headers();
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
    req.ip ||
    header.get("X-Real-IP");

  // Use structured logging where possible for easier parsing
  logger.debug("Request details", {
    clientHost,
    realIp: header.get("X-Real-IP"),
    customIp: header.get("X-Custom-IP"),
    xForwardedHost: header.get("X-Forwarded-Host"),
    xForwardedFor: header.get("X-Forwarded-For"),
    reqIp: req.ip,
  });

  if (!clientHost) {
    logger.warn(`POST request with missing client host`, { status: 400 });
    return Response.json({ error: "Missing host" }, { status: 400 });
  }

  const hosts = new URL(data.url);
  const parsedUrl = new URL(hosts.searchParams.get("url")!);

  const [host, path] = [
    parsedUrl.host,
    parsedUrl.pathname.replace(/\/index$/, ""),
  ];

  // logger.info(`Processing request`, { host, path, clientHost });

  const [siteUVBefore, sitePVBefore, pagePVBefore] = await Promise.all([
    getSiteUVBeforeData(host, path),
    getSitePVBeforeData(host, path),
    getPagePVBeforeData(host, path),
  ]);

  // logger.info(`Initial data`, {
  //   siteUVBefore,
  //   sitePVBefore,
  //   pagePVBefore,
  // });

  let [siteUVAfter, sitePVAfter, pagePVAfter] = await Promise.all([
    updateSiteUV(host, clientHost),
    updateSitePV(host),
    updatePagePV(host, path),
  ]);

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

  syncBusuanziData(host, path);

  const dataDict = {
    site_uv: siteUVAfter,
    site_pv: sitePVAfter,
    page_pv: pagePVAfter,
  };
  return Response.json(dataDict);
}

// export async function OPTIONS() {
//   const corsHeaders = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
//     "Access-Control-Allow-Headers": "*",
//   };
//   return NextResponse.json({ message: "OK" }, { headers: corsHeaders });
// }
