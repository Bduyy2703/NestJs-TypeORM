FROM node:lts-alpine

WORKDIR /app

COPY . .
COPY .env.prod .env
RUN npm install && npm cache clean --force

CMD ["npm", "start"]
