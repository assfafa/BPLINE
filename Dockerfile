FROM node:25.2.1-bookworm AS node

FROM python:3.14.3

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local /usr/local

RUN useradd -m -s /bin/bash pigeon \
    && mkdir -p /home/pigeon/projects/BPLine \
    && chown -R pigeon:pigeon /home/pigeon

WORKDIR /home/pigeon/projects/BPLine

EXPOSE 12111 12112 12113 12114 12115 12116 12117 12118 12119

CMD ["tail", "-f", "/dev/null"]
