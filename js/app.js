(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('scoreCanvas');
        const noteList = document.getElementById('noteList');
        const progressFill = document.getElementById('progressFill');
        const timeDisplay = document.getElementById('timeDisplay');

        const keySelect = document.getElementById('keySelect');
        const timeSignature = document.getElementById('timeSignature');
        const tempoInput = document.getElementById('tempoInput');
        const dottedCheck = document.getElementById('dottedCheck');
        const tieCheck = document.getElementById('tieCheck');

        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        const addBarLineBtn = document.getElementById('addBarLineBtn');
        const addRestBtn = document.getElementById('addRestBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const clearBtn = document.getElementById('clearBtn');

        const exportImageBtn = document.getElementById('exportImageBtn');
        const exportMidiBtn = document.getElementById('exportMidiBtn');

        const noteButtons = document.querySelectorAll('.note-btn');
        const octaveButtons = document.querySelectorAll('.octave-btn');
        const durationButtons = document.querySelectorAll('.duration-btn');

        let currentPitch = 1;
        let currentOctave = 0;
        let currentDuration = 1;

        const scoreRenderer = new ScoreRenderer(canvas, {
            key: keySelect.value,
            timeSignature: timeSignature.value,
            tempo: parseInt(tempoInput.value)
        });

        const noteEditor = new NoteEditor(scoreRenderer);

        const synthesizer = new AudioSynthesizer({
            key: keySelect.value,
            tempo: parseInt(tempoInput.value),
            waveType: 'sine'
        });

        const playbackController = new PlaybackController(synthesizer, {
            scoreRenderer: scoreRenderer,
            noteEditor: noteEditor,
            onProgress: (info) => {
                progressFill.style.width = info.progress + '%';
                timeDisplay.textContent = `${info.formattedCurrent} / ${info.formattedTotal}`;
            },
            onStateChange: (state) => {
                playBtn.disabled = state === 'playing';
                pauseBtn.disabled = state !== 'playing';
            },
            onComplete: () => {
                progressFill.style.width = '0%';
            }
        });

        const midiExporter = new MidiExporter({
            key: keySelect.value,
            tempo: parseInt(tempoInput.value),
            timeSignature: timeSignature.value
        });

        const imageExporter = new ImageExporter(scoreRenderer);

        updateNoteList();

        function setActiveButton(buttons, value, attr) {
            buttons.forEach(btn => {
                if (parseFloat(btn.dataset[attr]) === parseFloat(value)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        function updateNoteList() {
            const notes = noteEditor.getNotes();
            noteList.innerHTML = '';

            if (notes.length === 0) {
                noteList.innerHTML = '<div style="color:#999;font-size:12px;text-align:center;padding:20px;">暂无音符</div>';
                return;
            }

            notes.forEach((note, idx) => {
                const item = document.createElement('div');
                item.className = 'note-item';
                if (note.id === noteEditor.selectedNoteId) {
                    item.classList.add('selected');
                }

                const baseDuration = NoteUtils.getBaseDuration(note.duration, note.dotted);
                const durationLabel = NoteUtils.getDurationLabel(note.duration);
                const octaveLabel = NoteUtils.getOctaveLabel(note.octave);

                let pitchText = note.pitch === 0 ? '休止符' :
                    octaveLabel + NoteUtils.getNoteDisplay(note.pitch);
                if (note.pitch > 0 && note.dotted) pitchText += '·';
                if (note.tie) pitchText += ' ⌒';

                const durationText = baseDuration >= 1
                    ? `${baseDuration}拍${note.dotted ? ' (附点)' : ''}`
                    : `${baseDuration === 0.5 ? '1/2' : baseDuration === 0.25 ? '1/4' : baseDuration}拍${note.dotted ? ' (附点)' : ''}`;

                const actualDurationText = `实际: ${note.duration.toFixed(2)}拍`;

                item.innerHTML = `
                    <span class="note-info">${idx + 1}. ${pitchText} ${durationLabel ? '<small>(' + durationLabel + ')</small>' : ''}</span>
                    <span class="note-duration" title="${actualDurationText}">${durationText}</span>
                `;

                item.addEventListener('click', () => {
                    noteEditor.setSelectedNote(note.id);
                    if (synthesizer.isInitialized && note.pitch > 0) {
                        synthesizer.playNotePreview(note);
                    }
                    updateNoteList();
                });

                noteList.appendChild(item);
            });
        }

        noteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentPitch = parseInt(btn.dataset.pitch);
                setActiveButton(noteButtons, currentPitch, 'pitch');
                noteEditor.setTool('pitch', currentPitch);
            });
        });

        octaveButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                octaveButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentOctave = parseInt(btn.dataset.octave);
                noteEditor.setTool('octave', currentOctave);
            });
        });

        durationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentDuration = parseFloat(btn.dataset.duration);
                setActiveButton(durationButtons, currentDuration, 'duration');
                noteEditor.setTool('duration', currentDuration);
            });
        });

        dottedCheck.addEventListener('change', () => {
            noteEditor.setTool('dotted', dottedCheck.checked);
        });

        tieCheck.addEventListener('change', () => {
            noteEditor.setTool('tie', tieCheck.checked);
        });

        keySelect.addEventListener('change', () => {
            const oldKey = scoreRenderer.key;
            const newKey = keySelect.value;
            scoreRenderer.setKey(newKey);
            noteEditor.transposeChords(oldKey, newKey);
            synthesizer.setKey(newKey);
            midiExporter.setKey(newKey);
        });

        timeSignature.addEventListener('change', () => {
            scoreRenderer.setTimeSignature(timeSignature.value);
            midiExporter.setTimeSignature(timeSignature.value);
        });

        tempoInput.addEventListener('change', () => {
            const tempo = Math.max(40, Math.min(240, parseInt(tempoInput.value) || 120));
            tempoInput.value = tempo;
            scoreRenderer.setTempo(tempo);
            synthesizer.setTempo(tempo);
            midiExporter.setTempo(tempo);
        });

        playBtn.addEventListener('click', async () => {
            if (!synthesizer.isInitialized) {
                try {
                    await synthesizer.init();
                } catch (e) {
                    alert('音频系统初始化失败: ' + e.message);
                    return;
                }
            }
            playbackController.play();
        });

        pauseBtn.addEventListener('click', () => {
            playbackController.pause();
        });

        stopBtn.addEventListener('click', () => {
            playbackController.stop();
        });

        addBarLineBtn.addEventListener('click', () => {
            noteEditor.addBarLine();
        });

        addRestBtn.addEventListener('click', () => {
            noteEditor.addRest();
            updateNoteList();
        });

        deleteBtn.addEventListener('click', () => {
            if (noteEditor.selectedNoteId) {
                noteEditor.deleteSelectedNote();
            } else if (noteEditor.selectedBarLineId) {
                noteEditor.deleteSelectedBarLine();
            } else if (noteEditor.selectedChordId) {
                noteEditor.deleteSelectedChord();
            }
            updateNoteList();
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有音符吗？')) {
                noteEditor.clearAll();
                updateNoteList();
            }
        });

        exportImageBtn.addEventListener('click', () => {
            imageExporter.download('简谱导出_' + new Date().toLocaleDateString() + '.png', {
                format: 'image/png',
                scale: 2,
                quality: 0.95
            })
            .then(() => {
                alert('图片已下载！');
            })
            .catch(err => {
                console.error('导出图片失败:', err);
                alert('导出图片失败: ' + err.message);
            });
        });

        exportMidiBtn.addEventListener('click', () => {
            const notes = noteEditor.getNotes();
            if (notes.length === 0) {
                alert('没有可导出的音符！');
                return;
            }
            midiExporter.download(notes, '简谱导出_' + new Date().toLocaleDateString() + '.mid');
            alert('MIDI文件已下载！');
        });

        noteEditor.on('notesChanged', () => {
            updateNoteList();
        });

        noteEditor.on('noteAdded', (note) => {
            updateNoteList();
            if (synthesizer.isInitialized && note.pitch > 0) {
                synthesizer.playNotePreview(note);
            }
        });

        noteEditor.on('noteDeleted', () => {
            updateNoteList();
        });

        noteEditor.on('selectionChanged', () => {
            updateNoteList();
        });

        setActiveButton(noteButtons, currentPitch, 'pitch');
        setActiveButton(durationButtons, currentDuration, 'duration');

        noteEditor.setTool('pitch', currentPitch);
        noteEditor.setTool('octave', currentOctave);
        noteEditor.setTool('duration', currentDuration);

        initChordSystem();

        setTimeout(() => {
            scoreRenderer.render();
        }, 100);

        function initChordSystem() {
        const chordModeCheck = document.getElementById('chordModeCheck');
        const addCustomChordBtn = document.getElementById('addCustomChordBtn');
        const customChordRow = document.getElementById('customChordRow');
        const customChordInput = document.getElementById('customChordInput');
        const confirmCustomChordBtn = document.getElementById('confirmCustomChordBtn');
        const chordTypeSelect = document.getElementById('chordTypeSelect');
        const addChordBtn = document.getElementById('addChordBtn');
        const deleteChordBtn = document.getElementById('deleteChordBtn');
        const openChordLibraryBtn = document.getElementById('openChordLibraryBtn');
        const chordLibraryModal = document.getElementById('chordLibraryModal');
        const closeChordLibraryBtn = document.getElementById('closeChordLibraryBtn');
        const chordLibraryGrid = document.getElementById('chordLibraryGrid');
        const addNewChordBtn = document.getElementById('addNewChordBtn');
        const resetChordLibraryBtn = document.getElementById('resetChordLibraryBtn');
        const chordEditorModal = document.getElementById('chordEditorModal');
        const closeChordEditorBtn = document.getElementById('closeChordEditorBtn');
        const chordEditorTitle = document.getElementById('chordEditorTitle');
        const chordEditorName = document.getElementById('chordEditorName');
        const chordEditorDisplay = document.getElementById('chordEditorDisplay');
        const chordEditorDescription = document.getElementById('chordEditorDescription');
        const chordEditorStartFret = document.getElementById('chordEditorStartFret');
        const fingeringInputs = document.getElementById('fingeringInputs');
        const fingeringPreviewCanvas = document.getElementById('fingeringPreviewCanvas');
        const saveChordBtn = document.getElementById('saveChordBtn');
        const cancelChordBtn = document.getElementById('cancelChordBtn');

        let chordLibrary = ChordUtils.loadChordLibrary();
        let currentChordRoot = 'C';
        let editingChordId = null;

        generateCommonChordButtons();
        generateChordRootButtons();
        updateChordList();
        renderChordLibrary();
        initFingeringInputs();

        chordModeCheck.addEventListener('change', () => {
            noteEditor.setChordMode(chordModeCheck.checked);
            if (chordModeCheck.checked) {
                updateCurrentChordTool();
            }
        });

        addCustomChordBtn.addEventListener('click', () => {
            customChordRow.style.display = customChordRow.style.display === 'none' ? 'flex' : 'none';
        });

        confirmCustomChordBtn.addEventListener('click', () => {
            const chordName = customChordInput.value.trim();
            if (chordName) {
                const parsed = ChordUtils.parseChordName(chordName);
                const chordInfo = {
                    name: chordName,
                    root: parsed.root,
                    type: parsed.type,
                    bass: parsed.bass,
                    display: parsed.display,
                    description: '自定义和弦'
                };
                currentChordRoot = parsed.root;
                chordTypeSelect.value = parsed.type;
                noteEditor.setChordTool(chordInfo);
                chordModeCheck.checked = true;
                noteEditor.setChordMode(true);
                customChordRow.style.display = 'none';
                customChordInput.value = '';
            }
        });

        chordTypeSelect.addEventListener('change', updateCurrentChordTool);

        addChordBtn.addEventListener('click', () => {
            const lastNote = noteEditor.getNotes()[noteEditor.getNotes().length - 1];
            const position = lastNote ? lastNote.position + lastNote.duration : 0;
            noteEditor.addChord(position, null);
        });

        deleteChordBtn.addEventListener('click', () => {
            if (noteEditor.selectedChordId) {
                noteEditor.deleteSelectedChord();
            }
        });

        openChordLibraryBtn.addEventListener('click', () => {
            renderChordLibrary();
            chordLibraryModal.style.display = 'flex';
        });

        closeChordLibraryBtn.addEventListener('click', () => {
            chordLibraryModal.style.display = 'none';
        });

        addNewChordBtn.addEventListener('click', () => {
            editingChordId = null;
            chordEditorTitle.textContent = '新建和弦';
            chordEditorName.value = '';
            chordEditorDisplay.value = '';
            chordEditorDescription.value = '';
            chordEditorStartFret.value = 1;
            resetFingeringInputs();
            updateFingeringPreview();
            chordEditorModal.style.display = 'flex';
        });

        resetChordLibraryBtn.addEventListener('click', () => {
            if (confirm('确定要恢复默认和弦库吗？所有自定义和弦将丢失。')) {
                chordLibrary = ChordUtils.getDefaultChordLibrary();
                ChordUtils.saveChordLibrary(chordLibrary);
                renderChordLibrary();
                generateCommonChordButtons();
            }
        });

        closeChordEditorBtn.addEventListener('click', () => {
            chordEditorModal.style.display = 'none';
        });

        cancelChordBtn.addEventListener('click', () => {
            chordEditorModal.style.display = 'none';
        });

        saveChordBtn.addEventListener('click', () => {
            const name = chordEditorName.value.trim();
            if (!name) {
                alert('请输入和弦名称');
                return;
            }

            const parsed = ChordUtils.parseChordName(name);
            const fingering = getFingeringFromInputs();
            const startFret = parseInt(chordEditorStartFret.value) || 1;

            const chordData = {
                id: editingChordId || ChordUtils.generateChordId(),
                name: name,
                root: parsed.root,
                type: parsed.type,
                bass: parsed.bass,
                display: chordEditorDisplay.value.trim() || parsed.display,
                description: chordEditorDescription.value.trim(),
                fingering: fingering,
                startFret: startFret,
                custom: true
            };

            if (editingChordId) {
                const idx = chordLibrary.findIndex(c => c.id === editingChordId);
                if (idx >= 0) {
                    chordLibrary[idx] = chordData;
                }
            } else {
                chordLibrary.push(chordData);
            }

            ChordUtils.saveChordLibrary(chordLibrary);
            renderChordLibrary();
            generateCommonChordButtons();
            chordEditorModal.style.display = 'none';
        });

        chordEditorName.addEventListener('input', () => {
            const parsed = ChordUtils.parseChordName(chordEditorName.value);
            if (!chordEditorDisplay.value) {
                chordEditorDisplay.value = parsed.display;
            }
        });

        chordEditorStartFret.addEventListener('change', updateFingeringPreview);

        function generateCommonChordButtons() {
            const container = document.getElementById('commonChordButtons');
            container.innerHTML = '';

            const commonChords = chordLibrary.filter(c =>
                ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'G7', 'C7'].includes(c.name)
            ).slice(0, 12);

            commonChords.forEach(chord => {
                const btn = document.createElement('button');
                btn.className = 'common-chord-btn';
                btn.textContent = chord.display || chord.name;
                btn.title = chord.description || chord.name;
                btn.addEventListener('click', () => {
                    noteEditor.setChordTool(chord);
                    chordModeCheck.checked = true;
                    noteEditor.setChordMode(true);
                    currentChordRoot = chord.root;
                    chordTypeSelect.value = chord.type || '';
                    updateRootButtonSelection();
                });
                container.appendChild(btn);
            });
        }

        function generateChordRootButtons() {
            const container = document.getElementById('chordRootButtons');
            container.innerHTML = '';

            const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            roots.forEach(root => {
                const btn = document.createElement('button');
                btn.className = 'chord-root-btn';
                btn.dataset.root = root;
                btn.textContent = root;
                btn.addEventListener('click', () => {
                    currentChordRoot = root;
                    updateRootButtonSelection();
                    updateCurrentChordTool();
                });
                container.appendChild(btn);
            });

            updateRootButtonSelection();
        }

        function updateRootButtonSelection() {
            const buttons = document.querySelectorAll('.chord-root-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.root === currentChordRoot);
            });
        }

        function updateCurrentChordTool() {
            const chordType = chordTypeSelect.value;
            const displayName = ChordUtils.buildChordName(currentChordRoot, chordType, null);
            const chordInfo = {
                name: displayName,
                root: currentChordRoot,
                type: chordType,
                bass: null,
                display: displayName,
                description: ChordUtils.getChordTypeName(chordType) + '和弦'
            };
            noteEditor.setChordTool(chordInfo);
        }

        function updateChordList() {
            const chordList = document.getElementById('chordList');
            const chords = noteEditor.getChords();
            chordList.innerHTML = '';

            if (chords.length === 0) {
                chordList.innerHTML = '<div style="color:#999;font-size:12px;text-align:center;padding:20px;">暂无和弦</div>';
                return;
            }

            chords.forEach((chord, idx) => {
                const item = document.createElement('div');
                item.className = 'chord-item';
                if (chord.id === noteEditor.selectedChordId) {
                    item.classList.add('selected');
                }

                const attachedNote = chord.attachedTo ?
                    noteEditor.getNotes().find(n => n.id === chord.attachedTo) : null;
                const positionText = attachedNote ?
                    `附于音符 ${noteEditor.getNotes().indexOf(attachedNote) + 1}` :
                    `位置: ${chord.position.toFixed(1)}`;

                item.innerHTML = `
                    <span class="chord-info">
                        <span class="chord-name">${chord.display || chord.name}</span>
                        <small class="chord-type">${chord.description || ''}</small>
                    </span>
                    <span class="chord-position">${positionText}</span>
                `;

                item.addEventListener('click', () => {
                    noteEditor.setSelectedChord(chord.id);
                });

                chordList.appendChild(item);
            });
        }

        function renderChordLibrary() {
            chordLibraryGrid.innerHTML = '';

            chordLibrary.forEach(chord => {
                const card = document.createElement('div');
                card.className = 'chord-library-card';

                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 130;
                canvas.className = 'chord-canvas';

                card.innerHTML = `
                    <div class="chord-card-header">
                        <span class="chord-card-name">${chord.display || chord.name}</span>
                        <div class="chord-card-actions">
                            <button class="chord-card-edit" title="编辑">✎</button>
                            <button class="chord-card-delete" title="删除">✕</button>
                        </div>
                    </div>
                `;

                card.appendChild(canvas);

                const description = document.createElement('div');
                description.className = 'chord-card-desc';
                description.textContent = chord.description || '';
                card.appendChild(description);

                const useBtn = document.createElement('button');
                useBtn.className = 'chord-card-use';
                useBtn.textContent = '使用';
                useBtn.addEventListener('click', () => {
                    noteEditor.setChordTool(chord);
                    chordModeCheck.checked = true;
                    noteEditor.setChordMode(true);
                    chordLibraryModal.style.display = 'none';
                });
                card.appendChild(useBtn);

                card.querySelector('.chord-card-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingChordId = chord.id;
                    chordEditorTitle.textContent = '编辑和弦';
                    chordEditorName.value = chord.name || '';
                    chordEditorDisplay.value = chord.display || '';
                    chordEditorDescription.value = chord.description || '';
                    chordEditorStartFret.value = chord.startFret || 1;
                    setFingeringInputs(chord.fingering);
                    updateFingeringPreview();
                    chordEditorModal.style.display = 'flex';
                });

                card.querySelector('.chord-card-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (chord.custom && confirm(`确定要删除和弦 "${chord.display || chord.name}" 吗？`)) {
                        const idx = chordLibrary.findIndex(c => c.id === chord.id);
                        if (idx >= 0) {
                            chordLibrary.splice(idx, 1);
                            ChordUtils.saveChordLibrary(chordLibrary);
                            renderChordLibrary();
                            generateCommonChordButtons();
                        }
                    } else if (!chord.custom) {
                        alert('默认和弦不能删除，但可以编辑修改。');
                    }
                });

                const ctx = canvas.getContext('2d');
                ChordUtils.drawFingeringDiagram(ctx, chord, 0, 0, 100, 130, {
                    showName: false,
                    fontSize: 10
                });

                chordLibraryGrid.appendChild(card);
            });
        }

        function initFingeringInputs() {
            fingeringInputs.innerHTML = '';
            const stringNames = ['6弦', '5弦', '4弦', '3弦', '2弦', '1弦'];

            for (let i = 0; i < 6; i++) {
                const wrapper = document.createElement('div');
                wrapper.className = 'fingering-input-wrapper';

                const label = document.createElement('label');
                label.textContent = stringNames[i];
                label.className = 'fingering-label';

                const select = document.createElement('select');
                select.className = 'fingering-select';
                select.dataset.string = i;

                const options = [
                    { value: -1, text: '×' },
                    { value: 0, text: '○' }
                ];
                for (let f = 1; f <= 12; f++) {
                    options.push({ value: f, text: f.toString() });
                }

                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    select.appendChild(option);
                });

                select.addEventListener('change', updateFingeringPreview);

                wrapper.appendChild(label);
                wrapper.appendChild(select);
                fingeringInputs.appendChild(wrapper);
            }
        }

        function resetFingeringInputs() {
            const selects = fingeringInputs.querySelectorAll('.fingering-select');
            selects.forEach(select => {
                select.value = '0';
            });
        }

        function setFingeringInputs(fingering) {
            const selects = fingeringInputs.querySelectorAll('.fingering-select');
            if (fingering && fingering.length === 6) {
                selects.forEach((select, idx) => {
                    select.value = fingering[idx] !== undefined ? fingering[idx].toString() : '0';
                });
            } else {
                resetFingeringInputs();
            }
        }

        function getFingeringFromInputs() {
            const selects = fingeringInputs.querySelectorAll('.fingering-select');
            const fingering = [];
            selects.forEach(select => {
                fingering.push(parseInt(select.value));
            });
            return fingering;
        }

        function updateFingeringPreview() {
            const ctx = fingeringPreviewCanvas.getContext('2d');
            ctx.clearRect(0, 0, fingeringPreviewCanvas.width, fingeringPreviewCanvas.height);

            const chord = {
                name: chordEditorName.value || 'C',
                display: chordEditorDisplay.value || chordEditorName.value || 'C',
                fingering: getFingeringFromInputs(),
                startFret: parseInt(chordEditorStartFret.value) || 1
            };

            ChordUtils.drawFingeringDiagram(ctx, chord, 0, 0, 120, 150, {
                showName: false,
                fontSize: 11
            });
        }

        noteEditor.on('chordsChanged', () => {
            updateChordList();
        });

        noteEditor.on('chordAdded', () => {
            updateChordList();
        });

        noteEditor.on('chordDeleted', () => {
            updateChordList();
        });

        noteEditor.on('selectionChanged', () => {
            updateChordList();
        });

        noteEditor.on('notesChanged', () => {
            updateChordList();
        });
        }
    });
})();
