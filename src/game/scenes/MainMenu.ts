import * as Phaser from 'phaser';

// Seletor temporário: remover quando a abertura definitiva estiver pronta.
const chapters = [
    { scene: 'Game', title: 'Escola', subtitle: 'Mesmo mapa' },
    { scene: 'Instagram', title: 'Instagram', subtitle: 'A conversa começou' },
    { scene: 'FirstMeeting', title: 'Primeiro encontro', subtitle: 'Finalmente' },
    { scene: 'Cinema', title: 'Cinema', subtitle: 'Só um cinema' },
    { scene: 'Parents', title: 'Conhecendo os pais', subtitle: 'Mais perto' },
    { scene: 'Routine', title: 'Rotina', subtitle: 'As três microcenas' },
    { scene: 'Maturity', title: 'Amadurecimento', subtitle: 'No mesmo lado' },
    { scene: 'Sports', title: 'Esportes', subtitle: 'Valendo Nada' },
    { scene: 'TacticalCoop', title: 'Cooperação', subtitle: 'Dupla Fechada' },
    { scene: 'Concert', title: 'Shows', subtitle: 'Nossa trilha' },
    { scene: 'OfficialDating', title: 'Pedido de namoro', subtitle: 'Finalmente Oficial' }
];

export class MainMenu extends Phaser.Scene
{
    constructor () { super('MainMenu'); }

    create ()
    {
        this.cameras.main.setBackgroundColor('#1E2438');
        this.add.text(512, 78, 'Mesmo Mapa', {
            fontFamily: 'Arial', fontSize: '38px', color: '#F4EBDD', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(512, 128, 'Escolha uma fase', {
            fontFamily: 'Arial', fontSize: '23px', color: '#E7A98F'
        }).setOrigin(0.5);

        chapters.forEach((chapter, index) => {
            const x = index % 2 === 0 ? 302 : 722;
            const y = 210 + Math.floor(index / 2) * 82;
            const button = this.add.rectangle(x, y, 390, 72, 0x39435F)
                .setStrokeStyle(1, 0xD8B36A, 0.5)
                .setInteractive({ useHandCursor: true });
            this.add.text(x - 173, y - 23, `${String(index + 1).padStart(2, '0')}  ${chapter.title}`, {
                fontFamily: 'Arial', fontSize: '22px', color: '#F4EBDD', fontStyle: 'bold'
            });
            this.add.text(x - 173, y + 8, chapter.subtitle, {
                fontFamily: 'Arial', fontSize: '18px', color: '#E7A98F'
            });
            button.on('pointerover', () => button.setStrokeStyle(2, 0xD8B36A));
            button.on('pointerout', () => button.setStrokeStyle(1, 0xD8B36A, 0.5));
            button.on('pointerdown', () => this.scene.start(chapter.scene));
        });

        this.add.text(512, 704, 'Para escolher outra fase, recarregue a página.', {
            fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD'
        }).setOrigin(0.5);
    }
}
