import * as Phaser from 'phaser';
import { routineDialogues as script, type RoutineLine } from '../data/routineDialogues';

type Stage = 'ready' | 'choice' | 'moinho' | 'series' | 'everyday';
type State = 'transition' | 'explore' | 'select' | 'seriesSelect' | 'dialog' | 'pause' | 'card';
type Point = { id: string; label: string; image: Phaser.GameObjects.Image; x: number; y: number;
    lines: RoutineLine[]; marker: Phaser.GameObjects.Text };

export class Routine extends Phaser.Scene
{
    private music!: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private stage: Stage = 'ready';
    private state: State = 'transition';
    private background!: Phaser.GameObjects.Image;
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private movement!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    private arrows!: Phaser.Types.Input.Keyboard.CursorKeys;
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private hud!: Phaser.GameObjects.Text;
    private feedback!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Container;
    private promptText!: Phaser.GameObjects.Text;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private shade!: Phaser.GameObjects.Rectangle;
    private points: Point[] = [];
    private visited = new Set<string>();
    private tried = new Set<number>();
    private selected = 0;
    private choices!: Phaser.GameObjects.Container;
    private choiceLabels: Phaser.GameObjects.Text[] = [];
    private selection!: Phaser.GameObjects.Rectangle;
    private specialChoice!: Phaser.GameObjects.Text;
    private sofaCouple?: Phaser.GameObjects.Image;
    private seriesPanel?: Phaser.GameObjects.Container;
    private seriesSelection?: Phaser.GameObjects.Rectangle;
    private seriesIndex = 0;
    private card!: Phaser.GameObjects.Container;
    private activeLines: RoutineLine[] = [];
    private lineIndex = 0;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private afterDialog: () => void = () => {};

    constructor () { super('Routine'); }

    create ()
    {
        const { width, height } = this.scale;
        this.music = this.sound.add('shared-path-ambient', { loop: true, volume: 0.10 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.destroy());
        this.stage = 'ready';
        this.state = 'transition';
        this.points = [];
        this.visited = new Set();
        this.tried = new Set();
        this.choiceLabels = [];
        this.selected = 0;
        this.isTyping = false;
        this.typingEvent = undefined;
        this.sofaCouple = undefined;
        this.seriesPanel = undefined;
        this.seriesSelection = undefined;
        this.seriesIndex = 0;
        this.background = this.add.image(width / 2, height / 2, 'routine-ready').setDisplaySize(width, height);
        this.lucas = this.physics.add.image(width * 0.68, height * 0.87, 'lucas-front')
            .setOrigin(0.5, 1).setScale(0.30).setDepth(20);
        this.lucas.body!.setSize(180, 80);
        this.lucas.body!.setOffset((this.lucas.width - 180) / 2, this.lucas.height - 80);
        this.lucas.setCollideWorldBounds(true);
        this.gabriella = this.add.image(width * 0.84, height * 0.84, 'gabriella-front')
            .setOrigin(0.5, 1).setScale(0.28).setDepth(20).setVisible(false);
        this.shade = this.add.rectangle(width / 2, height / 2, width, height, 0x1E2438, 0.3)
            .setDepth(90).setVisible(false);
        this.hud = this.add.text(28, 25, '', { fontFamily: 'Arial', fontSize: '22px',
            color: '#F4EBDD', backgroundColor: '#1E2438', padding: { x: 12, y: 8 } }).setDepth(100);
        this.feedback = this.add.text(width / 2, 110, '', { fontFamily: 'Arial', fontSize: '24px',
            color: '#F4EBDD', backgroundColor: '#1E2438', padding: { x: 16, y: 10 }, align: 'center'
        }).setOrigin(0.5).setDepth(101).setVisible(false);
        const promptBox = this.add.image(width / 2, height - 75, 'interaction-prompt').setDisplaySize(390, 105);
        this.promptText = this.add.text(width / 2, height - 75, 'Pressione E', { fontFamily: 'Arial',
            fontSize: '22px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBox, this.promptText]).setDepth(100).setVisible(false);
        const box = this.add.image(width / 2, height - 115, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(width / 2 - 180, height - 140, '', { fontFamily: 'Arial',
            fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(width / 2 - 115, height - 164, '', { fontFamily: 'Arial',
            fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, height - 240, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.choices = this.add.container(0, 0).setDepth(100).setVisible(false);
        this.card = this.add.container(0, 0).setDepth(300).setVisible(false);
        const keyboard = this.input.keyboard!;
        this.advanceKey = keyboard.addKey('E');
        this.movement = { up: keyboard.addKey('W'), down: keyboard.addKey('S'), left: keyboard.addKey('A'), right: keyboard.addKey('D') };
        this.arrows = keyboard.createCursorKeys();
        this.setupReady();
        this.state = 'transition';
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this.state = 'explore'; });
        this.cameras.main.fadeIn(1000, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.typingEvent?.remove(false));
    }

    private addPoint (id: string, label: string, texture: string, x: number, y: number,
        displayWidth: number, targetX: number, targetY: number, lines: RoutineLine[])
    {
        const image = this.add.image(x, y, texture).setDepth(10);
        image.setScale(displayWidth / image.width);
        const marker = this.add.text(targetX, targetY - 50, label, { fontFamily: 'Arial', fontSize: '18px',
            color: '#F4EBDD', backgroundColor: '#1E2438', padding: { x: 7, y: 4 } }).setOrigin(0.5).setDepth(25);
        if (id === 'mirror') {
            image.setFlipX(true);
            marker.setPosition(image.x, image.y + image.displayHeight / 2 + 10).setOrigin(0.5, 0);
        }
        this.points.push({ id, label, image, x: targetX, y: targetY, lines, marker });
    }

    private setupReady ()
    {
        this.physics.world.setBounds(70, 560, 884, 180);
        this.addPoint('clock', 'Relógio', 'routine-clock', 660, 110, 175, 720, 585, script.clock);
        this.addPoint('phone', 'Celular', 'routine-phone', 240, 670, 140, 320, 700, script.waitingPhone);
        this.addPoint('mirror', 'Espelho', 'routine-mirror', 950, 420, 400, 920, 625, script.mirror);
        this.updateCounter();
    }

    private setupEveryday ()
    {
        this.stage = 'everyday';
        this.visited.clear();
        this.background.setTexture('routine-everyday').setDisplaySize(this.scale.width, this.scale.height);
        this.physics.world.setBounds(65, 560, 894, 185);
        this.lucas.setPosition(545, 690).setVisible(true);
        this.gabriella.setPosition(685, 670).setVisible(true);
        this.addPoint('phone', 'Celular', 'routine-phone', 755, 545, 125, 785, 635, script.phone);
        this.addPoint('controller', 'Controle', 'routine-controller', 545, 555, 105, 555, 625, script.controller);
        this.addPoint('food', 'Comida', 'routine-food', 320, 555, 140, 330, 645, script.food);
        this.addPoint('photo', 'Foto', 'routine-photo', 110, 520, 110, 115, 625, script.photo);
        this.updateCounter();
        this.hud.setVisible(true);
        this.state = 'explore';
    }

    update ()
    {
        const advance = Phaser.Input.Keyboard.JustDown(this.advanceKey);
        // Consumir eventos fora da seleção impede teclas antigas de mudar uma escolha futura.
        const left = [this.movement.left, this.arrows.left].map(key => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
        const right = [this.movement.right, this.arrows.right].map(key => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
        this.lucas.setVelocity(0);
        if (this.state === 'explore')
        {
            const x = Number(this.movement.right.isDown) - Number(this.movement.left.isDown);
            const y = Number(this.movement.down.isDown) - Number(this.movement.up.isDown);
            if (x || y)
            {
                this.lucas.setVelocity(x, y);
                this.lucas.body!.velocity.normalize().scale(180);
                if (y) this.lucas.setTexture(y < 0 ? 'lucas-back' : 'lucas-front').setFlipX(false);
                else this.lucas.setTexture('lucas-left').setFlipX(x > 0);
            }
            const point = this.points.filter(p => !this.visited.has(p.id))
                .map(p => ({ point: p, distance: Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y, p.x, p.y) }))
                .filter(p => p.distance < 90).sort((a, b) => a.distance - b.distance)[0]?.point;
            this.prompt.setVisible(!!point);
            if (point && advance)
            {
                // A fotografia desacelera o clima sem alterar o ritmo dos controles.
                if (this.stage === 'everyday' && point.id === 'photo') this.music.setVolume(0.025);
                this.shade.setVisible(this.stage === 'everyday' && point.id === 'photo');
                if (this.stage === 'moinho') {
                    this.hud.setVisible(false);
                    point.marker.setVisible(false);
                    this.lucas.setTexture('lucas-front').setFlipX(false);
                    this.startDialog(point.lines, () => this.changeStage(() => this.setupSeries()));
                }
                else this.startDialog(point.lines, () => this.collectPoint(point));
            }
        }
        else if (this.state === 'select')
        {
            const count = this.tried.size === 3 ? 4 : 3;
            if (left || right) { this.selected = (this.selected + (left ? -1 : 1) + count) % count; this.updateChoice(); }
            if (advance) this.chooseFood();
        }
        else if (this.state === 'seriesSelect')
        {
            if (left || right) {
                this.seriesIndex = (this.seriesIndex + (left ? -1 : 1) + 3) % 3;
                this.seriesSelection!.setX(282 + this.seriesIndex * 230);
            }
            if (advance && this.seriesIndex === 1) {
                this.seriesPanel!.setVisible(false);
                this.startDialog([{ speaker: 'Gabriella', text: 'Bora.' }], () => {
                    this.state = 'pause';
                    this.time.delayedCall(1800, () => this.startDialog(script.seriesWatch, () =>
                        this.changeStage(() => {
                            this.sofaCouple?.destroy(); this.seriesPanel?.destroy();
                            this.setupEveryday();
                        })));
                });
            }
        }
        else if (this.state === 'dialog' && advance)
        {
            if (this.isTyping)
            {
                this.typingEvent?.remove(false);
                this.dialogText.setText(this.currentFullText);
                this.isTyping = false;
            }
            else if (this.pageIndex + 1 < this.textPages.length) this.startTyping(this.textPages[++this.pageIndex]);
            else
            {
                const pause = this.activeLines[this.lineIndex].pauseAfter;
                if (pause)
                {
                    this.state = 'pause';
                    if (this.stage === 'series' || this.activeLines[this.lineIndex].laughAfter || this.stage === 'moinho') {
                        this.dialog.setVisible(false);
                        this.portrait.setVisible(false);
                        if (this.activeLines[this.lineIndex].laughAfter) {
                            const who = this.activeLines[this.lineIndex].laughWho;
                            const targets = this.stage === 'series' ? [this.sofaCouple!] :
                                who === 'Lucas' ? [this.lucas] : who === 'Gabriella' ? [this.gabriella] : [this.lucas, this.gabriella];
                            this.tweens.add({ targets, y: '-=3', duration: 120,
                                yoyo: true, repeat: 2, ease: 'Sine.InOut' });
                        }
                    }
                    this.time.delayedCall(pause, () => { this.state = 'dialog'; this.nextLine(); });
                }
                else this.nextLine();
            }
        }
        else if (this.state === 'card' && advance)
        {
            this.card.setVisible(false);
            this.shade.setVisible(false);
            this.startDialog(script.ending, () => this.finishRoutine());
        }
    }

    private collectPoint (point: Point)
    {
        this.visited.add(point.id);
        point.marker.setText(`${point.label} ✓`).setColor('#D8B36A');
        this.updateCounter();
        this.state = 'pause';
        if (this.stage === 'everyday')
        {
            // Coleção da partida, disponível às próximas cenas/ao futuro álbum.
            const collection: Record<string, { title: string; text: string }> = { ...this.registry.get('routineMemories') };
            collection[point.id] = { title: point.label, text: point.lines.map(line => line.text).join('\n') };
            this.registry.set('routineMemories', collection);
            this.feedback.setText(`MEMÓRIA ENCONTRADA\n${this.visited.size}/4`).setVisible(true);
        }
        this.time.delayedCall(this.stage === 'everyday' ? 1300 : 500, () => {
            this.feedback.setVisible(false);
            this.music.setVolume(0.10);
            this.shade.setVisible(false);
            if (this.visited.size < this.points.length) { this.state = 'explore'; return; }
            if (this.stage === 'ready')
            {
                this.gabriella.setAlpha(0).setVisible(true);
                this.tweens.add({ targets: this.gabriella, alpha: 1, duration: 650,
                    onComplete: () => this.startDialog(script.ready, () => this.changeStage(() => this.setupChoice())) });
            }
            else this.showCard();
        });
    }

    private updateCounter ()
    {
        this.hud.setText(this.stage === 'ready' ? `Enquanto isso... ${this.visited.size}/3` : `Memórias encontradas: ${this.visited.size}/4`);
    }

    private changeStage (setup: () => void)
    {
        this.state = 'transition';
        this.lucas.setVelocity(0);
        this.prompt.setVisible(false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.points.forEach(point => { point.image.destroy(); point.marker.destroy(); });
            this.points = [];
            setup();
            const nextState = this.stage === 'choice' ? 'select' : 'explore';
            this.state = 'transition';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                if (this.stage === 'series') {
                    this.tweens.add({ targets: this.sofaCouple, alpha: 1, duration: 600,
                        onComplete: () => this.startDialog(script.seriesIntro, () => this.showSeriesSelection()) });
                }
                else {
                    this.state = nextState;
                    if (this.stage === 'moinho') this.time.delayedCall(2600, () => {
                        if (this.stage === 'moinho') this.hud.setVisible(false);
                    });
                }
            });
            this.cameras.main.fadeIn(900, 30, 36, 56);
        });
        this.cameras.main.fadeOut(900, 30, 36, 56);
    }

    private setupChoice ()
    {
        this.stage = 'choice';
        this.background.setTexture('routine-choice').setDisplaySize(this.scale.width, this.scale.height);
        this.lucas.setVisible(false);
        this.gabriella.setVisible(false);
        this.hud.setText('Onde a gente vai comer?');
        this.selection = this.add.rectangle(260, 375, 235, 230, 0x1E2438, 0.65).setStrokeStyle(2, 0xD8B36A);
        this.choices.add(this.selection);
        ['Hambúrguer', 'Pizza', 'Restaurante'].forEach((label, index) => {
            const x = 260 + index * 250;
            const food = this.add.image(x, 345, `food-option-${index + 1}`);
            // O primeiro asset tem mais margem transparente; mantém tamanhos visuais próximos.
            food.setScale((index === 0 ? 510 : 195) / food.width);
            const text = this.add.text(x, 450, label, { fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 8, y: 5 } }).setOrigin(0.5);
            this.choiceLabels.push(text);
            this.choices.add([food, text]);
        });
        this.specialChoice = this.add.text(512, 550, 'Qualquer lugar', { fontFamily: 'Arial', fontSize: '24px',
            color: '#F4EBDD', backgroundColor: '#1E2438', padding: { x: 16, y: 10 } }).setOrigin(0.5).setVisible(false);
        const hint = this.add.text(512, 620, 'A / D ou ← / → para escolher • E para confirmar', {
            fontFamily: 'Arial', fontSize: '20px', color: '#F4EBDD', backgroundColor: '#1E2438', padding: { x: 10, y: 6 }
        }).setOrigin(0.5);
        this.choices.add([this.specialChoice, hint]).setVisible(true);
        this.updateChoice();
    }

    private updateChoice ()
    {
        this.selection.setPosition(this.selected === 3 ? 512 : 260 + this.selected * 250, this.selected === 3 ? 550 : 375)
            .setSize(this.selected === 3 ? 300 : 235, this.selected === 3 ? 70 : 230);
        this.specialChoice.setVisible(this.tried.size === 3);
    }

    private chooseFood ()
    {
        const index = this.selected;
        this.choices.setVisible(false);
        if (index === 3)
        {
            this.startDialog(script.moinhoDecision, () => this.changeStage(() => this.setupMoinho()));
            return;
        }
        this.startDialog([script.burger, script.pizza, script.restaurant][index], () => {
            this.tried.add(index);
            this.choiceLabels[index].setText(['Hambúrguer', 'Pizza', 'Restaurante'][index] + ' ✓');
            if (this.tried.size === 3) this.selected = 3;
            this.updateChoice();
            this.choices.setVisible(true);
            this.state = 'select';
        });
    }

    private setupMoinho ()
    {
        this.stage = 'moinho';
        this.visited.clear();
        this.background.setTexture('routine-moinho').setDisplaySize(this.scale.width, this.scale.height);
        this.choices.setVisible(false); this.feedback.setVisible(false); this.shade.setVisible(false);
        this.hud.setText('VELHO MOINHO').setVisible(true);
        this.physics.world.setBounds(300, 630, 475, 110);
        this.lucas.setPosition(335, 720).setTexture('lucas-front').setFlipX(false).setVisible(true);
        this.gabriella.setPosition(720, 670).setVisible(true);
        // A mesa fica junto ao corredor; o ponto de interação está no chão à frente dela.
        this.addPoint('moinho-table', 'Nossa mesa', 'velho-moinho-table', 620, 545, 650, 580, 675, script.moinho);
    }

    private setupSeries ()
    {
        this.stage = 'series';
        this.background.setTexture('routine-series').setDisplaySize(this.scale.width, this.scale.height);
        this.lucas.setVisible(false); this.gabriella.setVisible(false);
        this.hud.setVisible(false);
        // Alinhado ao sofá esquerdo, deixando a televisão livre à direita.
        this.sofaCouple = this.add.image(325, 565, 'couple-sofa-series').setOrigin(0.5, 1).setDepth(20).setAlpha(0);
        this.sofaCouple.setScale(530 / this.sofaCouple.width);
    }

    private showSeriesSelection ()
    {
        this.seriesIndex = 0;
        const panel = this.add.image(512, 320, 'series-selection-panel').setDisplaySize(820, 448);
        const interior = this.add.rectangle(512, 350, 760, 325, 0x39435F);
        const title = this.add.text(512, 150, 'O que vamos assistir?', {
            fontFamily: 'Arial', fontSize: '23px', color: '#F4EBDD'
        }).setOrigin(0.5);
        this.seriesSelection = this.add.rectangle(282, 330, 216, 192, 0x1E2438)
            .setStrokeStyle(3, 0xD8B36A);
        this.seriesPanel = this.add.container(0, 0, [panel, interior, title, this.seriesSelection]).setDepth(110);
        ['Série 1', 'Casamento\nàs Cegas', 'Série 3'].forEach((text, index) => {
            this.seriesPanel!.add(this.add.text(282 + index * 230, 330, text, {
                fontFamily: 'Arial', fontSize: '23px', color: '#F4EBDD', align: 'center'
            }).setOrigin(0.5));
        });
        this.seriesPanel.add(this.add.text(512, 470, '← / → para escolher • E para assistir Casamento às Cegas', {
            fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD'
        }).setOrigin(0.5));
        this.state = 'seriesSelect';
    }

    private startDialog (lines: RoutineLine[], afterDialog: () => void)
    {
        this.lucas.setVelocity(0);
        this.state = 'dialog';
        this.activeLines = lines;
        this.lineIndex = 0;
        this.afterDialog = afterDialog;
        this.prompt.setVisible(false);
        this.dialog.setVisible(true);
        this.showLine();
    }

    private nextLine ()
    {
        if (++this.lineIndex < this.activeLines.length) this.showLine();
        else { this.dialog.setVisible(false); this.portrait.setVisible(false); this.afterDialog(); }
    }

    private showLine ()
    {
        this.dialog.setVisible(true);
        const line = this.activeLines[this.lineIndex];
        this.dialogName.setText(line.speaker);
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait) this.portrait.setTexture(line.portrait).setX(line.speaker === 'Lucas' ? this.scale.width - 145 : 145);
        const wrapped = this.dialogText.getWrappedText(line.text);
        this.textPages = [];
        for (let i = 0; i < wrapped.length; i += 2) this.textPages.push(wrapped.slice(i, i + 2).join(' '));
        this.pageIndex = 0;
        this.startTyping(this.textPages[0]);
    }

    private startTyping (text: string)
    {
        this.typingEvent?.remove(false);
        this.currentFullText = text;
        this.dialogText.setText('');
        this.isTyping = true;
        let character = 0;
        this.typingEvent = this.time.addEvent({ delay: 35, repeat: text.length - 1, callback: () => {
            this.dialogText.setText(text.substring(0, ++character));
            if (character === text.length) this.isTyping = false;
        } });
    }

    private showCard ()
    {
        this.music.setVolume(0.04);
        this.state = 'card';
        this.hud.setVisible(false);
        this.shade.setVisible(true);
        const memory = this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850);
        const title = this.add.text(512, 364, 'O cotidiano', { fontFamily: 'Arial', fontSize: '26px',
            color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        const subtitle = this.add.text(512, 414, 'Foi no meio das coisas pequenas que vocês começaram a construir uma vida juntos.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5);
        const hint = this.add.text(512, 703, 'E — Continuar', { fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 8 } }).setOrigin(0.5);
        this.card.add([memory, title, subtitle, hint]).setVisible(true);
    }

    private finishRoutine ()
    {
        this.state = 'transition';
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => this.scene.start('Maturity'));
        this.cameras.main.fadeOut(1200, 30, 36, 56);
    }
}
