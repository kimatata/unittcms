FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV FRONTEND_ORIGIN=http://localhost:8000
ENV PORT=8001

EXPOSE $PORT

RUN npx sequelize db:migrate
RUN echo "Migration complete."

CMD ["node", "index.js"]
