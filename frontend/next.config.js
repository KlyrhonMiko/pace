const dotenv = require("dotenv");
const { join } = require("path");

dotenv.config({ path: join(process.cwd(), "../.env.local") });

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["pdf-parse"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
        ],
    },
};

module.exports = nextConfig;
