import * as Phaser from 'phaser';

export class Game extends Phaser.Scene
{
    private lucas!: Phaser.Physics.Arcade.Image;
    private gabriella!: Phaser.GameObjects.Image;

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

        const background = this.add.image(
            width / 2,
            height / 2,
            'school-background'
        );

        background.setDisplaySize(width, height);

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

        this.cursors = {
            up: this.input.keyboard!.addKey('W'),
            down: this.input.keyboard!.addKey('S'),
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D')
        };

        this.interactKey = this.input.keyboard!.addKey('E');
    }

    update ()
    {
        const speed = 220;

        this.lucas.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.lucas.setVelocityX(-speed);
            this.lucas.setTexture('lucas-left');
            this.lucas.setFlipX(false);
        }
        else if (this.cursors.right.isDown)
        {
            this.lucas.setVelocityX(speed);
            this.lucas.setTexture('lucas-left');
            this.lucas.setFlipX(true);
        }

        if (this.cursors.up.isDown)
        {
            this.lucas.setVelocityY(-speed);
            this.lucas.setTexture('lucas-back');
            this.lucas.setFlipX(false);
        }
        else if (this.cursors.down.isDown)
        {
            this.lucas.setVelocityY(speed);
            this.lucas.setTexture('lucas-front');
            this.lucas.setFlipX(false);
        }

        if (
            this.lucas.body &&
            this.lucas.body.velocity.length() > 0
        )
        {
            this.lucas.body.velocity
                .normalize()
                .scale(speed);
        }

        const distance = Phaser.Math.Distance.Between(
            this.lucas.x,
            this.lucas.y,
            this.gabriella.x,
            this.gabriella.y
        );

        if (
            distance < 120 &&
            Phaser.Input.Keyboard.JustDown(this.interactKey)
        )
        {
            console.log('Lucas interagiu com Gabriella');
        }
    }
}