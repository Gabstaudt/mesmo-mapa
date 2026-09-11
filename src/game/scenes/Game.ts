import * as Phaser from 'phaser';

export class Game extends Phaser.Scene
{
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;

    private promptBackground!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;

    private cursors!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private interactKey!: Phaser.Input.Keyboard.Key;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width, height } = this.scale;

        // Cenário da escola
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

        // WASD
        this.cursors = {
            up: this.input.keyboard!.addKey('W'),
            down: this.input.keyboard!.addKey('S'),
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D')
        };

        // E
        this.interactKey = this.input.keyboard!.addKey('E');

       // Fundo do indicador
this.promptBackground = this.add.image(
    width / 2,
    height - 90,
    'interaction-prompt'
);

this.promptBackground.setDisplaySize(390, 130);
this.promptBackground.setDepth(100);

// Texto do indicador
this.promptText = this.add.text(
    width / 2,
    height - 90,
    'Pressione E',
    {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#1E2438',
        fontStyle: 'bold'
    }
);

this.promptText.setOrigin(0.5);
this.promptText.setDepth(101);

// Começam escondidos
this.promptBackground.setVisible(false);
this.promptText.setVisible(false);
    }

    update ()
    {
        const speed = 220;

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

        // Corrige velocidade na diagonal
        if (
            this.lucas.body &&
            this.lucas.body.velocity.length() > 0
        )
        {
            this.lucas.body.velocity
                .normalize()
                .scale(speed);
        }

        // Distância entre Lucas e Gabriella
        const distance = Phaser.Math.Distance.Between(
            this.lucas.x,
            this.lucas.y,
            this.gabriella.x,
            this.gabriella.y
        );

        // Mostra/esconde Pressione E
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

        // Interação
        if (
            distance < 120 &&
            Phaser.Input.Keyboard.JustDown(this.interactKey)
        )
        {
            console.log('Lucas interagiu com Gabriella');
        }
    }
}