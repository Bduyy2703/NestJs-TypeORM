FROM node:lts-alpine

WORKDIR /app

COPY . .
COPY .env.prod .env.development
RUN npm install && npm cache clean --force

CMD ["npm", "start"]
