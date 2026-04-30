/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable, no experimental flag needed
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  turbopack: {
    root: 'c:/Users/veera/OneDrive/Desktop/LIC Margadarshi',
  },
}

module.exports = nextConfig
