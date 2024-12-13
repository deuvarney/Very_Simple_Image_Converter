/** @type {import('next').NextConfig} */
const nextConfig = {};

const isGithubActions = process.env.GITHUB_ACTIONS || false

let assetPrefix = ''
let basePath = ''

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '')
  assetPrefix = `/${repo}/`
  basePath = `/${repo}`
}

nextConfig.assetPrefix = assetPrefix
nextConfig.basePath = basePath
nextConfig.output = 'export'

export default nextConfig;
