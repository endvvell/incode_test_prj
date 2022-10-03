FROM node

WORKDIR /app

COPY ./package.json .

RUN npm install

COPY ./dist ./dist

EXPOSE 3000

# the values assigned with "=" are only defaults(that can be overwritten) for the specified fields
ENV MONGODB_USERNAME=produser
ENV MONGODB_PASSWORD=topsecretpassword
ENV MONGODB_HOST=localhost
# if I were really deploying this app then the host would be some Atlas cluster link like "cluster0.hwjdmyt.mongodb.net", but since this is only a test project I'll just leave it as "localhost" 
ENV MONGODB_DATABASE=amazingnewdb


CMD [ "npm", "start" ]