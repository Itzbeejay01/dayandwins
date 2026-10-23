<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = JournalEntry::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('entry_date')
            ->get(['id', 'entry_date', 'mood', 'body', 'little_win', 'photo_path', 'is_favorite']);

        $dates = $entries->pluck('entry_date')->map(fn ($date) => $date->toDateString())->all();
        $streak = 0;
        $day = Carbon::today();

        if (! in_array($day->toDateString(), $dates, true)) {
            $day->subDay();
        }

        while (in_array($day->toDateString(), $dates, true)) {
            $streak++;
            $day->subDay();
        }

        $moodScore = ['reflective' => 1, 'tender' => 2, 'grounded' => 3, 'peaceful' => 4, 'radiant' => 5];

        return Inertia::render('days-wins', [
            'entries' => $entries->map(fn (JournalEntry $entry) => [
                'id' => $entry->id,
                'entry_date' => $entry->entry_date->toDateString(),
                'mood' => $entry->mood,
                'body' => $entry->body,
                'little_win' => $entry->little_win,
                'has_photo' => filled($entry->photo_path),
                'is_favorite' => $entry->is_favorite,
            ]),
            'stats' => [
                'streak' => $streak,
                'entries' => $entries->count(),
                'wins' => $entries->filter(fn ($entry) => filled($entry->little_win))->count(),
                'favorites' => $entries->where('is_favorite', true)->count(),
                'mood_flow' => collect(range(6, 0))->map(function ($daysAgo) use ($entries, $moodScore) {
                    $date = Carbon::today()->subDays($daysAgo)->toDateString();
                    $mood = $entries->first(fn ($entry) => $entry->entry_date->toDateString() === $date)?->mood;

                    return ['date' => $date, 'mood' => $mood, 'score' => $mood ? $moodScore[$mood] : null];
                })->values()->all(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'entry_date' => ['required', 'date', 'before_or_equal:today'],
            'mood' => ['required', Rule::in(['radiant', 'peaceful', 'grounded', 'tender', 'reflective'])],
            'body' => ['nullable', 'string', 'max:10000'],
            'little_win' => ['nullable', 'string', 'max:500'],
            'photo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
            'remove_photo' => ['sometimes', 'boolean'],
        ]);

        $entry = JournalEntry::firstOrNew([
            'user_id' => $request->user()->id,
            'entry_date' => $data['entry_date'],
        ]);

        $oldPhoto = $entry->photo_path;
        $newPhoto = null;

        if ($request->hasFile('photo')) {
            $newPhoto = $request->file('photo')->store('journal-photos/'.$request->user()->id, 'local');
            $entry->photo_path = $newPhoto;
        } elseif ($request->boolean('remove_photo')) {
            $entry->photo_path = null;
        }

        $entry->fill([
            'mood' => $data['mood'],
            'body' => $data['body'] ?? null,
            'little_win' => $data['little_win'] ?? null,
        ]);

        try {
            $entry->save();
        } catch (\Throwable $exception) {
            if ($newPhoto) {
                Storage::disk('local')->delete($newPhoto);
            }
            throw $exception;
        }

        if ($oldPhoto && $oldPhoto !== $entry->photo_path) {
            Storage::disk('local')->delete($oldPhoto);
        }

        return redirect()->route('dashboard')->with('success', 'Entry saved');
    }

    public function photo(Request $request, JournalEntry $entry): BinaryFileResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 404);
        abort_unless($entry->photo_path && Storage::disk('local')->exists($entry->photo_path), 404);

        return response()->file(
            Storage::disk('local')->path($entry->photo_path),
            ['Cache-Control' => 'private, max-age=3600', 'X-Content-Type-Options' => 'nosniff']
        );
    }

    public function favorite(Request $request, JournalEntry $entry): RedirectResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 404);
        $entry->update(['is_favorite' => ! $entry->is_favorite]);

        return back();
    }

    public function destroy(Request $request, JournalEntry $entry): RedirectResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 404);
        $photo = $entry->photo_path;
        $entry->delete();

        if ($photo) {
            Storage::disk('local')->delete($photo);
        }

        return redirect()->route('dashboard')->with('success', 'Entry deleted');
    }
}
