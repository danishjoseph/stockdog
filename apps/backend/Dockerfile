# Production stage
FROM node:21-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production && yarn cache clean

COPY dist/apps/backend ./

EXPOSE 3000

CMD [ "node", "main.js" ]