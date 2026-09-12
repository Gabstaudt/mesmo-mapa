import * as Phaser from 'phaser';

// Acesso direto às fases, disponível pelo botão da capa.
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
    { scene: 'OfficialDating', title: 'Pedido de namoro', subtitle: 'Finalmente Oficial' },
    { scene: 'SantaCatarina', title: 'Santa Catarina', subtitle: 'O mesmo lugar' },
    { scene: 'Finale', title: 'Capítulo final', subtitle: 'O mapa continua' }
];

export class MainMenu extends Phaser.Scene
{
    constructor () { super('MainMenu'); }

    create ()
    {
        this.cameras.main.setBackgroundColor('#1E2438');
        this.showCover();
    }

    private showCover ()
    {
        this.children.removeAll(true);
        const cover = this.add.image(512, 384, 'menu-cover');
        cover.setScale(Math.min(1024 / cover.width, 768 / cover.height));
        this.menuButton(414, 'Iniciar o jogo', () => this.scene.start('Game'), 760, 280);
        this.menuButton(486, 'Fases', () => this.showChapters(), 760, 280);
    }

    private menuButton (y: number, text: string, action: () => void, x = 512, width = 360)
    {
        const button = this.add.rectangle(x, y, width, 56, 0x39435F)
            .setStrokeStyle(1, 0xD8B36A, 0.7)
            .setInteractive({ useHandCursor: true });
        this.add.text(x, y, text, {
            fontFamily: 'Arial', fontSize: '24px', color: '#F4EBDD', fontStyle: 'bold'
        }).setOrigin(0.5);
        button.on('pointerover', () => button.setFillStyle(0x4B5674).setStrokeStyle(2, 0xD8B36A));
        button.on('pointerout', () => button.setFillStyle(0x39435F).setStrokeStyle(1, 0xD8B36A, 0.7));
        button.on('pointerdown', action);
    }

    private showChapters ()
    {
        this.children.removeAll(true);
        this.add.text(512, 78, 'Mesmo Mapa', {
            fontFamily: 'Arial', fontSize: '38px', color: '#F4EBDD', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(512, 128, 'Escolha uma fase', {
            fontFamily: 'Arial', fontSize: '23px', color: '#E7A98F'
        }).setOrigin(0.5);

        chapters.forEach((chapter, index) => {
            const x = index % 2 === 0 ? 302 : 722;
            const y = 210 + Math.floor(index / 2) * 70;
            const button = this.add.rectangle(x, y, 390, 62, 0x39435F)
                .setStrokeStyle(1, 0xD8B36A, 0.5)
                .setInteractive({ useHandCursor: true });
            this.add.text(x - 173, y - 22, `${String(index + 1).padStart(2, '0')}  ${chapter.title}`, {
                fontFamily: 'Arial', fontSize: '20px', color: '#F4EBDD', fontStyle: 'bold'
            });
            this.add.text(x - 173, y + 8, chapter.subtitle, {
                fontFamily: 'Arial', fontSize: '17px', color: '#E7A98F'
            });
            button.on('pointerover', () => button.setStrokeStyle(2, 0xD8B36A));
            button.on('pointerout', () => button.setStrokeStyle(1, 0xD8B36A, 0.5));
            button.on('pointerdown', () => this.scene.start(chapter.scene));
        });

        this.menuButton(710, 'Voltar à capa', () => this.showCover());
    }
}
