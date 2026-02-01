# Use Node image that bundles dependencies for Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# Switch to root to install dependencies (base image sets user to pptruser)
USER root

# Skip Chromium download during npm install as it's already in the image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
# Install ALL dependencies (including dev) to allow building
RUN npm install

COPY src ./src
COPY tsconfig.json ./

# Build TypeScript to dist/
RUN npm run build

# Run as non-privileged user
USER pptruser

CMD [ "node", "dist/server.js" ]
