<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    protected $fillable = ['user_id', 'entry_date', 'mood', 'body', 'little_win'];
    protected function casts(): array { return ['entry_date' => 'date']; }
}