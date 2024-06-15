#!/usr/bin/env bash
set -eu -o pipefail

error() {
	>&2 echo "ERROR:" "${@}"
	exit 1
}

if [ ! -f .env ]; then
    echo "Error: .env file not found."
    exit 1
fi
source .env


[ -n "${GRAFANA_API_KEY:-}" ] || error "Invalid GRAFANA_API_KEY"
[[ "${GRAFANA_URL:-}" =~ ^https?://[^/]+/$ ]] || error "Invalid GRAFANA_URL (example: 'http://localhost:3001/' incl. slash at end)"

[ $# = 1 ] || error "Usage: $(basename "${0}") JSONNET_FILE_OF_DASHBOARD"
dashboard_jsonnet_file="${1}"

rendered_json_file="/tmp/$(basename "${dashboard_jsonnet_file%.jsonnet}").rendered.json"

cat >/tmp/render-and-upload-dashboard.sh <<-EOF
	#!/usr/bin/env bash
	set -euo pipefail
	clear
  source .env
	# Render
	echo "Will render to \${2}"
	JSONNET_PATH="\$(realpath vendor)"
	export JSONNET_PATH
	jsonnet-lint "\${1}"
	jsonnet -o "\${2}" "\${1}"

	# Enable editable flag and upload via Grafana API
	cat "\${2}" \
		| jq '{"dashboard":.,"folderId":0,"overwrite":true} | .dashboard.editable = true' \
		| curl \
			--fail-with-body \
			-sS \
			-X POST \
			-H "Authorization: Bearer ${GRAFANA_API_KEY}" \
			-H "Content-Type: application/json" \
			--data-binary @- "${GRAFANA_URL}api/dashboards/db" \
		&& printf '\nDashboard uploaded at: %s\n' "$(date)" \
		|| { >&2 printf '\nERROR: Failed to upload dashboard\n'; exit 1; }
EOF
chmod +x /tmp/render-and-upload-dashboard.sh

echo "${dashboard_jsonnet_file}" | entr /tmp/render-and-upload-dashboard.sh /_ "${rendered_json_file}"