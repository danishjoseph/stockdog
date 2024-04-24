# Build stage
FROM node:21-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile && yarn cache clean

COPY . .

RUN yarn build

# Production stage
FROM node:21-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile && yarn cache clean

EXPOSE 3000

CMD [ "yarn", "start:prod" ]