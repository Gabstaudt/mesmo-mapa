import * as Phaser from 'phaser';
import { maturityDialogues as script } from '../data/maturityDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'solo' | 'join' | 'rescue' | 'switches' | 'meeting' | 'dialog' | 'pause' | 'card';
type Position = { x: number; y: number };
const leftPath: Position[] = [{ x: 220, y: 660 }, { x: 330, y: 610 }, { x: 370, y: 565 },
    { x: 420, y: 500 }, { x: 490, y: 445 }, { x: 512, y: 420 }];
const rightPath: Position[] = leftPath.map(p => ({ x: 1024 - p.x, y: p.y }));

export class Maturity extends Phaser.Scene
{
    private music!: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private state: State = 'transition';
    private lucas!: Phaser.GameObjects.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private barrier!: Phaser.GameObjects.Image;
    private rescueSwitch!: Phaser.GameObjects.Image;
    private leftSwitch!: Phaser.GameObjects.Image;
    private rightSwitch!: Phaser.GameObjects.Image;
    private glow!: Phaser.GameObjects.Graphics;
    private shade!: Phaser.GameObjects.Rectangle;
    private leftPrompt!: Phaser.GameObjects.Text;
    private rightPrompt!: Phaser.GameObjects.Text;
    private instruction!: Phaser.GameObjects.Text;
    private joinPanel!: Phaser.GameObjects.Container;
    private joinTitle!: Phaser.GameObjects.Text;
    private joinHint!: Phaser.GameObjects.Text;
    private joinReady = false;
    private connected = false;
    private barrierOpen = false;
    private centerOpen = false;
    private attempts = 0;
    private heldTogether = 0;
    private teased = new Set<string>();
    private keys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    private arrows!: Phaser.Types.Input.Keyboard.CursorKeys;
    private interact!: Phaser.Input.Keyboard.Key;
    private enter!: Phaser.Input.Keyboard.Key;
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
    private world!: Phaser.GameObjects.Container;

    constructor () { super('Maturity'); }

    create ()
    {
        const { width, height } = this.scale;
        this.music = this.sound.add('shared-path-ambient', { loop: true, volume: 0.08 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.destroy());
        this.state = 'transition';
        this.connected = false;
        this.barrierOpen = false;
        this.centerOpen = false;
        this.joinReady = false;
        this.attempts = 0;
        this.heldTogether = 0;
        this.teased = new Set();
        this.typingEvent = undefined;
        this.isTyping = false;
        this.world = this.add.container(512, 430);
        const background = this.add.image(-512 + width / 2, -430 + height / 2, 'maturity-background')
            .setDisplaySize(width, height);
        this.world.add(background);
        // Caminhos definidos no plano do cenário: impedem atravessar o vazio ou contornar a barreira.
        this.lucas = this.add.image(240, 650, 'lucas-front').setOrigin(0.5, 1).setScale(0.11).setDepth(20);
        this.gabriella = this.add.image(784, 650, 'gabriella-front').setOrigin(0.5, 1).setScale(0.11).setDepth(20).setAlpha(0.5);
        this.barrier = this.add.image(360, 555, 'maturity-barrier');
        this.barrier.setScale(260 / this.barrier.width).setDepth(25);
        this.rescueSwitch = this.makeSwitch(710, 615);
        this.leftSwitch = this.makeSwitch(410, 515).setVisible(false);
        this.rightSwitch = this.makeSwitch(614, 515).setVisible(false);
        this.glow = this.add.graphics().setDepth(15);
        this.shade = this.add.rectangle(512, 384, width, height, 0x1E2438, 0.7).setDepth(90).setVisible(true);
        this.leftPrompt = this.makeText(245, 705, '', 21).setVisible(false);
        this.rightPrompt = this.makeText(779, 705, '', 21).setVisible(false);
        this.instruction = this.makeText(512, 60, '', 23).setVisible(false);
        const box = this.add.image(512, height - 115, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(512 - 180, height - 140, '', { fontFamily: 'Arial', fontSize: '24px',
            color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(512 - 115, height - 164, '', { fontFamily: 'Arial', fontSize: '18px',
            color: '#F4EBDD', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, height - 240, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        const keyboard = this.input.keyboard!;
        this.keys = { up: keyboard.addKey('W'), down: keyboard.addKey('S'), left: keyboard.addKey('A'), right: keyboard.addKey('D') };
        this.arrows = keyboard.createCursorKeys();
        this.interact = keyboard.addKey('E');
        this.enter = keyboard.addKey('ENTER');
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => this.startDialog(script.intro, () => { this.shade.setVisible(false); this.state = 'solo'; }));
        this.cameras.main.fadeIn(1000, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.typingEvent?.remove(false));
    }

    private makeText (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 8 }, align: 'center' }).setOrigin(0.5).setDepth(100);
    }

    private makeSwitch (x: number, y: number)
    {
        const object = this.add.image(x, y, 'maturity-switch').setDepth(10);
        return object.setScale(185 / object.width);
    }

    private near (a: Position, b: Position, radius = 65)
    {
        return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) < radius;
    }

    private onPath (x: number, y: number, path: Position[])
    {
        return path.slice(1).some((end, i) => {
            const start = path[i], dx = end.x - start.x, dy = end.y - start.y;
            const t = Phaser.Math.Clamp(((x - start.x) * dx + (y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
            return Math.hypot(x - start.x - t * dx, y - start.y - t * dy) <= 32;
        });
    }

    private movePlayer (sprite: Phaser.GameObjects.Image, dx: number, dy: number, player: 'lucas' | 'gabriella', delta: number)
    {
        if (!dx && !dy) return;
        const distance = 150 * Math.min(delta, 50) / 1000 / Math.hypot(dx, dy);
        const path = player === 'lucas' ? leftPath : rightPath;
        const allowed = (x: number, y: number) => {
            if (player === 'lucas' && !this.barrierOpen && x > 333) return false;
            if (!this.centerOpen && (player === 'lucas' ? x > 433 : x < 591)) return false;
            return this.onPath(x, y, path);
        };
        const x = sprite.x + dx * distance, y = sprite.y + dy * distance;
        if (allowed(x, y)) sprite.setPosition(x, y);
        else if (allowed(x, sprite.y)) sprite.x = x;
        else if (allowed(sprite.x, y)) sprite.y = y;
        if (dy) sprite.setTexture(`${player}-${dy < 0 ? 'back' : 'front'}`).setFlipX(false);
        else sprite.setTexture(`${player}-left`).setFlipX(dx > 0);
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.interact);
        const enter = Phaser.Input.Keyboard.JustDown(this.enter);
        this.leftPrompt.setVisible(false);
        this.rightPrompt.setVisible(false);
        if (this.state === 'join')
        {
            if (this.joinReady && enter)
            {
                this.joinReady = false;
                this.state = 'pause';
                this.connected = true;
                this.sound.play('player-two-chime', { volume: 0.25 });
                this.music.setVolume(0.12);
                this.gabriella.setAlpha(1);
                this.joinTitle.setText('PLAYER 2 CONNECTED');
                this.joinHint.setText('Agora, juntos.');
                this.time.delayedCall(1000, () => {
                    this.joinPanel.destroy(); this.shade.setVisible(false); this.state = 'rescue';
                    this.instruction.setText('Gabriella, encontre o mecanismo.').setVisible(true);
                });
            }
            return;
        }
        if (['solo', 'rescue', 'switches', 'meeting'].includes(this.state))
        {
            this.movePlayer(this.lucas, Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
                Number(this.keys.down.isDown) - Number(this.keys.up.isDown), 'lucas', delta);
            if (this.connected) this.movePlayer(this.gabriella, Number(this.arrows.right.isDown) - Number(this.arrows.left.isDown),
                Number(this.arrows.down.isDown) - Number(this.arrows.up.isDown), 'gabriella', delta);
        }
        if (this.state === 'solo')
        {
            const nearBarrier = this.near(this.lucas, { x: 330, y: 610 }, 65);
            this.leftPrompt.setText('E — Tentar abrir').setVisible(nearBarrier);
            if (nearBarrier && e)
            {
                const attempt = this.attempts++;
                this.startDialog([script.firstAttempt, script.secondAttempt, script.call][Math.min(attempt, 2)],
                    () => { if (attempt >= 2) this.requestPlayerTwo(); else this.state = 'solo'; });
            }
        }
        else if (this.state === 'rescue')
        {
            const nearSwitch = this.near(this.gabriella, this.rescueSwitch);
            this.rightPrompt.setText('ENTER — Ativar').setVisible(nearSwitch);
            if (nearSwitch && enter)
            {
                this.state = 'pause';
                this.instruction.setVisible(false);
                this.lightSwitch(this.rescueSwitch);
                this.tweens.add({ targets: this.barrier, alpha: 0, duration: 1000, onComplete: () => {
                    this.barrierOpen = true;
                    this.barrier.setVisible(false);
                    this.startDialog(script.opened, () => {
                        this.leftSwitch.setVisible(true); this.rightSwitch.setVisible(true);
                        this.instruction.setText('Cada um no seu mecanismo.').setVisible(true);
                        this.state = 'switches';
                    });
                } });
            }
        }
        else if (this.state === 'switches')
        {
            const left = this.near(this.lucas, this.leftSwitch, 40);
            const right = this.near(this.gabriella, this.rightSwitch, 40);
            this.leftPrompt.setText('E — Ativar').setVisible(left);
            this.rightPrompt.setText('ENTER — Ativar').setVisible(right);
            this.instruction.setText(left && right ? 'ATIVEM JUNTOS — segurem E + ENTER' : 'Cada um no seu mecanismo.');
            if (left && right && this.interact.isDown && this.enter.isDown)
            {
                this.heldTogether += delta;
                if (this.heldTogether >= 600) this.openCenter();
            }
            else
            {
                this.heldTogether = 0;
                const side = left && !right && e ? 'left' : right && !left && enter ? 'right' : '';
                if (side && !this.teased.has(side))
                {
                    this.teased.add(side);
                    this.startDialog(side === 'left' ? script.leftAlone : script.rightAlone, () => { this.state = 'switches'; });
                }
            }
        }
        else if (this.state === 'meeting')
        {
            if (this.near(this.lucas, { x: 512, y: 430 }, 48) && this.near(this.gabriella, { x: 512, y: 430 }, 48))
            {
                this.state = 'pause';
                this.instruction.setVisible(false);
                this.music.setVolume(0.025);
                this.time.delayedCall(1400, () => this.startDialog(script.ending, () => this.showCard()));
            }
        }
        else if (this.state === 'dialog' && (e || (this.connected && enter))) this.advanceDialog();
        else if (this.state === 'card' && e) this.scene.restart();
    }

    private requestPlayerTwo ()
    {
        this.state = 'join';
        this.shade.setVisible(true);
        const frame = this.add.rectangle(512, 370, 790, 530, 0x1E2438, 0.95).setStrokeStyle(2, 0xD8B36A);
        this.joinTitle = this.makeText(512, 180, 'PLAYER 2 REQUIRED', 34);
        const name = this.makeText(512, 245, 'Gabriella, sua vez.', 26);
        const controls = this.makeText(512, 335, 'PLAYER 1                     PLAYER 2\nWASD + E                  SETAS + ENTER', 22);
        const narration = this.makeText(512, 450,
            'Alguns caminhos simplesmente não foram feitos\npara uma pessoa resolver sozinha.', 22);
        this.joinHint = this.makeText(512, 550, 'Um lugar ao lado dele.', 22);
        this.joinPanel = this.add.container(0, 0, [frame, this.joinTitle, name, controls, narration, this.joinHint]).setDepth(300);
        this.time.delayedCall(2200, () => {
            this.joinReady = true;
            this.joinHint.setText('Gabriella: pressione ENTER para entrar.');
        });
    }

    private lightSwitch (object: Phaser.GameObjects.Image)
    {
        object.setTint(0xD8B36A);
        this.add.circle(object.x, object.y, 22, 0xD8B36A, 0.3).setDepth(9);
    }

    private openCenter ()
    {
        this.state = 'pause';
        this.lightSwitch(this.leftSwitch);
        this.lightSwitch(this.rightSwitch);
        const progress = { value: 0 };
        this.tweens.add({ targets: progress, value: 1, duration: 1400, onUpdate: () => {
            this.glow.clear().lineStyle(5, 0xD8B36A, 0.9);
            for (const start of [this.leftSwitch, this.rightSwitch])
                this.glow.lineBetween(start.x, start.y, Phaser.Math.Linear(start.x, 512, progress.value),
                    Phaser.Math.Linear(start.y, 430, progress.value));
        }, onComplete: () => {
            this.centerOpen = true;
            this.state = 'meeting';
            this.instruction.setText('Encontrem-se no centro.');
            this.add.circle(512, 430, 42).setStrokeStyle(3, 0xD8B36A).setDepth(15);
        } });
    }

    private startDialog (lines: RoutineLine[], afterDialog: () => void)
    {
        this.state = 'dialog'; this.heldTogether = 0; this.activeLines = lines; this.lineIndex = 0;
        this.afterDialog = afterDialog; this.dialog.setVisible(true); this.showLine();
    }

    private advanceDialog ()
    {
        if (this.isTyping)
        {
            this.typingEvent?.remove(false); this.dialogText.setText(this.currentFullText); this.isTyping = false;
        }
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
        const line = this.activeLines[this.lineIndex];
        this.dialogName.setText(line.speaker);
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait) this.portrait.setTexture(line.portrait).setX(line.speaker === 'Lucas' ? 879 : 145);
        if (line.text === 'Porque no fim…')
        {
            // Aproxima só o cenário e o casal, mantendo a caixa de diálogo no lugar aprovado.
            for (const sprite of [this.lucas, this.gabriella])
            {
                sprite.setPosition(sprite.x - 512, sprite.y - 430);
                this.world.add(sprite);
            }
            this.tweens.add({ targets: this.world, scaleX: 1.08, scaleY: 1.08, duration: 1800 });
        }
        const wrapped = this.dialogText.getWrappedText(line.text);
        this.textPages = [];
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
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'No mesmo lado', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438',
            fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'Nem sempre concordando. Mas aprendendo a continuar juntos.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(301);
        this.makeText(512, 703, 'E — Rever memória', 22).setDepth(302);
    }
}
