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
    /** Tree-shake icon/barrel packages (lucide) without deep import paths. */
    optimizePackageImports: ["lucide-react"],
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
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(self)",
                    },
                ],
            },
        ]
    },
}

export default nextConfig
