import * as Phaser from 'phaser';

export class FirstMeeting extends Phaser.Scene
{
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private prompt!: Phaser.GameObjects.Container;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private keepsake!: Phaser.GameObjects.Image;
    private state: 'entering' | 'object' | 'dialog' | 'checkpoint' | 'memory' = 'entering';
    private lineIndex = 0;
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;

    // Falas dramatizadas e editáveis, autorizadas para o jogo; não são transcrições reais.
    // O porta-retrato representa a lembrança; não pressupõe um objeto do encontro real.
    private readonly lines = [
        { speaker: 'Narrador', text: 'Depois das conversas pelo Instagram, vocês se viram pessoalmente.' },
        { speaker: 'Gabriella', text: 'Então… agora não dá pra ficar ensaiando a resposta antes de mandar.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Me dá pelo menos uns três segundos pra pensar.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tá bom. Mas eu vou ficar olhando.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Aí você não tá ajudando muito.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'É bom conversar com você assim, de pertinho.', portrait: 'gabriella-romantic' },
        { speaker: 'Lucas', text: 'Também tô gostando. A gente podia fazer isso mais vezes.', portrait: 'lucas-romantic' },
        { speaker: 'Narrador', text: 'Gabriella acredita que foi nesse encontro que percebeu que gostava de Lucas.' }
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

        this.add.image(width / 2, height / 2, 'first-meeting-background')
            .setDisplaySize(width, height);

        // Mantém a proporção original do asset sobre a mesa lateral direita.
        this.keepsake = this.add.image(width * 0.84, height * 0.55, 'first-meeting-object');
        this.keepsake.setScale(170 / this.keepsake.width);
        this.portrait = this.add.image(145, height - 240, 'gabriella-portrait')
            .setScale(0.22).setDepth(150).setVisible(false);

        const promptBackground = this.add.image(width / 2, height - 75, 'interaction-prompt')
            .setDisplaySize(390, 105);
        const promptText = this.add.text(width / 2, height - 75, 'E — Observar a fotografia', {
            fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBackground, promptText])
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

        this.advanceKey = this.input.keyboard!.addKey('E');
        this.cameras.main.fadeIn(1200, 30, 36, 56);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
            this.state = 'object';
            this.prompt.setVisible(true);
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false);
        });
    }

    update ()
    {
        if (!Phaser.Input.Keyboard.JustDown(this.advanceKey)) return;

        if (this.state === 'object')
        {
            this.state = 'dialog';
            this.prompt.setVisible(false);
            this.dialog.setVisible(true);
            this.showLine();
        }
        else if (this.state === 'dialog')
        {
            if (this.isTyping)
            {
                this.typingEvent?.remove(false);
                this.dialogText.setText(this.lines[this.lineIndex].text);
                this.isTyping = false;
                return;
            }

            this.lineIndex++;
            if (this.lineIndex < this.lines.length) this.showLine();
            else this.showCheckpoint();
        }
        else if (this.state === 'memory')
        {
            this.state = 'entering';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => this.scene.start('Cinema'));
            this.cameras.main.fadeOut(1200, 30, 36, 56);
        }
    }

    private showLine ()
    {
        this.typingEvent?.remove(false);
        const line = this.lines[this.lineIndex];
        const text = line.text;
        this.dialogName.setText(line.speaker);
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait)
        {
            this.portrait.setTexture(line.portrait);
            this.portrait.setX(line.speaker === 'Lucas' ? this.scale.width - 145 : 145);
        }
        this.dialogText.setText('');
        this.isTyping = true;
        let character = 0;
        this.typingEvent = this.time.addEvent({
            delay: 35,
            repeat: text.length - 1,
            callback: () => {
                character++;
                this.dialogText.setText(text.substring(0, character));
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
        const caption = this.add.text(width / 2, height - 95, 'Primeiro encontro', {
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
            this.add.text(width / 2, height / 2 - 20, 'Primeiro encontro', {
                fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height / 2 + 30, 'Uma memória de vocês, agora frente a frente.', {
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
