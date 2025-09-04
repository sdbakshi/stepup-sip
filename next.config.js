/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const repo = "stepup-sip-next"; // <-- your repo name

module.exports = {
  output: "export",           // make a static site in ./out
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,        // helps with static hosting
  images: { unoptimized: true } // (safety; we’re not using next/image anyway)
};