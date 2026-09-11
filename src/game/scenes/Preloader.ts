import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        this.load.image('first-meeting-background', 'assets/scenes/first-meeting/first-meeting-background.png');
        this.load.image('first-meeting-object', 'assets/objects/first-meeting-object.png');
        this.load.image('cinema-lobby', 'assets/scenes/cinema/cinema-lobby-background.png');
        this.load.image('cinema-room', 'assets/scenes/cinema/cinema-room-background.png');
        this.load.image('cinema-ticket', 'assets/objects/cinema-ticket.png');
        this.load.image('popcorn', 'assets/objects/popcorn.png');
        this.load.image('gabriella-romantic', 'assets/portraits/gabriella-romantic.png');
        this.load.image('lucas-romantic', 'assets/portraits/lucas-romantic.png');

            this.load.image(
            'school-background',
            'assets/scenes/school/school-background.png'
            );

            this.load.image(
            'lucas-front',
            'assets/characters/lucas-front.png'
            );

            this.load.image(
            'lucas-left',
            'assets/characters/lucas-left.png'
        );

        this.load.image(
            'lucas-back',
            'assets/characters/lucas-back.png'
        );

            this.load.image(
            'gabriella-front',
            'assets/characters/gabriella-front.png'
            );

            this.load.image(
    'interaction-prompt',
    'assets/ui/interaction-prompt.png'
);

this.load.image(
    'dialog-box',
    'assets/ui/dialog-box.png'
);

this.load.image(
    'instagram-background',
    'assets/scenes/instagram/instagram-background.png'
);

this.load.image(
    'instagram-chat-overlay',
    'assets/ui/instagram-chat-overlay.png'
);

this.load.image(
    'memory-card',
    'assets/ui/memory-card.png'
);

this.load.image(
    'gabriella-portrait',
    'assets/portraits/gabriella-happy.png'
);

this.load.image(
    'lucas-portrait',
    'assets/portraits/lucas-happy.png'
);


    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
