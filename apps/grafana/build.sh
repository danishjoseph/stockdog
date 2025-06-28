#!/usr/bin/env bash

DIST_DIR="../../dist/apps/grafana"
DASHBOARD_DIR="./src/dashboards"

if [[ -d "$DIST_DIR" ]]; then
    rm -rf "$DIST_DIR" || {
        echo "Failed to remove existing dist directory"
        exit 1
    }
fi

mkdir -p "$DIST_DIR/dashboards" || {
    echo "Failed to create output directory $DIST_DIR/dashboards"
    exit 1
}

# Copy provisioning/ to dist 
cp -r "./provisioning" "$DIST_DIR/provisioning" 

JSONNET_PATH="$(realpath vendor)"
export JSONNET_PATH

for file in $DASHBOARD_DIR/*.jsonnet; do
    filename=$(basename -- "$file")
    output="$DIST_DIR/dashboards/${filename%.*}.json"
    jsonnet -J "$JSONNET_PATH" -o "$output" "$file"
    echo "Converted $file to $output"
done

