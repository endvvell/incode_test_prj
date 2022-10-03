FROM node

WORKDIR /app

COPY ./package.json .

RUN npm install

COPY ./dist ./dist

EXPOSE 3000

# the values assigned with "=" are only defaults(that can be overwritten - which I would usually do when deploying in production, therefore the defaults for the project are set to "dev" values, since I expect them to be overwritten with different ones in prod
ENV MONGODB_USERNAME=devuser
ENV MONGODB_PASSWORD=devpassword
ENV MONGODB_HOST=127.0.0.1
# ^^ if I were really deploying this app then the host would be some Atlas cluster link like "cluster0.hwjdmyt.mongodb.net", but since this is only a test project I'll just leave it as "localhost" 
ENV MONGODB_PORT=27017
ENV MONGODB_DATABASE=amazingnewdb-dev


CMD [ "npm", "start" ]