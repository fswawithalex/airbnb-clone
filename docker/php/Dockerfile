FROM php:8.4-fpm

# Match the host user's ids (Linux) so files written from the container are owned by the developer.
ARG UID=1000
ARG GID=1000

COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && install-php-extensions pdo_mysql bcmath intl zip gd exif pcntl opcache \
    && rm -rf /var/lib/apt/lists/* \
    && groupmod -o -g "${GID}" www-data \
    && usermod -o -u "${UID}" -g www-data www-data

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY php.ini "$PHP_INI_DIR/conf.d/zz-app.ini"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# Strip CR in case the script was checked out with Windows line endings.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

ENV COMPOSER_HOME=/tmp/composer \
    XDG_CONFIG_HOME=/tmp/.config
WORKDIR /var/www/html
USER www-data

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
