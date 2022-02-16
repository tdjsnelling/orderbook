FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json ./package.json
COPY src ./src
RUN yarn install
RUN yarn build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist/index.js ./index.js
EXPOSE 9696
CMD ["node", "/app/index.js"]
