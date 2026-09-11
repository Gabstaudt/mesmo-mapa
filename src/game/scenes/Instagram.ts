import * as Phaser from 'phaser';

type StoryStep = {
    speaker: 'Narrador' | 'Gabriella' | 'Lucas';
    text: string;
    portrait?: 'gabriella' | 'lucas';
    pauseAfter?: number;
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
    private isTransitioning = false;
    private isPausing = false;
    private pauseEvent?: Phaser.Time.TimerEvent;
    private textPages: string[] = [];
    private pageIndex = 0;

    // Roteiro fornecido por Gabriella: falas narrativas do jogo, não mensagens do Instagram.
    private readonly storySteps: StoryStep[] = [
        { speaker: 'Narrador', text: 'Engraçado como algumas histórias começam.' },
        { speaker: 'Narrador', text: 'Vocês estavam na mesma cidade havia anos.' },
        { speaker: 'Narrador', text: 'Mas foi quando Gabriella estava indo passar três meses em Santa Catarina que vocês finalmente começaram a conversar.' },
        { speaker: 'Gabriella', text: 'Claro.', portrait: 'gabriella' },
        { speaker: 'Gabriella', text: 'Tinha que ser justo agora.', portrait: 'gabriella' },
        { speaker: 'Lucas', text: 'Pelo menos agora a gente tem motivo pra conversar.', portrait: 'lucas' },
        { speaker: 'Gabriella', text: 'Motivo?', portrait: 'gabriella' },
        { speaker: 'Gabriella', text: 'Eu falo até sem motivo.', portrait: 'gabriella' },
        { speaker: 'Lucas', text: 'Eu percebi.', portrait: 'lucas' },
        { speaker: 'Gabriella', text: 'KKKKKKKK', portrait: 'gabriella' },
        { speaker: 'Narrador', text: 'A distância que deveria separar acabou fazendo o contrário.' },
        { speaker: 'Narrador', text: 'Um assunto puxava outro.' },
        { speaker: 'Narrador', text: 'E outro.' },
        { speaker: 'Narrador', text: 'E quando perceberam, conversar já fazia parte do dia.' },
        { speaker: 'Narrador', text: 'Sono. Estudo. Família. Comida. Academia. Coisas importantes.', pauseAfter: 900 },
        { speaker: 'Narrador', text: 'E um monte de coisa completamente inútil também.' },
        { speaker: 'Gabriella', text: 'Acho que a gente vai se dar bem.', portrait: 'gabriella' },
        { speaker: 'Lucas', text: 'Eu também acho.', portrait: 'lucas' },
    ];

    constructor ()
    {
        super('Instagram');
    }

    create ()
    {
        this.stepIndex = 0;
        this.memoryVisible = false;
        this.isTransitioning = false;
        this.isPausing = false;
        this.isTyping = false;
        this.textPages = [];
        this.pageIndex = 0;
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false);
            this.pauseEvent?.remove(false);
        });
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
            'A conversa começou',
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
            'Foi preciso ficar longe para começar a ficar perto.',
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
        const advance = Phaser.Input.Keyboard.JustDown(this.advanceKey);
        if (this.isTransitioning || this.isPausing || !advance)
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

        if (this.pageIndex + 1 < this.textPages.length)
        {
            this.startTyping(this.textPages[++this.pageIndex]);
            return;
        }

        const pause = this.storySteps[this.stepIndex].pauseAfter;
        if (pause)
        {
            this.isPausing = true;
            this.pauseEvent = this.time.delayedCall(pause, () => {
                this.isPausing = false;
                this.nextStep();
            });
            return;
        }
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

        // Frases longas continuam em outra página, sem reduzir a fonte aprovada.
        const wrapped = this.dialogText.getWrappedText(currentStep.text);
        this.textPages = [];
        for (let index = 0; index < wrapped.length; index += 2)
        {
            this.textPages.push(wrapped.slice(index, index + 2).join(' '));
        }
        this.pageIndex = 0;
        this.startTyping(this.textPages[0]);
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
        this.isTransitioning = true;
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

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => this.scene.start('FirstMeeting')
        );
    }
}
