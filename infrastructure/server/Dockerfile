FROM node:20.11.0-bookworm AS base
WORKDIR /app
COPY ".yarn" /app/.yarn
COPY ["package.json", "yarn.lock", ".yarnrc.yml", "eslint.config.js", "tsconfig.json", "./"]
COPY ./src/server/package.json ./src/server/

FROM base AS build-dependencies
COPY ./build/package.json ./build/
RUN yarn install
COPY ./build/ ./build/
COPY ./src/server/ ./src/server/

FROM build-dependencies AS build
RUN yarn workspace @js_node_chat/build build server

FROM node:20.11.0-bookworm-slim AS builded
WORKDIR /app
COPY --from=base /app/ /app/
RUN yarn workspaces focus @js_node_chat/server --production
COPY --from=build /app/dist/server /app/dist/server
CMD [ "node", "./dist/server/index.js" ]

FROM build-dependencies AS hot-reload
CMD [ "yarn", "builder-hot-reload", "server"]