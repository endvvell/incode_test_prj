FROM mongo

ENV MONGO_INITDB_ROOT_USERNAME=devuser
ENV MONGO_INITDB_ROOT_PASSWORD=devpassword

EXPOSE 27017

# docker build -t mongo_solo -f mongodb.dockerfile .
# docker run --rm -d --name mongo_solo -p 27017:27017 mongo_solo