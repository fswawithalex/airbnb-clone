<?php

namespace App\Enums;

/** Stored in experiences.category (VARCHAR). The frontend shows a translated name and an icon per case. */
enum ExperienceCategory: string
{
    case Food = 'food';
    case Tours = 'tours';
    case Art = 'art';
    case Outdoors = 'outdoors';
    case Wellness = 'wellness';
}
