import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Por enquanto, pula o menu do template
        // e entra direto na nossa primeira cena.
        this.scene.start('Game');
    }
}