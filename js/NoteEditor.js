class NoteEditor {
    constructor(scoreRenderer) {
        this.scoreRenderer = scoreRenderer;
        this.notes = [];
        this.barLines = [];
        this.chords = [];
        this.selectedNoteId = null;
        this.selectedBarLineId = null;
        this.selectedChordId = null;
        this.currentChordTool = null;
        this.chordMode = false;

        this.currentTool = {
            pitch: 1,
            octave: 0,
            duration: 1,
            dotted: false,
            tie: false
        };

        this.listeners = {
            notesChanged: [],
            barLinesChanged: [],
            chordsChanged: [],
            selectionChanged: [],
            noteAdded: [],
            noteDeleted: [],
            chordAdded: [],
            chordDeleted: []
        };

        this._initSampleData();
        this._bindCanvasEvents();
        this._bindKeyboardEvents();
        this._syncToRenderer();
    }

    _initSampleData() {
        const createNote = (pitch, octave, duration, dotted = false, tie = false) => ({
            id: NoteUtils.generateNoteId(),
            pitch,
            octave,
            duration: NoteUtils.getActualDuration(duration, dotted),
            dotted,
            tie
        });

        this.notes = [
            createNote(5, 0, 1),
            createNote(3, 0, 1),
            createNote(5, 0, 1),
            createNote(6, 0, 1),
            createNote(5, 0, 1, false, true),
            createNote(5, 0, 1),
            createNote(3, 0, 1),
            createNote(2, 0, 1),
            createNote(1, 0, 1),
            createNote(2, 0, 1),
            createNote(3, 0, 1),
            createNote(5, 0, 2),
            createNote(6, 0, 1),
            createNote(5, 0, 1, false, true),
            createNote(5, 0, 0.5),
            createNote(3, 0, 0.5),
            createNote(2, 0, 1),
            createNote(1, -1, 1),
            createNote(2, 0, 1),
            createNote(1, 0, 2)
        ];

        this.barLines = [
            { id: NoteUtils.generateBarLineId(), position: 4, type: 'single' },
            { id: NoteUtils.generateBarLineId(), position: 8, type: 'single' },
            { id: NoteUtils.generateBarLineId(), position: 12, type: 'single' },
            { id: NoteUtils.generateBarLineId(), position: 16, type: 'double' }
        ];

        const firstNoteId = this.notes[0].id;
        const fifthNoteId = this.notes[4].id;
        const ninthNoteId = this.notes[8].id;
        const thirteenthNoteId = this.notes[12].id;

        this.chords = [
            Chord.fromLibraryItem ? Chord.fromLibraryItem({
                id: ChordUtils.generateChordId(),
                name: 'G',
                root: 'G',
                type: '',
                display: 'G',
                fingering: [3, 2, 0, 0, 0, 3],
                description: 'G大三和弦'
            }, { position: 0, attachedTo: firstNoteId }) : new Chord({
                id: ChordUtils.generateChordId(),
                name: 'G',
                root: 'G',
                type: '',
                display: 'G',
                position: 0,
                attachedTo: firstNoteId,
                fingering: [3, 2, 0, 0, 0, 3],
                description: 'G大三和弦'
            }),
            Chord.fromLibraryItem ? Chord.fromLibraryItem({
                id: ChordUtils.generateChordId(),
                name: 'Em',
                root: 'E',
                type: 'm',
                display: 'Em',
                fingering: [0, 2, 2, 0, 0, 0],
                description: 'E小三和弦'
            }, { position: 4, attachedTo: fifthNoteId }) : new Chord({
                id: ChordUtils.generateChordId(),
                name: 'Em',
                root: 'E',
                type: 'm',
                display: 'Em',
                position: 4,
                attachedTo: fifthNoteId,
                fingering: [0, 2, 2, 0, 0, 0],
                description: 'E小三和弦'
            }),
            Chord.fromLibraryItem ? Chord.fromLibraryItem({
                id: ChordUtils.generateChordId(),
                name: 'C',
                root: 'C',
                type: '',
                display: 'C',
                fingering: [0, 3, 2, 0, 1, 0],
                description: 'C大三和弦'
            }, { position: 8, attachedTo: ninthNoteId }) : new Chord({
                id: ChordUtils.generateChordId(),
                name: 'C',
                root: 'C',
                type: '',
                display: 'C',
                position: 8,
                attachedTo: ninthNoteId,
                fingering: [0, 3, 2, 0, 1, 0],
                description: 'C大三和弦'
            }),
            Chord.fromLibraryItem ? Chord.fromLibraryItem({
                id: ChordUtils.generateChordId(),
                name: 'D7',
                root: 'D',
                type: '7',
                display: 'D7',
                fingering: [-1, -1, 0, 2, 1, 2],
                description: 'D七和弦'
            }, { position: 12, attachedTo: thirteenthNoteId }) : new Chord({
                id: ChordUtils.generateChordId(),
                name: 'D7',
                root: 'D',
                type: '7',
                display: 'D7',
                position: 12,
                attachedTo: thirteenthNoteId,
                fingering: [-1, -1, 0, 2, 1, 2],
                description: 'D七和弦'
            })
        ];
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    _emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    _syncToRenderer() {
        this.scoreRenderer.setData(this.notes, this.barLines, this.chords);
    }

    _bindCanvasEvents() {
        const canvas = this.scoreRenderer.canvas;
        let isDragging = false;
        let dragNoteId = null;
        let dragStartIndex = -1;
        let isChordDragging = false;
        let dragChordId = null;

        const getCanvasPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
            const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
            return { x, y };
        };

        canvas.addEventListener('mousedown', (e) => {
            const pos = getCanvasPos(e);
            const clickedChord = this.scoreRenderer.getChordAt(pos.x, pos.y);
            const clickedNote = this.scoreRenderer.getNoteAt(pos.x, pos.y);
            const clickedBarLine = this.scoreRenderer.getBarLineAt(pos.x, pos.y);

            if (clickedChord) {
                this.setSelectedChord(clickedChord.id);
                isChordDragging = true;
                dragChordId = clickedChord.id;
            } else if (clickedNote) {
                this.setSelectedNote(clickedNote.id);
                isDragging = true;
                dragNoteId = clickedNote.id;
                dragStartIndex = this.notes.findIndex(n => n.id === dragNoteId);
            } else if (clickedBarLine) {
                this.setSelectedBarLine(clickedBarLine.id);
            } else if (this.chordMode && this.currentChordTool) {
                const insertPos = this.scoreRenderer.getChordInsertPosition(pos.x);
                this.addChord(insertPos.position, insertPos.attachedNoteId);
            } else {
                const insertPos = this.scoreRenderer.getInsertPosition(pos.x);
                this.addNote(insertPos.index);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const pos = getCanvasPos(e);

            if (isDragging && dragNoteId) {
                const currentIndex = this.notes.findIndex(n => n.id === dragNoteId);
                if (currentIndex < 0) return;

                const insertPos = this.scoreRenderer.getInsertPosition(pos.x);
                if (insertPos.index !== currentIndex && insertPos.index !== currentIndex + 1) {
                    const [note] = this.notes.splice(currentIndex, 1);
                    const newIndex = insertPos.index > currentIndex ? insertPos.index - 1 : insertPos.index;
                    this.notes.splice(Math.max(0, newIndex), 0, note);
                    this._syncToRenderer();
                    this._emit('notesChanged', this.notes);
                }
            }

            if (isChordDragging && dragChordId) {
                const chordIndex = this.chords.findIndex(c => c.id === dragChordId);
                if (chordIndex < 0) return;

                const insertPos = this.scoreRenderer.getChordInsertPosition(pos.x);
                const chord = this.chords[chordIndex];

                if (insertPos.attachedNoteId !== chord.attachedTo || Math.abs(insertPos.position - chord.position) > 0.1) {
                    chord.position = insertPos.position;
                    chord.attachedTo = insertPos.attachedNoteId;
                    this._syncToRenderer();
                    this._emit('chordsChanged', this.chords);
                }
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            dragNoteId = null;
            isChordDragging = false;
            dragChordId = null;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            dragNoteId = null;
            isChordDragging = false;
            dragChordId = null;
        });

        canvas.addEventListener('dblclick', (e) => {
            const pos = getCanvasPos(e);
            const clickedChord = this.scoreRenderer.getChordAt(pos.x, pos.y);
            const clickedNote = this.scoreRenderer.getNoteAt(pos.x, pos.y);

            if (clickedChord) {
                this.setSelectedChord(clickedChord.id);
                this._emit('chordAdded', clickedChord);
            } else if (clickedNote) {
                this.setSelectedNote(clickedNote.id);
                this._emit('noteAdded', clickedNote);
            }
        });
    }

    _bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedNoteId) {
                    this.deleteSelectedNote();
                    e.preventDefault();
                } else if (this.selectedBarLineId) {
                    this.deleteSelectedBarLine();
                    e.preventDefault();
                } else if (this.selectedChordId) {
                    this.deleteSelectedChord();
                    e.preventDefault();
                }
            }

            if (e.key >= '1' && e.key <= '7') {
                this.setTool('pitch', parseInt(e.key));
            }

            if (e.key === '.') {
                this.setTool('dotted', !this.currentTool.dotted);
            }

            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }

    setTool(prop, value) {
        this.currentTool[prop] = value;
    }

    getTool() {
        return { ...this.currentTool };
    }

    setChordTool(chordInfo) {
        this.currentChordTool = chordInfo;
        this.chordMode = chordInfo !== null;
    }

    setChordMode(enabled) {
        this.chordMode = enabled;
        if (!enabled) {
            this.currentChordTool = null;
        }
    }

    addChord(position, attachedNoteId, chordInfo) {
        const info = chordInfo || this.currentChordTool;
        if (!info) return null;

        const newChord = Chord.fromLibraryItem ? Chord.fromLibraryItem(info, {
            position,
            attachedTo: attachedNoteId
        }) : new Chord({
            ...info,
            position,
            attachedTo: attachedNoteId
        });

        this.chords.push(newChord);
        this.chords.sort((a, b) => a.position - b.position);

        this.selectedChordId = newChord.id;
        this.selectedNoteId = null;
        this.selectedBarLineId = null;
        this._syncToRenderer();
        this.scoreRenderer.setSelectedChord(newChord.id);
        this._emit('chordsChanged', this.chords);
        this._emit('chordAdded', newChord);
        this._emit('selectionChanged', { type: 'chord', id: newChord.id });

        return newChord;
    }

    addChordByPosition(position, chordInfo) {
        return this.addChord(position, null, chordInfo);
    }

    addChordToNote(noteId, chordInfo) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return null;

        let durationSum = 0;
        for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].id === noteId) break;
            durationSum += this.notes[i].duration;
        }

        return this.addChord(durationSum, noteId, chordInfo);
    }

    addNote(index) {
        const tool = this.currentTool;
        const actualDuration = NoteUtils.getActualDuration(tool.duration, tool.dotted);

        const newNote = {
            id: NoteUtils.generateNoteId(),
            pitch: tool.pitch,
            octave: tool.octave,
            duration: actualDuration,
            dotted: tool.dotted,
            tie: tool.tie
        };

        if (index === undefined || index >= this.notes.length) {
            this.notes.push(newNote);
        } else {
            this.notes.splice(Math.max(0, index), 0, newNote);
        }

        this.selectedNoteId = newNote.id;
        this.selectedBarLineId = null;
        this._syncToRenderer();
        this.scoreRenderer.setSelectedNote(newNote.id);
        this._emit('notesChanged', this.notes);
        this._emit('noteAdded', newNote);
        this._emit('selectionChanged', { type: 'note', id: newNote.id });

        return newNote;
    }

    addRest(index) {
        const tool = this.currentTool;
        const actualDuration = NoteUtils.getActualDuration(tool.duration, tool.dotted);

        const newNote = {
            id: NoteUtils.generateNoteId(),
            pitch: 0,
            octave: 0,
            duration: actualDuration,
            dotted: tool.dotted,
            tie: false
        };

        if (index === undefined || index >= this.notes.length) {
            this.notes.push(newNote);
        } else {
            this.notes.splice(Math.max(0, index), 0, newNote);
        }

        this.selectedNoteId = newNote.id;
        this.selectedBarLineId = null;
        this._syncToRenderer();
        this.scoreRenderer.setSelectedNote(newNote.id);
        this._emit('notesChanged', this.notes);
        this._emit('noteAdded', newNote);
        this._emit('selectionChanged', { type: 'note', id: newNote.id });

        return newNote;
    }

    addBarLine(position) {
        if (position === undefined) {
            position = NoteUtils.getTotalDuration(this.notes);
        }

        const exists = this.barLines.some(bl => Math.abs(bl.position - position) < 0.1);
        if (exists) return null;

        const newBarLine = {
            id: NoteUtils.generateBarLineId(),
            position: position,
            type: 'single'
        };

        this.barLines.push(newBarLine);
        this.barLines.sort((a, b) => a.position - b.position);

        this.selectedBarLineId = newBarLine.id;
        this.selectedNoteId = null;
        this._syncToRenderer();
        this.scoreRenderer.setSelectedBarLine(newBarLine.id);
        this._emit('barLinesChanged', this.barLines);
        this._emit('selectionChanged', { type: 'barline', id: newBarLine.id });

        return newBarLine;
    }

    deleteSelectedNote() {
        if (!this.selectedNoteId) return;

        const index = this.notes.findIndex(n => n.id === this.selectedNoteId);
        if (index >= 0) {
            const deleted = this.notes.splice(index, 1)[0];
            this.selectedNoteId = null;
            this._syncToRenderer();
            this.scoreRenderer.clearSelection();
            this._emit('notesChanged', this.notes);
            this._emit('noteDeleted', deleted);
            this._emit('selectionChanged', null);
        }
    }

    deleteSelectedBarLine() {
        if (!this.selectedBarLineId) return;

        const index = this.barLines.findIndex(bl => bl.id === this.selectedBarLineId);
        if (index >= 0) {
            this.barLines.splice(index, 1);
            this.selectedBarLineId = null;
            this._syncToRenderer();
            this.scoreRenderer.clearSelection();
            this._emit('barLinesChanged', this.barLines);
            this._emit('selectionChanged', null);
        }
    }

    deleteSelectedChord() {
        if (!this.selectedChordId) return;

        const index = this.chords.findIndex(c => c.id === this.selectedChordId);
        if (index >= 0) {
            const deleted = this.chords.splice(index, 1)[0];
            this.selectedChordId = null;
            this._syncToRenderer();
            this.scoreRenderer.clearSelection();
            this._emit('chordsChanged', this.chords);
            this._emit('chordDeleted', deleted);
            this._emit('selectionChanged', null);
        }
    }

    deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index >= 0) {
            const wasSelected = this.selectedNoteId === id;
            const deleted = this.notes.splice(index, 1)[0];

            const chordsToDetach = this.chords.filter(c => c.attachedTo === id);
            chordsToDetach.forEach(c => {
                c.attachedTo = null;
            });

            if (wasSelected) {
                this.selectedNoteId = null;
                this.scoreRenderer.clearSelection();
            }
            this._syncToRenderer();
            this._emit('notesChanged', this.notes);
            this._emit('noteDeleted', deleted);
            if (chordsToDetach.length > 0) {
                this._emit('chordsChanged', this.chords);
            }
            if (wasSelected) {
                this._emit('selectionChanged', null);
            }
        }
    }

    deleteChord(id) {
        const index = this.chords.findIndex(c => c.id === id);
        if (index >= 0) {
            const wasSelected = this.selectedChordId === id;
            const deleted = this.chords.splice(index, 1)[0];
            if (wasSelected) {
                this.selectedChordId = null;
                this.scoreRenderer.clearSelection();
            }
            this._syncToRenderer();
            this._emit('chordsChanged', this.chords);
            this._emit('chordDeleted', deleted);
            if (wasSelected) {
                this._emit('selectionChanged', null);
            }
        }
    }

    updateChord(id, updates) {
        const chord = this.chords.find(c => c.id === id);
        if (!chord) return;

        if (updates.name) {
            if (chord.setName) {
                chord.setName(updates.name);
            } else {
                const parsed = ChordUtils.parseChordName(updates.name);
                chord.root = parsed.root;
                chord.type = parsed.type;
                chord.bass = parsed.bass;
                chord.display = parsed.display;
                chord.name = parsed.display;
            }
        }
        if (updates.root !== undefined) chord.root = updates.root;
        if (updates.type !== undefined) chord.type = updates.type;
        if (updates.bass !== undefined) chord.bass = updates.bass;
        if (updates.position !== undefined) chord.position = updates.position;
        if (updates.attachedTo !== undefined) chord.attachedTo = updates.attachedTo;
        if (updates.fingering !== undefined) chord.fingering = updates.fingering;
        if (updates.description !== undefined) chord.description = updates.description;

        if (updates.name || updates.root || updates.type || updates.bass) {
            if (!updates.name && chord.setName) {
                chord.display = ChordUtils.buildChordName(chord.root, chord.type, chord.bass);
                chord.name = chord.display;
            }
        }

        this._syncToRenderer();
        this._emit('chordsChanged', this.chords);
    }

    updateNote(id, updates) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        if (updates.dotted !== undefined && updates.duration === undefined) {
            const newDotted = updates.dotted;
            if (note.dotted !== newDotted) {
                note.duration = NoteUtils.recalculateDuration(note, newDotted);
            }
            note.dotted = newDotted;
        } else if (updates.duration !== undefined && updates.dotted === undefined) {
            if (note.dotted) {
                const baseDuration = updates.duration;
                note.duration = NoteUtils.getActualDuration(baseDuration, true);
            } else {
                note.duration = updates.duration;
            }
        } else if (updates.duration !== undefined && updates.dotted !== undefined) {
            note.duration = NoteUtils.getActualDuration(updates.duration, updates.dotted);
            note.dotted = updates.dotted;
        }

        if (updates.pitch !== undefined) {
            note.pitch = updates.pitch;
        }
        if (updates.octave !== undefined) {
            note.octave = updates.octave;
        }
        if (updates.tie !== undefined) {
            note.tie = updates.tie;
        }

        this._syncToRenderer();
        this._emit('notesChanged', this.notes);
    }

    setSelectedNote(id) {
        this.selectedNoteId = id;
        this.selectedBarLineId = null;
        this.selectedChordId = null;
        this.scoreRenderer.setSelectedNote(id);
        this._emit('selectionChanged', { type: 'note', id });
    }

    setSelectedBarLine(id) {
        this.selectedBarLineId = id;
        this.selectedNoteId = null;
        this.selectedChordId = null;
        this.scoreRenderer.setSelectedBarLine(id);
        this._emit('selectionChanged', { type: 'barline', id });
    }

    clearSelection() {
        this.selectedNoteId = null;
        this.selectedBarLineId = null;
        this.selectedChordId = null;
        this.scoreRenderer.clearSelection();
        this._emit('selectionChanged', null);
    }

    setSelectedChord(id) {
        this.selectedChordId = id;
        this.selectedNoteId = null;
        this.selectedBarLineId = null;
        this.scoreRenderer.setSelectedChord(id);
        this._emit('selectionChanged', { type: 'chord', id });
    }

    getSelectedChord() {
        return this.chords.find(c => c.id === this.selectedChordId) || null;
    }

    getSelectedNote() {
        return this.notes.find(n => n.id === this.selectedNoteId) || null;
    }

    getNotes() {
        return [...this.notes];
    }

    getBarLines() {
        return [...this.barLines];
    }

    getChords() {
        return [...this.chords];
    }

    clearAll() {
        this.notes = [];
        this.barLines = [];
        this.chords = [];
        this.selectedNoteId = null;
        this.selectedBarLineId = null;
        this.selectedChordId = null;
        this._syncToRenderer();
        this.scoreRenderer.clearSelection();
        this._emit('notesChanged', this.notes);
        this._emit('barLinesChanged', this.barLines);
        this._emit('chordsChanged', this.chords);
        this._emit('selectionChanged', null);
    }

    transposeChords(fromKey, toKey) {
        if (fromKey === toKey) return;

        this.chords.forEach(chord => {
            if (chord.transpose) {
                chord.transpose(fromKey, toKey);
            } else {
                const transposed = ChordUtils.transposeChord(chord, fromKey, toKey);
                chord.root = transposed.root;
                chord.bass = transposed.bass;
                chord.display = transposed.display;
                chord.name = transposed.display;
            }
        });

        this._syncToRenderer();
        this._emit('chordsChanged', this.chords);
    }

    getTotalDuration() {
        return NoteUtils.getTotalDuration(this.notes);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteEditor;
}
