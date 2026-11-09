<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_reports_database_connection(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson(['status' => 'ok', 'database' => 'connected']);
    }

    public function test_cors_allows_the_frontend_origin(): void
    {
        $origin = config('app.frontend_url');

        $this->withHeaders(['Origin' => $origin])
            ->getJson('/api/health')
            ->assertHeader('Access-Control-Allow-Origin', $origin);
    }
}
