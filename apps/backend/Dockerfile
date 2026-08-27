# Production stage
FROM node:24-alpine

WORKDIR /app

RUN corepack enable 

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY dist/apps/backend ./

EXPOSE 3000

CMD [ "node", "main.js" ]

