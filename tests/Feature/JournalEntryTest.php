<?php

use App\Models\JournalEntry;
use App\Models\User;

it('redirects guests to sign in', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

it('stores one entry per user and day and updates it', function () {
    $user = User::factory()->create();
    $payload = ['entry_date' => now()->toDateString(), 'mood' => 'radiant', 'body' => 'A lovely day', 'little_win' => 'Finished a task'];
    $this->actingAs($user)->post('/journal-entries', $payload)->assertRedirect('/dashboard');
    $this->actingAs($user)->post('/journal-entries', array_merge($payload, ['body' => 'Updated']))->assertRedirect('/dashboard');
    expect(JournalEntry::where('user_id', $user->id)->count())->toBe(1);
    expect(JournalEntry::where('user_id', $user->id)->first()->body)->toBe('Updated');
});

it('does not allow deleting another users journal entry', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $entry = JournalEntry::create(['user_id'=>$owner->id,'entry_date'=>now()->toDateString(),'mood'=>'peaceful','body'=>'Private']);
    $this->actingAs($other)->delete('/journal-entries/'.$entry->id)->assertForbidden();
    expect(JournalEntry::find($entry->id))->not->toBeNull();
});

it('validates journal mood and future dates', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/journal-entries', ['entry_date'=>now()->addDay()->toDateString(),'mood'=>'invalid'])
        ->assertSessionHasErrors(['entry_date','mood']);
});
