import * as Phaser from 'phaser';
import { concertDialogues as script } from '../data/concertDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'explore' | 'dialog' | 'pause' | 'ready' | 'join' | 'rhythm' | 'card';
type Note = { lane: number; at: number; result: 'pending' | 'hit' | 'miss'; sprite: Phaser.GameObjects.Image };
type Beat = { notes: Note[]; judged: boolean };
const PULSE = 625;
const HIT_WINDOW = 180;

export class Concert extends Phaser.Scene
{
    private state: State = 'transition';
    private background!: Phaser.GameObjects.Image;
    private players: Phaser.GameObjects.Image[] = [];
    private ticket!: Phaser.GameObjects.Image;
    private ticketRead = false;
    private photo!: Phaser.GameObjects.Image;
    private lighting!: Phaser.GameObjects.Rectangle;
    private heading!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Container;
    private shade!: Phaser.GameObjects.Rectangle;
    private joinPanel!: Phaser.GameObjects.Container;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private rhythmUI!: Phaser.GameObjects.Container;
    private notesLayer!: Phaser.GameObjects.Container;
    private targets: Phaser.GameObjects.Image[] = [];
    private syncText!: Phaser.GameObjects.Text;
    private syncFill!: Phaser.GameObjects.Rectangle;
    private feedback!: Phaser.GameObjects.Text;
    private beats: Beat[] = [];
    private elapsed = 0;
    private block = 0;
    private hits = 0;
    private resolved = 0;
    private combo = 0;
    private bestCombo = 0;
    private blockMissed = false;
    private missShown = false;
    private readyAction: () => void = () => {};
    private music?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private activeLines: RoutineLine[] = [];
    private lineIndex = 0;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private afterDialog: () => void = () => {};

    constructor () { super('Concert'); }

    create ()
    {
        this.state = 'transition'; this.players = []; this.targets = []; this.beats = [];
        this.ticketRead = false; this.block = 0; this.hits = 0; this.resolved = 0;
        this.combo = 0; this.bestCombo = 0; this.blockMissed = false; this.missShown = false;
        this.elapsed = 0; this.isTyping = false; this.typingEvent = undefined;
        this.background = this.add.image(512, 384, 'concert-crowd').setDisplaySize(1024, 768);
        this.lighting = this.add.rectangle(512, 384, 1024, 768, 0xC9828A, 0).setDepth(1);
        ['lucas', 'gabriella'].forEach((name, i) => this.players.push(
            this.add.image(i === 0 ? 400 : 490, 652, `${name}-front`).setOrigin(0.5, 1).setScale(0.11).setDepth(20)
        ));
        this.ticket = this.add.image(315, 624, 'concert-ticket').setScale(0.16).setDepth(25);
        this.photo = this.add.image(512, 292, 'concert-photo').setScale(0.55).setDepth(90).setVisible(false);
        this.heading = this.label(512, 80, 'Grupo Revelação\nPrimeiro show juntos', 24).setDepth(100);
        this.hint = this.label(512, 738, 'WASD — Caminhar • Vá em direção ao palco', 19).setDepth(110);
        const promptBG = this.add.image(512, 693, 'interaction-prompt').setDisplaySize(390, 105);
        const promptText = this.add.text(512, 693, 'Pressione E', { fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBG, promptText]).setDepth(100).setVisible(false);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.72).setDepth(120).setVisible(false);
        this.joinPanel = this.add.container(0, 0, [
            this.label(512, 300, 'PLAYER 2 REQUIRED', 32),
            this.label(512, 395, 'Lucas: E • Gabriella: ENTER\nAgora, no mesmo ritmo.', 24),
            this.label(512, 515, 'Gabriella, aperte ENTER para entrar', 22)
        ]).setDepth(130).setVisible(false);
        this.createRhythmUI();
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
        this.music = this.sound.add('concert-groove', { loop: true, volume: 0.08 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play();
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this.state = 'explore'; });
        this.cameras.main.fadeIn(900, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.typingEvent?.remove(false); this.music?.destroy(); });
    }

    private label (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 7 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    }

    private createRhythmUI ()
    {
        this.rhythmUI = this.add.container(0, 0).setDepth(80).setVisible(false);
        [410, 614].forEach((x, i) => {
            const lane = this.add.rectangle(x, 382, 110, 400, 0x1E2438, 0.78).setStrokeStyle(1, 0xD8B36A, 0.5);
            const target = this.add.image(x, 550, 'rhythm-hit-zone').setScale(0.13);
            this.targets.push(target);
            this.rhythmUI.add([lane, target, this.label(x, 612, i === 0 ? 'LUCAS • E' : 'GABRIELLA • ENTER', 16)]);
        });
        this.syncText = this.label(512, 138, 'SINCRONIA: 0%', 20);
        const track = this.add.rectangle(362, 168, 300, 9, 0x39435F).setOrigin(0, 0.5);
        this.syncFill = this.add.rectangle(362, 168, 0, 9, 0xD8B36A).setOrigin(0, 0.5);
        this.feedback = this.label(512, 671, 'Sinta o pulso', 21);
        this.rhythmUI.add([this.syncText, track, this.syncFill, this.feedback]);
        this.notesLayer = this.add.container(0, 0).setDepth(85).setVisible(false);
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.keys.E), enter = Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
        if (this.state === 'dialog') { if (e || enter) this.advanceDialog(); return; }
        if (this.state === 'ready') { if (e) this.readyAction(); return; }
        if (this.state === 'join' && enter)
        {
            this.shade.setVisible(false); this.joinPanel.setVisible(false);
            this.startDialog(script.like, () => this.beginBlock(1)); return;
        }
        if (this.state === 'rhythm') { this.updateRhythm(delta, e, enter); return; }
        if (this.state === 'card' && e) { this.scene.restart(); return; }
        if (this.state !== 'explore') return;
        const dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
        const dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
        const lucas = this.players[0], gabriella = this.players[1];
        if (dx || dy)
        {
            const distance = Math.min(delta, 40) * 0.17 / Math.hypot(dx, dy);
            lucas.x = Phaser.Math.Clamp(lucas.x + dx * distance, 235, 730);
            lucas.y = Phaser.Math.Clamp(lucas.y + dy * distance, 445, 665);
            lucas.setTexture(`lucas-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
            gabriella.x = Phaser.Math.Linear(gabriella.x, lucas.x + 85, Math.min(delta / 180, 1));
            gabriella.y = Phaser.Math.Linear(gabriella.y, lucas.y + 8, Math.min(delta / 180, 1));
            gabriella.setTexture(`gabriella-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
        }
        const nearTicket = !this.ticketRead && Phaser.Math.Distance.Between(lucas.x, lucas.y, this.ticket.x, this.ticket.y) < 100;
        this.prompt.setVisible(nearTicket);
        if (nearTicket && e)
        {
            this.ticketRead = true; this.prompt.setVisible(false);
            this.startDialog(script.ticket, () => { this.state = 'explore'; });
        }
        else if (lucas.y <= 455) this.enterStage();
    }

    private enterStage ()
    {
        this.state = 'transition'; this.prompt.setVisible(false); this.hint.setVisible(false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.background.setTexture('concert-stage'); this.ticket.setVisible(false);
            this.players[0].setPosition(450, 730); this.players[1].setPosition(575, 730);
            this.players.forEach(p => p.setTexture(p === this.players[0] ? 'lucas-front' : 'gabriella-front').setFlipX(false));
            this.music?.setVolume(0.18);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
                () => this.startDialog(script.stage, () => this.drawClose()));
            this.cameras.main.fadeIn(700, 30, 36, 56);
        });
        this.cameras.main.fadeOut(650, 30, 36, 56);
    }

    private drawClose ()
    {
        this.state = 'pause';
        this.tweens.add({ targets: this.players[0], x: 485, duration: 650 });
        this.tweens.add({ targets: this.players[1], x: 540, duration: 650, onComplete: () => {
            this.time.delayedCall(800, () => {
                this.state = 'ready';
                this.hint.setText('E — Começar • Acerte quando a nota chegar ao centro do círculo').setVisible(true);
                this.readyAction = () => this.beginBlock(0);
            });
        } });
    }

    private beginBlock (block: number)
    {
        this.state = 'rhythm'; this.block = block; this.elapsed = 0; this.blockMissed = false; this.combo = 0;
        this.notesLayer.removeAll(true);
        // Quatro pulsos de preparação; notas alinhadas à base original de 96 BPM.
        const pattern = block === 0 ? [[0], [0], [0], [0]] : block === 1 ?
            [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1]] : block === 2 ?
            [[0], [1], [0, 1], [0, 1]] :
            [[0], [1], [0, 1], [0], [1], [0, 1], [1], [0], [0, 1], [0], [1], [0, 1]];
        this.beats = pattern.map((lanes, index) => ({ judged: false, notes: lanes.map(lane => {
            const sprite = this.add.image(lane === 0 ? 410 : 614, 180, 'rhythm-note').setScale(0.09).setVisible(false);
            this.notesLayer.add(sprite);
            return { lane, at: (4 + index) * PULSE, result: 'pending', sprite };
        }) }));
        this.rhythmUI.setVisible(true); this.notesLayer.setVisible(true);
        this.targets[1].setAlpha(block === 0 ? 0.25 : 1);
        this.feedback.setText(block === 0 ? 'Lucas começa • E' : 'No mesmo ritmo');
        this.hint.setText(block === 0 ? 'E — Bata no ritmo • ENTER entra depois' : 'E + ENTER • Cada um acompanha a sua nota').setVisible(true);
        this.players[0].setPosition(190, 730); this.players[1].setPosition(834, 730);
        this.music?.stop(); this.music?.play({ loop: true, volume: 0.22 });
        this.updateSync();
    }

    private updateRhythm (delta: number, e: boolean, enter: boolean)
    {
        this.elapsed += delta;
        const all = this.beats.flatMap(beat => beat.notes);
        [e, enter].forEach((pressed, lane) => {
            if (!pressed || (this.block === 0 && lane === 1)) return;
            const note = all.find(note => note.lane === lane && note.result === 'pending' && Math.abs(note.at - this.elapsed) <= HIT_WINDOW);
            if (note)
            {
                note.result = 'hit'; note.sprite.setVisible(false); this.hits++; this.resolved++;
                this.feedback.setText('No ritmo!');
                const target = this.targets[lane];
                this.tweens.killTweensOf(target); target.setScale(0.15);
                this.tweens.add({ targets: target, scale: 0.13, duration: 160 });
            }
            else { this.combo = 0; this.blockMissed = true; this.feedback.setText('Respira. No próximo pulso.'); }
        });
        all.forEach(note => {
            if (note.result !== 'pending') return;
            if (this.elapsed > note.at + HIT_WINDOW)
            {
                note.result = 'miss'; note.sprite.setVisible(false); this.resolved++;
                this.blockMissed = true; this.feedback.setText('O ritmo continua');
            }
            else
            {
                const y = 550 - (note.at - this.elapsed) * 0.23;
                note.sprite.setPosition(note.lane === 0 ? 410 : 614, y).setVisible(y >= 190);
            }
        });
        this.beats.forEach(beat => {
            if (beat.judged || beat.notes.some(n => n.result === 'pending')) return;
            beat.judged = true;
            if (beat.notes.every(n => n.result === 'hit'))
            {
                this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo);
                if (this.block > 0 && this.combo >= 3) this.feedback.setText(`COMBO EM DUPLA ×${this.combo}`);
            }
            else this.combo = 0;
        });
        this.updateSync();
        if (this.beats.every(beat => beat.judged) && this.elapsed >= all[all.length - 1].at + 650) this.finishBlock();
    }

    private updateSync ()
    {
        const percent = this.resolved ? Math.round(this.hits / this.resolved * 100) : 0;
        this.syncText.setText(`SINCRONIA: ${percent}%`); this.syncFill.width = percent * 3;
    }

    private finishBlock ()
    {
        this.state = 'pause'; this.rhythmUI.setVisible(false); this.notesLayer.setVisible(false); this.hint.setVisible(false);
        this.music?.setVolume(0.10);
        const next = () => {
            if (this.block === 0)
            {
                this.state = 'join'; this.shade.setVisible(true); this.joinPanel.setVisible(true);
            }
            else if (this.block === 1) this.startDialog(script.sing, () => this.beginBlock(2));
            else if (this.block === 2) this.showPhoto();
            else this.emotionalEnding();
        };
        if (this.block > 0 && this.blockMissed && !this.missShown)
        {
            this.missShown = true; this.startDialog(script.miss, next);
        }
        else next();
    }

    private showPhoto ()
    {
        this.state = 'pause'; this.players[0].setPosition(480, 730); this.players[1].setPosition(545, 730);
        this.photo.setVisible(true).setAlpha(0).setScale(0.48);
        this.cameras.main.flash(200, 244, 235, 221);
        this.tweens.add({ targets: this.photo, alpha: 1, scale: 0.55, duration: 800, onComplete: () => {
            this.registry.set('concertPhoto', { texture: 'concert-photo', title: 'Primeiro show juntos', artist: 'Grupo Revelação' });
            this.startDialog(script.photo, () => this.laterMemory());
        } });
    }

    private laterMemory ()
    {
        this.state = 'transition';
        this.tweens.add({ targets: this.photo, angle: 12, alpha: 0, scale: 0.7, duration: 1000 });
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.photo.setVisible(false);
            this.lighting.setAlpha(0.14);
            this.heading.setText('Sorriso Maroto • As Antigas\nOutra noite, mais adiante');
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.startDialog(script.later, () => {
                this.state = 'ready';
                this.hint.setText('E — Começar • Notas separadas e notas juntas').setVisible(true);
                this.readyAction = () => this.beginBlock(3);
            }));
            this.cameras.main.fadeIn(900, 30, 36, 56);
        });
        this.cameras.main.fadeOut(1100, 30, 36, 56);
    }

    private emotionalEnding ()
    {
        this.state = 'pause'; this.music?.setVolume(0.035);
        this.tweens.add({ targets: this.players[0], x: 480, duration: 800 });
        this.tweens.add({ targets: this.players[1], x: 545, duration: 800 });
        this.time.delayedCall(1200, () => this.startDialog(script.ending, () => this.showCard()));
    }
    private startDialog (lines: RoutineLine[], afterDialog: () => void)
    {
        this.state = 'dialog'; this.activeLines = lines; this.lineIndex = 0;
        this.afterDialog = afterDialog; this.dialog.setVisible(true); this.showLine();
    }

    private advanceDialog ()
    {
        if (this.isTyping) { this.typingEvent?.remove(false); this.dialogText.setText(this.currentFullText); this.isTyping = false; }
        else if (this.pageIndex + 1 < this.textPages.length) this.startTyping(this.textPages[++this.pageIndex]);
        else
        {
            const pause = this.activeLines[this.lineIndex].pauseAfter;
            if (pause) { this.state = 'pause'; this.time.delayedCall(pause, () => { this.state = 'dialog'; this.nextLine(); }); }
            else this.nextLine();
        }
    }

    private nextLine ()
    {
        if (++this.lineIndex < this.activeLines.length) this.showLine();
        else { this.dialog.setVisible(false); this.portrait.setVisible(false); this.afterDialog(); }
    }

    private showLine ()
    {
        const line = this.activeLines[this.lineIndex]; this.dialogName.setText(line.speaker);
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait) this.portrait.setTexture(line.portrait).setX(line.speaker === 'Lucas' ? 879 : 145);
        const wrapped = this.dialogText.getWrappedText(line.text); this.textPages = [];
        for (let i = 0; i < wrapped.length; i += 2) this.textPages.push(wrapped.slice(i, i + 2).join(' '));
        this.pageIndex = 0; this.startTyping(this.textPages[0]);
    }

    private startTyping (text: string)
    {
        this.typingEvent?.remove(false); this.currentFullText = text; this.dialogText.setText(''); this.isTyping = true;
        let character = 0;
        this.typingEvent = this.time.addEvent({ delay: 35, repeat: text.length - 1, callback: () => {
            this.dialogText.setText(text.substring(0, ++character));
            if (character === text.length) this.isTyping = false;
        } });
    }

    private showCard ()
    {
        this.state = 'card'; this.shade.setVisible(true); this.hint.setVisible(false);
        this.registry.set('concertMemory', { title: 'Nossa trilha', photo: 'concert-photo', hits: this.hits, notes: this.resolved, bestCombo: this.bestCombo });
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'Nossa trilha', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'Tem música que eu não escuto mais sozinha. Eu escuto e lembro da gente.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(301);
        this.label(512, 703, 'E — Reviver essa memória', 22).setDepth(302);
    }
}
