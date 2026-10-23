<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('entry_date');
            $table->string('mood', 24);
            $table->text('body')->nullable();
            $table->string('little_win', 500)->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'entry_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('journal_entries'); }
};