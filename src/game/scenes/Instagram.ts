import * as Phaser from 'phaser';

export class Instagram extends Phaser.Scene
{
    constructor ()
    {
        super('Instagram');
    }

    create ()
    {
        const { width, height } = this.scale;

        // Fundo da cena do Instagram
        const background = this.add.image(
            width / 2,
            height / 2,
            'instagram-background'
        );

        background.setDisplaySize(width, height);

        // Gabriella
        const gabriella = this.add.image(
            width * 0.28,
            height * 0.70,
            'gabriella-front'
        );

        // Lucas
        const lucas = this.add.image(
            width * 0.72,
            height * 0.70,
            'lucas-front'
        );

        gabriella.setScale(0.25);
        lucas.setScale(0.25);
    }
}