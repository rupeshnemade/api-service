FROM node:10

# Create app directory
WORKDIR /usr/src/worker

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080

# Run worker service as container starts
CMD [ "node", "worker.js" ]