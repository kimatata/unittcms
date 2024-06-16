FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE $PORT
RUN npx sequelize db:migrate

CMD ["node", "index.js"]
