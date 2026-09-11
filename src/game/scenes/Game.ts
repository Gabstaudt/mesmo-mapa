import * as Phaser from 'phaser';

export class Game extends Phaser.Scene
{
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;

    private promptBackground!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;

    private dialogBackground!: Phaser.GameObjects.Image;
    private dialogText!: Phaser.GameObjects.Text;

    private cursors!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private interactKey!: Phaser.Input.Keyboard.Key;

    private isDialogOpen = false;
    private dialogIndex = 0;

    private dialogLines: string[] = [
        'Vocês já se conheciam de vista.',
        'Mas ainda não sabiam o que esse caminho ia virar.'
    ];

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width, height } = this.scale;

        // Fundo da escola
        const background = this.add.image(
            width / 2,
            height / 2,
            'school-background'
        );

        background.setDisplaySize(width, height);

        // Lucas
        this.lucas = this.physics.add.image(
            width * 0.72,
            height * 0.72,
            'lucas-front'
        );

        // Gabriella
        this.gabriella = this.add.image(
            width * 0.28,
            height * 0.68,
            'gabriella-front'
        );

        this.lucas.setScale(0.25);
        this.gabriella.setScale(0.25);

        this.lucas.setCollideWorldBounds(true);

        // Movimento
        this.cursors = {
            up: this.input.keyboard!.addKey('W'),
            down: this.input.keyboard!.addKey('S'),
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D')
        };

        // Interação
        this.interactKey = this.input.keyboard!.addKey('E');

        // HUD "Pressione E"
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

        // Caixa de diálogo
        this.dialogBackground = this.add.image(
            width / 2,
            height - 115,
            'dialog-box'
        );

        this.dialogBackground.setDisplaySize(780, 180);
        this.dialogBackground.setDepth(200);

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

        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
    }

    update ()
    {
        const speed = 220;

        // Se diálogo estiver aberto, bloqueia movimento
        if (this.isDialogOpen)
        {
            this.lucas.setVelocity(0);

            if (Phaser.Input.Keyboard.JustDown(this.interactKey))
            {
                this.advanceDialog();
            }

            return;
        }

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

        // Corrige diagonal
        if (
            this.lucas.body &&
            this.lucas.body.velocity.length() > 0
        )
        {
            this.lucas.body.velocity
                .normalize()
                .scale(speed);
        }

        // Distância Lucas ↔ Gabriella
        const distance = Phaser.Math.Distance.Between(
            this.lucas.x,
            this.lucas.y,
            this.gabriella.x,
            this.gabriella.y
        );

        // Mostra HUD
        if (distance < 140)
        {
            this.promptBackground.setVisible(true);
            this.promptText.setVisible(true);
        }
        else
        {
            this.promptBackground.setVisible(false);
            this.promptText.setVisible(false);
        }

        // Abre diálogo
        if (
            distance < 120 &&
            Phaser.Input.Keyboard.JustDown(this.interactKey)
        )
        {
            this.openDialog();
        }
    }

    private openDialog ()
    {
        this.isDialogOpen = true;
        this.dialogIndex = 0;

        this.promptBackground.setVisible(false);
        this.promptText.setVisible(false);

        this.dialogBackground.setVisible(true);
        this.dialogText.setVisible(true);

        this.dialogText.setText(
            this.dialogLines[this.dialogIndex]
        );
    }

    private advanceDialog ()
    {
        this.dialogIndex++;

        if (this.dialogIndex >= this.dialogLines.length)
        {
            this.closeDialog();
            return;
        }

        this.dialogText.setText(
            this.dialogLines[this.dialogIndex]
        );
    }

    private closeDialog ()
    {
        this.isDialogOpen = false;

        this.dialogBackground.setVisible(false);
        this.dialogText.setVisible(false);
    }
}