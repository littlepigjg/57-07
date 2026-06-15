class Chord {
    constructor(options = {}) {
        this.id = options.id || ChordUtils.generateChordId();

        if (options.name) {
            const parsed = ChordUtils.parseChordName(options.name);
            this.root = options.root || parsed.root;
            this.type = options.type || parsed.type;
            this.bass = options.bass || parsed.bass;
            this.display = options.display || parsed.display;
        } else {
            this.root = options.root || 'C';
            this.type = options.type || '';
            this.bass = options.bass || null;
            this.display = options.display || ChordUtils.buildChordName(this.root, this.type, this.bass);
        }

        this.name = this.display;
        this.position = options.position !== undefined ? options.position : 0;
        this.attachedTo = options.attachedTo || null;
        this.description = options.description || '';
        this.fingering = options.fingering || null;
        this.startFret = options.startFret || 1;
        this.barre = options.barre || null;
        this.custom = options.custom || false;
    }

    getName() {
        return this.display;
    }

    setName(name) {
        const parsed = ChordUtils.parseChordName(name);
        this.root = parsed.root;
        this.type = parsed.type;
        this.bass = parsed.bass;
        this.display = parsed.display;
        this.name = parsed.display;
    }

    setRoot(root) {
        this.root = root;
        this.display = ChordUtils.buildChordName(this.root, this.type, this.bass);
        this.name = this.display;
    }

    setType(type) {
        this.type = type;
        this.display = ChordUtils.buildChordName(this.root, this.type, this.bass);
        this.name = this.display;
    }

    setBass(bass) {
        this.bass = bass;
        this.display = ChordUtils.buildChordName(this.root, this.type, this.bass);
        this.name = this.display;
    }

    getNotes() {
        return ChordUtils.getChordNotes(this);
    }

    getTypeName() {
        return ChordUtils.getChordTypeName(this.type);
    }

    transpose(fromKey, toKey) {
        const transposed = ChordUtils.transposeChord(this, fromKey, toKey);
        this.root = transposed.root;
        this.bass = transposed.bass;
        this.display = transposed.display;
        this.name = transposed.name;
    }

    transposed(fromKey, toKey) {
        const transposed = ChordUtils.transposeChord(this, fromKey, toKey);
        return new Chord({
            ...this,
            root: transposed.root,
            bass: transposed.bass,
            display: transposed.display,
            name: transposed.name
        });
    }

    setFingering(fingering) {
        this.fingering = fingering;
    }

    setPosition(position) {
        this.position = position;
    }

    attachTo(noteId) {
        this.attachedTo = noteId;
    }

    detach() {
        this.attachedTo = null;
    }

    clone() {
        return new Chord({
            id: ChordUtils.generateChordId(),
            root: this.root,
            type: this.type,
            bass: this.bass,
            display: this.display,
            position: this.position,
            attachedTo: this.attachedTo,
            description: this.description,
            fingering: this.fingering ? [...this.fingering] : null,
            startFret: this.startFret,
            barre: this.barre ? { ...this.barre } : null,
            custom: this.custom
        });
    }

    equals(other) {
        if (!other) return false;
        return this.root === other.root &&
               this.type === other.type &&
               this.bass === other.bass &&
               Math.abs(this.position - other.position) < 0.001;
    }

    toJSON() {
        return {
            id: this.id,
            root: this.root,
            type: this.type,
            bass: this.bass,
            display: this.display,
            name: this.name,
            position: this.position,
            attachedTo: this.attachedTo,
            description: this.description,
            fingering: this.fingering,
            startFret: this.startFret,
            barre: this.barre,
            custom: this.custom
        };
    }

    static fromJSON(json) {
        return new Chord(json);
    }

    static create(options = {}) {
        return new Chord(options);
    }

    static fromName(name, options = {}) {
        const parsed = ChordUtils.parseChordName(name);
        return new Chord({
            ...options,
            root: parsed.root,
            type: parsed.type,
            bass: parsed.bass,
            display: parsed.display
        });
    }

    static fromLibraryItem(libraryItem, options = {}) {
        return new Chord({
            ...libraryItem,
            ...options,
            custom: true
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chord;
}
