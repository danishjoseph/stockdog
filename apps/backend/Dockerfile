# Production stage
FROM node:21-alpine

WORKDIR /app

RUN corepack enable 

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn workspaces focus --production && yarn cache clean 

COPY dist/apps/backend ./

EXPOSE 3000

CMD [ "node", "main.js" ]

