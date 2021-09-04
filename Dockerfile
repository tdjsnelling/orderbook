FROM node:14-alpine
COPY . .
RUN yarn
EXPOSE 9696
CMD ["yarn", "start"]