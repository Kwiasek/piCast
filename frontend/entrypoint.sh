#!/bin/sh

# Replace placeholder api url with value from $API_URL variable
sed -i "s|__API_URL_PLACEHOLDER__|${API_URL}|g" /usr/share/nginx/html/index.html

exec "$@"