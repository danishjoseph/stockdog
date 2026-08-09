# Production stage
FROM node:22-alpine

WORKDIR /app

RUN corepack enable 

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY dist/apps/backend ./

EXPOSE 3000

CMD [ "node", "main.js" ]

