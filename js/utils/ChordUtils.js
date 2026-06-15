const ChordUtils = (function() {
    'use strict';

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    const KEY_TRANSPOSE_MAP = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const MAJOR_SCALE_NOTES = {
        'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
        'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
        'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
        'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
    };

    const CHORD_TYPES = {
        '': { name: '大三', intervals: [0, 4, 7] },
        'm': { name: '小三', intervals: [0, 3, 7] },
        'M': { name: '大三', intervals: [0, 4, 7] },
        'maj': { name: '大三', intervals: [0, 4, 7] },
        'min': { name: '小三', intervals: [0, 3, 7] },
        '-': { name: '小三', intervals: [0, 3, 7] },
        'dim': { name: '减三', intervals: [0, 3, 6] },
        'aug': { name: '增三', intervals: [0, 4, 8] },
        '+': { name: '增三', intervals: [0, 4, 8] },
        '7': { name: '属七', intervals: [0, 4, 7, 10] },
        'dom7': { name: '属七', intervals: [0, 4, 7, 10] },
        'maj7': { name: '大七', intervals: [0, 4, 7, 11] },
        'M7': { name: '大七', intervals: [0, 4, 7, 11] },
        'min7': { name: '小七', intervals: [0, 3, 7, 10] },
        'm7': { name: '小七', intervals: [0, 3, 7, 10] },
        '-7': { name: '小七', intervals: [0, 3, 7, 10] },
        'dim7': { name: '减七', intervals: [0, 3, 6, 9] },
        'm7b5': { name: '半减七', intervals: [0, 3, 6, 10] },
        'mM7': { name: '小大七', intervals: [0, 3, 7, 11] },
        'aug7': { name: '增七', intervals: [0, 4, 8, 10] },
        '6': { name: '六', intervals: [0, 4, 7, 9] },
        'm6': { name: '小六', intervals: [0, 3, 7, 9] },
        'sus4': { name: '挂四', intervals: [0, 5, 7] },
        'sus2': { name: '挂二', intervals: [0, 2, 7] },
        'add9': { name: '加九', intervals: [0, 4, 7, 14] },
        '9': { name: '九', intervals: [0, 4, 7, 10, 14] },
        'maj9': { name: '大九', intervals: [0, 4, 7, 11, 14] },
        'm9': { name: '小九', intervals: [0, 3, 7, 10, 14] },
        '11': { name: '十一', intervals: [0, 4, 7, 10, 14, 17] },
        '13': { name: '十三', intervals: [0, 4, 7, 10, 14, 17, 21] },
        'power': { name: '强力', intervals: [0, 7] },
        '5': { name: '强力', intervals: [0, 7] }
    };

    const DEFAULT_CHORD_LIBRARY = [
        { id: 'c_major', name: 'C', root: 'C', type: '', display: 'C', fingering: [0, 3, 2, 0, 1, 0], description: 'C大三和弦' },
        { id: 'd_major', name: 'D', root: 'D', type: '', display: 'D', fingering: [-1, -1, 0, 2, 3, 2], description: 'D大三和弦' },
        { id: 'e_major', name: 'E', root: 'E', type: '', display: 'E', fingering: [0, 2, 2, 1, 0, 0], description: 'E大三和弦' },
        { id: 'f_major', name: 'F', root: 'F', type: '', display: 'F', fingering: [1, 3, 3, 2, 1, 1], description: 'F大三和弦（大横按）' },
        { id: 'g_major', name: 'G', root: 'G', type: '', display: 'G', fingering: [3, 2, 0, 0, 0, 3], description: 'G大三和弦' },
        { id: 'a_major', name: 'A', root: 'A', type: '', display: 'A', fingering: [-1, 0, 2, 2, 2, 0], description: 'A大三和弦' },
        { id: 'b_major', name: 'B', root: 'B', type: '', display: 'B', fingering: [-1, 2, 4, 4, 4, 2], description: 'B大三和弦' },
        { id: 'c_minor', name: 'Cm', root: 'C', type: 'm', display: 'Cm', fingering: [-1, 3, 5, 5, 4, 3], description: 'C小三和弦' },
        { id: 'd_minor', name: 'Dm', root: 'D', type: 'm', display: 'Dm', fingering: [-1, -1, 0, 2, 3, 1], description: 'D小三和弦' },
        { id: 'e_minor', name: 'Em', root: 'E', type: 'm', display: 'Em', fingering: [0, 2, 2, 0, 0, 0], description: 'E小三和弦' },
        { id: 'f_minor', name: 'Fm', root: 'F', type: 'm', display: 'Fm', fingering: [1, 3, 3, 1, 1, 1], description: 'F小三和弦' },
        { id: 'g_minor', name: 'Gm', root: 'G', type: 'm', display: 'Gm', fingering: [3, 5, 5, 3, 3, 3], description: 'G小三和弦' },
        { id: 'a_minor', name: 'Am', root: 'A', type: 'm', display: 'Am', fingering: [-1, 0, 2, 2, 1, 0], description: 'A小三和弦' },
        { id: 'b_minor', name: 'Bm', root: 'B', type: 'm', display: 'Bm', fingering: [-1, 2, 4, 4, 3, 2], description: 'B小三和弦' },
        { id: 'g_seven', name: 'G7', root: 'G', type: '7', display: 'G7', fingering: [3, 2, 0, 0, 0, 1], description: 'G七和弦' },
        { id: 'c_seven', name: 'C7', root: 'C', type: '7', display: 'C7', fingering: [-1, 3, 2, 3, 1, 0], description: 'C七和弦' },
        { id: 'd_seven', name: 'D7', root: 'D', type: '7', display: 'D7', fingering: [-1, -1, 0, 2, 1, 2], description: 'D七和弦' },
        { id: 'e_seven', name: 'E7', root: 'E', type: '7', display: 'E7', fingering: [0, 2, 0, 1, 0, 0], description: 'E七和弦' },
        { id: 'a_seven', name: 'A7', root: 'A', type: '7', display: 'A7', fingering: [-1, 0, 2, 0, 2, 0], description: 'A七和弦' },
        { id: 'b_seven', name: 'B7', root: 'B', type: '7', display: 'B7', fingering: [-1, 2, 1, 2, 0, 2], description: 'B七和弦' },
        { id: 'c_maj7', name: 'Cmaj7', root: 'C', type: 'maj7', display: 'Cmaj7', fingering: [-1, 3, 2, 0, 0, 0], description: 'C大七和弦' },
        { id: 'g_maj7', name: 'Gmaj7', root: 'G', type: 'maj7', display: 'Gmaj7', fingering: [3, 2, 0, 0, 0, 2], description: 'G大七和弦' },
        { id: 'd_min7', name: 'Dm7', root: 'D', type: 'm7', display: 'Dm7', fingering: [-1, -1, 0, 2, 1, 1], description: 'D小七和弦' },
        { id: 'e_min7', name: 'Em7', root: 'E', type: 'm7', display: 'Em7', fingering: [0, 2, 0, 0, 0, 0], description: 'E小七和弦' },
        { id: 'a_min7', name: 'Am7', root: 'A', type: 'm7', display: 'Am7', fingering: [-1, 0, 2, 0, 1, 0], description: 'A小七和弦' }
    ];

    function generateChordId() {
        return 'chord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    function parseChordName(name) {
        const match = name.match(/^([A-G][#b]?)(.*)$/);
        if (!match) {
            return { root: 'C', type: '', bass: null, display: name };
        }

        let root = match[1];
        let type = match[2] || '';
        let bass = null;

        const bassMatch = type.match(/^(.*)\/([A-G][#b]?)$/);
        if (bassMatch) {
            type = bassMatch[1];
            bass = bassMatch[2];
        }

        if (!CHORD_TYPES[type]) {
            type = '';
        }

        return {
            root,
            type,
            bass,
            display: name
        };
    }

    function buildChordName(root, type, bass) {
        let name = root;
        if (type) name += type;
        if (bass) name += '/' + bass;
        return name;
    }

    function getNoteSemitone(note) {
        const idx = KEY_TRANSPOSE_MAP[note];
        return idx !== undefined ? idx : 0;
    }

    function getNoteName(semitone, preferFlat = false) {
        const names = preferFlat ? NOTE_NAMES_FLAT : NOTE_NAMES;
        return names[((semitone % 12) + 12) % 12];
    }

    function transposeNote(note, semitones, preferFlat = false) {
        const current = getNoteSemitone(note);
        const newSemitone = ((current + semitones) % 12 + 12) % 12;
        return getNoteName(newSemitone, preferFlat);
    }

    function getKeySemitone(key) {
        return KEY_TRANSPOSE_MAP[key] || 0;
    }

    function transposeChord(chord, fromKey, toKey) {
        const fromSemitone = getKeySemitone(fromKey);
        const toSemitone = getKeySemitone(toKey);
        const delta = toSemitone - fromSemitone;

        if (delta === 0) {
            return { ...chord };
        }

        const preferFlat = ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(toKey);

        const newRoot = transposeNote(chord.root, delta, preferFlat);
        const newBass = chord.bass ? transposeNote(chord.bass, delta, preferFlat) : null;
        const newDisplay = buildChordName(newRoot, chord.type, newBass);

        return {
            ...chord,
            root: newRoot,
            bass: newBass,
            display: newDisplay,
            name: newDisplay
        };
    }

    function getChordNotes(chord) {
        const rootSemitone = getNoteSemitone(chord.root);
        const typeInfo = CHORD_TYPES[chord.type] || CHORD_TYPES[''];
        const intervals = typeInfo.intervals;

        const notes = intervals.map(interval => {
            const semitone = (rootSemitone + interval) % 12;
            return getNoteName(semitone);
        });

        if (chord.bass) {
            notes.unshift(chord.bass);
        }

        return notes;
    }

    function getChordTypeName(type) {
        const typeInfo = CHORD_TYPES[type] || CHORD_TYPES[''];
        return typeInfo.name;
    }

    function getAvailableChordTypes() {
        return Object.entries(CHORD_TYPES).map(([suffix, info]) => ({
            suffix,
            name: info.name,
            intervals: info.intervals
        })).filter(t => t.suffix !== 'M' && t.suffix !== 'maj' && t.suffix !== 'min' && t.suffix !== '-');
    }

    function getDefaultChordLibrary() {
        return JSON.parse(JSON.stringify(DEFAULT_CHORD_LIBRARY));
    }

    function loadChordLibrary() {
        try {
            const saved = localStorage.getItem('chordLibrary');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('加载和弦库失败:', e);
        }
        return getDefaultChordLibrary();
    }

    function saveChordLibrary(library) {
        try {
            localStorage.setItem('chordLibrary', JSON.stringify(library));
            return true;
        } catch (e) {
            console.warn('保存和弦库失败:', e);
            return false;
        }
    }

    function drawFingeringDiagram(ctx, chord, x, y, width, height, options = {}) {
        const cfg = {
            stringCount: 6,
            fretCount: 5,
            startFret: chord.startFret || 1,
            dotRadius: 5,
            lineColor: options.lineColor || '#333',
            dotColor: options.dotColor || '#333',
            textColor: options.textColor || '#333',
            openColor: options.openColor || '#43a047',
            mutedColor: options.mutedColor || '#e53935',
            fontSize: options.fontSize || 12,
            showName: options.showName !== false,
            showFretNumbers: options.showFretNumbers !== false,
            ...options
        };

        const padding = 10;
        const topPadding = cfg.showName ? 25 : 10;
        const leftPadding = 15;
        const rightPadding = 10;
        const bottomPadding = 15;

        const innerWidth = width - leftPadding - rightPadding;
        const innerHeight = height - topPadding - bottomPadding;

        const stringSpacing = innerWidth / (cfg.stringCount - 1);
        const fretSpacing = innerHeight / cfg.fretCount;

        const stringStartY = y + topPadding;
        const stringEndY = y + topPadding + innerHeight;
        const fretStartX = x + leftPadding;
        const fretEndX = x + leftPadding + innerWidth;

        ctx.save();

        if (cfg.showName) {
            ctx.fillStyle = cfg.textColor;
            ctx.font = `bold ${cfg.fontSize + 4}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(chord.display || chord.name, x + width / 2, y + 12);
        }

        ctx.strokeStyle = cfg.lineColor;
        ctx.lineWidth = 1;

        for (let s = 0; s < cfg.stringCount; s++) {
            const sx = fretStartX + s * stringSpacing;
            ctx.beginPath();
            ctx.moveTo(sx, stringStartY);
            ctx.lineTo(sx, stringEndY);
            ctx.stroke();
        }

        ctx.lineWidth = cfg.startFret === 1 ? 3 : 1;
        for (let f = 0; f <= cfg.fretCount; f++) {
            const fy = stringStartY + f * fretSpacing;
            ctx.beginPath();
            ctx.moveTo(fretStartX, fy);
            ctx.lineTo(fretEndX, fy);
            ctx.stroke();
        }

        if (cfg.showFretNumbers && cfg.startFret > 1) {
            ctx.fillStyle = cfg.textColor;
            ctx.font = `${cfg.fontSize - 2}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(cfg.startFret + 'fr', x + leftPadding - 3, stringStartY + fretSpacing / 2);
        }

        const fingering = chord.fingering || [];
        for (let s = 0; s < cfg.stringCount; s++) {
            const sx = fretStartX + s * stringSpacing;
            const finger = fingering[s];

            if (finger === -1) {
                ctx.strokeStyle = cfg.mutedColor;
                ctx.lineWidth = 2;
                const size = 6;
                ctx.beginPath();
                ctx.moveTo(sx - size, stringStartY - 12);
                ctx.lineTo(sx + size, stringStartY - 12);
                ctx.moveTo(sx, stringStartY - 12 - size);
                ctx.lineTo(sx, stringStartY - 12 + size);
                ctx.stroke();
            } else if (finger === 0) {
                ctx.strokeStyle = cfg.openColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, stringStartY - 12, 5, 0, Math.PI * 2);
                ctx.stroke();
            } else if (finger > 0) {
                const fret = finger - (cfg.startFret - 1);
                if (fret >= 1 && fret <= cfg.fretCount) {
                    const dotY = stringStartY + (fret - 0.5) * fretSpacing;
                    ctx.fillStyle = cfg.dotColor;
                    ctx.beginPath();
                    ctx.arc(sx, dotY, cfg.dotRadius, 0, Math.PI * 2);
                    ctx.fill();

                    if (options.showFingerNumbers !== false) {
                        ctx.fillStyle = '#fff';
                        ctx.font = `bold ${cfg.fontSize - 2}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(finger.toString(), sx, dotY);
                    }
                }
            }
        }

        if (chord.barre && chord.barre.fret && chord.barre.fromString && chord.barre.toString) {
            const fret = chord.barre.fret - (cfg.startFret - 1);
            if (fret >= 1 && fret <= cfg.fretCount) {
                const dotY = stringStartY + (fret - 0.5) * fretSpacing;
                const fromX = fretStartX + chord.barre.fromString * stringSpacing;
                const toX = fretStartX + chord.barre.toString * stringSpacing;

                ctx.fillStyle = cfg.dotColor;
                ctx.beginPath();
                ctx.arc(fromX, dotY, cfg.dotRadius, 0, Math.PI * 2);
                ctx.arc(toX, dotY, cfg.dotRadius, 0, Math.PI * 2);
                ctx.fillRect(fromX, dotY - cfg.dotRadius, toX - fromX, cfg.dotRadius * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    return {
        NOTE_NAMES,
        NOTE_NAMES_FLAT,
        CHORD_TYPES,
        DEFAULT_CHORD_LIBRARY,
        generateChordId,
        parseChordName,
        buildChordName,
        getNoteSemitone,
        getNoteName,
        transposeNote,
        getKeySemitone,
        transposeChord,
        getChordNotes,
        getChordTypeName,
        getAvailableChordTypes,
        getDefaultChordLibrary,
        loadChordLibrary,
        saveChordLibrary,
        drawFingeringDiagram
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChordUtils;
}
