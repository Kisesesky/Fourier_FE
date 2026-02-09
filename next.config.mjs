/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "newsimg.sedaily.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "images.khan.co.kr" },
      { protocol: "https", hostname: "cdn.tvj.co.kr" },
      { protocol: "https", hostname: "pds.joongang.co.kr" },
      { protocol: "https", hostname: "img2.daumcdn.net" },
      { protocol: "https", hostname: "img6.yna.co.kr" },
      { protocol: "https", hostname: "talkimg.imbc.com" },
      { protocol: "https", hostname: "www.interview365.com" },
    ],
  },
};

export default nextConfig;
