#!/bin/sh
set -e
cat <<EOF >/usr/share/nginx/html/config.json
{
  "apiUrl": "${API_URL:-http://localhost:3000}",
  "featureEditTask": "${VITE_FEATURE_EDIT_TASK:-false}",
  "featureDeleteTask": "${VITE_FEATURE_DELETE_TASK:-false}"
}
EOF
chown nginx:nginx /usr/share/nginx/html/config.json
exec nginx -g 'daemon off;'
