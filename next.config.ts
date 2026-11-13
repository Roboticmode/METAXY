import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /pitch serves the deck straight from docs/pitch, so ship those files with the route
  outputFileTracingIncludes: {
    "/pitch/\\[\\[\\.\\.\\.path\\]\\]": ["./docs/pitch/deck/**/*", "./docs/pitch/assets/**/*"],
  },
};

export default nextConfig;
