#ARG BUILD_FROM
#FROM $BUILD_FROM
FROM arm32v7/alpine

ENV LANG C.UTF-8

# Install requirements for add-on
RUN apk add --no-cache nodejs npm


#FROM node:10.16-slim

WORKDIR /server

COPY . /server
RUN npm install --unsafe-perm
RUN pwd
RUN ls -al

EXPOSE 10002

CMD [ "npm", "start" ]



# FROM node:10.16-slim

# WORKDIR /server

# COPY . /server
# RUN npm install --unsafe-perm

# CMD [ "npm", "start" ]
