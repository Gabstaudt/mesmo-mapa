import * as Phaser from 'phaser';
import { officialDialogues as script } from '../data/officialDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'explore' | 'dialog' | 'pause' | 'letter' | 'card';

export class OfficialDating extends Phaser.Scene
{
    private state: State = 'transition';
    private noteFound = false;
    private ringFound = false;
    private world!: Phaser.GameObjects.Container;
    private lucas!: Phaser.GameObjects.Image;
    private gabriella!: Phaser.GameObjects.Image;
    private note!: Phaser.GameObjects.Image;
    private ring!: Phaser.GameObjects.Image;
    private ringFocus!: Phaser.GameObjects.Image;
    private ringGlow!: Phaser.GameObjects.Arc;
    private letter!: Phaser.GameObjects.Container;
    private objective!: Phaser.GameObjects.Text;
    private hint!: Phaser.GameObjects.Text;
    private prompt!: Phaser.GameObjects.Container;
    private shade!: Phaser.GameObjects.Rectangle;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private music?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    private dialog!: Phaser.GameObjects.Container;
    private dialogText!: Phaser.GameObjects.Text;
    private dialogName!: Phaser.GameObjects.Text;
    private portrait!: Phaser.GameObjects.Image;
    private activeLines: RoutineLine[] = [];
    private lineIndex = 0;
    private textPages: string[] = [];
    private pageIndex = 0;
    private currentFullText = '';
    private isTyping = false;
    private typingEvent?: Phaser.Time.TimerEvent;
    private afterDialog: () => void = () => {};

    constructor () { super('OfficialDating'); }

    create ()
    {
        this.state = 'transition'; this.noteFound = false; this.ringFound = false;
        this.isTyping = false; this.typingEvent = undefined;
        this.world = this.add.container(0, 0);
        this.world.add(this.add.image(512, 384, 'official-background').setDisplaySize(1024, 768));
        this.note = this.add.image(376, 558, 'official-note').setScale(0.12);
        this.ring = this.add.image(133, 553, 'official-ring').setScale(0.085).setAlpha(0.45);
        this.lucas = this.add.image(250, 720, 'lucas-front').setOrigin(0.5, 1).setScale(0.12);
        this.gabriella = this.add.image(700, 620, 'gabriella-front').setOrigin(0.5, 1).setScale(0.12);
        this.world.add([this.note, this.ring, this.gabriella, this.lucas]);
        this.objective = this.label(512, 75, '', 21).setDepth(100);
        this.hint = this.label(512, 740, 'WASD — Caminhar', 18).setDepth(110);
        const promptBG = this.add.image(512, 693, 'interaction-prompt').setDisplaySize(390, 105);
        const promptText = this.add.text(512, 693, 'Pressione E', { fontFamily: 'Arial', fontSize: '22px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [promptBG, promptText]).setDepth(105).setVisible(false);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.65).setDepth(120).setVisible(false);
        const paper = this.add.rectangle(512, 312, 550, 285, 0xF4EBDD).setStrokeStyle(3, 0xD8B36A);
        const title = this.add.text(512, 212, 'O bilhete', { fontFamily: 'Arial', fontSize: '25px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5);
        const content = this.add.text(512, 313, '“Depois de tudo que a gente já viveu… talvez esteja na hora de fazer uma pergunta que já tá atrasada.”', {
            fontFamily: 'Arial', fontSize: '24px', color: '#39435F', align: 'center', wordWrap: { width: 460 }, lineSpacing: 9
        }).setOrigin(0.5);
        this.letter = this.add.container(0, 0, [paper, title, content, this.label(512, 505, 'E — Continuar', 22)]).setDepth(140).setVisible(false);
        this.ringGlow = this.add.circle(512, 305, 115, 0xD8B36A, 0.13).setDepth(130).setVisible(false);
        this.ringFocus = this.add.image(512, 305, 'official-ring').setScale(0.4).setDepth(140).setVisible(false);
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438', wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD', fontStyle: 'bold' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E') as Record<string, Phaser.Input.Keyboard.Key>;
        this.music = this.sound.add('shared-path-ambient', { loop: true, volume: 0.10 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        this.music.play(); this.updateObjective();
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this.state = 'explore'; });
        this.cameras.main.fadeIn(1100, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.typingEvent?.remove(false); this.music?.destroy(); });
    }

    private label (x: number, y: number, text: string, size: number)
    {
        return this.add.text(x, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 7 }, align: 'center', lineSpacing: 7 }).setOrigin(0.5);
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.keys.E);
        if (this.state === 'dialog') { if (e) this.advanceDialog(); return; }
        if (this.state === 'letter' && e)
        {
            this.letter.setVisible(false); this.shade.setVisible(false);
            this.startDialog(script.noteAfter, () => {
                this.noteFound = true; this.note.setAlpha(0.4); this.ring.setAlpha(1);
                this.updateObjective(); this.state = 'explore';
            }); return;
        }
        if (this.state === 'card' && e) { this.scene.start('MainMenu'); return; }
        if (this.state !== 'explore') return;
        this.move(delta);
        // Pontos de interação no chão, em frente aos móveis onde estão os objetos.
        const nearNote = this.near(400, 702, 66);
        const nearRing = this.near(145, 710, 68);
        const nearGabriella = this.near(this.gabriella.x, this.gabriella.y, 105);
        const target = !this.noteFound && nearNote ? 'note' : this.noteFound && !this.ringFound && nearRing ? 'ring' : this.ringFound && nearGabriella ? 'gabriella' : '';
        this.prompt.setVisible(!!target);
        this.hint.setText(target === 'note' ? 'Ler o bilhete sobre a mesa' : target === 'ring' ? 'Pegar a aliança no móvel ao lado do sofá' :
            target === 'gabriella' ? 'Falar com Gabriella' : nearGabriella && !this.ringFound ? 'Antes, encontre o bilhete e a aliança.' : 'WASD — Caminhar');
        if (!e) return;
        if (target === 'note')
        {
            this.prompt.setVisible(false);
            this.startDialog(script.noteIntro, () => {
                this.state = 'letter'; this.shade.setVisible(true); this.letter.setVisible(true);
            });
        }
        else if (target === 'ring') this.collectRing();
        else if (target === 'gabriella') this.beginProposal();
    }

    private near (x: number, y: number, radius: number)
    { return Phaser.Math.Distance.Between(this.lucas.x, this.lucas.y, x, y) <= radius; }

    private move (delta: number)
    {
        const dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
        const dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
        if (!dx && !dy) return;
        const distance = Math.min(delta, 40) * 0.19 / Math.hypot(dx, dy);
        const canWalk = (x: number, y: number) => x >= 100 && x <= 920 && y >= 595 && y <= 730 &&
            !(x < 350 && y < 690) && !(x >= 320 && x <= 490 && y < 695) && !(x > 745 && y < 670);
        if (canWalk(this.lucas.x + dx * distance, this.lucas.y)) this.lucas.x += dx * distance;
        if (canWalk(this.lucas.x, this.lucas.y + dy * distance)) this.lucas.y += dy * distance;
        this.lucas.setTexture(`lucas-${dx ? 'left' : dy < 0 ? 'back' : 'front'}`).setFlipX(dx > 0);
    }

    private updateObjective ()
    {
        this.objective.setText(`BILHETE ${this.noteFound ? '✓' : '○'}    ALIANÇA ${this.ringFound ? '✓' : '○'}\n${!this.noteFound ? 'Encontre o bilhete sobre a mesa' : !this.ringFound ? 'Encontre a aliança ao lado do sofá' : 'VÁ ATÉ GABRIELLA'}`);
    }

    private collectRing ()
    {
        this.ringFound = true; this.ring.setVisible(false); this.prompt.setVisible(false);
        this.updateObjective(); this.ringFocus.setVisible(true).setAlpha(0).setScale(0.28);
        this.tweens.add({ targets: this.ringFocus, alpha: 1, scale: 0.4, duration: 550 });
        this.startDialog(script.ring, () => {
            this.ringFocus.setVisible(false); this.state = 'explore';
        });
    }

    private beginProposal ()
    {
        this.state = 'pause'; this.prompt.setVisible(false); this.objective.setVisible(false); this.hint.setVisible(false);
        this.music?.setVolume(0.035);
        this.lucas.setPosition(615, 640).setTexture('lucas-left').setFlipX(true);
        this.gabriella.setTexture('gabriella-left').setFlipX(false);
        // Aproxima apenas o cenário: caixa e retratos preservam o layout aprovado.
        this.tweens.add({ targets: this.world, scale: 1.05, x: -33, y: -31, duration: 1000 });
        this.time.delayedCall(1100, () => this.startDialog([...script.intro, ...script.proposal], () => this.celebrateRing()));
    }

    private celebrateRing ()
    {
        this.state = 'pause'; this.shade.setVisible(true); this.ringGlow.setVisible(true).setAlpha(0);
        this.ringFocus.setVisible(true).setAlpha(0).setScale(0.38);
        this.tweens.add({ targets: this.ringGlow, alpha: 1, duration: 900 });
        this.tweens.add({ targets: this.ringFocus, alpha: 1, scale: 0.52, duration: 1200, onComplete: () => {
            this.time.delayedCall(1300, () => {
                this.tweens.add({ targets: [this.ringFocus, this.ringGlow], alpha: 0, duration: 800, onComplete: () => {
                    this.ringFocus.setVisible(false); this.ringGlow.setVisible(false); this.shade.setVisible(false);
                    this.showRingPhotos();
                } });
            });
        } });
    }
    private showRingPhotos ()
    {
        this.state = 'pause'; this.shade.setVisible(true);
        const photos = this.add.container(0, 0, [
            this.add.image(355, 305, 'gabriella-ring').setScale(0.32),
            this.add.image(669, 305, 'lucas-ring').setScale(0.32)
        ]).setDepth(140).setAlpha(0);
        this.tweens.add({ targets: photos, alpha: 1, duration: 800, onComplete: () => {
            this.startDialog(script.ringPhotos, () => {
                this.state = 'pause';
                this.tweens.add({ targets: photos, alpha: 0, duration: 1000, onComplete: () => {
                    photos.destroy(); this.showCard();
                } });
            });
        } });
    }

    private startDialog (lines: RoutineLine[], afterDialog: () => void)
    {
        this.state = 'dialog'; this.activeLines = lines; this.lineIndex = 0;
        this.afterDialog = afterDialog; this.dialog.setVisible(true); this.showLine();
    }

    private advanceDialog ()
    {
        if (this.isTyping) { this.typingEvent?.remove(false); this.dialogText.setText(this.currentFullText); this.isTyping = false; }
        else if (this.pageIndex + 1 < this.textPages.length) this.startTyping(this.textPages[++this.pageIndex]);
        else
        {
            const pause = this.activeLines[this.lineIndex].pauseAfter;
            if (pause) { this.state = 'pause'; this.time.delayedCall(pause, () => { this.state = 'dialog'; this.nextLine(); }); }
            else this.nextLine();
        }
    }

    private nextLine ()
    {
        if (++this.lineIndex < this.activeLines.length) this.showLine();
        else { this.dialog.setVisible(false); this.portrait.setVisible(false); this.afterDialog(); }
    }

    private showLine ()
    {
        const line = this.activeLines[this.lineIndex]; this.dialogName.setText(line.speaker);
        this.portrait.setVisible(!!line.portrait);
        if (line.portrait) this.portrait.setTexture(line.portrait).setX(line.speaker === 'Lucas' ? 879 : 145);
        const wrapped = this.dialogText.getWrappedText(line.text); this.textPages = [];
        for (let i = 0; i < wrapped.length; i += 2) this.textPages.push(wrapped.slice(i, i + 2).join(' '));
        this.pageIndex = 0; this.startTyping(this.textPages[0]);
    }

    private startTyping (text: string)
    {
        this.typingEvent?.remove(false); this.currentFullText = text; this.dialogText.setText(''); this.isTyping = true;
        let character = 0;
        this.typingEvent = this.time.addEvent({ delay: 35, repeat: text.length - 1, callback: () => {
            this.dialogText.setText(text.substring(0, ++character));
            if (character === text.length) this.isTyping = false;
        } });
    }

    private showCard ()
    {
        this.state = 'card'; this.shade.setVisible(true);
        this.registry.set('officialMemory', { title: 'Finalmente Oficial', subtitle: 'O sentimento já existia. Só faltava colocar nome.' });
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'Finalmente Oficial', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'O sentimento já existia. Só faltava colocar nome.', {
            fontFamily: 'Arial', fontSize: '20px', color: '#39435F', align: 'center', wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(301);
        this.label(512, 703, 'E — Voltar ao menu', 22).setDepth(302);
    }
}
