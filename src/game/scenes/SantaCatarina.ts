import * as Phaser from 'phaser';
import { travelDialogues as script, type TravelLine } from '../data/travelDialogues';

type Stage = 'route' | 'airport' | 'plane' | 'family' | 'baptism' | 'sleep' | 'paraguay' | 'falls' | 'montage';
type State = 'transition' | 'explore' | 'dialog' | 'pause' | 'montage' | 'card';
type Point = { id: string; x: number; y: number; label: string; lines: TravelLine[]; marker: Phaser.GameObjects.Text; image?: Phaser.GameObjects.Image };

export class SantaCatarina extends Phaser.Scene
{
    private state: State = 'transition';
    private stage: Stage = 'route';
    private world!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Image;
    private lucas!: Phaser.GameObjects.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private objects!: Phaser.GameObjects.Container;
    private points: Point[] = [];
    private items = new Set<string>();
    private shops = new Set<string>();
    private memories = new Set<string>();
    private route!: Phaser.GameObjects.Container;
    private focus!: Phaser.GameObjects.Image;
    private hud!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Container;
    private shade!: Phaser.GameObjects.Rectangle;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private music?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private water?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private activeLines: TravelLine[] = [];
    private lineIndex = 0;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private afterDialog: () => void = () => {};

    constructor () { super('SantaCatarina'); }

    create ()
    {
        this.state = 'transition'; this.stage = 'route'; this.items = new Set(); this.shops = new Set(); this.memories = new Set();
        this.points = []; this.isTyping = false; this.typingEvent = undefined;
        this.world = this.add.container(0, 0);
        this.background = this.add.image(512, 384, 'travel-airport').setDisplaySize(1024, 768).setVisible(false);
        this.objects = this.add.container(0, 0);
        this.lucas = this.add.image(420, 680, 'lucas-front').setOrigin(0.5, 1).setScale(0.10).setVisible(false);
        this.gabriella = this.add.image(480, 685, 'gabriella-front').setOrigin(0.5, 1).setScale(0.10).setVisible(false);
        this.world.add([this.background, this.objects, this.lucas, this.gabriella]);
        this.focus = this.add.image(512, 300, 'travel-photo').setScale(0.55).setDepth(90).setVisible(false);
        this.route = this.add.container(0, 0).setDepth(95).setVisible(false);
        this.hud = this.label(512, 65, '', 21).setDepth(100);
        this.hint = this.label(512, 743, '', 18).setDepth(105).setVisible(false);
        const promptBG = this.add.image(512, 693, 'interaction-prompt').setDisplaySize(390, 105);
        const promptText = this.add.text(512, 693, 'Pressione E', { fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBG, promptText]).setDepth(105).setVisible(false);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.65).setDepth(120).setVisible(false);
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E') as Record<string, Phaser.Input.Keyboard.Key>;
        this.music = this.sound.add('shared-path-ambient', { loop: true, volume: 0.08 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.water = this.sound.add('travel-water', { loop: true, volume: 0.035 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play();
        this.showRoute(['BELÉM', 'SANTA CATARINA'], false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.startDialog(script.entry, () => this.changeStage('airport')));
        this.cameras.main.fadeIn(1000, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.typingEvent?.remove(false); this.music?.destroy(); this.water?.destroy(); });
    }

    private label (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 10, y: 6 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    }

    private showRoute (names: string[], arrived: boolean)
    {
        this.route.removeAll(true); this.route.setVisible(true); this.hud.setVisible(false);
        this.route.add(this.add.image(512, 300, 'travel-route').setDisplaySize(880, 470));
        const x = names.length === 2 ? [255, 755] : [230, 512, 794];
        names.forEach((name, i) => this.route.add(this.label(x[i], 485, name + (arrived ? i === names.length - 1 ? ' ●' : ' ✓' : ''), 18)));
        const line = this.add.graphics(); this.route.add(line);
        const progress = { value: 0 };
        this.tweens.add({ targets: progress, value: arrived ? 1 : 0.55, duration: 1800, onUpdate: () => {
            line.clear().lineStyle(4, 0xD8B36A, 1).beginPath().moveTo(x[0], 440)
                .lineTo(Phaser.Math.Linear(x[0], x[x.length - 1], progress.value), 440).strokePath();
        } });
    }

    private changeStage (stage: Stage)
    {
        this.state = 'transition'; this.prompt.setVisible(false); this.hint.setVisible(false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.setupStage(stage);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.enterStage());
            this.cameras.main.fadeIn(700, 30, 36, 56);
        });
        this.cameras.main.fadeOut(700, 30, 36, 56);
    }

    private setupStage (stage: Stage)
    {
        this.stage = stage; this.objects.removeAll(true); this.points = [];
        this.route.setVisible(false); this.focus.setVisible(false); this.hud.setVisible(true);
        this.background.setVisible(stage !== 'plane').setTexture(stage === 'plane' ? 'travel-airport' : `travel-${stage}`).setDisplaySize(1024, 768).clearTint();
        const playable = ['airport', 'family', 'baptism', 'paraguay', 'falls'].includes(stage);
        this.lucas.setVisible(playable || stage === 'sleep').setTexture('lucas-front').setFlipX(false);
        this.gabriella.setVisible(playable || stage === 'sleep').setTexture('gabriella-front').setFlipX(false);
        this.lucas.setScale(stage === 'falls' ? 0.075 : 0.10); this.gabriella.setScale(stage === 'falls' ? 0.075 : 0.10);
        const positions: Partial<Record<Stage, number[]>> = { airport: [420, 690, 475, 695], family: [130, 720, 410, 720],
            baptism: [365, 710, 420, 715], sleep: [795, 705, 875, 710], paraguay: [300, 700, 350, 708], falls: [940, 580, 895, 570] };
        const position = positions[stage];
        if (position) { this.lucas.setPosition(position[0], position[1]); this.gabriella.setPosition(position[2], position[3]); }
        if (stage === 'airport')
        {
            this.point('suitcase', 365, 635, 'A mala', script.suitcase, 'travel-suitcase', 0.13);
            this.point('ticket', 790, 620, 'A passagem', script.ticket, 'travel-ticket', 0.13);
            this.point('boarding', 300, 545, 'Embarcar', []);
        }
        if (stage === 'family') this.point('family', 410, 720, 'Conversar com Gabriella e a família', script.family);
        if (stage === 'baptism') this.point('godson', 555, 500, 'A lembrança do batizado', script.baptism, 'godson-memory', 0.18);
        if (stage === 'paraguay')
        {
            this.point('shop1', 260, 660, 'Olhar a primeira loja', script.shop1);
            this.point('shop2', 430, 585, 'Explorar as vitrines', script.shop2);
            this.point('shop3', 805, 650, 'Mais uma descoberta', script.shop3);
        }
        if (stage === 'falls')
        {
            this.point('view', 660, 540, 'O mirante', script.falls);
            this.water?.play();
        }
        this.updateHud();
    }

    private enterStage ()
    {
        if (this.stage === 'plane')
        {
            this.hud.setText('Primeira viagem de avião juntos');
            this.focus.setTexture('airplane-window').setScale(0.65).setPosition(512, 300).setAlpha(1).setVisible(true);
            this.startDialog(script.plane, () => this.routeTransition(['BELÉM', 'SANTA CATARINA'], 'family'));
        }
        else if (this.stage === 'sleep')
        {
            this.music?.setVolume(0.035);
            this.startDialog(script.sleep, () => {
                this.state = 'pause';
                this.tweens.add({ targets: this.gabriella, x: 840, duration: 700, onComplete: () => {
                    this.showPhoto([], 'sleep', () => this.changeStage('paraguay'));
                } });
            });
        }
        else { this.state = 'explore'; this.hint.setText('WASD — Caminhar').setVisible(true); }
    }

    private point (id: string, x: number, y: number, label: string, lines: TravelLine[], texture?: string, scale = 0.1)
    {
        const image = texture ? this.add.image(x, y - 30, texture).setScale(scale) : undefined;
        const marker = this.label(x, y + 24, '◇', 20);
        if (image) this.objects.add(image);
        this.objects.add(marker); this.points.push({ id, x, y, label, lines, marker, image });
    }

    private routeTransition (names: string[], next: Stage)
    {
        this.state = 'transition'; this.prompt.setVisible(false); this.hint.setVisible(false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.background.setVisible(false); this.lucas.setVisible(false); this.gabriella.setVisible(false);
            this.objects.removeAll(true); this.focus.setVisible(false); this.showRoute(names, true);
            this.cameras.main.fadeIn(500, 30, 36, 56);
            this.time.delayedCall(2600, () => this.changeStage(next));
        });
        this.cameras.main.fadeOut(600, 30, 36, 56);
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.keys.E);
        if (this.state === 'dialog') { if (e) this.advanceDialog(); return; }
        if (this.state === 'card' && e)
        {
            this.state = 'transition';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Finale'));
            this.cameras.main.fadeOut(1600, 30, 36, 56); return;
        }
        if (this.state !== 'explore') return;
        this.move(delta);
        const point = this.points.find(p => !this.items.has(p.id) && !this.shops.has(p.id) &&
            Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y, p.x, p.y) <= 62);
        const boardingBlocked = point?.id === 'boarding' && this.items.size < 2;
        this.prompt.setVisible(!!point && !boardingBlocked && this.stage !== 'falls');
        this.hint.setText(boardingBlocked ? 'Encontre a mala e a passagem antes de embarcar.' : point?.label || 'WASD — Caminhar');
        if (this.stage === 'falls' && point && Phaser.Math.Distance.Between(this.gabriella.x, this.gabriella.y, point.x, point.y) < 95)
        {
            this.water?.setVolume(0.13); this.music?.setVolume(0.025);
            this.hud.setVisible(false); this.hint.setVisible(false); point.marker.setVisible(false);
            this.state = 'pause';
            this.time.delayedCall(1300, () => this.startDialog(script.falls, () => this.showPhoto(script.photo, 'falls', () => this.startMontage())));
            return;
        }
        if (!e || !point || boardingBlocked) return;
        this.prompt.setVisible(false);
        if (point.id === 'boarding') { this.changeStage('plane'); return; }
        if (this.stage === 'airport')
        {
            this.items.add(point.id); point.image?.setAlpha(0.35); point.marker.setText('✓'); this.updateHud();
            this.startDialog(point.lines, () => { this.state = 'explore'; });
        }
        else if (this.stage === 'family') this.startDialog(point.lines, () => this.changeStage('baptism'));
        else if (this.stage === 'baptism') this.startDialog(point.lines, () => {
            this.remember('baptism'); this.state = 'pause';
            this.time.delayedCall(1500, () => this.changeStage('sleep'));
        });
        else if (this.stage === 'paraguay')
        {
            this.shops.add(point.id); point.marker.setText('✓'); this.updateHud();
            this.startDialog(point.lines, () => {
                if (this.shops.size < 3) this.state = 'explore';
                else this.startDialog(script.paraguayEnd, () => {
                    this.remember('paraguay'); this.state = 'pause';
                    this.time.delayedCall(1500, () => this.routeTransition(['SANTA CATARINA', 'PARAGUAI', 'FOZ DO IGUAÇU'], 'falls'));
                });
            });
        }
    }

    private move (delta: number)
    {
        const dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown), dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
        if (dx || dy)
        {
            const step = Math.min(delta, 40) * 0.18 / Math.hypot(dx, dy);
            if (this.walkable(this.lucas.x + dx * step, this.lucas.y)) this.lucas.x += dx * step;
            if (this.walkable(this.lucas.x, this.lucas.y + dy * step)) this.lucas.y += dy * step;
            this.lucas.setTexture(`lucas-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
            if (this.stage !== 'family') this.gabriella.setTexture(`gabriella-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
        }
        if (this.stage !== 'family')
        {
            this.gabriella.x = Phaser.Math.Linear(this.gabriella.x, this.lucas.x + 50, Math.min(delta / 240, 1));
            this.gabriella.y = Phaser.Math.Linear(this.gabriella.y, this.lucas.y + 8, Math.min(delta / 240, 1));
        }
    }

    private walkable (x: number, y: number)
    {
        if (this.stage === 'family') return x >= 100 && x <= 470 && y >= 690 && y <= 737;
        if (this.stage === 'paraguay') return y >= 560 && y <= 730 &&
            x >= 130 + (730 - y) * 1.6 && x <= 930 - (730 - y) * 0.8;
        const paths: Partial<Record<Stage, number[][]>> = {
            airport: [[420, 700], [380, 635], [550, 600], [800, 620], [900, 600]],
            baptism: [[350, 730], [440, 640], [500, 565], [560, 490]],
            falls: [[975, 590], [850, 555], [730, 535], [630, 515]]
        };
        const path = paths[this.stage]; if (!path) return false;
        const nearPath = (points: number[][], width: number) => points.slice(1).some((b, i) => {
            const a = points[i], vx = b[0] - a[0], vy = b[1] - a[1];
            const t = Phaser.Math.Clamp(((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy), 0, 1);
            return Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy) < width;
        });
        return nearPath(path, this.stage === 'airport' ? 48 : 27) ||
            (this.stage === 'airport' && nearPath([[380, 635], [300, 545]], 38));
    }

    private updateHud ()
    {
        const names: Partial<Record<Stage, string>> = { family: 'Conhecendo a família', baptism: 'O batizado', sleep: 'No fim do dia', falls: 'Cataratas do Iguaçu' };
        this.hud.setText(this.stage === 'airport' ? `ITENS DE VIAGEM ${this.items.size}/2${this.items.size === 2 ? ' • EMBARQUE LIBERADO' : ''}` :
            this.stage === 'paraguay' ? `PARAGUAI • PASSEIO ${this.shops.size}/3\nMEMÓRIAS DA VIAGEM ${this.memories.size}/4` :
            `${names[this.stage] || ''}\nMEMÓRIAS DA VIAGEM ${this.memories.size}/4`);
    }

    private remember (id: string)
    {
        this.memories.add(id); this.registry.set('travelMemories', [...this.memories]);
        this.updateHud(); this.hud.setVisible(true).setText(`MEMÓRIA DA VIAGEM ${this.memories.size}/4${this.memories.size === 4 ? '\nVIAGEM COMPLETA' : ''}`);
    }

    private showPhoto (lines: TravelLine[], memory: string, after: () => void)
    {
        this.state = 'pause'; this.remember(memory);
        this.focus.setTexture('travel-photo').setPosition(512, 295).setScale(0.55).setAlpha(0).setVisible(true);
        this.tweens.add({ targets: this.focus, alpha: 1, duration: 850, onComplete: () => {
            if (lines.length) this.startDialog(lines, after);
            else this.time.delayedCall(1400, after);
        } });
    }

    private startMontage ()
    {
        this.state = 'montage'; this.stage = 'montage'; this.hud.setVisible(false); this.hint.setVisible(false);
        this.lucas.setVisible(false); this.gabriella.setVisible(false); this.objects.setVisible(false);
        this.water?.setVolume(0.025);
        const frames = ['travel-ticket', 'airplane-window', 'travel-family', 'godson-memory', 'travel-sleep', 'travel-paraguay', 'travel-falls', 'travel-photo'];
        let index = 0;
        const frame = () => {
            const key = frames[index], isBackground = ['travel-family', 'travel-sleep', 'travel-paraguay', 'travel-falls'].includes(key);
            this.background.setVisible(isBackground);
            if (isBackground) this.background.setTexture(key).setDisplaySize(1024, 768);
            this.focus.setVisible(!isBackground);
            if (!isBackground) this.focus.setTexture(key).setScale(0.55).setAlpha(1);
            const line = script.montage[Math.max(0, index - 1)];
            this.dialog.setVisible(true); this.dialogName.setText('Narrador'); this.dialogText.setText(line.text);
            index++;
            this.time.delayedCall(2000, () => {
                if (index < frames.length) frame();
                else { this.dialog.setVisible(false); this.closeCircle(); }
            });
        };
        frame();
    }

    private closeCircle ()
    {
        this.focus.setVisible(false); this.background.setVisible(false); this.water?.stop();
        this.startDialog(script.circle.slice(0, 1), () => {
            this.background.setTexture('instagram-background').setDisplaySize(1024, 768).setAlpha(0.7).setVisible(true);
            this.startDialog(script.circle.slice(1, 3), () => {
                this.state = 'transition';
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.background.setTexture('travel-falls').setDisplaySize(1024, 768).setAlpha(1);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
                        () => this.startDialog(script.circle.slice(3).map((line, i) => i === 2 ? { ...line, pauseAfter: 1400 } : line), () => this.showCard()));
                    this.cameras.main.fadeIn(900, 30, 36, 56);
                });
                this.cameras.main.fadeOut(800, 30, 36, 56);
            });
        });
    }
    private startDialog (lines: TravelLine[], afterDialog: () => void)
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
        this.state = 'card'; this.shade.setVisible(true); this.hud.setVisible(false);
        this.registry.set('travelComplete', { title: 'O mesmo lugar', photo: 'travel-photo', memories: [...this.memories] });
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'O mesmo lugar', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'Antes era distância. Dessa vez, vocês foram juntos.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(301);
        this.label(512, 703, 'E — Continuar', 22).setDepth(302);
    }
}
