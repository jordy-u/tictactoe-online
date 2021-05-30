# syntax=docker/dockerfile:1

# First: Configure html/parameters.js with a text editor.

# Second, build the image with:
# docker build --tag boter-kaas-en-eieren .

# Third: Run the container. Example command:
# docker run -d -p 8082:8082 -p 8080:8080 --name boter boter-kaas-en-eieren

FROM node:12.18.1
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

RUN npm install -g http-server

COPY . .

CMD [ "npm", "start" ]
