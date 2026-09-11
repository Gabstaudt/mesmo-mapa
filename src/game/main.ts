import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Instagram } from './scenes/Instagram';
import { FirstMeeting } from './scenes/FirstMeeting';
import { Cinema } from './scenes/Cinema';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,

    width: 1024,
    height: 768,

    parent: 'game-container',

    backgroundColor: '#1E2438',

    physics: {
        default: 'arcade',

        arcade: {
            gravity: {
                x: 0,
                y: 0
            },

            debug: false
        }
    },

    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        Instagram,
        FirstMeeting,
        Cinema
    ]
};

const StartGame = (parent: string) => {

    return new Game({
        ...config,
        parent
    });

};

export default StartGame;
