<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'entry_date', 'mood', 'body', 'little_win', 'photo_path', 'is_favorite'])]
class JournalEntry extends Model
{
    protected function casts(): array
    {
        return ['entry_date' => 'date', 'is_favorite' => 'boolean'];
    }
}
