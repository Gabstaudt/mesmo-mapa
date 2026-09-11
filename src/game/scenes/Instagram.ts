import * as Phaser from 'phaser';

type StoryStep = {
    type: 'narration' | 'thought' | 'message';
    speaker: 'Narrador' | 'Gabriella' | 'Lucas';
    text: string;
    portrait?: 'gabriella' | 'lucas';
};

export class Instagram extends Phaser.Scene
{
    private dialogBackground!: Phaser.GameObjects.Image;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;

    private gabriellaPortrait!: Phaser.GameObjects.Image;
    private lucasPortrait!: Phaser.GameObjects.Image;

    private memoryCard!: Phaser.GameObjects.Image;
    private memoryTitle!: Phaser.GameObjects.Text;
    private memorySubtitle!: Phaser.GameObjects.Text;

    private advanceKey!: Phaser.Input.Keyboard.Key;

    private stepIndex = 0;

    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private currentFullText = '';

    private memoryVisible = false;

    private storySteps: StoryStep[] = [
        {
            type: 'narration',
            speaker: 'Narrador',
            text: 'Foi justamente quando a distância apareceu que a conversa começou.'
        },
        {
            type: 'message',
            speaker: 'Lucas',
            text: 'E foi pelo Instagram que vocês finalmente começaram a se falar de verdade.'
        },
        {
            type: 'thought',
            speaker: 'Gabriella',
            text: 'Engraçado pensar que a gente se via há tanto tempo e só agora começava a conversar.',
            portrait: 'gabriella'
        },
        {
            type: 'message',
            speaker: 'Gabriella',
            text: 'Eu estava indo para Santa Catarina e passaria três meses lá.'
        },
        {
            type: 'thought',
            speaker: 'Lucas',
            text: 'Talvez nenhum dos dois soubesse ainda o quanto aquela conversa ia mudar tudo.',
            portrait: 'lucas'
        }
    ];

    constructor ()
    {
        super('Instagram');
    }

    create ()
    {
        const { width, height } = this.scale;

        // -------------------------
        // BACKGROUND
        // -------------------------

        const background = this.add.image(
            width / 2,
            height / 2,
            'instagram-background'
        );

        background.setDisplaySize(width, height);

        // -------------------------
        // RETRATO GABRIELLA
        // -------------------------

        this.gabriellaPortrait = this.add.image(
            145,
            height - 240,
            'gabriella-portrait'
        );

        this.gabriellaPortrait.setScale(0.22);
        this.gabriellaPortrait.setDepth(150);
        this.gabriellaPortrait.setVisible(false);

        // -------------------------
        // RETRATO LUCAS
        // -------------------------

        this.lucasPortrait = this.add.image(
            width - 145,
            height - 240,
            'lucas-portrait'
        );

        this.lucasPortrait.setScale(0.22);
        this.lucasPortrait.setDepth(150);
        this.lucasPortrait.setVisible(false);

        // -------------------------
        // CAIXA DE DIÁLOGO
        // Mesmos valores usados na escola
        // -------------------------

        this.dialogBackground = this.add.image(
            width / 2,
            height - 115,
            'dialog-box'
        );

        this.dialogBackground.setDisplaySize(780, 180);
        this.dialogBackground.setDepth(200);

        // Texto principal
        this.dialogText = this.add.text(
            width / 2 - 180,
            height - 140,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#1E2438',

                wordWrap: {
                    width: 480
                },

                lineSpacing: 8
            }
        );

        this.dialogText.setDepth(201);

        // Nome de quem está falando
        this.dialogName = this.add.text(
            width / 2 - 115,
            height - 164,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#F4EBDD',
                fontStyle: 'bold',
                align: 'center'
            }
        );

        this.dialogName.setOrigin(0.5);
        this.dialogName.setDepth(202);

        // -------------------------
        // MEMORY CARD
        // -------------------------

        this.memoryCard = this.add.image(
            width / 2,
            height / 2,
            'memory-card'
        );

        this.memoryCard.setDisplaySize(600, 850);
        this.memoryCard.setDepth(300);
        this.memoryCard.setVisible(false);

        this.memoryTitle = this.add.text(
            width / 2,
            height / 2 - 20,
            'Nova memória',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#1E2438',
                fontStyle: 'bold'
            }
        );

        this.memoryTitle.setOrigin(0.5);
        this.memoryTitle.setDepth(301);
        this.memoryTitle.setVisible(false);

        this.memorySubtitle = this.add.text(
            width / 2,
            height / 2 + 30,
            'Foi aqui que a conversa começou.',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#39435F',
                align: 'center',

                wordWrap: {
                    width: 420
                }
            }
        );

        this.memorySubtitle.setOrigin(0.5);
        this.memorySubtitle.setDepth(301);
        this.memorySubtitle.setVisible(false);

        // -------------------------
        // CONTROLE
        // -------------------------

        this.advanceKey = this.input.keyboard!.addKey('E');

        this.showCurrentStep();
    }

    update ()
    {
        if (!Phaser.Input.Keyboard.JustDown(this.advanceKey))
        {
            return;
        }

        // Se o memory card estiver na tela,
        // E finaliza essa memória
        if (this.memoryVisible)
        {
            this.finishMemory();
            return;
        }

        // Se ainda está digitando,
        // E completa a frase
        if (this.isTyping)
        {
            this.finishTyping();
            return;
        }

        // Caso contrário, próxima fala
        this.nextStep();
    }

    private showCurrentStep ()
    {
        const currentStep = this.storySteps[this.stepIndex];

        // Esconde ambos antes de decidir qual mostrar
        this.gabriellaPortrait.setVisible(false);
        this.lucasPortrait.setVisible(false);

        this.dialogName.setText(currentStep.speaker);

        // Mostra retrato somente quando definido
        if (currentStep.portrait === 'gabriella')
        {
            this.gabriellaPortrait.setVisible(true);
        }

        if (currentStep.portrait === 'lucas')
        {
            this.lucasPortrait.setVisible(true);
        }

        this.startTyping(currentStep.text);
    }

    private startTyping (text: string)
    {
        if (this.typingEvent)
        {
            this.typingEvent.remove(false);
        }

        this.dialogText.setText('');

        this.currentFullText = text;
        this.isTyping = true;

        let currentCharacter = 0;

        this.typingEvent = this.time.addEvent({
            delay: 35,
            repeat: text.length - 1,

            callback: () =>
            {
                currentCharacter++;

                this.dialogText.setText(
                    text.substring(0, currentCharacter)
                );

                if (currentCharacter >= text.length)
                {
                    this.isTyping = false;
                }
            }
        });
    }

    private finishTyping ()
    {
        if (this.typingEvent)
        {
            this.typingEvent.remove(false);
        }

        this.dialogText.setText(this.currentFullText);
        this.isTyping = false;
    }

    private nextStep ()
    {
        this.stepIndex++;

        if (this.stepIndex >= this.storySteps.length)
        {
            this.showMemoryCard();
            return;
        }

        this.showCurrentStep();
    }

    private showMemoryCard ()
    {
        // Esconde tudo da conversa
        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
        this.dialogName.setVisible(false);

        this.gabriellaPortrait.setVisible(false);
        this.lucasPortrait.setVisible(false);

        // Mostra card
        this.memoryCard.setVisible(true);
        this.memoryTitle.setVisible(true);
        this.memorySubtitle.setVisible(true);

        this.memoryVisible = true;
    }

    private finishMemory ()
    {
        this.memoryVisible = false;

        this.memoryCard.setVisible(false);
        this.memoryTitle.setVisible(false);
        this.memorySubtitle.setVisible(false);

        // Fade para próxima cena
        this.cameras.main.fadeOut(
            1200,
            30,
            36,
            56
        );

        // Depois vamos colocar:
        // this.scene.start('FirstMeeting');
    }
}