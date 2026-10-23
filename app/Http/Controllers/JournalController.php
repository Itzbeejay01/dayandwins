<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = JournalEntry::query()->where('user_id', $request->user()->id)
            ->orderByDesc('entry_date')->get(['id','entry_date','mood','body','little_win']);
        $dates = $entries->pluck('entry_date')->map(fn ($date) => $date->format('Y-m-d'))->all();
        $streak = 0;
        $day = Carbon::today();
        if (!in_array($day->toDateString(), $dates, true)) $day->subDay();
        while (in_array($day->toDateString(), $dates, true)) { $streak++; $day->subDay(); }
        return Inertia::render('days-wins', [
            'entries' => $entries,
            'stats' => [
                'streak' => $streak,
                'entries' => $entries->count(),
                'wins' => $entries->filter(fn ($entry) => filled($entry->little_win))->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'entry_date' => ['required', 'date', 'before_or_equal:today'],
            'mood' => ['required', 'in:radiant,peaceful,grounded,tender,reflective'],
            'body' => ['nullable', 'string', 'max:10000'],
            'little_win' => ['nullable', 'string', 'max:500'],
        ]);
        JournalEntry::updateOrCreate(
            ['user_id' => $request->user()->id, 'entry_date' => $data['entry_date']],
            ['mood' => $data['mood'], 'body' => $data['body'] ?? null, 'little_win' => $data['little_win'] ?? null]
        );
        return redirect()->route('dashboard')->with('success', 'Entry saved');
    }

    public function destroy(Request $request, JournalEntry $entry)
    {
        abort_unless($entry->user_id === $request->user()->id, 403);
        $entry->delete();
        return redirect()->route('dashboard');
    }
}