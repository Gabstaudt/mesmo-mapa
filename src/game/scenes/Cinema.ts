import * as Phaser from 'phaser';

type Line = { speaker: 'Narrador' | 'Gabriella' | 'Lucas'; text: string; portrait?: string };
type CinemaState = 'transition' | 'lobby' | 'dialog' | 'checkpoint' | 'memory';

// Dramatização editável para o jogo, não uma transcrição do primeiro passeio.
// Filme, data, cinema e acontecimentos específicos aguardam o relato de Gabriella.
const conversations: Record<'intro' | 'ticket' | 'popcorn' | 'room', Line[]> = {
    intro: [
        { speaker: 'Narrador', text: 'O primeiro passeio de vocês juntos foi ao cinema.' },
        { speaker: 'Gabriella', text: 'Cinema com você… gostei desse programa.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Então vamos aproveitar. Por onde a gente começa?', portrait: 'lucas-portrait' }
    ],
    ticket: [
        { speaker: 'Lucas', text: 'Dois ingressos. Agora é achar nossos lugares.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Desde que o seu seja do lado do meu.', portrait: 'gabriella-romantic' },
        { speaker: 'Lucas', text: 'Essa parte eu faço questão.', portrait: 'lucas-romantic' }
    ],
    popcorn: [
        { speaker: 'Gabriella', text: 'Só pra combinar: dividir pipoca não é uma competição.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Você tá avisando a mim ou a você mesma?', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'Aos dois. Mas eu fico com o balde.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Tá bom. Só deixa umas pra mim até o filme começar.', portrait: 'lucas-portrait' }
    ],
    room: [
        { speaker: 'Gabriella', text: 'Pronto. Agora tenta prestar atenção no filme.', portrait: 'gabriella-portrait' },
        { speaker: 'Lucas', text: 'Eu tô quietinho. Você que tá puxando assunto.', portrait: 'lucas-portrait' },
        { speaker: 'Gabriella', text: 'É que eu tô gostando de estar aqui com você.', portrait: 'gabriella-romantic' },
        { speaker: 'Lucas', text: 'Eu também. Pode puxar assunto mais um pouquinho.', portrait: 'lucas-romantic' },
        { speaker: 'Narrador', text: 'O primeiro passeio juntos ganhou um lugar na história de vocês.' }
    ]
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
    private selection!: Phaser.GameObjects.Rectangle;
    private promptText!: Phaser.GameObjects.Text;
    private labels: Phaser.GameObjects.Text[] = [];
    private objects: Phaser.GameObjects.Image[] = [];
    private advanceKey!: Phaser.Input.Keyboard.Key;
    private leftKeys!: Phaser.Input.Keyboard.Key[];
    private rightKeys!: Phaser.Input.Keyboard.Key[];
    private selected = 0;
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
        this.selected = 0;
        this.visited = [false, false];
        this.labels = [];
        this.objects = [];
        this.isTyping = false;
        this.typingEvent = undefined;

        this.background = this.add.image(width / 2, height / 2, 'cinema-lobby')
            .setDisplaySize(width, height);
        this.portrait = this.add.image(145, height - 240, 'gabriella-portrait')
            .setScale(0.22).setDepth(150).setVisible(false);

        this.lobbyUI = this.add.container(0, 0).setDepth(100).setVisible(false);
        this.selection = this.add.rectangle(350, 465, 230, 190, 0x1E2438, 0.85)
            .setStrokeStyle(2, 0xD8B36A);
        this.lobbyUI.add(this.selection);
        ['cinema-ticket', 'popcorn'].forEach((key, index) => {
            const x = index === 0 ? 350 : 674;
            const object = this.add.image(x, 445, key);
            object.setScale(290 / object.width);
            this.objects.push(object);
            const label = this.add.text(x, 530, index === 0 ? 'Ingressos' : 'Pipoca', {
                fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            this.labels.push(label);
            this.lobbyUI.add([object, label]);
        });
        const instructions = this.add.text(width / 2, 600, 'A / D ou ← / → para escolher', {
            fontFamily: 'Arial', fontSize: '20px', color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 6 }
        }).setOrigin(0.5);
        const promptBackground = this.add.image(width / 2, height - 75, 'interaction-prompt')
            .setDisplaySize(390, 105);
        this.promptText = this.add.text(width / 2, height - 75, '', {
            fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.lobbyUI.add([instructions, promptBackground, this.promptText]);

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
        this.leftKeys = [keyboard.addKey('A'), keyboard.addKey('LEFT')];
        this.rightKeys = [keyboard.addKey('D'), keyboard.addKey('RIGHT')];
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => this.startDialog(conversations.intro, () => this.showLobby()));
        this.cameras.main.fadeIn(1200, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.typingEvent?.remove(false));
    }

    update ()
    {
        // Consome os eventos mesmo durante transições, evitando ações atrasadas.
        const left = this.leftKeys.map(key => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
        const right = this.rightKeys.map(key => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
        const advance = Phaser.Input.Keyboard.JustDown(this.advanceKey);
        if (this.state === 'lobby')
        {
            if (left || right)
            {
                this.selected = left ? 0 : 1;
                this.updateSelection();
            }
            if (!advance) return;
            if (this.visited.every(Boolean)) { this.enterRoom(); return; }
            const selected = this.selected;
            this.startDialog(selected === 0 ? conversations.ticket : conversations.popcorn, () => {
                this.visited[selected] = true;
                if (!this.visited[1 - selected]) this.selected = 1 - selected;
                this.showLobby();
            });
        }
        else if (this.state === 'dialog' && advance)
        {
            if (this.isTyping)
            {
                this.typingEvent?.remove(false);
                this.dialogText.setText(this.lines[this.lineIndex].text);
                this.isTyping = false;
            }
            else if (++this.lineIndex < this.lines.length) this.showLine();
            else
            {
                this.dialog.setVisible(false);
                this.portrait.setVisible(false);
                this.afterDialog();
            }
        }
        else if (this.state === 'memory' && advance) this.scene.restart();
    }

    private showLobby ()
    {
        this.state = 'lobby';
        this.lobbyUI.setVisible(true);
        this.updateSelection();
    }

    private updateSelection ()
    {
        this.selection.setX(this.selected === 0 ? 350 : 674);
        this.labels.forEach((label, index) => {
            label.setText(`${index === 0 ? 'Ingressos' : 'Pipoca'}${this.visited[index] ? ' ✓' : ''}`);
            this.objects[index].setAlpha(index === this.selected ? 1 : 0.7);
        });
        this.promptText.setText(this.visited.every(Boolean) ? 'E — Entrar na sala' :
            this.selected === 0 ? 'E — Ver os ingressos' : 'E — Dividir a pipoca');
    }

    private startDialog (lines: Line[], onComplete: () => void)
    {
        this.state = 'dialog';
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
        this.dialogName.setText(line.speaker);
        this.dialogText.setText('');
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait)
        {
            this.portrait.setTexture(line.portrait);
            this.portrait.setX(line.speaker === 'Lucas' ? this.scale.width - 145 : 145);
        }
        this.isTyping = true;
        let character = 0;
        this.typingEvent = this.time.addEvent({ delay: 35, repeat: line.text.length - 1,
            callback: () => {
                this.dialogText.setText(line.text.substring(0, ++character));
                if (character === line.text.length) this.isTyping = false;
            }
        });
    }

    private enterRoom ()
    {
        this.state = 'transition';
        this.lobbyUI.setVisible(false);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.background.setTexture('cinema-room').setDisplaySize(this.scale.width, this.scale.height);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
                () => this.startDialog(conversations.room, () => this.showMemory()));
            this.cameras.main.fadeIn(1000, 30, 36, 56);
        });
        this.cameras.main.fadeOut(1000, 30, 36, 56);
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
            this.add.text(width / 2, height / 2 - 20, 'Nosso primeiro cinema', {
                fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height / 2 + 30, 'O primeiro passeio juntos.', {
                fontFamily: 'Arial', fontSize: '20px', color: '#39435F',
                align: 'center', wordWrap: { width: 420 }
            }).setOrigin(0.5).setDepth(301);
            this.add.text(width / 2, height - 65, 'E — Rever memória', {
                fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD',
                backgroundColor: '#1E2438', padding: { x: 12, y: 8 }
            }).setOrigin(0.5).setDepth(302);
            this.state = 'memory';
        });
    }
}
