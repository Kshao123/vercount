import { redisHandler } from "./services.mjs";

const res = redisHandler({
  // type: 50,
  // REDIS_KEY: `site_uv_live:${host}`,
  // REDIS_VALUE: siteUV
  redisData: {
    'page_pv:ksh7.com/categories/SSL/': 123,
  },
  type: 52,
});

console.log(res);
