FROM grafana/grafana:latest

WORKDIR /app

COPY dist/apps/grafana /app/grafana

COPY dist/apps/grafana/provisioning/ /etc/grafana/provisioning/

CMD ["grafana-server", "--homepath=/usr/share/grafana"]

