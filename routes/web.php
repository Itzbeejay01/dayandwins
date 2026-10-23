<?php

use App\Http\Controllers\JournalController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [JournalController::class, 'index'])->name('dashboard');
    Route::post('/journal-entries', [JournalController::class, 'store'])->name('journal.store');
    Route::delete('/journal-entries/{entry}', [JournalController::class, 'destroy'])->name('journal.destroy');
});

require __DIR__.'/settings.php';
