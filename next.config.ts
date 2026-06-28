import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  images: { domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"] },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // pptxgenjs' ESM build statically references node: built-ins for its Node
      // file-writing path, which never runs in the browser (we use Blob download).
      // Rewrite `node:fs` -> `fs` etc., then stub those modules out for the client.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
      };
    }
    return config;
  },
};

export default nextConfig;
