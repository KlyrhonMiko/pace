import dotenv from "dotenv";
import { join } from "path";
import type { NextConfig } from "next";

dotenv.config({ path: join(process.cwd(), "../.env.local") });

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
