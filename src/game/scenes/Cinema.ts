import * as Phaser from 'phaser';

type Line = { speaker: 'Narrador' | 'Gabriella' | 'Lucas'; text: string; portrait?: string; pauseAfter?: number; lightsUp?: boolean };
type CinemaState = 'transition' | 'lobby' | 'dialog' | 'pause' | 'checkpoint' | 'memory';

// Roteiro fornecido por Gabriella; dramatização do jogo, não uma transcrição real.
const conversations: Record<'intro' | 'ticket' | 'popcorn' | 'beforeRoom' | 'room', Line[]> = {
    intro: [
        { speaker: 'Narrador', text: 'Primeiro encontro fora de casa.' },
        { speaker: 'Narrador', text: 'Ou, como eles provavelmente chamariam…' },
        { speaker: 'Gabriella', text: 'Só um cinema.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Claro.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Super casual.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Com você? Nunca.', portrait: 'lucas-portrait' },
    ],
    ticket: [
        { speaker: 'Gabriella', text: 'Tu trouxe o ingresso?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Trouxe.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tem certeza?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Gabriella.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Só conferindo.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você perguntou três vezes.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Agora são quatro.', portrait: 'gabriella-portrait' },
    ],
    popcorn: [
        { speaker: 'Gabriella', text: 'Pipoca?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Óbvio.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Grande?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você vai dizer que não quer e comer metade.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Mentira.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tá.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Talvez.', portrait: 'gabriella-portrait' },
    ],
    beforeRoom: [
        { speaker: 'Narrador', text: 'Parecia só um passeio.' },
        { speaker: 'Narrador', text: 'Mas aos poucos, qualquer lugar começava a ficar mais importante quando os dois estavam juntos.' },
        { speaker: 'Gabriella', text: 'E olha…', portrait: 'gabriella-portrait' },
        { speaker: 'Gabriella', text: 'No cinema ninguém vê nada.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Isso era pra me tranquilizar?', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Não.', portrait: 'gabriella-portrait' },
    ],
    room: [
        { speaker: 'Narrador', text: 'Primeiro cinema juntos.' },
        { speaker: 'Narrador', text: 'Animais Fantásticos: Os Segredos de Dumbledore.', pauseAfter: 1000 },
        { speaker: 'Gabriella', text: 'Eu quero pipoca.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Eu sabia.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Como assim?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você falou disso lá fora.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'E continuo querendo.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tá aqui.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Obrigada, amor.', portrait: 'gabriella-portrait', pauseAfter: 3000 },
        { speaker: 'Gabriella', text: 'Tu entendeu isso?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Mais ou menos.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Eu também não.', portrait: 'gabriella-portrait', pauseAfter: 1000 },
        { speaker: 'Gabriella', text: 'Depois tu me explica.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Mas eu acabei de falar que não entendi.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tu dá teu jeito.', portrait: 'gabriella-portrait', pauseAfter: 2500 },
        { speaker: 'Gabriella', text: 'Amor.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Hum?', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Me dá mais pipoca.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tá na tua mão.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Mas eu quero daí.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'É a mesma pipoca.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Lucas.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tá bom.', portrait: 'lucas-portrait', pauseAfter: 2500 },
        { speaker: 'Lucas', text: 'Tu vai assistir?', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Tô assistindo.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você já falou comigo umas cinco vezes.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'E daí?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Nada.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Eu gosto de comentar.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Eu percebi.', portrait: 'lucas-portrait', pauseAfter: 2500 },
        { speaker: 'Gabriella', text: 'Gostou?', portrait: 'gabriella-portrait', lightsUp: true },
        { speaker: 'Lucas', text: 'Gostei.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Eu também.', portrait: 'gabriella-portrait', pauseAfter: 1000 },
        { speaker: 'Gabriella', text: 'Mas gostei mais do rolê.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Também.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Vamos de novo outro dia?', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Vamos.', portrait: 'lucas-portrait' },
        { speaker: 'Narrador', text: 'Não aconteceu nada extraordinário.' },
        { speaker: 'Narrador', text: 'Vocês foram ao cinema.' },
        { speaker: 'Narrador', text: 'Dividiram pipoca.' },
        { speaker: 'Narrador', text: 'Conversaram mais do que deveriam durante o filme.', pauseAfter: 1200 },
        { speaker: 'Narrador', text: 'E foi justamente por ser tão simples que virou memória.' },
    ],
};

export class Cinema extends Phaser.Scene
{
    private state: CinemaState = 'transition';
    private background!: Phaser.GameObjects.Image;
    private portrait!: Phaser.GameObjects.Image;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private lobbyUI!: Phaser.GameObjects.Container;
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private movement!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    private entrance!: Phaser.GameObjects.Zone;
    private entranceLabel!: Phaser.GameObjects.Text;
    private pauseEvent?: Phaser.Time.TimerEvent;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';
    private promptText!: Phaser.GameObjects.Text;
    private labels: Phaser.GameObjects.Text[] = [];
    private objects: Phaser.GameObjects.Image[] = [];
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private visited = [false, false];
    private lines: Line[] = [];
    private lineIndex = 0;
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private afterDialog: () => void = () => {};

    constructor () { super('Cinema'); }

    create ()
    {
        const { width, height } = this.scale;
        this.state = 'transition';
        this.visited = [false, false];
        this.labels = [];
        this.objects = [];
        this.isTyping = false;
        this.typingEvent = undefined;
        this.pauseEvent = undefined;
        this.textPages = [];
        this.pageIndex = 0;

        this.background = this.add.image(width / 2, height / 2, 'cinema-lobby')
            .setDisplaySize(width, height);
        this.portrait = this.add.image(145, height - 240, 'gabriella-portrait')
            .setScale(0.22).setDepth(150).setVisible(false);

        this.physics.world.setBounds(60, height * 0.70, width - 120, height * 0.27);
        this.lucas = this.physics.add.image(width * 0.48, height * 0.86, 'lucas-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20);
        this.lucas.body!.setSize(180, 80);
        this.lucas.body!.setOffset((this.lucas.width - 180) / 2, this.lucas.height - 80);
        this.lucas.setCollideWorldBounds(true);
        this.gabriella = this.add.image(width * 0.65, height * 0.86, 'gabriella-front')
            .setOrigin(0.5, 1).setScale(0.16).setDepth(20);
        this.entrance = this.add.zone(width * 0.50, height * 0.70, 100, 80);
        this.entranceLabel = this.add.text(this.entrance.x, height * 0.62, 'Sala de cinema', {
            fontFamily: 'Arial', fontSize: '20px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setVisible(false);
        ['cinema-ticket', 'popcorn'].forEach((key, index) => {
            const x = width * (index === 0 ? 0.25 : 0.83);
            const object = this.add.image(x, height * 0.65, key);
            object.setScale(220 / object.width);
            this.objects.push(object);
            const label = this.add.text(x, height * 0.73, index === 0 ? 'Ingressos' : 'Pipoca', {
                fontFamily: 'Arial', fontSize: '20px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(25);
            this.labels.push(label);
        });
        this.lobbyUI = this.add.container(0, 0).setDepth(100).setVisible(false);
        const promptBackground = this.add.image(width / 2, height - 75, 'interaction-prompt')
            .setDisplaySize(390, 105);
        this.promptText = this.add.text(width / 2, height - 75, '', {
            fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.lobbyUI.add([promptBackground, this.promptText]);

        const box = this.add.image(width / 2, height - 115, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(width / 2 - 180, height - 140, '', {
            fontFamily: 'Arial', fontSize: '24px', color: '#1E2438',
            wordWrap: { width: 480 }, lineSpacing: 8
        });
        this.dialogName = this.add.text(width / 2 - 115, height - 164, '', {
            fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD',
            fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName])
            .setDepth(200).setVisible(false);

        const keyboard = this.input.keyboard!;
        this.advanceKey = keyboard.addKey('E');
        this.movement = { up: keyboard.addKey('W'), down: keyboard.addKey('S'),
            left: keyboard.addKey('A'), right: keyboard.addKey('D') };
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => this.startDialog(conversations.intro, () => this.showLobby()));
        this.cameras.main.fadeIn(1200, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false);
            this.pauseEvent?.remove(false);
        });
    }

    update ()
    {
        const advance = Phaser.Input.Keyboard.JustDown(this.advanceKey);
        this.lucas.setVelocity(0);
        if (this.state === 'lobby')
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
            // Aproximação pelo chão abaixo dos objetos, sem atravessar a parede do lobby.
            const nearbyObject = this.objects.findIndex(object =>
                Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y,
                    object.x, this.scale.height * 0.76) < 110);
            const nearEntrance = this.visited[0] && Phaser.Math.Distance.Between(
                this.lucas.x, this.lucas.y, this.entrance.x, this.entrance.y) < 110;
            this.lobbyUI.setVisible(nearbyObject !== -1 || nearEntrance);
            this.promptText.setText(nearbyObject === 0 ? 'E — Ver os ingressos' :
                nearbyObject === 1 ? 'E — Dividir a pipoca' : 'E — Entrar na sala');
            if (!advance) return;
            if (nearbyObject !== -1)
            {
                this.startDialog(nearbyObject === 0 ? conversations.ticket : conversations.popcorn, () => {
                    this.visited[nearbyObject] = true;
                    this.labels[nearbyObject].setText(nearbyObject === 0 ? 'Ingressos ✓' : 'Pipoca ✓');
                    this.showLobby();
                });
            }
            else if (nearEntrance)
                this.startDialog(conversations.beforeRoom, () => this.enterRoom());
        }
        else if (this.state === 'dialog' && advance)
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
                const pause = this.lines[this.lineIndex].pauseAfter;
                if (pause)
                {
                    this.state = 'pause';
                    this.dialog.setVisible(false);
                    this.portrait.setVisible(false);
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
            this.state = 'transition';
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => this.scene.start('Parents'));
            this.cameras.main.fadeOut(1200, 30, 36, 56);
        }
    }

    private showLobby ()
    {
        this.state = 'lobby';
        this.entranceLabel.setVisible(this.visited[0]);
    }

    private nextLine ()
    {
        if (++this.lineIndex < this.lines.length) this.showLine();
        else
        {
            this.dialog.setVisible(false);
            this.portrait.setVisible(false);
            this.afterDialog();
        }
    }

    private startDialog (lines: Line[], onComplete: () => void)
    {
        this.state = 'dialog';
        this.lucas.setVelocity(0);
        this.lobbyUI.setVisible(false);
        this.dialog.setVisible(true);
        this.lines = lines;
        this.lineIndex = 0;
        this.afterDialog = onComplete;
        this.showLine();
    }

    private showLine ()
    {
        this.typingEvent?.remove(false);
        const line = this.lines[this.lineIndex];
        this.dialog.setVisible(true);
        if (line.lightsUp) {
            const light = this.add.rectangle(512, 384, 1024, 768, 0xF4EBDD, 1).setAlpha(0).setDepth(5);
            this.tweens.add({ targets: light, alpha: 0.16, duration: 2200, ease: 'Sine.InOut' });
        }
        this.dialogName.setText(line.speaker);
        this.dialogText.setText('');
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

    private enterRoom ()
    {
        this.state = 'transition';
        this.lucas.setVelocity(0);
        this.lobbyUI.setVisible(false);
        const ticket = this.add.image(this.objects[0].x, this.objects[0].y, 'cinema-ticket')
            .setScale(this.objects[0].scaleX).setDepth(280);
        this.tweens.add({ targets: ticket, x: this.scale.width / 2, y: this.scale.height / 2,
            scaleX: 1800 / ticket.width, scaleY: 1800 / ticket.width,
            duration: 650, ease: 'Cubic.In', onComplete: () => {
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    ticket.destroy();
                    this.lucas.setVisible(false);
                    this.gabriella.setVisible(false);
                    this.objects.forEach(object => object.setVisible(false));
                    this.labels.forEach(label => label.setVisible(false));
                    this.entranceLabel.setVisible(false);
                    this.background.setTexture('cinema-room').setDisplaySize(this.scale.width, this.scale.height);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
                        () => this.startDialog(conversations.room, () => this.showMemory()));
                    this.cameras.main.fadeIn(1200, 30, 36, 56);
                });
                this.cameras.main.fadeOut(650, 30, 36, 56);
            }
        });
    }

    private showMemory ()
    {
        const { width, height } = this.scale;
        this.state = 'checkpoint';
        const frame = this.add.rectangle(width / 2, height / 2, width - 64, height - 64)
            .setStrokeStyle(8, 0xF4EBDD).setDepth(250);
        this.time.delayedCall(1600, () => {
            frame.destroy();
            this.add.rectangle(width / 2, height / 2, width, height, 0x1E2438, 0.55).setDepth(299);
            this.add.image(width / 2, height / 2, 'memory-card').setDisplaySize(600, 850).setDepth(300);
            this.add.text(width / 2, height / 2 - 20, 'Só um cinema', {
                fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height / 2 + 30, 'Animais Fantásticos, pipoca e mais uma primeira vez juntos.', {
                fontFamily: 'Arial', fontSize: '20px', color: '#39435F',
                align: 'center', wordWrap: { width: 420 }
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height - 65, 'E — Conhecer os pais', {
                fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 12, y: 8 }
            }).setOrigin(0.5).setDepth(302);
            this.state = 'memory';
        });
    }
}
