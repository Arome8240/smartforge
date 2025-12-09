import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Ignore test files in problematic node_modules packages
    config.externals.push({
      // prevent test files from being bundled
      'tap': 'commonjs tap',
    });

    config.module.rules.push({
      test: /thread-stream\/test|pino\/test/,
      use: 'null-loader',
    });

    return config;
  },
};

export default nextConfig;
