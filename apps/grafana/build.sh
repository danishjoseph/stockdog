#!/usr/bin/env bash

OUTPUT_DIR="../../dist/apps/grafana"
DASHBOARD_DIR="$OUTPUT_DIR/dashboards"

if [[ -d "$OUTPUT_DIR" ]]; then
    rm -rf "$OUTPUT_DIR" || {
        echo "Failed to remove existing dist directory"
        exit 1
    }
fi

mkdir -p "$DASHBOARD_DIR" || {
    echo "Failed to create output directory $OUTPUT_DIR/dashboards"
    exit 1
}

# Copy provisioning/ to dist 
cp -r "./provisioning" "$OUTPUT_DIR/provisioning" 

JSONNET_PATH="$(realpath vendor)"
export JSONNET_PATH

for file in ./src/panels/*.jsonnet; do
    filename=$(basename -- "$file")
    output="$DASHBOARD_DIR/${filename%.*}.json"
    jsonnet -J "$JSONNET_PATH" -o "$output" "$file"
    echo "Converted $file to $output"
done
