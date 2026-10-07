FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Run node directly instead of through pnpm: the pnpm process would stay resident and use ~100 MB of RAM.
# The launcher runs the API and the queue worker side by side; see src/start-all.ts.
CMD ["node", "--env-file-if-exists=.env.production", "dist/start-all.mjs"]