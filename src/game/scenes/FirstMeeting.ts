import * as Phaser from 'phaser';

type MeetingLine = { speaker: string; text: string; portrait?: string; thought?: boolean; pauseAfter?: number };

export class FirstMeeting extends Phaser.Scene
{
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private prompt!: Phaser.GameObjects.Container;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private keepsake!: Phaser.GameObjects.Image;
    private state: 'entering' | 'waiting' | 'arrived' | 'dialog' | 'pause' | 'checkpoint' | 'memory' = 'entering';
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private movement!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    private promptText!: Phaser.GameObjects.Text;
    private arrivalNotice!: Phaser.GameObjects.Text;
    private activeLines: MeetingLine[] = [];
    private afterDialog: () => void = () => {};
    private pauseEvent?: Phaser.Time.TimerEvent;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';

    private readonly waitingLines: MeetingLine[] = [
        { speaker: 'Lucas', text: 'Tá.', thought: true, portrait: 'lucas-portrait' },
        { speaker: 'Lucas', text: 'Normal.', thought: true, portrait: 'lucas-portrait', pauseAfter: 900 },
        { speaker: 'Lucas', text: 'É só ela vindo aqui.', thought: true, portrait: 'lucas-portrait', pauseAfter: 700 },
        { speaker: 'Lucas', text: 'Normal.', thought: true, portrait: 'lucas-portrait' }
    ];
    private lineIndex = 0;
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;

    // Roteiro fornecido por Gabriella para a cena; não é uma transcrição do WhatsApp.
    private readonly lines: MeetingLine[] = [
        { speaker: 'Narrador', text: 'Depois de tanta conversa…' },
        { speaker: 'Narrador', text: 'finalmente não tinha uma tela no meio.' },
        { speaker: 'Gabriella', text: 'Oi.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Oi.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Só isso?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Eu tava preparando uma fala melhor.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Preparou por quanto tempo?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tempo suficiente pra esquecer.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Muito bom.', portrait: 'gabriella-portrait' },
        { speaker: 'Gabriella', text: 'Nota 10.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Obrigado pelo apoio.', portrait: 'lucas-portrait' },
        { speaker: 'Narrador', text: 'E foi ali que alguma coisa ficou diferente.' },
        { speaker: 'Gabriella', text: 'Eu acho que foi aqui.', portrait: 'gabriella-romantic', thought: true },
        { speaker: 'Gabriella', text: 'Foi aqui que eu percebi que gostava dele de verdade.', portrait: 'gabriella-romantic', thought: true },
        { speaker: 'Lucas', text: 'Tá tudo bem?', portrait: 'lucas-romantic' },
        { speaker: 'Gabriella', text: 'Tá.', portrait: 'gabriella-romantic', pauseAfter: 900 },
        { speaker: 'Gabriella', text: 'Tô só pensando.', portrait: 'gabriella-romantic' },
        { speaker: 'Lucas', text: 'Perigoso.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Cala a boca.', portrait: 'gabriella-portrait' },
        { speaker: 'Gabriella', text: 'Você é bem mais quieto pessoalmente.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você compensa pelos dois.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Alguém precisa manter a conversa viva.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Nunca esteve em risco.', portrait: 'lucas-portrait' },
        { speaker: 'Narrador', text: 'Não teve música tocando.' },
        { speaker: 'Narrador', text: 'Não teve cena perfeita.' },
        { speaker: 'Narrador', text: 'Só teve vocês dois.' },
        { speaker: 'Narrador', text: 'E aparentemente isso já era suficiente.' },
    ];

    constructor ()
    {
        super('FirstMeeting');
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

        this.add.image(width / 2, height / 2, 'first-meeting-background')
            .setDisplaySize(width, height);

        // Faixa de chão livre à frente dos móveis. A posição dos sprites marca os pés.
        this.physics.world.setBounds(55, height * 0.77, width - 110, height * 0.21);
        this.lucas = this.physics.add.image(width * 0.72, height * 0.88, 'lucas-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20);
        this.lucas.body!.setSize(180, 80);
        this.lucas.body!.setOffset((this.lucas.width - 180) / 2, this.lucas.height - 80);
        this.lucas.setCollideWorldBounds(true);
        this.gabriella = this.add.image(width * 0.20, height * 0.88, 'gabriella-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20).setVisible(false);
        this.arrivalNotice = this.add.text(width / 2, 60, 'Gabriella chegou.', {
            fontFamily: 'Arial', fontSize: '24px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        // Mantém a proporção original do asset sobre a mesa lateral direita.
        this.keepsake = this.add.image(width * 0.84, height * 0.55, 'first-meeting-object');
        this.keepsake.setScale(170 / this.keepsake.width);
        this.portrait = this.add.image(145, height - 240, 'gabriella-portrait')
            .setScale(0.22).setDepth(150).setVisible(false);

        const promptBackground = this.add.image(width / 2, height - 75, 'interaction-prompt')
            .setDisplaySize(390, 105);
        this.promptText = this.add.text(width / 2, height - 75, 'E — Observar a fotografia', {
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
            this.state = 'waiting';
            this.prompt.setVisible(true);
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
        if (this.state === 'waiting' || this.state === 'arrived')
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
            if (this.state === 'arrived')
            {
                this.prompt.setVisible(false);
                if (Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y,
                    this.gabriella.x, this.gabriella.y) < 120)
                {
                    this.state = 'pause';
                    this.lucas.setVelocity(0);
                    this.arrivalNotice.setVisible(false);
                    this.pauseEvent = this.time.delayedCall(800,
                        () => this.startDialog(this.lines, () => this.showCheckpoint()));
                }
                return;
            }
            // O porta-retrato fica sobre a mesa; aproximação pela faixa de chão abaixo dele.
            const nearObject = Math.abs(this.lucas.x - this.keepsake.x) < 85;
            this.prompt.setVisible(true);
            this.promptText.setText(nearObject ? 'E — Observar a fotografia' : 'E — Esperar Gabriella');
            if (advance)
            {
                if (nearObject)
                {
                    // Observação opcional e simbólica; não acrescenta um fato do encontro.
                    this.startDialog([{ speaker: 'Narrador', text: 'Algumas lembranças cabem numa fotografia.' }],
                        () => { this.state = 'waiting'; });
                }
                else this.startDialog(this.waitingLines, () => this.showArrival());
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
            this.state = 'entering';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => this.scene.start('Cinema'));
            this.cameras.main.fadeOut(1200, 30, 36, 56);
        }
    }

    private showArrival ()
    {
        this.state = 'arrived';
        this.gabriella.setAlpha(0).setVisible(true);
        this.arrivalNotice.setVisible(true);
        this.tweens.add({ targets: this.gabriella, alpha: 1, duration: 600 });
    }

    private startDialog (lines: MeetingLine[], afterDialog: () => void)
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

    private showCheckpoint ()
    {
        const { width, height } = this.scale;
        this.state = 'checkpoint';
        this.dialog.setVisible(false);
        this.portrait.setVisible(false);

        // Pausa de fotografia antes de registrar a memória.
        const frame = this.add.rectangle(width / 2, height / 2, width - 64, height - 64)
            .setStrokeStyle(8, 0xF4EBDD).setDepth(250);
        const caption = this.add.text(width / 2, height - 95, 'Finalmente', {
            fontFamily: 'Arial', fontSize: '28px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setDepth(251);

        this.time.delayedCall(1600, () => {
            frame.destroy();
            caption.destroy();
            this.add.rectangle(width / 2, height / 2, width, height, 0x1E2438, 0.55)
                .setDepth(299);
            this.add.image(width / 2, height / 2, 'memory-card')
                .setDisplaySize(600, 850).setDepth(300);
            this.add.text(width / 2, height / 2 - 20, 'Finalmente', {
                fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height / 2 + 30, 'Foi aqui que eu percebi.', {
                fontFamily: 'Arial', fontSize: '20px', color: '#39435F',
                align: 'center', wordWrap: { width: 420 }
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height - 65, 'E — Ir ao cinema', {
                fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 12, y: 8 }
            }).setOrigin(0.5).setDepth(302);
            this.state = 'memory';
        });
    }
}
