FROM grafana/grafana:latest

WORKDIR /app

COPY dist/apps/dashboard/ /app/dashboard/

COPY dist/apps/dashboard/provisioning/ /etc/grafana/provisioning/

CMD ["grafana-server", "--homepath=/usr/share/grafana"]

