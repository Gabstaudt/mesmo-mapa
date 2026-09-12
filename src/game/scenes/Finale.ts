import * as Phaser from 'phaser';
import { finaleDialogues as script, finalLetter } from '../data/finaleDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'pause' | 'dialog' | 'wall' | 'future' | 'soloLucas' | 'soloGabriella' | 'hold' | 'letter' | 'end';
type Future = { id: string; title: string; texture: string; x: number; y: number; container: Phaser.GameObjects.Container; status: Phaser.GameObjects.Text; frame: Phaser.GameObjects.Image };

export class Finale extends Phaser.Scene
{
    private state: State = 'transition';
    private world!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Image;
    private wallObjects!: Phaser.GameObjects.Container;
    private wallPoints: { id: string; x: number; image: Phaser.GameObjects.Image; marker: Phaser.GameObjects.Text }[] = [];
    private visited = new Set<string>();
    private futureIndex = 0;
    private futures: Future[] = [];
    private lucas!: Phaser.GameObjects.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private symbol!: Phaser.GameObjects.Image;
    private glow!: Phaser.GameObjects.Arc;
    private paths!: Phaser.GameObjects.Graphics;
    private charge!: Phaser.GameObjects.Graphics;
    private held = 0;
    private holdArmed = false;
    private hud!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Container;
    private shade!: Phaser.GameObjects.Rectangle;
    private joinPanel!: Phaser.GameObjects.Container;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private music?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private letterPanel!: Phaser.GameObjects.Container;
    private letterText!: Phaser.GameObjects.Text;
    private letterCount!: Phaser.GameObjects.Text;
    private signature!: Phaser.GameObjects.Text;
    private letterPages: string[] = [];
    private letterIndex = 0;
    private signed = false;
    private signatureTimer?: Phaser.Time.TimerEvent;
    private couple!: Phaser.GameObjects.Image;
    private endReady = false;
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

    constructor () { super('Finale'); }

    create ()
    {
        this.state = 'transition'; this.visited = new Set(); this.futureIndex = 0; this.futures = []; this.wallPoints = [];
        this.held = 0; this.holdArmed = false; this.endReady = false; this.isTyping = false; this.typingEvent = undefined;
        this.letterIndex = 0; this.letterPages = []; this.signed = false; this.signatureTimer = undefined;
        this.world = this.add.container(0, 0);
        this.background = this.add.image(512, 384, 'final-wall').setDisplaySize(1024, 768);
        this.wallObjects = this.add.container(0, 0);
        this.paths = this.add.graphics();
        this.lucas = this.add.image(100, 680, 'lucas-front').setOrigin(0.5, 1).setScale(0.09).setVisible(false);
        this.gabriella = this.add.image(585, 685, 'gabriella-front').setOrigin(0.5, 1).setScale(0.09).setVisible(false);
        this.world.add([this.background, this.wallObjects, this.paths, this.lucas, this.gabriella]);
        this.glow = this.add.circle(512, 380, 95, 0xD8B36A, 0.15).setDepth(80).setVisible(false);
        this.symbol = this.add.image(512, 380, 'final-symbol').setScale(0.23).setDepth(90).setAlpha(0.3).setVisible(false);
        this.charge = this.add.graphics().setDepth(91);
        this.hud = this.label(512, 65, '', 20).setDepth(100).setVisible(false);
        this.hint = this.label(512, 738, '', 18).setDepth(110).setVisible(false);
        const promptBG = this.add.image(512, 693, 'interaction-prompt').setDisplaySize(390, 105);
        const promptText = this.add.text(512, 693, 'Pressione E', { fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBG, promptText]).setDepth(105).setVisible(false);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.6).setDepth(120).setVisible(false);
        this.joinPanel = this.add.container(0, 0, [
            this.label(512, 128, 'PLAYER 2 REQUIRED', 30),
            this.label(512, 190, 'ÚLTIMA AÇÃO', 23),
            this.label(512, 255, 'LUCAS — SEGURE E\nGABRIELLA — SEGURE ENTER', 21)
        ]).setDepth(130).setVisible(false);
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-romantic').setScale(0.22).setDepth(150).setVisible(false);
        this.couple = this.add.image(512, 300, 'couple-key-art').setScale(0.34).setDepth(140).setVisible(false);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,UP,LEFT,DOWN,RIGHT,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
        this.music = this.sound.add('finale-song', { loop: true, volume: 0.075 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play(); this.createWall();
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
            this.time.delayedCall(700, () => this.revealWall());
        });
        this.cameras.main.fadeIn(1800, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false); this.signatureTimer?.remove(false); this.music?.destroy();
        });
    }

    private label (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 10, y: 6 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    }

    private createWall ()
    {
        const memories = [
            { id: 'routine', texture: 'routine-photo', x: 180, y: 380, scale: 0.26 },
            { id: 'concert', texture: 'concert-photo', x: 400, y: 360, scale: 0.30 },
            { id: 'ring', texture: 'official-ring', x: 625, y: 355, scale: 0.30 },
            { id: 'travel', texture: 'travel-photo', x: 845, y: 370, scale: 0.30 }
        ];
        ['travel-ticket', 'concert-ticket'].forEach((key, i) => this.wallObjects.add(
            this.add.image(i === 0 ? 310 : 720, 150, key).setScale(0.15).setAlpha(0)
        ));
        memories.forEach(m => {
            const image = this.add.image(m.x, m.y, m.texture).setScale(m.scale).setAlpha(0);
            const marker = this.label(m.x, 568, '◇', 20).setVisible(false);
            this.wallObjects.add(image); this.wallPoints.push({ id: m.id, x: m.x, image, marker });
            this.world.add(marker);
        });
    }

    private revealWall ()
    {
        this.wallObjects.list.forEach((image, i) => this.tweens.add({ targets: image, alpha: 1, duration: 700, delay: i * 400 }));
        this.time.delayedCall(3000, () => this.startDialog(script.intro, () => {
            this.lucas.setVisible(true); this.wallPoints.forEach(p => p.marker.setVisible(true));
            this.state = 'wall'; this.hud.setText('MEMÓRIAS REVISITADAS 0/4').setVisible(true);
            this.hint.setText('WASD — Caminhar pelo mural').setVisible(true);
        }));
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.keys.E), enter = Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
        const left = Phaser.Input.Keyboard.JustDown(this.keys.LEFT);
        if (this.state === 'dialog') { if (e || enter) this.advanceDialog(); return; }
        if (this.state === 'letter') { this.updateLetter(e, left); return; }
        if (this.state === 'end') { if (e && this.endReady) this.scene.start('MainMenu'); return; }
        if (this.state === 'hold') { this.updateHold(delta); return; }
        if (!['wall', 'future', 'soloLucas', 'soloGabriella'].includes(this.state)) return;
        const p2 = this.state === 'soloGabriella'; this.move(p2 ? this.gabriella : this.lucas, p2, delta);
        this.prompt.setVisible(false);
        if (this.state === 'wall')
        {
            const point = this.wallPoints.find(p => Math.abs(this.lucas.x - p.x) < 65 && this.lucas.y < 665);
            this.prompt.setVisible(!!point && !this.visited.has(point.id));
            if (point && !this.visited.has(point.id) && e)
            {
                this.visited.add(point.id); point.marker.setText('✓'); this.prompt.setVisible(false);
                this.hud.setText(`MEMÓRIAS REVISITADAS ${this.visited.size}/4`);
                this.startDialog(script[point.id], () => {
                    if (this.visited.size === 4) this.leaveWall(); else this.state = 'wall';
                });
            }
        }
        else if (this.state === 'future')
        {
            const future = this.futures[this.futureIndex];
            this.hint.setText(`WASD — Explore o mapa • Próximo: ${future.title}`);
            const near = this.near(this.lucas, future.x, future.y + 85, 90);
            this.prompt.setVisible(near);
            if (near && e) this.visitFuture(future);
        }
        else
        {
            const actor = p2 ? this.gabriella : this.lucas;
            const near = this.near(actor, 512, 400, 105);
            this.hint.setText(p2 ? 'Gabriella: SETAS para chegar ao símbolo • ENTER para tentar' : 'Lucas: WASD para chegar ao símbolo');
            this.prompt.setVisible(near && !p2);
            if (near && (p2 ? enter : e))
            {
                this.prompt.setVisible(false);
                this.startDialog(p2 ? script.solo.slice(2) : script.solo.slice(0, 2), () => {
                    if (p2) this.requireBoth(); else this.state = 'soloGabriella';
                });
            }
        }
    }

    private move (sprite: Phaser.GameObjects.Image, p2: boolean, delta: number)
    {
        const [up, left, down, right] = p2 ? ['UP', 'LEFT', 'DOWN', 'RIGHT'] : ['W', 'A', 'S', 'D'];
        const dx = Number(this.keys[right].isDown) - Number(this.keys[left].isDown);
        const dy = Number(this.keys[down].isDown) - Number(this.keys[up].isDown);
        if (!dx && !dy) return;
        const step = Math.min(delta, 40) * 0.2 / Math.hypot(dx, dy);
        sprite.x = Phaser.Math.Clamp(sprite.x + dx * step, 70, 954);
        sprite.y = Phaser.Math.Clamp(sprite.y + dy * step, this.state === 'wall' ? 595 : 165, 720);
        sprite.setTexture(`${p2 ? 'gabriella' : 'lucas'}-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
    }

    private near (sprite: Phaser.GameObjects.Image, x: number, y: number, radius: number)
    { return Phaser.Math.Distance.Between(sprite.x, sprite.y, x, y) < radius; }

    private leaveWall ()
    {
        this.state = 'pause'; this.hud.setVisible(false); this.hint.setVisible(false);
        this.tweens.add({ targets: this.world, scale: 0.96, x: 20, y: 15, duration: 1100 });
        this.time.delayedCall(1100, () => this.startDialog(script.wallEnd, () => {
            this.state = 'transition';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.wallObjects.setVisible(false); this.wallPoints.forEach(p => p.marker.setVisible(false));
                this.world.setScale(1).setPosition(0, 0); this.background.setTexture('final-future-map').setDisplaySize(1024, 768);
                this.lucas.setPosition(450, 700).setTexture('lucas-front').setFlipX(false);
                this.gabriella.setPosition(585, 700).setTexture('gabriella-front').setFlipX(false).setVisible(true);
                this.createFutures();
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.startDialog(script.futureIntro, () => {
                    this.futures.forEach(f => f.container.setVisible(true)); this.state = 'future'; this.hint.setVisible(true);
                }));
                this.cameras.main.fadeIn(1100, 30, 36, 56);
            });
            this.cameras.main.fadeOut(1300, 30, 36, 56);
        }));
    }

    private createFutures ()
    {
        const data = [
            { id: 'home', title: 'Nossa casa', texture: 'future-home', x: 392, y: 160 },
            { id: 'wedding', title: 'Casamento', texture: 'future-wedding', x: 152, y: 373 },
            { id: 'machu', title: 'Machu Picchu', texture: 'future-machu', x: 546, y: 610 },
            { id: 'san', title: 'San Andrés', texture: 'future-san', x: 867, y: 603 }
        ];
        data.forEach(f => {
            const image = this.add.image(0, 0, f.texture).setScale(0.29);
            const frame = this.add.image(0, 0, 'future-locked').setScale(0.28).setAlpha(0.3);
            const title = this.label(0, -98, f.title, 16);
            const status = this.label(0, f.y > 550 ? 82 : 103, 'MEMÓRIA AINDA\nNÃO CRIADA', 11);
            const container = this.add.container(f.x, f.y, [image, frame, title, status]).setVisible(false);
            this.world.add(container); this.futures.push({ ...f, container, status, frame });
        });
        this.world.bringToTop(this.lucas); this.world.bringToTop(this.gabriella);
    }

    private visitFuture (future: Future)
    {
        this.prompt.setVisible(false); this.hint.setVisible(false); this.shade.setVisible(true);
        const focus = this.add.container(0, 0, [
            this.add.image(512, 293, future.texture).setScale(0.58),
            this.add.image(512, 293, 'future-locked').setScale(0.55).setAlpha(0.24),
            this.label(512, 90, future.title, 25),
            this.label(512, 505, 'MEMÓRIA AINDA NÃO CRIADA', 20)
        ]).setDepth(130);
        this.startDialog(script[future.id], () => {
            focus.destroy(); this.shade.setVisible(false); this.futureIndex++;
            if (this.futureIndex < 4) { this.state = 'future'; this.hint.setVisible(true); }
            else this.startDialog(script.overview, () => this.revealSymbol());
        });
    }

    private revealSymbol ()
    {
        this.state = 'pause';
        const positions = [[200, 170], [824, 170], [200, 500], [824, 500]];
        this.futures.forEach((f, i) => this.tweens.add({ targets: f.container, x: positions[i][0], y: positions[i][1], duration: 1000 }));
        this.symbol.setVisible(true); this.glow.setVisible(true).setAlpha(0.2);
        this.time.delayedCall(1100, () => { this.state = 'soloLucas'; this.hint.setVisible(true); });
    }

    private requireBoth ()
    {
        this.shade.setVisible(true); this.joinPanel.setVisible(true); this.hint.setVisible(false);
        this.startDialog(script.required, () => {
            this.state = 'hold'; this.shade.setVisible(false); this.held = 0; this.holdArmed = false;
            this.hint.setText('Soltem as teclas. Depois, segurem E + ENTER juntos.').setVisible(true);
        });
    }

    private updateHold (delta: number)
    {
        if (!this.holdArmed)
        {
            if (!this.keys.E.isDown && !this.keys.ENTER.isDown) this.holdArmed = true;
            return;
        }
        const together = this.keys.E.isDown && this.keys.ENTER.isDown && this.near(this.lucas, 512, 400, 105) && this.near(this.gabriella, 512, 400, 105);
        this.held = together ? this.held + Math.min(delta, 50) : 0;
        const progress = Phaser.Math.Clamp(this.held / 2500, 0, 1);
        this.hint.setText('Segurem E + ENTER juntos até o símbolo acender');
        this.symbol.setAlpha(0.3 + progress * 0.7); this.glow.setAlpha(0.2 + progress * 0.8);
        this.charge.clear().lineStyle(4, 0xD8B36A).beginPath().arc(512, 380, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress).strokePath();
        if (progress === 1) this.unlockFuture();
    }

    private unlockFuture ()
    {
        this.state = 'pause'; this.joinPanel.setVisible(false); this.hint.setVisible(false); this.charge.clear();
        this.futures.forEach(f => { f.status.setText('EM DESENVOLVIMENTO'); f.frame.setAlpha(0.18); });
        const progress = { value: 0 };
        this.tweens.add({ targets: progress, value: 1, duration: 1400, onUpdate: () => {
            this.paths.clear().lineStyle(3, 0xD8B36A, 0.9);
            this.futures.forEach(f => this.paths.lineBetween(512, 380,
                Phaser.Math.Linear(512, f.container.x, progress.value), Phaser.Math.Linear(380, f.container.y, progress.value)));
        }, onComplete: () => this.startDialog(script.beta, () => this.emotionalEnding()) });
        this.futures.forEach(f => this.tweens.add({ targets: f.frame, alpha: 0.45, duration: 650, yoyo: true, repeat: 1 }));
    }

    private emotionalEnding ()
    {
        this.state = 'pause'; this.music?.setVolume(0.04);
        this.tweens.add({ targets: this.world, alpha: 0, duration: 1800, onComplete: () => {
            this.startDialog(script.emotional, () => this.showLetter());
        } });
    }

    private showLetter ()
    {
        this.state = 'letter'; this.symbol.setVisible(false); this.glow.setVisible(false);
        this.letterText = this.add.text(200, 255, '', { fontFamily: 'Arial', fontSize: '23px', color: '#1E2438', wordWrap: { width: 624 }, lineSpacing: 7 });
        const lines = this.letterText.getWrappedText(finalLetter);
        this.letterPages = [];
        for (let i = 0; i < lines.length; i += 10) this.letterPages.push(lines.slice(i, i + 10).join('\n').trim());
        this.letterCount = this.add.text(512, 648, '', { fontFamily: 'Arial', fontSize: '17px', color: '#39435F' }).setOrigin(0.5);
        this.signature = this.add.text(780, 598, '— Gabriella', { fontFamily: 'Arial', fontSize: '24px', color: '#39435F', fontStyle: 'italic' }).setOrigin(1, 0.5).setVisible(false);
        this.letterPanel = this.add.container(0, 0, [
            this.add.image(512, 384, 'final-message').setDisplaySize(1000, 740), this.letterText, this.letterCount, this.signature
        ]).setDepth(140);
        this.letterIndex = 0; this.showLetterPage();
    }

    private showLetterPage ()
    {
        this.signatureTimer?.remove(false); this.signature.setVisible(false); this.signed = false;
        this.letterText.setText(this.letterPages[this.letterIndex]);
        this.letterCount.setText(`${this.letterIndex + 1} / ${this.letterPages.length}`);
        const last = this.letterIndex === this.letterPages.length - 1;
        this.hint.setText(last ? '← — Página anterior' : 'E — Próxima página • ← — Página anterior').setVisible(true).setDepth(150);
        if (last) this.signatureTimer = this.time.delayedCall(2500, () => {
            this.signature.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.signature, alpha: 1, duration: 800, onComplete: () => {
                this.signed = true; this.hint.setText('E — Continuar • ← — Página anterior');
            } });
        });
    }

    private updateLetter (e: boolean, left: boolean)
    {
        if (left && this.letterIndex > 0)
        {
            this.tweens.killTweensOf(this.signature); this.letterIndex--; this.showLetterPage();
        }
        else if (e && this.letterIndex < this.letterPages.length - 1) { this.letterIndex++; this.showLetterPage(); }
        else if (e && this.signed)
        {
            this.state = 'pause'; this.hint.setVisible(false);
            this.tweens.add({ targets: this.letterPanel, alpha: 0, duration: 1500, onComplete: () => {
                this.letterPanel.destroy(); this.showCouple();
            } });
        }
    }

    private showCouple ()
    {
        this.state = 'pause'; this.couple.setVisible(true).setAlpha(0).setScale(0.34);
        this.tweens.add({ targets: this.couple, alpha: 1, scale: 0.36, duration: 1400 });
        this.time.delayedCall(4000, () => {
            const names = this.label(512, 575, 'Gabriella + Lucas', 25).setDepth(145);
            this.time.delayedCall(1500, () => {
                names.destroy(); this.startDialog(script.last, () => this.showContinue());
            });
        });
    }

    private showContinue ()
    {
        this.state = 'transition'; this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.couple.setVisible(false); this.world.setVisible(false);
            this.add.image(512, 340, 'final-continue').setScale(0.75).setDepth(140);
            const title = this.add.text(512, 480, 'CONTINUA...', { fontFamily: 'Arial', fontSize: '30px', fontStyle: 'bold', color: '#1E2438' }).setOrigin(0.5).setDepth(145).setAlpha(0);
            const subtitle = this.add.text(512, 602, 'O resto do mapa ainda está sendo desenhado.', { fontFamily: 'Arial', fontSize: '21px', color: '#F4EBDD', align: 'center', wordWrap: { width: 480 } }).setOrigin(0.5).setDepth(145).setAlpha(0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.state = 'end'; this.registry.set('finaleComplete', true);
                this.tweens.add({ targets: title, alpha: 1, duration: 1800 });
                this.tweens.add({ targets: subtitle, alpha: 1, delay: 1300, duration: 1400 });
                this.time.delayedCall(3800, () => {
                    this.add.graphics().setDepth(145).lineStyle(2, 0xD8B36A, 0.6).lineBetween(420, 660, 604, 660);
                    this.add.circle(604, 660, 4, 0xD8B36A).setDepth(145);
                });
                this.time.delayedCall(6000, () => { this.endReady = true; this.hint.setText('E — Voltar ao início').setAlpha(0.65).setVisible(true); });
            });
            this.cameras.main.fadeIn(1400, 30, 36, 56);
        });
        this.cameras.main.fadeOut(1500, 30, 36, 56);
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

}
