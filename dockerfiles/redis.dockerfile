FROM redis:alpine

EXPOSE 6379:6379

ENV REDIS_PASSWORD="secretredispassword"

ENTRYPOINT redis-server --requirepass "${REDIS_PASSWORD}"

RUN echo ${REDIS_PASSWORD}
