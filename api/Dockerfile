FROM node:10

# Create app directory
WORKDIR /usr/src/api

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080

# Run api service as container starts
CMD [ "node", "api.js" ]