-- Runs once, the first time the mysql-data volume is created.
-- Separate database for `php artisan test` so tests never wipe your dev data.
CREATE DATABASE IF NOT EXISTS airbnb_clone_testing
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON airbnb_clone_testing.* TO 'airbnb'@'%';
FLUSH PRIVILEGES;
