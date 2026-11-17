#!/bin/sh
set -e

cd /var/www/html

# First start after cloning: install PHP dependencies
if [ -f composer.json ] && [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] vendor/ missing -> composer install"
    composer install --no-interaction --prefer-dist
fi

# First start after cloning: create .env with an app key
if [ -f .env.example ] && [ ! -f .env ]; then
    echo "[entrypoint] .env missing -> copying .env.example and generating APP_KEY"
    cp .env.example .env
    php artisan key:generate --force
fi

# Make files on the "public" disk (avatars, listing photos) reachable at /storage/...
if [ ! -e public/storage ]; then
    php artisan storage:link || true
fi

exec "$@"
