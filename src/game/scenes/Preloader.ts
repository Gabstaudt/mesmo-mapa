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
        this.load.image('menu-cover', 'assets/capa/capa.png');
        for (const [key, file] of Object.entries({
            airport: 'airport', family: 'family-house', baptism: 'baptism', sleep: 'sleep-together', falls: 'iguacu'
        })) this.load.image(`travel-${key}`, `assets/scenes/travel/${file}-background.png`);
        for (const name of ['travel-photo', 'travel-suitcase', 'travel-ticket', 'airplane-window'])
            this.load.image(name, `assets/objects/${name}.png`);
        this.load.image('godson-memory', 'assets/objects/godson-memory-object.png');
        this.load.image('travel-route', 'assets/ui/travel-route-panel.png  .png');
        this.load.audio('travel-water', 'assets/audio/travel-water.wav');
        this.load.image('final-wall', 'assets/scenes/final/final-memory-wall-background.png');
        this.load.image('final-future-map', 'assets/scenes/final/future-map-background.png');
        this.load.image('future-home', 'assets/objects/future-home-card.png');
        this.load.image('future-wedding', 'assets/objects/future-wedding-card.png');
        this.load.image('future-machu', 'assets/objects/future-machu-picchu-card.png');
        this.load.image('future-san', 'assets/objects/future-san-andres-card.png');
        this.load.image('future-locked', 'assets/ui/future-locked-frame.png');
        this.load.image('final-symbol', 'assets/objects/final-connection-symbol.png');
        this.load.image('final-message', 'assets/ui/final-message-panel.png');
        this.load.image('final-continue', 'assets/ui/final-continue-card.png');
        this.load.image('couple-key-art', 'assets/couple/couple-key-art.png');
        this.load.image('travel-paraguay', 'assets/scenes/travel/paraguay-background.png');
        this.load.image('official-background', 'assets/scenes/official/official-request-background.png');
        this.load.image('official-note', 'assets/objects/official-note.png');
        this.load.image('gabriella-ring', 'assets/portraits/gabriella-ring.png');
        this.load.image('lucas-ring', 'assets/portraits/lucas-ring.png');
        this.load.image('official-ring', 'assets/objects/official-ring.png');
        this.load.image('concert-crowd', 'assets/scenes/concert/pagode-crowd-background.png');
        this.load.image('concert-stage', 'assets/scenes/concert/pagode-stage-background.png');
        this.load.image('concert-ticket', 'assets/objects/concert-ticket.png');
        this.load.image('concert-photo', 'assets/objects/concert-memory-photo.png');
        this.load.image('rhythm-note', 'assets/ui/rhythm-note.png');
        this.load.image('rhythm-hit-zone', 'assets/ui/rhythm-hit-zone.png');
        this.load.audio('concert-song', 'assets/audios/FalaBaixinho.mp3');
        this.load.audio('finale-song', 'assets/audios/IRIS.mp3');
        this.load.image('tactical-background', 'assets/scenes/tactical/tactical-background.png');
        this.load.image('tactical-objective-panel', 'assets/ui/tactical-objective-panel.png');
        this.load.image('tactical-finish-zone', 'assets/objects/tactical-finish-zone.png .png');
        this.load.image('sports-background', 'assets/scenes/sports/sports-background.png');
        this.load.image('sports-target', 'assets/objects/sports-target.png');
        this.load.image('sports-ball', 'assets/objects/sports-ball.png');
        this.load.image('sports-score-panel', 'assets/ui/sports-score-panel.png');
        this.load.audio('shared-path-ambient', 'assets/audio/shared-path-ambient.wav');
        this.load.audio('player-two-chime', 'assets/audio/player-two-chime.wav');
        this.load.image('maturity-background', 'assets/scenes/maturity/maturity-background.png');
        this.load.image('maturity-barrier', 'assets/objects/maturity-barrier-left.png');
        this.load.image('maturity-switch', 'assets/objects/maturity-switch.png');
        this.load.image('gabriella-left', 'assets/characters/gabriella-left.png');
        this.load.image('gabriella-back', 'assets/characters/gabriella-back.png');
        this.load.image('routine-series', 'assets/scenes/routine/sofa-series-background.png');
        this.load.image('couple-sofa-series', 'assets/couple/couple-sofa-series.png');
        this.load.image('series-selection-panel', 'assets/ui/series-selection-panel.png');
        this.load.image('routine-ready', 'assets/scenes/routine/getting-ready-background.png');
        this.load.image('routine-choice', 'assets/scenes/routine/food-choice-background.png');
        // Fundo do cotidiano disponível com este nome no projeto.
        this.load.image('routine-everyday', 'assets/scenes/routine/image.png');
        for (const name of ['routine-clock', 'routine-mirror', 'routine-phone', 'routine-controller',
            'routine-food', 'routine-photo', 'food-option-1', 'food-option-2', 'food-option-3'])
        {
            this.load.image(name, `assets/objects/${name}.png`);
        }
        this.load.image('parents-house', 'assets/scenes/parents/parents-house-background.jpg');
        this.load.image('parents-front-door', 'assets/objects/parents-front-door.png');
        this.load.image('parents-living-room-object', 'assets/objects/parents-living-room-object.png');
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
