#!/usr/bin/env python3
"""おかえりの灯 — BGM一式を作曲・レンダリングするスクリプト。

  python3 tools/compose_music.py [曲名 ...]

MIDIを組み立て、FluidSynth + FluidR3_GM.sf2 で演奏を録音し、
継ぎ目のないループへ切り出して assets/music/*.ogg に書き出します。
必要なもの: fluidsynth, ffmpeg, FluidR3_GM.sf2, Python の mido / numpy。
"""
import os, random, subprocess, sys, tempfile, wave
import numpy as np
import mido

SF2 = os.environ.get('OKAERI_SF2', '/usr/share/sounds/sf2/FluidR3_GM.sf2')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'music')
RATE = 44100
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pitch(name):
    """'F#4' -> MIDI番号。C4 = 60。"""
    n = NOTE[name[0]]
    rest = name[1:]
    while rest[0] in '#b':
        n += 1 if rest[0] == '#' else -1
        rest = rest[1:]
    return n + 12 * (int(rest) + 1)


def line(text):
    """'D5:1 E5:.5 r:1' -> [(pitch|None, beats), ...]"""
    out = []
    for token in text.split():
        name, beats = token.split(':')
        out.append((None if name == 'r' else pitch(name), float(beats)))
    return out


CHORDS = {
    'D': 'D F# A', 'A': 'A C# E', 'Bm': 'B D F#', 'G': 'G B D', 'Em': 'E G B', 'Em7': 'E G B D',
    'A7': 'A C# E G', 'Asus4': 'A D E', 'F#m': 'F# A C#', 'F#': 'F# A# C#', 'F#sus4': 'F# B C#',
    'C': 'C E G', 'Am': 'A C E', 'Am7': 'A C E G', 'D7': 'D F# A C', 'B7': 'B D# F# A',
    'F': 'F A C', 'Dm': 'D F A', 'Bb': 'Bb D F', 'Gm': 'G Bb D', 'Gm7': 'G Bb D F', 'C7': 'C E G Bb',
    'A7sus4': 'A D E G',
}


def chord(symbol, octave=3):
    """'D/F#' -> (バス音, [和音の構成音])。構成音は octave から上へ積む。"""
    name, _, bass = symbol.partition('/')
    tones = CHORDS[name].split()
    notes, last = [], -1
    for t in tones:
        p = pitch(t + str(octave))
        while p <= last:
            p += 12
        notes.append(p)
        last = p
    root = pitch((bass or tones[0]) + str(octave - 1))
    return root, notes


class Song:
    def __init__(self, name, bpm, beats_per_bar, bars, loop=True, seed=7):
        self.name, self.bpm, self.bpb, self.bars, self.loop = name, bpm, beats_per_bar, bars, loop
        self.events = []  # (beat, channel, kind, a, b)
        self.channels = {}
        self.tempo_changes = []
        self.rng = random.Random(seed)

    def inst(self, key, program, vol=96, pan=64, reverb=60, chorus=0):
        ch = 9 if program == 'drums' else len([c for c in self.channels.values() if c != 9])
        if ch >= 9 and program != 'drums':
            ch += 1
        self.channels[key] = ch
        if program != 'drums':
            self.events.append((0, ch, 'program', program, 0))
        for cc, value in ((7, vol), (10, pan), (91, reverb), (93, chorus)):
            self.events.append((0, ch, 'cc', cc, value))
        return key

    def note(self, key, beat, beats, p, vel=80, legato=.92, human=True):
        if p is None:
            return
        ch = self.channels[key]
        if human:
            beat += self.rng.uniform(-.008, .012)
            vel = max(1, min(127, int(vel + self.rng.uniform(-5, 5))))
        self.events.append((max(0, beat), ch, 'on', p, vel))
        self.events.append((max(0, beat) + beats * legato, ch, 'off', p, 0))

    def cc(self, key, beat, controller, value):
        self.events.append((beat, self.channels[key], 'cc', controller, int(value)))

    def swell(self, key, start, end, lo, hi, steps=12):
        for i in range(steps + 1):
            self.cc(key, start + (end - start) * i / steps, 11, lo + (hi - lo) * i / steps)

    def melody(self, key, bar, text, vel=84, shift=0, legato=.96, accent=6):
        beat = bar * self.bpb
        for p, beats in line(text):
            on_beat = abs(beat - round(beat)) < .01 and int(round(beat)) % self.bpb == 0
            if p is not None:
                self.note(key, beat, beats, p + shift, vel + (accent if on_beat else 0), legato)
            beat += beats

    def pedal(self, key, bar, changes=1):
        step = self.bpb / changes
        for i in range(changes):
            b = bar * self.bpb + i * step
            self.cc(key, b + .02, 64, 0)
            self.cc(key, b + .08, 64, 127)

    def tempo(self, beat, bpm):
        self.tempo_changes.append((beat, bpm))

    def write(self, path, repeats=1, tail_beats=0):
        total = self.bars * self.bpb
        events = []
        for r in range(repeats):
            for beat, ch, kind, a, b in self.events:
                if r and kind == 'program':
                    continue
                events.append((beat + r * total, ch, kind, a, b))
            for beat, bpm in self.tempo_changes:
                events.append((beat + r * total, 0, 'tempo', bpm, 0))
        events.append((repeats * total + tail_beats, 0, 'cc', 121, 0))
        order = {'off': 0, 'tempo': 1, 'program': 2, 'cc': 3, 'on': 4}
        events.sort(key=lambda e: (e[0], order[e[2]]))
        mid = mido.MidiFile(ticks_per_beat=480)
        track = mido.MidiTrack()
        mid.tracks.append(track)
        track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        now = 0
        for beat, ch, kind, a, b in events:
            tick = int(round(beat * 480))
            dt, now = max(0, tick - now), max(now, tick)
            if kind == 'tempo':
                track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(a), time=dt))
            elif kind == 'program':
                track.append(mido.Message('program_change', channel=ch, program=a, time=dt))
            elif kind == 'cc':
                track.append(mido.Message('control_change', channel=ch, control=a, value=b, time=dt))
            elif kind == 'on':
                track.append(mido.Message('note_on', channel=ch, note=a, velocity=b, time=dt))
            else:
                track.append(mido.Message('note_off', channel=ch, note=a, velocity=0, time=dt))
        mid.save(path)

    def seconds(self):
        total, now, bpm, out = self.bars * self.bpb, 0, self.bpm, 0
        for beat, next_bpm in sorted(self.tempo_changes):
            out += (beat - now) * 60 / bpm
            now, bpm = beat, next_bpm
        return out + (total - now) * 60 / bpm


def render(song, target_db=-19.0):
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        mid, wav = os.path.join(tmp, 's.mid'), os.path.join(tmp, 's.wav')
        song.write(mid, repeats=2 if song.loop else 1, tail_beats=song.bpm / 60 * 5)
        subprocess.run(['fluidsynth', '-ni', '-q', '-F', wav, '-r', str(RATE), '-g', '0.7',
                        '-o', 'synth.reverb.active=1', '-o', 'synth.reverb.room-size=0.78',
                        '-o', 'synth.reverb.damp=0.35', '-o', 'synth.reverb.width=1.0',
                        '-o', 'synth.reverb.level=0.75', '-o', 'synth.chorus.active=1',
                        SF2, mid], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with wave.open(wav) as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(np.float64) / 32768
        n = int(round(song.seconds() * RATE))
        if song.loop:
            # 二周目だけを切り出す。一周目の余韻が頭に重なっているので、そのまま循環する。
            k = int(RATE * .06)
            lead_in = data[n - k:n].copy()
            data = data[n:2 * n].copy()
            ramp = np.linspace(0, 1, k)[:, None]
            data[-k:] = data[-k:] * (1 - ramp) + lead_in * ramp  # 終端を「頭の直前」へつなぐ
        else:
            data = data[:n + RATE * 5]
            fade = np.linspace(1, 0, RATE * 2) ** 2
            data[-len(fade):] *= fade[:, None]
        rms = np.sqrt((data ** 2).mean())
        gain = 10 ** (target_db / 20) / max(rms, 1e-9)
        gain = min(gain, .89 / np.abs(data).max())
        data *= gain
        out_wav = os.path.join(tmp, 'o.wav')
        with wave.open(out_wav, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((data * 32767).astype(np.int16).tobytes())
        out = os.path.join(OUT, song.name + '.ogg')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out_wav, '-c:a', 'libvorbis', '-q:a', '4', out], check=True)
    print(f'{song.name}: {len(data) / RATE:.2f}s  rms {20 * np.log10(np.sqrt((data ** 2).mean())):.1f} dB  peak {np.abs(data).max():.2f}')


# ---------------------------------------------------------------- 伴奏の型

def pad(song, key, bar, symbol, vel=52, octave=3, beats=None):
    _, notes = chord(symbol, octave)
    for p in notes[:4]:
        song.note(key, bar * song.bpb, beats or song.bpb, p, vel, legato=1.0)


def bass(song, key, bar, symbol, vel=70, pattern=(0, 2), beats=1.6, octave=3):
    root, notes = chord(symbol, octave)
    fifth = notes[2] - 12 if len(notes) > 2 else root
    for i, b in enumerate(pattern):
        p = root if i % 2 == 0 else fifth
        song.note(key, bar * song.bpb + b, beats, p, vel)


def arp(song, key, bar, symbol, vel=58, octave=3, step=.5, shape=(0, 1, 2, 1, 3, 2, 1, 2), start=0):
    root, notes = chord(symbol, octave)
    pool = [root + 12] + notes + [notes[0] + 12, notes[1] + 12]
    pool = sorted(set(pool))
    for i, idx in enumerate(shape):
        b = start + i * step
        if b >= song.bpb:
            break
        song.note(key, bar * song.bpb + b, step * 1.8, pool[idx % len(pool)], vel - (0 if i % 2 == 0 else 6), legato=1.0)


def waltz(song, key, bar, symbol, vel=60, octave=3):
    root, notes = chord(symbol, octave)
    song.note(key, bar * 3, 1, root, vel + 8)
    for b in (1, 2):
        for p in notes[-3:]:
            song.note(key, bar * 3 + b, .6, p, vel - 10)


# ---------------------------------------------------------------- 主題「おかえりの灯」

THEME_CHORDS = ['D', 'A/C#', 'Bm', 'D/A', 'G', 'D/F#', 'Em7', 'A7sus4']
THEME_A = [
    'r:1 A4:.5 D5:.5 F#5:1.5 E5:.5', 'E5:1.5 D5:.5 C#5:1 A4:1',
    'r:1 B4:.5 D5:.5 F#5:1.5 E5:.5', 'D5:1.5 C#5:.5 A4:2',
    'r:1 G4:.5 B4:.5 D5:1.5 C#5:.5', 'A4:1.5 F#4:.5 A4:2',
    'G4:1 B4:1 D5:1 E5:1', 'E5:3 r:1',
]
THEME_A_END = THEME_A[:6] + ['G4:1 B4:1 E5:1 D5:1', 'C#5:1 E5:1 D5:2']
THEME_A_END_CHORDS = THEME_CHORDS[:7] + ['A7>D']
BRIDGE_CHORDS = ['G', 'A', 'F#m', 'Bm', 'G', 'D/F#', 'Em7', 'A']
BRIDGE = [
    'B4:1 D5:1 G5:1.5 F#5:.5', 'E5:2 C#5:1 E5:1', 'A4:1 C#5:1 F#5:1.5 E5:.5', 'D5:2 B4:2',
    'B4:1 D5:1 G5:1.5 F#5:.5', 'A5:1.5 F#5:.5 D5:2', 'E5:1 G5:1.5 F#5:.5 E5:1', 'E5:3 r:1',
]


def split(symbol):
    return symbol.split('>') if '>' in symbol else [symbol]


def theme_harmony(song, bar, symbols, harp=None, strings=None, bassline=None, piano=None, vel=0):
    for i, symbol in enumerate(symbols):
        parts = split(symbol)
        span = song.bpb / len(parts)
        for j, part in enumerate(parts):
            offset = j * span
            if harp:
                arp(song, harp, bar + i, part, 54 + vel, 3, shape=(0, 2, 3, 4, 3, 2, 3, 2)[:int(span * 2)], start=offset)
            if strings:
                _, notes = chord(part, 4)
                for p in notes[:3]:
                    song.note(strings, (bar + i) * song.bpb + offset, span, p, 44 + vel, legato=1.02)
            if bassline:
                root, _ = chord(part, 3)
                song.note(bassline, (bar + i) * song.bpb + offset, span, root, 62 + vel, legato=.95)
            if piano:
                root, notes = chord(part, 3)
                seq = [root, notes[0], notes[1], notes[2], notes[1], notes[0]] if span > 2 else [root, notes[1], notes[2]]
                step = span / len(seq) if span <= 2 else .5
                for k, p in enumerate(seq):
                    song.note(piano, (bar + i) * song.bpb + offset + k * step, step * 2, p, 50 + vel - (k % 2) * 5, legato=1.0)


def title():
    s = Song('title', 66, 4, 24)
    box = s.inst('box', 10, 92, 76, 80)
    harp = s.inst('harp', 46, 74, 44, 70)
    strings = s.inst('strings', 48, 70, 64, 85)
    piano = s.inst('piano', 0, 96, 58, 60)
    flute = s.inst('flute', 73, 82, 80, 75)
    low = s.inst('low', 42, 70, 52, 70)
    glock = s.inst('glock', 9, 60, 88, 80)
    # A: オルゴールが主題を置く
    for i, m in enumerate(THEME_A):
        s.melody(box, i, m, 74, shift=12)
    theme_harmony(s, 0, THEME_CHORDS, harp=harp, strings=strings, vel=-6)
    # B: フルートが歌い、ピアノが支える
    for i, m in enumerate(BRIDGE):
        s.melody(flute, 8 + i, m, 76)
        s.pedal(piano, 8 + i)
    theme_harmony(s, 8, BRIDGE_CHORDS, strings=strings, bassline=low, piano=piano)
    s.swell(strings, 32, 60, 70, 112)
    # A': ピアノとフルートで主題
    for i, m in enumerate(THEME_A_END):
        s.melody(piano, 16 + i, m, 88, shift=0)
        s.melody(piano, 16 + i, m, 62, shift=12)
        s.pedal(piano, 16 + i)
        if i in (0, 2, 4):
            s.melody(glock, 16 + i, m, 52, shift=24)
    for i, m in enumerate(['r:4', 'r:2 C#5:1 E5:1', 'r:4', 'r:2 E5:1 F#5:1', 'r:4', 'r:2 D5:1 F#5:1', 'B5:2 A5:2', 'G5:2 F#5:2']):
        s.melody(flute, 16 + i, m, 66)
    theme_harmony(s, 16, THEME_A_END_CHORDS, harp=harp, strings=strings, bassline=low, vel=4)
    s.swell(strings, 64, 88, 112, 124)
    s.swell(strings, 88, 96, 124, 70)
    return s


def tender():
    s = Song('tender', 58, 4, 16)
    piano = s.inst('piano', 0, 100, 60, 70)
    cello = s.inst('cello', 42, 78, 50, 80)
    strings = s.inst('strings', 48, 62, 70, 90)
    for i, m in enumerate(THEME_A):
        s.melody(piano, i, m, 78)
        s.pedal(piano, i)
    theme_harmony(s, 0, THEME_CHORDS, piano=piano, vel=-8)
    for i, m in enumerate(THEME_A_END):
        s.melody(piano, 8 + i, m, 84)
        s.pedal(piano, 8 + i, 2 if i == 7 else 1)
    theme_harmony(s, 8, THEME_A_END_CHORDS, piano=piano, strings=strings, vel=-4)
    for i, m in enumerate(['F#3:4', 'E3:4', 'D3:2 F#3:2', 'A3:4', 'B3:2 D4:2', 'A3:4', 'G3:2 B3:2', 'A3:2 F#3:2']):
        s.melody(cello, 8 + i, m, 62, legato=1.0)
    s.swell(cello, 32, 56, 70, 110)
    s.swell(cello, 56, 64, 110, 60)
    s.swell(strings, 32, 60, 60, 100)
    return s


def ending():
    s = Song('ending', 64, 4, 34, loop=False)
    piano = s.inst('piano', 0, 100, 58, 65)
    strings = s.inst('strings', 48, 76, 64, 88)
    flute = s.inst('flute', 73, 84, 82, 75)
    oboe = s.inst('oboe', 68, 70, 44, 75)
    harp = s.inst('harp', 46, 76, 40, 70)
    low = s.inst('low', 42, 74, 56, 70)
    glock = s.inst('glock', 9, 62, 90, 80)
    horn = s.inst('horn', 60, 58, 64, 85)
    for i, m in enumerate(THEME_A):
        s.melody(piano, i, m, 80)
        s.pedal(piano, i)
    theme_harmony(s, 0, THEME_CHORDS, piano=piano, vel=-6)
    for i, m in enumerate(BRIDGE):
        s.melody(oboe, 8 + i, m, 74)
    theme_harmony(s, 8, BRIDGE_CHORDS, strings=strings, bassline=low, harp=harp)
    s.swell(strings, 32, 62, 70, 118)
    for i, m in enumerate(THEME_A):
        s.melody(flute, 16 + i, m, 84, shift=12)
        s.melody(piano, 16 + i, m, 80)
        s.pedal(piano, 16 + i)
        s.melody(glock, 16 + i, m, 46, shift=24)
    theme_harmony(s, 16, THEME_CHORDS, strings=strings, bassline=low, harp=harp, vel=6)
    for i, symbol in enumerate(THEME_CHORDS):
        _, notes = chord(symbol, 3)
        s.note(horn, (16 + i) * 4, 4, notes[1], 52, legato=1.0)
    for i, m in enumerate(THEME_A_END):
        s.melody(piano, 24 + i, m, 86)
        s.melody(piano, 24 + i, m, 60, shift=12)
        s.melody(strings, 24 + i, m, 64, shift=12, legato=1.0)
        s.pedal(piano, 24 + i, 2 if i == 7 else 1)
    theme_harmony(s, 24, THEME_A_END_CHORDS, strings=strings, bassline=low, harp=harp, vel=8)
    s.tempo(30 * 4, 58)
    s.tempo(31 * 4, 50)
    # コーダ
    for k, name in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6']):
        s.note(harp, 32 * 4 + k * .33, 6, pitch(name), 60 + k, legato=1.0)
    for name in ('D2', 'D3', 'A3', 'F#4', 'D5'):
        s.note(strings, 32 * 4, 8, pitch(name), 50, legato=1.0)
    s.note(glock, 32 * 4 + 3, 4, pitch('D6'), 58)
    s.note(glock, 32 * 4 + 3.5, 4, pitch('A6'), 50)
    s.swell(strings, 128, 136, 110, 30)
    s.tempo(32 * 4, 46)
    return s


def quiet():
    s = Song('quiet', 54, 4, 16)
    piano = s.inst('piano', 0, 100, 60, 85)
    cello = s.inst('cello', 42, 70, 48, 90)
    clar = s.inst('clar', 71, 60, 78, 90)
    chords = ['Bm', 'F#m/A', 'G', 'D/F#', 'Em', 'Bm/D', 'Em7', 'F#sus4>F#']
    mel = ['r:1 F#4:.5 B4:.5 D5:2', 'C#5:3 r:1', 'r:1 G4:.5 B4:.5 D5:2', 'A4:3 r:1',
           'r:1 E4:.5 G4:.5 B4:1.5 A4:.5', 'F#4:3 r:1', 'G4:1 B4:1 E5:2', 'B4:2 A#4:2']
    for rep in range(2):
        for i, m in enumerate(mel):
            bar = rep * 8 + i
            s.melody(piano, bar, m, 70 if rep == 0 else 76, shift=12 if rep else 0)
            s.pedal(piano, bar, 2 if i == 7 else 1)
            for j, part in enumerate(split(chords[i])):
                span = 4 / len(split(chords[i]))
                root, notes = chord(part, 3)
                s.note(piano, bar * 4 + j * span, span, root, 52, legato=1.0)
                s.note(piano, bar * 4 + j * span + (1 if span > 2 else .5), span - 1, notes[1], 44, legato=1.0)
                s.note(piano, bar * 4 + j * span + (2 if span > 2 else 1), span - 2 if span > 2 else 1, notes[2], 42, legato=1.0)
    for i, m in enumerate(['B2:4', 'A2:4', 'G2:4', 'F#2:4', 'E2:4', 'D3:4', 'E3:4', 'F#3:4']):
        s.melody(cello, 8 + i, m, 58, legato=1.0)
    for i, m in enumerate(['r:4', 'r:2 E4:2', 'r:4', 'r:2 F#4:2', 'r:4', 'r:2 D4:2', 'r:4', 'r:4']):
        s.melody(clar, 8 + i, m, 50, legato=1.0)
    s.swell(cello, 32, 56, 60, 100)
    s.swell(cello, 56, 64, 100, 55)
    return s


def village():
    s = Song('village', 92, 3, 32)
    clar = s.inst('clar', 71, 86, 54, 60)
    flute = s.inst('flute', 73, 80, 80, 65)
    guitar = s.inst('guitar', 24, 84, 40, 50)
    pizz = s.inst('pizz', 45, 80, 70, 55)
    accordion = s.inst('accordion', 21, 50, 90, 60)
    glock = s.inst('glock', 9, 54, 96, 75)
    a = ['D4:1 G4:1 B4:1', 'A4:2 F#4:1', 'G4:1 B4:1 E5:1', 'D5:2 B4:1', 'C5:1 E5:1 D5:1', 'B4:2 G4:1', 'A4:1 C5:1 B4:1', 'A4:2 D4:1']
    a_ch = ['G', 'D/F#', 'Em', 'Bm', 'C', 'G/B', 'Am7', 'D7']
    a2 = a[:4] + ['E5:1 D5:1 C5:1', 'D5:2 B4:1', 'C5:1 A4:1 F#4:1', 'G4:3']
    a2_ch = a_ch[:6] + ['Am7', 'G']
    b = ['B4:1 E5:2', 'D5:2 B4:1', 'C5:1 E5:2', 'G5:2 D5:1', 'E5:1 C5:1 A4:1', 'B4:2 G4:1', 'C#5:1 E5:1 G5:1', 'F#5:2 D5:1']
    b_ch = ['Em', 'Bm', 'C', 'G', 'Am', 'Em', 'A7', 'D7']
    sections = [(a, a_ch, clar, 0, False), (a2, a2_ch, clar, 12, True), (b, b_ch, flute, 0, True), (a2, a2_ch, flute, 12, True)]
    for n, (mel, chords, lead, shift, full) in enumerate(sections):
        for i, m in enumerate(mel):
            bar = n * 8 + i
            s.melody(lead, bar, m, 80 if n else 74, shift=shift)
            symbol = chords[i]
            if mel is a2 and i == 6:  # Am7 を二拍、三拍目だけ D7
                root, notes = chord('Am7', 3)
                s.note(guitar, bar * 3, 1, root, 66)
                for p in notes[-3:]:
                    s.note(guitar, bar * 3 + 1, .6, p, 48)
                droot, dnotes = chord('D7', 3)
                for p in dnotes[-3:]:
                    s.note(guitar, bar * 3 + 2, .6, p, 48)
                s.note(pizz, bar * 3, 1, root, 72)
                s.note(pizz, bar * 3 + 2, 1, droot, 70)
                continue
            waltz(s, guitar, bar, symbol, 58 if full else 52)
            s.note(pizz, bar * 3, 1, chord(symbol, 3)[0], 74)
            if full and i % 2 == 1:
                s.note(pizz, bar * 3 + 2, .8, chord(symbol, 3)[1][2] - 12, 60)
            if n == 2:
                _, notes = chord(symbol, 4)
                for p in notes[:3]:
                    s.note(accordion, bar * 3, 3, p, 46, legato=1.0)
            if n == 3 and i in (0, 2, 4):
                s.melody(glock, bar, m, 48, shift=24)
    return s


def journey():
    s = Song('journey', 104, 4, 24)
    flute = s.inst('flute', 73, 84, 84, 65)
    clar = s.inst('clar', 71, 86, 44, 65)
    guitar = s.inst('guitar', 24, 76, 56, 50)
    pizz = s.inst('pizz', 45, 84, 64, 50)
    strings = s.inst('strings', 48, 56, 64, 85)
    drums = s.inst('drums', 'drums', 60, 64, 50)
    a_ch = ['F', 'C/E', 'Dm', 'F/C', 'Bb', 'F/A', 'Gm7', 'C7']
    call = ['C5:.5 F5:.5 A5:1 G5:.5 F5:.5 G5:1', 'E5:1 C5:1 r:2', 'r:4', 'r:2 C5:.5 D5:.5 E5:.5 F5:.5',
            'D5:.5 F5:.5 Bb5:1 A5:.5 G5:.5 F5:1', 'A5:1 F5:1 r:2', 'r:4', 'G5:2 E5:1 r:1']
    answer = ['r:4', 'r:2 G4:.5 A4:.5 Bb4:.5 C5:.5', 'A4:1 F4:.5 A4:.5 D5:1.5 C5:.5', 'A4:2 r:2',
              'r:4', 'r:2 C5:.5 Bb4:.5 A4:.5 G4:.5', 'Bb4:1 G4:.5 Bb4:.5 D5:1.5 C5:.5', 'Bb4:2 C5:1 r:1']
    b_ch = ['Bb', 'C', 'Am', 'Dm', 'Bb', 'C7', 'F', 'F>C7']
    top = ['D5:1 F5:1 Bb5:1.5 A5:.5', 'G5:2 E5:1 G5:1', 'C5:1 E5:1 A5:1.5 G5:.5', 'F5:2 D5:2',
           'D5:1 F5:1 Bb5:1.5 A5:.5', 'G5:1 Bb5:1.5 A5:.5 G5:1', 'A5:1.5 G5:.5 F5:2', 'F5:2 r:2']
    under = ['Bb4:1 D5:1 F5:1.5 F5:.5', 'E5:2 C5:1 E5:1', 'A4:1 C5:1 E5:1.5 E5:.5', 'D5:2 A4:2',
             'Bb4:1 D5:1 F5:1.5 F5:.5', 'E5:1 G5:1.5 F5:.5 E5:1', 'F5:1.5 E5:.5 A4:2', 'A4:2 r:2']
    for i in range(8):
        s.melody(flute, i, call[i], 80)
        s.melody(clar, i, answer[i], 78)
        s.melody(clar, 8 + i, call[i], 82, shift=-12)
        s.melody(flute, 8 + i, answer[i], 76, shift=12)
        s.melody(flute, 16 + i, top[i], 84)
        s.melody(clar, 16 + i, under[i], 74)
    for n, chords in enumerate([a_ch, a_ch, b_ch]):
        for i, symbol in enumerate(chords):
            bar = n * 8 + i
            parts = split(symbol)
            for j, part in enumerate(parts):
                span = 4 / len(parts)
                root, notes = chord(part, 3)
                s.note(pizz, bar * 4 + j * span, 1, root, 78)
                if span > 2:
                    s.note(pizz, bar * 4 + 2, 1, notes[2] - 12 if notes[2] - 12 >= 40 else notes[2], 68)
                pattern = [notes[0], notes[2], notes[1] + 12, notes[2]] * 2
                for k in range(int(span * 2)):
                    s.note(guitar, bar * 4 + j * span + k * .5, .9, pattern[k], 56 - (k % 2) * 8, legato=1.0)
                if n == 2:
                    _, hi = chord(part, 4)
                    for p in hi[:3]:
                        s.note(strings, bar * 4 + j * span, span, p, 44, legato=1.0)
            for beat in range(4):
                s.note(drums, bar * 4 + beat, .2, 83, 34 if beat % 2 else 46)  # そりの鈴
                if n and beat in (1, 3):
                    s.note(drums, bar * 4 + beat, .2, 54, 30)
    return s


def battle():
    s = Song('battle', 138, 4, 32)
    piano = s.inst('piano', 0, 96, 58, 45)
    violin = s.inst('violin', 40, 80, 82, 60)
    flute = s.inst('flute', 73, 80, 44, 60)
    pizz = s.inst('pizz', 45, 88, 70, 45)
    strings = s.inst('strings', 48, 64, 64, 75)
    low = s.inst('low', 32, 96, 60, 30)
    drums = s.inst('drums', 'drums', 78, 64, 35)
    a = ['E5:.5 E5:.5 B5:1 G5:.5 A5:.5 B5:1', 'A5:.5 A5:.5 F#5:1 D5:.5 E5:.5 F#5:1',
         'G5:.5 G5:.5 E5:1 C5:.5 D5:.5 E5:1', 'F#5:1.5 D#5:.5 B4:1 r:1',
         'E5:.5 E5:.5 B5:1 G5:.5 A5:.5 B5:1', 'D6:1 A5:1 F#5:.5 G5:.5 A5:1',
         'G5:1 E5:1 F#5:1 A5:1', 'B5:1 G5:1 E5:2']
    a_ch = ['Em', 'D', 'C', 'B7', 'Em', 'D', 'C>D', 'Em']
    b = ['D5:1 G5:1 B5:1.5 A5:.5', 'A5:1 F#5:1 D5:2', 'E5:1 G5:1 B5:1.5 A5:.5', 'F#5:2 D5:1 F#5:1',
         'E5:1 G5:1 C6:1.5 B5:.5', 'B5:1 G5:1 D5:2', 'C5:1 E5:1 A5:1 G5:1', 'F#5:2 D#5:1 F#5:1']
    b_ch = ['G', 'D/F#', 'Em', 'Bm', 'C', 'G/B', 'Am', 'B7']
    plan = [(a, a_ch, 0), (a, a_ch, 1), (b, b_ch, 2), (a, a_ch, 3)]
    for n, (mel, chords, level) in enumerate(plan):
        for i, m in enumerate(mel):
            bar = n * 8 + i
            if level == 2:
                s.melody(flute, bar, m, 84, legato=.98)
                s.melody(violin, bar, m, 60, shift=-12, legato=1.0)
            else:
                s.melody(piano, bar, m, 88 + level * 3, legato=.8)
                s.melody(piano, bar, m, 64, shift=-12, legato=.8)
                if level:
                    s.melody(violin, bar, m, 70 + level * 4, legato=.85)
                if level == 3:
                    s.melody(flute, bar, m, 66, shift=12, legato=.85)
            parts = split(chords[i])
            for j, part in enumerate(parts):
                span = 4 / len(parts)
                root, notes = chord(part, 3)
                seq = [notes[0], notes[2], notes[0] + 12, notes[2]] * 2
                for k in range(int(span * 2)):
                    if level != 2:
                        s.note(pizz, bar * 4 + j * span + k * .5, .4, seq[k], 62 + (10 if k % 4 == 0 else 0))
                    elif k % 2 == 0:
                        s.note(pizz, bar * 4 + j * span + k * .5, .4, seq[k], 54)
                for q in range(int(span)):
                    s.note(low, bar * 4 + j * span + q, .8, root if q % 2 == 0 else root + 7 if root + 7 < 48 else root, 84 if level else 72)
                if level >= 2:
                    _, hi = chord(part, 4)
                    for p in hi[:3]:
                        s.note(strings, bar * 4 + j * span, span, p, 50 if level == 2 else 44, legato=1.0)
            for beat in range(4):
                base = bar * 4 + beat
                if level != 2:
                    if beat in (0, 2):
                        s.note(drums, base, .2, 36, 78 if level else 60)
                    if beat in (1, 3):
                        s.note(drums, base, .2, 37 if level < 3 else 38, 62 if level < 3 else 58)
                    s.note(drums, base, .1, 42, 44)
                    s.note(drums, base + .5, .1, 42, 30)
                    if level == 3 and beat in (1, 3):
                        s.note(drums, base, .2, 54, 44)
                else:
                    if beat == 0:
                        s.note(drums, base, .2, 36, 56)
                    s.note(drums, base + .5, .1, 70, 30)
                    if beat in (1, 3):
                        s.note(drums, base, .2, 54, 36)
            if i == 7 and level != 2:
                for k in range(4):
                    s.note(drums, bar * 4 + 3 + k * .25, .1, 38, 50 + k * 8)
    s.swell(strings, 64, 92, 80, 118)
    return s


def tension():
    s = Song('tension', 126, 4, 16)
    low = s.inst('low', 48, 96, 54, 60)
    trem = s.inst('trem', 44, 62, 78, 80)
    piano = s.inst('piano', 0, 90, 60, 55)
    clar = s.inst('clar', 71, 80, 44, 70)
    oboe = s.inst('oboe', 68, 70, 84, 70)
    horn = s.inst('horn', 60, 62, 64, 85)
    drums = s.inst('drums', 'drums', 80, 64, 55)
    timp = s.inst('timp', 47, 84, 64, 65)
    chords = ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'A7sus4', 'A7']
    mel = ['r:2 A4:.5 D5:.5 F5:1', 'E5:1.5 D5:.5 A4:2', 'r:2 Bb4:.5 D5:.5 F5:1', 'G5:1.5 F5:.5 D5:2',
           'r:2 G4:.5 Bb4:.5 D5:1', 'C5:1.5 Bb4:.5 G4:2', 'A4:1 D5:1 E5:1 G5:1', 'E5:2 C#5:2']
    for rep in range(2):
        for i, symbol in enumerate(chords):
            bar = rep * 8 + i
            root, notes = chord(symbol, 3)
            seq = [root, root, notes[2] - 12, root, root, notes[1], notes[2] - 12, root]
            for k, p in enumerate(seq):
                s.note(low, bar * 4 + k * .5, .35, p, 76 + (12 if k in (0, 4) else 0) + rep * 4)
            _, hi = chord(symbol, 4)
            for p in (hi[0] + 12, hi[1] + 12):
                s.note(trem, bar * 4, 4, p, 46 + rep * 8, legato=1.0)
            s.melody(clar, bar, mel[i], 78)
            if rep:
                s.melody(oboe, bar, mel[i], 70, shift=12)
                s.note(horn, bar * 4, 4, notes[0], 54, legato=1.0)
                s.note(horn, bar * 4, 4, notes[2], 50, legato=1.0)
            if i % 2 == 0:
                s.note(timp, bar * 4, 1.5, root, 84 if rep else 70)
                s.note(piano, bar * 4, 3, root - 12, 80)
                s.note(piano, bar * 4, 3, root, 70)
            if i == 7:
                for k in range(8):
                    s.note(timp, bar * 4 + k * .5, .4, pitch('A2'), 50 + k * 6)
            for beat in (1, 3):
                s.note(drums, bar * 4 + beat, .2, 37, 40 + rep * 12)
            if rep:
                for k in range(8):
                    s.note(drums, bar * 4 + k * .5, .1, 70, 26 + (8 if k % 2 == 0 else 0))
    s.swell(trem, 0, 30, 60, 110)
    s.swell(trem, 32, 62, 80, 124)
    return s


def festival():
    s = Song('festival', 162, 3, 48)
    violin = s.inst('violin', 40, 88, 78, 55)
    accordion = s.inst('accordion', 21, 70, 46, 50)
    guitar = s.inst('guitar', 25, 76, 34, 40)
    low = s.inst('low', 32, 96, 64, 30)
    flute = s.inst('flute', 73, 80, 92, 60)
    drums = s.inst('drums', 'drums', 78, 64, 40)

    def jig(notes):
        return ' '.join(n if ':' in n else n + ':.5' for n in notes.split())
    a = [jig('D5 G5 G5 B5 G5 B5'), jig('A5 F#5 A5 D5 F#5 A5'), jig('G5 E5 G5 B5 G5 E5'), jig('E5 C5 E5 F#5 D5 F#5'),
         jig('D5 G5 G5 B5 G5 B5'), jig('A5 F#5 A5 D6 A5 F#5'), jig('G5 E5 C5 A5 F#5 D5'), jig('G5:1 B5 G5:1.5')]
    a_ch = ['G', 'D', 'Em', 'C>D', 'G', 'D', 'C>D', 'G']
    b = [jig('B5:1 E5 G5 F#5 E5'), jig('F#5:1 B4 D5 E5 F#5'), jig('E5:1 C5 E5 G5 E5'), jig('F#5:1 D5 A5:1.5'),
         jig('B5:1 E5 G5 F#5 E5'), jig('D5:1 F#5 B5:1.5'), jig('C6 B5 A5 G5 E5 C5'), jig('D5 F#5 A5 C6:1 A5')]
    b_ch = ['Em', 'Bm', 'C', 'D', 'Em', 'Bm', 'C', 'D7']
    plan = [(a, a_ch, violin, 0), (a, a_ch, violin, 1), (b, b_ch, accordion, 1), (a, a_ch, violin, 2), (b, b_ch, flute, 2), (a, a_ch, violin, 3)]
    for n, (mel, chords, lead, level) in enumerate(plan):
        for i, m in enumerate(mel):
            bar = n * 8 + i
            s.melody(lead, bar, m, 86, legato=.85, shift=12 if lead == flute else 0)
            if level >= 2 and lead == violin:
                s.melody(flute, bar, m, 64, legato=.85, shift=12)
            if level == 3:
                s.melody(accordion, bar, m, 60, legato=.85, shift=-12)
            parts = split(chords[i])
            for j, part in enumerate(parts):
                span = 3 / len(parts)
                root, notes = chord(part, 3)
                s.note(low, bar * 3 + j * span, span * .8, root, 88)
                s.note(guitar, bar * 3 + j * span, .5, root + 12, 66)
                for p in notes[-3:]:
                    s.note(guitar, bar * 3 + j * span + 1, .4, p + 12 if p < 55 else p, 54)
                if len(parts) == 1:
                    s.note(low, bar * 3 + 1.5, 1, notes[2] - 12, 78)
                    s.note(guitar, bar * 3 + 1.5, .5, root + 12, 60)
                    for p in notes[-3:]:
                        s.note(guitar, bar * 3 + 2.5, .4, p + 12 if p < 55 else p, 52)
                if lead != accordion and level:
                    _, hi = chord(part, 4)
                    for p in hi[:3]:
                        s.note(accordion, bar * 3 + j * span, span * .9, p, 44, legato=.9)
            s.note(drums, bar * 3, .2, 54, 62)
            s.note(drums, bar * 3 + 1.5, .2, 54, 50)
            if level:
                for k in range(6):
                    s.note(drums, bar * 3 + k * .5, .1, 70, 30 + (10 if k % 3 == 0 else 0))
                s.note(drums, bar * 3, .3, 41, 60)
            if level >= 2:
                s.note(drums, bar * 3 + 1, .2, 39, 44)
                s.note(drums, bar * 3 + 2.5, .2, 39, 40)
    return s


def jingle_lit():
    s = Song('jingle-lit', 80, 4, 2, loop=False)
    harp = s.inst('harp', 46, 96, 50, 80)
    strings = s.inst('strings', 48, 80, 64, 90)
    glock = s.inst('glock', 9, 76, 84, 85)
    for k, name in enumerate(['D3', 'A3', 'D4', 'E4', 'F#4', 'A4', 'D5', 'E5', 'F#5', 'A5', 'D6']):
        s.note(harp, k * .2, 5, pitch(name), 62 + k * 3, legato=1.0)
    for name in ('D3', 'A3', 'F#4', 'A4', 'D5'):
        s.note(strings, 1.8, 5.5, pitch(name), 62, legato=1.0)
    s.swell(strings, 1.8, 4, 60, 120)
    s.swell(strings, 4, 7.5, 120, 20)
    for k, name in enumerate(['A5', 'D6', 'F#6', 'E6']):
        s.note(glock, 2.2 + k * .35, 3, pitch(name), 70)
    return s


def jingle_night():
    s = Song('jingle-night', 60, 4, 3, loop=False)
    box = s.inst('box', 10, 100, 64, 90)
    harp = s.inst('harp', 46, 70, 50, 80)
    s.melody(box, 0, 'G5:1 B5:1 E6:1 D6:1', 76)
    s.melody(box, 1, 'C#6:1 E6:1 D6:2', 72)
    for k, name in enumerate(['E3', 'B3', 'G4']):
        s.note(harp, k * .08, 4, pitch(name), 54, legato=1.0)
    for k, name in enumerate(['A2', 'G3', 'C#4']):
        s.note(harp, 4 + k * .08, 2, pitch(name), 52, legato=1.0)
    for k, name in enumerate(['D3', 'A3', 'F#4', 'D5']):
        s.note(harp, 6 + k * .12, 5, pitch(name), 56, legato=1.0)
    s.tempo(6, 50)
    return s


def clashes(song):
    """半音でぶつかる音が強拍に長く残っていないかを調べる（作曲ミスの検出用）。"""
    on, sounding = {}, []
    for beat, ch, kind, a, b in sorted(song.events, key=lambda e: e[0]):
        if ch == 9 or kind not in ('on', 'off'):
            continue
        if kind == 'on':
            on[(ch, a)] = beat
        elif (ch, a) in on:
            sounding.append((on.pop((ch, a)), beat, a, ch))
    found = []
    for i, (s1, e1, p1, c1) in enumerate(sounding):
        for s2, e2, p2, c2 in sounding[i + 1:]:
            if s2 >= e1:
                continue
            overlap = min(e1, e2) - max(s1, s2)
            if overlap >= .9 and (p1 - p2) % 12 in (1, 11):
                found.append((round(max(s1, s2), 2), p1, p2))
    return sorted(set(found))


SONGS = {f.__name__.replace('_', '-'): f for f in (title, tender, ending, quiet, village, journey, battle, tension, festival, jingle_lit, jingle_night)}
LEVELS = {'battle': -17.5, 'festival': -18, 'tension': -18.5, 'quiet': -22, 'tender': -20.5, 'jingle-lit': -18, 'jingle-night': -20}

if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['--check']:
        for name, make in SONGS.items():
            song = make()
            print(name, f'{song.seconds():.1f}s', clashes(song)[:12])
        sys.exit()
    for name in (args or SONGS):
        render(SONGS[name](), LEVELS.get(name, -19.0))
