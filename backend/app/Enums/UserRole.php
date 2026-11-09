<?php

namespace App\Enums;

enum UserRole: string
{
    case Guest = 'guest';
    case Host = 'host';
    case Admin = 'admin';
}
