FROM redis:alpine

EXPOSE 6379:6379

ENV REDIS_PASSWORD="secretredispassword"

ENTRYPOINT redis-server --requirepass "${REDIS_PASSWORD}"

RUN echo ${REDIS_PASSWORD}


# docker build -t redis_solo -f redis.dockerfile .
# docker run --rm -d --name redis_solo -p 6379:6379 redis_solo