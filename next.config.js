/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => [
    {
      source: "/js",
      destination: "/js/client.min.js",
    },
  ],
  headers: async () => [
    {
      // matching all API routes
      source: "/log",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "https://ksh7.com,https://www.ksh7.com,http://local.ksh7.com" },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value:
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
        },
        {
          key: "Access-Control-Max-Age",
          value: "86400",
        },
      ],
    },
    {
      // matching js route
      source: "/js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=86400, max-age=86400",
        },
        {
          key: "Vercel-CDN-Cache-Control",
          value: "max-age=3600",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
