import * as Phaser from 'phaser';

export class Game extends Phaser.Scene
{
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;

    private promptBackground!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;

    private dialogBackground!: Phaser.GameObjects.Image;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;

    private cursors!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private interactKey!: Phaser.Input.Keyboard.Key;

    private isDialogOpen = false;
    private dialogIndex = 0;
    private isTransitioning = false;
    private isOptionalDialog = false;
    private isPausing = false;
    private pauseEvent?: Phaser.Time.TimerEvent;
    private schoolObject!: Phaser.GameObjects.Zone;
    private activeLines: { speaker: string; text: string }[] = [];
    private readonly objectLines = [
        { speaker: 'Narrador', text: 'Vocês já dividiam corredores, horários e lugares.' },
        { speaker: 'Narrador', text: 'Só ainda não dividiam a vida.' }
    ];

    // Controle do efeito de digitação
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private currentFullText = '';

    private readonly dialogLines = [
        { speaker: 'Narrador', text: 'Vocês já se conheciam de vista.' },
        { speaker: 'Narrador', text: 'Talvez tenham cruzado o caminho um do outro mais vezes do que conseguem lembrar.' },
        { speaker: 'Narrador', text: 'Mas naquela época, era só isso.' },
        { speaker: 'Narrador', text: 'Duas pessoas no mesmo mapa.' },
        { speaker: 'Narrador', text: 'Sem fazer ideia de que um dia seria difícil imaginar um caminho sem o outro.' }
    ];

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width, height } = this.scale;
        this.isDialogOpen = false;
        this.isTransitioning = false;
        this.isOptionalDialog = false;
        this.isPausing = false;
        this.isTyping = false;
        this.dialogIndex = 0;
        this.activeLines = this.dialogLines;
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.typingEvent?.remove(false);
            this.pauseEvent?.remove(false);
        });
        // Interação com o banco já desenhado à direita do cenário.
        this.schoolObject = this.add.zone(width * 0.88, height * 0.70, 160, 100);

        // -------------------------
        // CENÁRIO
        // -------------------------

        const background = this.add.image(
            width / 2,
            height / 2,
            'school-background'
        );

        background.setDisplaySize(width, height);

        // -------------------------
        // PERSONAGENS
        // -------------------------

        this.lucas = this.physics.add.image(
            width * 0.72,
            height * 0.72,
            'lucas-front'
        );

        this.gabriella = this.add.image(
            width * 0.28,
            height * 0.68,
            'gabriella-front'
        );

        this.lucas.setScale(0.25);
        this.gabriella.setScale(0.25);

        this.lucas.setCollideWorldBounds(true);

        // -------------------------
        // CONTROLES
        // -------------------------

        this.cursors = {
            up: this.input.keyboard!.addKey('W'),
            down: this.input.keyboard!.addKey('S'),
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D')
        };

        this.interactKey = this.input.keyboard!.addKey('E');

        // -------------------------
        // HUD "PRESSIONE E"
        // -------------------------

        this.promptBackground = this.add.image(
            width / 2,
            height - 75,
            'interaction-prompt'
        );

        this.promptBackground.setDisplaySize(390, 105);
        this.promptBackground.setDepth(100);

        this.promptText = this.add.text(
            width / 2,
            height - 75,
            'Pressione E',
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#1E2438',
                fontStyle: 'bold'
            }
        );

        this.promptText.setOrigin(0.5);
        this.promptText.setDepth(101);

        this.promptBackground.setVisible(false);
        this.promptText.setVisible(false);

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

        // Texto principal da fala
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

        // Tudo começa escondido
        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
        this.dialogName.setVisible(false);
    }

    update ()
    {
        const speed = 220;
        const interact = Phaser.Input.Keyboard.JustDown(this.interactKey);

        // -------------------------
        // DURANTE A TRANSIÇÃO
        // -------------------------

        if (this.isTransitioning)
        {
            this.lucas.setVelocity(0);
            return;
        }

        // -------------------------
        // DIÁLOGO ABERTO
        // -------------------------

        if (this.isDialogOpen)
        {
            this.lucas.setVelocity(0);

            if (interact && !this.isPausing)
            {
                // Se ainda está escrevendo:
                // E mostra toda a frase imediatamente
                if (this.isTyping)
                {
                    this.finishTyping();
                }
                else
                {
                    // Se terminou de escrever:
                    // E passa para a próxima fala
                    this.advanceDialog();
                }
            }

            return;
        }

        // -------------------------
        // MOVIMENTO DO LUCAS
        // -------------------------

        this.lucas.setVelocity(0);

        // Esquerda
        if (this.cursors.left.isDown)
        {
            this.lucas.setVelocityX(-speed);

            this.lucas.setTexture('lucas-left');
            this.lucas.setFlipX(false);
        }

        // Direita
        else if (this.cursors.right.isDown)
        {
            this.lucas.setVelocityX(speed);

            this.lucas.setTexture('lucas-left');
            this.lucas.setFlipX(true);
        }

        // Cima
        if (this.cursors.up.isDown)
        {
            this.lucas.setVelocityY(-speed);

            this.lucas.setTexture('lucas-back');
            this.lucas.setFlipX(false);
        }

        // Baixo
        else if (this.cursors.down.isDown)
        {
            this.lucas.setVelocityY(speed);

            this.lucas.setTexture('lucas-front');
            this.lucas.setFlipX(false);
        }

        // Mantém a mesma velocidade andando na diagonal
        if (
            this.lucas.body &&
            this.lucas.body.velocity.length() > 0
        )
        {
            this.lucas.body.velocity
                .normalize()
                .scale(speed);
        }

        // -------------------------
        // PROXIMIDADE DA GABRIELLA
        // -------------------------

        const distance = Phaser.Math.Distance.Between(
            this.lucas.x,
            this.lucas.y,
            this.gabriella.x,
            this.gabriella.y
        );

        // A presença de Gabriella dispara a observação, sem interação direta.
        if (distance < 120)
        {
            this.openDialog();
            return;
        }

        const objectDistance = Phaser.Math.Distance.Between(
            this.lucas.x, this.lucas.y, this.schoolObject.x, this.schoolObject.y
        );
        const nearObject = objectDistance < 120;
        this.promptBackground.setVisible(nearObject);
        this.promptText.setVisible(nearObject);
        this.promptText.setText('E — Observar o banco');
        if (nearObject && interact) this.openDialog(true);
    }

    // -------------------------
    // ABRIR DIÁLOGO
    // -------------------------

    private openDialog (optional = false)
    {
        this.isDialogOpen = true;
        this.lucas.setVelocity(0);
        this.isOptionalDialog = optional;
        this.activeLines = optional ? this.objectLines : this.dialogLines;
        this.dialogIndex = 0;

        this.promptBackground.setVisible(false);
        this.promptText.setVisible(false);

        this.dialogBackground.setVisible(true);
        this.dialogText.setVisible(true);
        this.dialogName.setVisible(true);

        this.showCurrentLine();
    }

    // -------------------------
    // MOSTRAR FALA ATUAL
    // -------------------------

    private showCurrentLine ()
    {
        const currentLine = this.activeLines[this.dialogIndex];

        this.dialogName.setText(currentLine.speaker);

        this.startTyping(currentLine.text);
    }

    // -------------------------
    // EFEITO DE DIGITAÇÃO
    // -------------------------

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

    // -------------------------
    // COMPLETA A FRASE
    // -------------------------

    private finishTyping ()
    {
        if (this.typingEvent)
        {
            this.typingEvent.remove(false);
        }

        this.dialogText.setText(this.currentFullText);

        this.isTyping = false;
    }

    // -------------------------
    // PRÓXIMA FALA
    // -------------------------

    private advanceDialog ()
    {
        // Deixa “Duas pessoas no mesmo mapa.” respirar antes da última frase.
        if (!this.isOptionalDialog && this.dialogIndex === 3)
        {
            this.isPausing = true;
            this.pauseEvent = this.time.delayedCall(900, () => {
                this.isPausing = false;
                this.dialogIndex++;
                this.showCurrentLine();
            });
            return;
        }

        this.dialogIndex++;

        if (this.dialogIndex >= this.activeLines.length)
        {
            this.closeDialog();
            return;
        }

        this.showCurrentLine();
    }

    // -------------------------
    // FINAL DO DIÁLOGO
    // -------------------------

    private closeDialog ()
    {
        if (this.typingEvent)
        {
            this.typingEvent.remove(false);
        }

        this.isTyping = false;
        this.isDialogOpen = false;

        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
        this.dialogName.setVisible(false);

        // A escola terminou.
        // Começa a passagem para a próxima memória.
        if (!this.isOptionalDialog) this.startTransition();
    }

    // -------------------------
    // TRANSIÇÃO
    // -------------------------

    private startTransition ()
    {
        this.isTransitioning = true;

        this.lucas.setVelocity(0);

        // Garante que nenhum HUD apareça
        this.promptBackground.setVisible(false);
        this.promptText.setVisible(false);

        // Fade para o Azul Noite oficial
        this.cameras.main.fadeOut(
            1200,
            30,
            36,
            56
        );

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () =>
            {
                this.scene.start('Instagram');
            }
        );
    }
}