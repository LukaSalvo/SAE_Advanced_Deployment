FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN mkdir -p /tmp/vite-cache /app/node_modules/.vite-temp && \
    chown -R node:node /app /tmp/vite-cache /app/node_modules/.vite-temp && \
    chmod -R u+rw /app /tmp/vite-cache /app/node_modules/.vite-temp
RUN npm run build
USER node
EXPOSE 3000
CMD ["npm", "run", "preview"]