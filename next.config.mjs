import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
    /**
     * Pin Turbopack to this app root. Without this, Next may pick a parent
     * lockfile (e.g. ~/package-lock.json) and fail to resolve tailwindcss.
     */
    turbopack: {
        root: __dirname,
    },
    /** Enables `"use cache"`, `cacheTag`, `cacheLife`, and tag invalidation via `revalidateTag`. */
    cacheComponents: true,
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "187.127.133.141",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "framerusercontent.com",
                pathname: "/**",
            },
        ],
    },
}

export default nextConfig
