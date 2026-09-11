import * as Phaser from 'phaser';
import { tacticalDialogues as script } from '../data/tacticalDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'dialog' | 'pause' | 'join' | 'play' | 'card';

export class TacticalCoop extends Phaser.Scene
{
    private state: State = 'transition';
    private players: Phaser.GameObjects.Image[] = [];
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private doors: Phaser.GameObjects.Container[] = [];
    private terminals: Phaser.GameObjects.Container[] = [];
    private energy: Phaser.GameObjects.Container[] = [];
    private opened = [false, false];
    private discussed = [false, false];
    private collected = [false, false, false];
    private syncIntroduced = false;
    private synced = false;
    private pressedAt = [-1, -1];
    private arrived = false;
    private finish!: Phaser.GameObjects.Image;
    private world!: Phaser.GameObjects.Container;
    private hud!: Phaser.GameObjects.Container;
    private objective!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private joinPanel!: Phaser.GameObjects.Container;
    private shade!: Phaser.GameObjects.Rectangle;
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

    constructor () { super('TacticalCoop'); }

    create ()
    {
        this.state = 'transition'; this.players = []; this.doors = []; this.terminals = []; this.energy = [];
        this.opened = [false, false]; this.discussed = [false, false]; this.collected = [false, false, false];
        this.syncIntroduced = false; this.synced = false; this.pressedAt = [-1, -1]; this.arrived = false;
        this.isTyping = false; this.typingEvent = undefined;
        this.world = this.add.container(0, 0);
        this.world.add(this.add.image(512, 384, 'tactical-background').setDisplaySize(1024, 768));
        this.finish = this.add.image(512, 679, 'tactical-finish-zone').setDisplaySize(166, 100).setAlpha(0.28);
        this.world.add(this.finish);
        // Portas e terminais desenhados por código até os respectivos assets serem fornecidos.
        [[165, 420], [850, 470]].forEach(([x, y]) => {
            const door = this.add.container(x, y, [
                this.add.rectangle(0, 0, 70, 16, 0x39435F).setStrokeStyle(3, 0xD8B36A),
                this.add.rectangle(0, 0, 52, 5, 0xC9828A)
            ]);
            this.doors.push(door); this.world.add(door);
        });
        [[850, 330], [165, 500], [400, 640], [624, 640]].forEach(([x, y], i) => {
            const terminal = this.add.container(x, y, [
                this.add.rectangle(0, 0, 32, 34, 0x1E2438).setStrokeStyle(2, 0xD8B36A),
                this.add.rectangle(0, -3, 22, 17, 0xC9828A),
                this.label(0, 30, i % 2 === 0 ? 'ENTER' : 'E', 13)
            ]);
            // Os terminais finais seguem Lucas à esquerda e Gabriella à direita.
            if (i >= 2) (terminal.list[2] as Phaser.GameObjects.Text).setText(i === 2 ? 'E' : 'ENTER');
            this.terminals.push(terminal); this.world.add(terminal);
        });
        [[850, 560], [165, 570], [512, 625]].forEach(([x, y], i) => {
            const core = this.add.container(x, y, [
                this.add.circle(0, 0, 22, 0xD8B36A, 0.17),
                this.add.rectangle(0, 0, 16, 16, 0xD8B36A).setAngle(45).setStrokeStyle(2, 0xF4EBDD)
            ]).setVisible(i < 2);
            this.energy.push(core); this.world.add(core);
        });
        ['lucas', 'gabriella'].forEach((name, i) => {
            const sprite = this.add.image(i === 0 ? 165 : 850, 270, `${name}-front`).setOrigin(0.5, 1).setScale(0.08);
            this.players.push(sprite); this.world.add(sprite);
        });
        this.players[1].setAlpha(0.5);
        const panel = this.add.image(512, 71, 'tactical-objective-panel').setDisplaySize(330, 155);
        this.objective = this.add.text(531, 73, 'ENERGIA: 0/3\nColete os 3 núcleos', {
            fontFamily: 'Arial', fontSize: '15px', color: '#1E2438', align: 'center', lineSpacing: 4, wordWrap: { width: 180 }
        }).setOrigin(0.5);
        this.hud = this.add.container(0, 0, [panel, this.objective]).setDepth(100);
        this.hint = this.label(512, 743, '', 17).setDepth(105);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.72).setDepth(120).setVisible(false);
        this.joinPanel = this.add.container(0, 0, [
            this.label(512, 285, 'PLAYER 2 REQUIRED', 32),
            this.label(512, 360, 'MISSÃO EM DUPLA', 25),
            this.label(512, 440, 'Lucas: WASD + E\nGabriella: SETAS + ENTER', 23),
            this.label(512, 545, 'Gabriella, aperte ENTER para entrar', 22)
        ]).setDepth(130).setVisible(false);
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,UP,LEFT,DOWN,RIGHT,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
        this.music = this.sound.add('shared-path-ambient', { loop: true, volume: 0.12 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play();
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.startDialog(script.intro, () => {
            this.state = 'join'; this.shade.setVisible(true); this.joinPanel.setVisible(true);
        }));
        this.cameras.main.fadeIn(400, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.typingEvent?.remove(false); this.music?.destroy(); });
    }

    private label (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 8, y: 5 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    }

    update (time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.keys.E), enter = Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
        if (this.state === 'dialog') { if (e || enter) this.advanceDialog(); return; }
        if (this.state === 'join' && enter)
        {
            this.shade.setVisible(false); this.joinPanel.setVisible(false); this.players[1].setAlpha(1);
            this.sound.play('player-two-chime', { volume: 0.25 }); this.state = 'play'; return;
        }
        if (this.state === 'card' && e)
        {
            this.state = 'transition';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Concert'));
            this.cameras.main.fadeOut(900, 30, 36, 56); return;
        }
        if (this.state !== 'play') return;
        this.movePlayer(0, delta); this.movePlayer(1, delta);
        this.hint.setText('Lucas: WASD + E • Gabriella: SETAS + ENTER');
        const taps = [e, enter];
        for (let i = 0; i < 2; i++)
        {
            if (!this.opened[i] && this.near(i, this.doors[i], 65))
            {
                this.hint.setText(i === 0 ? 'E — Porta fechada • Gabriella pode abrir' : 'ENTER — Porta fechada • Lucas pode abrir');
                if (taps[i] && !this.discussed[i]) { this.discussDoor(i); return; }
            }
            const operator = 1 - i;
            if (!this.opened[i] && this.near(operator, this.terminals[i], 48))
            {
                this.hint.setText(`${operator === 0 ? 'E' : 'ENTER'} — Abrir a porta de ${i === 0 ? 'Lucas' : 'Gabriella'}`);
                if (taps[operator])
                {
                    if (!this.discussed[i]) this.discussDoor(i, () => this.openDoor(i));
                    else this.openDoor(i);
                    return;
                }
            }
        }
        for (let i = 0; i < 3; i++)
        {
            if (this.collected[i] || (i === 2 && !this.synced)) continue;
            const owner = i === 0 ? 1 : 0;
            if ((i < 2 && this.near(owner, this.energy[i], 27)) || (i === 2 && this.players.some((_, p) => this.near(p, this.energy[i], 27))))
            { this.collect(i); return; }
        }
        if (this.collected[0] && this.collected[1] && !this.synced)
        {
            const ready = [this.near(0, this.terminals[2], 44), this.near(1, this.terminals[3], 44)];
            this.hint.setText('Cada um no seu terminal dourado • E + ENTER em até 2 segundos');
            if (ready.every(Boolean) && !this.syncIntroduced)
            {
                this.syncIntroduced = true;
                this.startDialog(script.sync, () => { this.pressedAt = [-1, -1]; this.state = 'play'; }); return;
            }
            if (this.syncIntroduced)
            {
                ready.forEach((near, i) => {
                    if (!near || (this.pressedAt[i] >= 0 && time - this.pressedAt[i] > 2000)) this.pressedAt[i] = -1;
                    if (near && taps[i]) this.pressedAt[i] = time;
                    this.terminals[i + 2].setAlpha(this.pressedAt[i] >= 0 ? 0.5 : 1);
                });
                if (this.pressedAt.every(t => t >= 0))
                {
                    this.synced = true; this.energy[2].setVisible(true);
                    this.objective.setText('ENERGIA: 2/3\nNúcleo central liberado');
                    this.sound.play('player-two-chime', { volume: 0.2 });
                }
            }
        }
        if (this.collected.every(Boolean))
        {
            const inside = this.players.map(p => Math.abs(p.x - 512) < 55 && Math.abs(p.y - 679) < 26);
            this.hint.setText('Encontrem-se na zona iluminada');
            if (inside.every(Boolean)) { this.complete(); return; }
            if (!this.arrived && inside.some(Boolean))
            {
                this.arrived = true;
                this.startDialog(inside[0] ? script.lucasFirst : script.gabriellaFirst, () => { this.state = 'play'; });
            }
        }
    }

    private near (player: number, object: { x: number; y: number }, radius: number)
    { return Math.hypot(this.players[player].x - object.x, this.players[player].y - object.y) <= radius; }

    private movePlayer (i: number, delta: number)
    {
        const [up, left, down, right] = i === 0 ? ['W', 'A', 'S', 'D'] : ['UP', 'LEFT', 'DOWN', 'RIGHT'];
        const dx = Number(this.keys[right].isDown) - Number(this.keys[left].isDown);
        const dy = Number(this.keys[down].isDown) - Number(this.keys[up].isDown);
        if (!dx && !dy) return;
        const p = this.players[i], step = Math.min(delta, 40) * 0.19 / Math.hypot(dx, dy);
        const canWalk = (x: number, y: number) => {
            const lane = i === 0 ? 165 : 850;
            const vertical = Math.abs(x - lane) <= 27 && y >= 235 && y <= 660;
            const horizontal = x >= (i === 0 ? 138 : 550) && x <= (i === 0 ? 474 : 877) && y >= 622 && y <= 660;
            const center = this.synced && x >= 450 && x <= 574 && y >= 609 && y <= 704;
            if (!vertical && !horizontal && !center) return false;
            if (!this.opened[i] && y >= this.doors[i].y - 12) return false;
            return true;
        };
        if (canWalk(p.x + dx * step, p.y)) p.x += dx * step;
        if (canWalk(p.x, p.y + dy * step)) p.y += dy * step;
        const name = i === 0 ? 'lucas' : 'gabriella';
        p.setTexture(`${name}-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
    }

    private discussDoor (i: number, after?: () => void)
    {
        this.discussed[i] = true;
        this.startDialog(i === 0 ? script.doorLucas : script.doorGabriella, () => { this.state = 'play'; after?.(); });
    }

    private openDoor (i: number)
    {
        if (this.opened[i]) return;
        this.opened[i] = true; this.terminals[i].setAlpha(0.5);
        this.tweens.add({ targets: this.doors[i], alpha: 0, scaleX: 0.1, duration: 450 });
    }

    private collect (i: number)
    {
        this.collected[i] = true;
        const core = this.energy[i];
        this.tweens.add({ targets: core, scale: 1.8, alpha: 0, duration: 350, onComplete: () => core.setVisible(false) });
        const count = this.collected.filter(Boolean).length;
        this.objective.setText(`ENERGIA: ${count}/3\n${count === 3 ? 'OBJETIVO FINAL LIBERADO' : count === 2 ? 'Ativem os terminais juntos' : 'Colete os 3 núcleos'}`);
        if (count === 3)
        {
            this.finish.setAlpha(1);
            this.tweens.add({ targets: this.finish, alpha: 0.65, yoyo: true, repeat: -1, duration: 900 });
        }
        // A fala “Peguei” acompanha quem coletou, sem atribuir a ação ao jogador errado.
        let lines = count === 1 ? script.first : count === 2 ? script.second : script.third;
        if (count === 1 && i === 1) lines = [
            { speaker: 'Lucas', text: 'Peguei. Um.', portrait: 'lucas-portrait' },
            ...script.second.slice(1)
        ];
        this.startDialog(lines, () => { this.state = 'play'; });
    }

    private complete ()
    {
        this.state = 'pause'; this.hud.setVisible(false); this.hint.setVisible(false);
        this.tweens.killTweensOf(this.finish); this.finish.setAlpha(1);
        this.music?.setVolume(0.025);
        this.tweens.add({ targets: this.world, scale: 1.035, x: -18, y: -24, duration: 900 });
        this.time.delayedCall(1000, () => this.startDialog(script.ending, () => this.showCard()));
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
        if (this.activeLines === script.sync && this.lineIndex === 3)
        {
            this.tweens.add({ targets: this.terminals[3], alpha: 0.2, yoyo: true, repeat: 1, duration: 160 });
        }
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
        this.state = 'card'; this.shade.setVisible(true);
        this.registry.set('tacticalComplete', true);
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'Dupla Fechada', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'Algumas fases só fazem sentido quando os dois chegam juntos.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(301);
        this.label(512, 703, 'E — Continuar', 22).setDepth(302);
    }
}
