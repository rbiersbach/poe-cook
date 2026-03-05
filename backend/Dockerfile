FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests so npm can resolve the workspaces
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all deps (includes devDeps so tsx is available at runtime)
RUN npm ci

# Copy source files
COPY backend/ ./backend/
COPY specs/ ./specs/

WORKDIR /app/backend

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
