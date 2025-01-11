ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

RUN apk add --no-cache nodejs npm

WORKDIR /server

COPY . /server
RUN npm install --unsafe-perm
RUN pwd
RUN ls -al

EXPOSE 10002

CMD [ "npm", "start" ]
