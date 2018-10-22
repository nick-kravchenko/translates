FROM node:8-alpine

## Copy package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN mkdir /var/www
RUN npm i && mkdir /var/www/app && cp -R ./node_modules ./var/www/app

WORKDIR /var/www/app
RUN mkdir storage && touch storage/translate.csv && touch storage/users.js && touch GOOGLE_TRANSLATE_CREDENTIALS.json
COPY . .
RUN npm run build

CMD ["node", "index.js"]