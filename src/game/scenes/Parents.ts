import * as Phaser from 'phaser';

type ParentsLine = { speaker: string; text: string; portrait?: string; thought?: boolean; pauseAfter?: number };

export class Parents extends Phaser.Scene
{
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private prompt!: Phaser.GameObjects.Container;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private keepsake!: Phaser.GameObjects.Image;
    private door!: Phaser.GameObjects.Image;
    private entrance!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Image;
    private state: 'entering' | 'outside' | 'inside' | 'dialog' | 'pause' | 'memory' = 'entering';
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private movement!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    private promptText!: Phaser.GameObjects.Text;
    private activeLines: ParentsLine[] = [];
    private afterDialog: () => void = () => {};
    private pauseEvent?: Phaser.Time.TimerEvent;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';

    private readonly doorLines: ParentsLine[] = [
        { speaker: 'Lucas', text: 'Tá.', portrait: 'lucas-portrait', thought: true },
        { speaker: 'Lucas', text: 'É só conhecer os pais dela.', portrait: 'lucas-portrait', thought: true, pauseAfter: 700 },
        { speaker: 'Lucas', text: 'Tranquilo.', portrait: 'lucas-portrait', thought: true, pauseAfter: 900 },
        { speaker: 'Lucas', text: 'Super tranquilo.', portrait: 'lucas-portrait', thought: true },
        { speaker: 'Narrador', text: 'Ele não estava tranquilo.' }
    ];
    private readonly objectLines: ParentsLine[] = [
        { speaker: 'Lucas', text: 'Ótimo.', portrait: 'lucas-portrait', thought: true },
        { speaker: 'Lucas', text: 'Até o porta-retrato tá me julgando.', portrait: 'lucas-portrait', thought: true }
    ];
    private lineIndex = 0;
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;

    // Roteiro fornecido por Gabriella para Conhecendo os Pais.
    private readonly lines: ParentsLine[] = [
        { speaker: 'Gabriella', text: 'Tá nervoso?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Não.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tá sim.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Não tô.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Lucas.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Talvez um pouco.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'KKKKKKKK', portrait: 'gabriella-portrait' },
        { speaker: 'Gabriella', text: 'Relaxa.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Fácil falar.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Eles não vão te comer.', portrait: 'gabriella-portrait', pauseAfter: 800 },
        { speaker: 'Lucas', text: 'Essa frase não ajudou.', portrait: 'lucas-portrait' },
        { speaker: 'Mãe', text: 'Então esse é o Lucas?' },
        { speaker: 'Gabriella', text: 'É.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Oi.', portrait: 'lucas-portrait', pauseAfter: 800 },
        { speaker: 'Lucas', text: 'Prazer.', portrait: 'lucas-portrait' },
        { speaker: 'Pai', text: 'Fica à vontade.' },
        { speaker: 'Lucas', text: 'Obrigado.', portrait: 'lucas-portrait', pauseAfter: 800 },
        { speaker: 'Gabriella', text: 'Viu?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'O quê?', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Sobreviveu.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Por enquanto.', portrait: 'lucas-portrait' },
        { speaker: 'Narrador', text: 'Pode parecer só mais uma apresentação.' },
        { speaker: 'Narrador', text: 'Mas algumas pessoas começam a fazer parte da sua vida muito antes de você perceber o tamanho que vão ocupar nela.' },
        { speaker: 'Lucas', text: 'Então essa é a família dela.', portrait: 'lucas-portrait', thought: true, pauseAfter: 800 },
        { speaker: 'Lucas', text: 'Agora faz um pouco mais de sentido.', portrait: 'lucas-portrait', thought: true },
        { speaker: 'Gabriella', text: 'Foi tão ruim assim?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Já passei por situações piores.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tipo?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você escolhendo onde a gente vai comer.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Nem sou eu que escolho.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Exatamente.', portrait: 'lucas-portrait' },
    ];

    constructor ()
    {
        super('Parents');
    }

    create ()
    {
        const { width, height } = this.scale;
        this.state = 'entering';
        this.lineIndex = 0;
        this.isTyping = false;
        this.typingEvent = undefined;
        this.pauseEvent = undefined;
        this.activeLines = [];
        this.textPages = [];
        this.pageIndex = 0;

        this.background = this.add.image(width / 2, height / 2, 'parents-house')
            .setDisplaySize(width, height).setVisible(false);
        // A porta isolada compõe a entrada; a sala só é revelada após o primeiro diálogo.
        const wall = this.add.rectangle(width / 2, height / 2, width, height, 0x39435F);
        const floor = this.add.rectangle(width / 2, height * 0.85, width, height * 0.30, 0x1E2438);
        this.door = this.add.image(width * 0.62, height * 0.70, 'parents-front-door').setOrigin(0.5, 1);
        this.door.setScale(500 / this.door.height);
        this.entrance = this.add.container(0, 0, [wall, floor, this.door]);

        this.physics.world.setBounds(55, height * 0.69, width - 110, height * 0.28);
        this.lucas = this.physics.add.image(width * 0.32, height * 0.81, 'lucas-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20);
        this.lucas.body!.setSize(180, 80);
        this.lucas.body!.setOffset((this.lucas.width - 180) / 2, this.lucas.height - 80);
        this.lucas.setCollideWorldBounds(true);
        this.gabriella = this.add.image(width * 0.52, height * 0.92, 'gabriella-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20).setVisible(false);
        this.keepsake = this.add.image(width * 0.84, height * 0.79, 'parents-living-room-object')
            .setOrigin(0.5, 1).setVisible(false);
        this.keepsake.setScale(160 / this.keepsake.width);
        this.portrait = this.add.image(145, height - 240, 'gabriella-portrait')
            .setScale(0.22).setDepth(150).setVisible(false);

        const promptBackground = this.add.image(width / 2, height - 75, 'interaction-prompt')
            .setDisplaySize(390, 105);
        this.promptText = this.add.text(width / 2, height - 75, 'Pressione E', {
            fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBackground, this.promptText])
            .setDepth(100).setVisible(false);

        const dialogBackground = this.add.image(width / 2, height - 115, 'dialog-box')
            .setDisplaySize(780, 180);
        this.dialogText = this.add.text(width / 2 - 180, height - 140, '', {
            fontFamily: 'Arial', fontSize: '24px', color: '#1E2438',
            wordWrap: { width: 480 }, lineSpacing: 8
        });
        this.dialogName = this.add.text(width / 2 - 115, height - 164, 'Narrador', {
            fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD',
            fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [dialogBackground, this.dialogText, this.dialogName])
            .setDepth(200).setVisible(false);

        const keyboard = this.input.keyboard!;
        this.advanceKey = keyboard.addKey('E');
        this.movement = { up: keyboard.addKey('W'), down: keyboard.addKey('S'),
            left: keyboard.addKey('A'), right: keyboard.addKey('D') };
        this.cameras.main.fadeIn(1200, 30, 36, 56);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
            this.state = 'outside';
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false);
            this.pauseEvent?.remove(false);
        });
    }

    update ()
    {
        const advance = Phaser.Input.Keyboard.JustDown(this.advanceKey);
        this.lucas.setVelocity(0);
        if (this.state === 'outside' || this.state === 'inside')
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
            const distanceTo = (target: Phaser.GameObjects.Image) =>
                Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y, target.x, target.y);
            if (this.state === 'outside')
            {
                const nearDoor = distanceTo(this.door) < 145;
                this.prompt.setVisible(nearDoor);
                if (nearDoor && advance) this.startDialog(this.doorLines, () => this.enterHouse());
            }
            else
            {
                const nearGabriella = distanceTo(this.gabriella) < 115;
                const nearObject = distanceTo(this.keepsake) < 110;
                this.prompt.setVisible(nearGabriella || nearObject);
                if (advance && nearGabriella) this.startDialog(this.lines, () => this.showMemory());
                else if (advance && nearObject)
                    this.startDialog(this.objectLines, () => { this.state = 'inside'; });
            }
            return;
        }
        if (this.state === 'dialog' && advance)
        {
            if (this.isTyping)
            {
                this.typingEvent?.remove(false);
                this.dialogText.setText(this.currentFullText);
                this.isTyping = false;
            }
            else if (this.pageIndex + 1 < this.textPages.length)
                this.startTyping(this.textPages[++this.pageIndex]);
            else
            {
                const pause = this.activeLines[this.lineIndex].pauseAfter;
                if (pause)
                {
                    this.state = 'pause';
                    this.pauseEvent = this.time.delayedCall(pause, () => {
                        this.state = 'dialog';
                        this.nextLine();
                    });
                }
                else this.nextLine();
            }
        }
        else if (this.state === 'memory' && advance)
        {
            // Próximo capítulo ainda não implementado; permite rever esta memória.
            this.scene.restart();
        }
    }

    private enterHouse ()
    {
        this.state = 'entering';
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            const { width, height } = this.scale;
            this.entrance.setVisible(false);
            this.background.setVisible(true);
            this.keepsake.setVisible(true);
            this.gabriella.setVisible(true);
            // Corredor livre entre a mesa de centro e o aparador.
            this.physics.world.setBounds(width * 0.48, height * 0.65, width * 0.38, height * 0.32);
            this.lucas.setPosition(width * 0.72, height * 0.72).setTexture('lucas-front').setFlipX(false);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
                () => { this.state = 'inside'; });
            this.cameras.main.fadeIn(800, 30, 36, 56);
        });
        this.cameras.main.fadeOut(800, 30, 36, 56);
    }

    private startDialog (lines: ParentsLine[], afterDialog: () => void)
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
        else
        {
            this.dialog.setVisible(false);
            this.portrait.setVisible(false);
            this.afterDialog();
        }
    }

    private showLine ()
    {
        const line = this.activeLines[this.lineIndex];
        this.dialogName.setText(line.speaker);
        // Itálico diferencia pensamentos das falas em voz alta, mantendo o nome e o layout.
        this.dialogText.setFontStyle(line.thought ? 'italic' : 'normal');
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait)
        {
            this.portrait.setTexture(line.portrait);
            this.portrait.setX(line.speaker === 'Lucas' ? this.scale.width - 145 : 145);
        }
        const wrapped = this.dialogText.getWrappedText(line.text);
        this.textPages = [];
        for (let i = 0; i < wrapped.length; i += 2)
            this.textPages.push(wrapped.slice(i, i + 2).join(' '));
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
        this.typingEvent = this.time.addEvent({ delay: 35, repeat: text.length - 1,
            callback: () => {
                this.dialogText.setText(text.substring(0, ++character));
                if (character === text.length) this.isTyping = false;
            }
        });
    }

    private showMemory ()
    {
        const { width, height } = this.scale;
        this.state = 'memory';
        this.lucas.setVelocity(0).setVisible(false);
        this.gabriella.setVisible(false);
        this.dialog.setVisible(false);
        this.portrait.setVisible(false);
        this.prompt.setVisible(false);
        this.add.rectangle(width / 2, height / 2, width, height, 0x1E2438, 0.55).setDepth(299);
        this.add.image(width / 2, height / 2, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(width / 2, height / 2 - 20, 'Mais perto', {
            fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(width / 2, height / 2 + 30,
            'Conhecer a família também era conhecer um pouco mais dela.', {
                fontFamily: 'Arial', fontSize: '20px', color: '#39435F',
                align: 'center', wordWrap: { width: 420 }
            }).setOrigin(0.5).setDepth(301);
        this.add.text(width / 2, height - 65, 'E — Rever memória', {
            fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setDepth(302);
    }
}
