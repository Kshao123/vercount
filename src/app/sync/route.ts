import { NextResponse, type NextRequest } from "next/server";
import logger from "@/lib/logger";
import syncBusuanziData from "@/lib/sync-busuanzi-data";

// sync to busuanzi
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { host, path, protocol, isFirstUser } = data || {};
  logger.info("sync busuanzi data", data);

  await syncBusuanziData(host, path, protocol, isFirstUser);

  return NextResponse.json({
    message: "sync busuanzi data successfully",
    success: true,
  });
}
