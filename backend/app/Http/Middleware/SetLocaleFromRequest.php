<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validation messages and emails in the user's language.
 * The React app sends "Accept-Language: ro" (or en / ru) with every request (see frontend/src/lib/api.js).
 */
class SetLocaleFromRequest
{
    public const SUPPORTED = ['en', 'ro', 'ru'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->getPreferredLanguage(self::SUPPORTED);

        if ($locale) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
