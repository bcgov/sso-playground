FROM node:22.18.0-alpine
WORKDIR /opt/app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
