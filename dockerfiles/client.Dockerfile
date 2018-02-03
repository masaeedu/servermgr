FROM node:9

# Add and build code
COPY ./client /app
WORKDIR /app
RUN yarn

CMD yarn start
EXPOSE 3000
