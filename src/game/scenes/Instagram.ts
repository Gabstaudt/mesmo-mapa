import * as Phaser from 'phaser';

type StoryStep = {
    type: 'narration' | 'message' | 'thought';
    speaker: 'Narrador' | 'Gabriella' | 'Lucas';
    text: string;
};

export class Instagram extends Phaser.Scene
{
    private dialogBackground!: Phaser.GameObjects.Image;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;

    private gabriellaPortrait!: Phaser.GameObjects.Image;
    private lucasPortrait!: Phaser.GameObjects.Image;

    private advanceKey!: Phaser.Input.Keyboard.Key;

    private stepIndex = 0;

    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private currentFullText = '';

    private storySteps: StoryStep[] = [
        {
            type: 'narration',
            speaker: 'Narrador',
            text: 'Foi justamente quando a distância apareceu que a conversa começou.'
        },
        {
            type: 'message',
            speaker: 'Lucas',
            text: 'Então... você vai passar mesmo três meses em Santa Catarina?'
        },
        {
            type: 'thought',
            speaker: 'Gabriella',
            text: 'Engraçado. A gente se via há tanto tempo e só agora começava a conversar.'
        },
        {
            type: 'message',
            speaker: 'Gabriella',
            text: 'Vou sim. Mas acho que agora a gente vai ter assunto.'
        },
        {
            type: 'thought',
            speaker: 'Lucas',
            text: 'Talvez esse tenha sido o começo de alguma coisa.'
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
        // FUNDO
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
            170,
            height - 180,
            'gabriella-portrait'
        );

        this.gabriellaPortrait.setScale(0.23);
        this.gabriellaPortrait.setDepth(150);
        this.gabriellaPortrait.setVisible(false);

        // -------------------------
        // RETRATO LUCAS
        // -------------------------

        this.lucasPortrait = this.add.image(
            width - 170,
            height - 180,
            'lucas-portrait'
        );

        this.lucasPortrait.setScale(0.23);
        this.lucasPortrait.setDepth(150);
        this.lucasPortrait.setVisible(false);

        // -------------------------
        // CAIXA DE DIÁLOGO
        // -------------------------

        this.dialogBackground = this.add.image(
            width / 2,
            height - 115,
            'dialog-box'
        );

        this.dialogBackground.setDisplaySize(780, 180);
        this.dialogBackground.setDepth(200);

        // Texto
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

        // Nome
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
        // CONTROLE
        // -------------------------

        this.advanceKey = this.input.keyboard!.addKey('E');

        // Começa a história
        this.showCurrentStep();
    }

    update ()
    {
        if (Phaser.Input.Keyboard.JustDown(this.advanceKey))
        {
            if (this.isTyping)
            {
                this.finishTyping();
            }
            else
            {
                this.nextStep();
            }
        }
    }

    private showCurrentStep ()
    {
        const currentStep = this.storySteps[this.stepIndex];

        this.dialogName.setText(currentStep.speaker);

        this.updatePortraits(currentStep);

        this.startTyping(currentStep.text);
    }

    private updatePortraits (step: StoryStep)
    {
        this.gabriellaPortrait.setVisible(false);
        this.lucasPortrait.setVisible(false);

        if (step.speaker === 'Gabriella')
        {
            this.gabriellaPortrait.setVisible(true);
        }

        if (step.speaker === 'Lucas')
        {
            this.lucasPortrait.setVisible(true);
        }
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
            this.finishScene();
            return;
        }

        this.showCurrentStep();
    }

    private finishScene ()
    {
        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
        this.dialogName.setVisible(false);

        this.gabriellaPortrait.setVisible(false);
        this.lucasPortrait.setVisible(false);

        this.showMemoryCard();
    }

    private showMemoryCard ()
    {
        const { width, height } = this.scale;

        const memoryCard = this.add.image(
            width / 2,
            height / 2,
            'memory-card'
        );

        memoryCard.setDisplaySize(600, 340);
        memoryCard.setDepth(300);

        const title = this.add.text(
            width / 2,
            height / 2 - 20,
            'Nova memória',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#1E2438',
                fontStyle: 'bold'
            }
        );

        title.setOrigin(0.5);
        title.setDepth(301);

        const subtitle = this.add.text(
            width / 2,
            height / 2 + 30,
            'Foi aqui que a conversa começou.',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#39435F',
                align: 'center'
            }
        );

        subtitle.setOrigin(0.5);
        subtitle.setDepth(301);
    }
}