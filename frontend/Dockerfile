# Frontend dev-server image (Vite). Source is live-mounted by compose.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
