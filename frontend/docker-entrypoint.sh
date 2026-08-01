#!/bin/sh

# Если node_modules пустой, копируем из образа
if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "Installing dependencies..."
    cp -r /app/node_modules_cached/* /app/node_modules/
fi

exec "$@"
