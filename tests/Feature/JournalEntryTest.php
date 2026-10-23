<?php

use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('redirects guests to sign in', function () {
    $this->get('/dashboard')->assertRedirect('/login');
    $this->post('/journal-entries')->assertRedirect('/login');
});

it('renders the authenticated journal without another users entries', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    JournalEntry::create([
        'user_id' => $owner->id,
        'entry_date' => now()->toDateString(),
        'mood' => 'peaceful',
        'body' => 'My private day',
    ]);
    JournalEntry::create([
        'user_id' => $other->id,
        'entry_date' => now()->toDateString(),
        'mood' => 'radiant',
        'body' => 'Their private day',
    ]);

    $this->actingAs($owner)->get('/dashboard')->assertOk()
        ->assertInertia(fn ($page) => $page->component('days-wins')
            ->has('entries', 1)
            ->where('entries.0.body', 'My private day')
            ->where('stats.entries', 1));
});

it('saves and updates one entry per user and day', function () {
    $user = User::factory()->create();
    $payload = [
        'entry_date' => now()->toDateString(),
        'mood' => 'radiant',
        'body' => 'A lovely day',
        'little_win' => 'Finished my first task',
    ];

    $this->actingAs($user)->post('/journal-entries', $payload)->assertRedirect('/dashboard');
    $this->actingAs($user)->post('/journal-entries', [...$payload, 'body' => 'Updated'])->assertRedirect('/dashboard');

    expect(JournalEntry::where('user_id', $user->id)->count())->toBe(1);
    expect(JournalEntry::where('user_id', $user->id)->first()->body)->toBe('Updated');
});

it('keeps personal journal photos private and cleans them up', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $payload = [
        'entry_date' => now()->toDateString(),
        'mood' => 'grounded',
        'body' => 'A memory worth keeping',
    ];

    $this->actingAs($owner)->post('/journal-entries', [
        ...$payload,
        'photo' => UploadedFile::fake()->image('memory.jpg', 500, 300),
    ])->assertRedirect('/dashboard');

    $entry = JournalEntry::where('user_id', $owner->id)->firstOrFail();
    expect($entry->photo_path)->not->toBeNull();
    Storage::disk('local')->assertExists($entry->photo_path);
    $path = $entry->photo_path;

    $this->actingAs($other)->get('/journal-entries/'.$entry->id.'/photo')->assertNotFound();
    $this->actingAs($owner)->get('/journal-entries/'.$entry->id.'/photo')->assertOk();

    $this->actingAs($owner)->post('/journal-entries', [...$payload, 'remove_photo' => '1'])
        ->assertRedirect('/dashboard');

    expect($entry->fresh()->photo_path)->toBeNull();
    Storage::disk('local')->assertMissing($path);
});

it('prevents accessing, modifying or deleting another users entry', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $entry = JournalEntry::create([
        'user_id' => $owner->id,
        'entry_date' => now()->toDateString(),
        'mood' => 'peaceful',
        'body' => 'Private',
    ]);

    $this->actingAs($other)->delete('/journal-entries/'.$entry->id)->assertNotFound();
    $this->actingAs($other)->patch('/journal-entries/'.$entry->id.'/favorite')->assertNotFound();
    expect(JournalEntry::find($entry->id))->not->toBeNull();
});

it('toggles favorite state only for its owner', function () {
    $owner = User::factory()->create();
    $entry = JournalEntry::create([
        'user_id' => $owner->id,
        'entry_date' => now()->toDateString(),
        'mood' => 'tender',
    ]);

    $this->actingAs($owner)->patch('/journal-entries/'.$entry->id.'/favorite')->assertRedirect();
    expect($entry->fresh()->is_favorite)->toBeTrue();
    $this->actingAs($owner)->patch('/journal-entries/'.$entry->id.'/favorite')->assertRedirect();
    expect($entry->fresh()->is_favorite)->toBeFalse();
});

it('rejects invalid mood, future date and oversized images', function () {
    Storage::fake('local');
    $user = User::factory()->create();

    $this->actingAs($user)->post('/journal-entries', [
        'entry_date' => now()->addDay()->toDateString(),
        'mood' => 'wrong',
        'photo' => UploadedFile::fake()->create('huge.png', 11000, 'image/png'),
    ])->assertSessionHasErrors(['entry_date', 'mood', 'photo']);

    expect(JournalEntry::where('user_id', $user->id)->count())->toBe(0);
});

it('removes private journal photos when the owner deletes their account', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $path = UploadedFile::fake()->image('last-memory.jpg')->store('journal-photos/'.$user->id, 'local');

    expect($path)->toBeString();

    JournalEntry::create([
        'user_id' => $user->id,
        'entry_date' => now()->toDateString(),
        'mood' => 'peaceful',
        'body' => 'A private memory',
        'photo_path' => $path,
    ]);

    Storage::disk('local')->assertExists($path);

    $this->actingAs($user)->delete(route('profile.destroy'), [
        'password' => 'password',
    ])->assertRedirect(route('home'));

    Storage::disk('local')->assertMissing($path);
    expect(JournalEntry::where('user_id', $user->id)->count())->toBe(0);
});
