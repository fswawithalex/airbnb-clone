<?php

namespace App\Enums;

/** Stored in services.category (VARCHAR). The frontend shows a translated name and an icon per case. */
enum ServiceCategory: string
{
    case Chef = 'chef';
    case Photography = 'photography';
    case Massage = 'massage';
    case Training = 'training';
    case Makeup = 'makeup';
}
