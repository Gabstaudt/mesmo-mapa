import * as Phaser from 'phaser';
import { sportsDialogues as script } from '../data/sportsDialogues';
import type { RoutineLine } from '../data/routineDialogues';

type State = 'transition' | 'dialog' | 'pause' | 'rules' | 'power' | 'aim' | 'flight' | 'tiebreak' | 'card';
// Raios em pixels correspondentes aos quatro anéis do asset exibido a 42%.
export function scoreImpact (distance: number): number
{
    if (distance <= 22) return 100;
    if (distance <= 47) return 75;
    if (distance <= 69) return 50;
    if (distance <= 90) return 25;
    return 0;
}

export class Sports extends Phaser.Scene
{
    private state: State = 'transition';
    private player = 0;
    private round = 1;
    private scores = [0, 0];
    private attempts = [0, 0];
    private firstLucasScore = 0;
    private power = 0;
    private aim = 0;
    private phase = 0;
    private players: Phaser.GameObjects.Image[] = [];
    private scoreTexts: Phaser.GameObjects.Text[] = [];
    private attemptTexts: Phaser.GameObjects.Text[] = [];
    private roundText!: Phaser.GameObjects.Text;
    private banner!: Phaser.GameObjects.Text;
    private rules!: Phaser.GameObjects.Container;
    private meter!: Phaser.GameObjects.Container;
    private marker!: Phaser.GameObjects.Rectangle;
    private crosshair!: Phaser.GameObjects.Arc;
    private ball!: Phaser.GameObjects.Image;
    private impact!: Phaser.GameObjects.Arc;
    private shade!: Phaser.GameObjects.Rectangle;
    private interact!: Phaser.Input.Keyboard.Key;
    private enter!: Phaser.Input.Keyboard.Key;
    private space!: Phaser.Input.Keyboard.Key;
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

    constructor () { super('Sports'); }

    create ()
    {
        this.state = 'transition'; this.player = 0; this.round = 1;
        this.scores = [0, 0]; this.attempts = [0, 0]; this.firstLucasScore = 0;
        this.phase = 0; this.power = 0; this.aim = 0; this.isTyping = false;
        this.players = []; this.scoreTexts = []; this.attemptTexts = []; this.typingEvent = undefined;
        this.add.image(512, 384, 'sports-background').setDisplaySize(1024, 768);
        // Centro geométrico dos anéis no arquivo original: (302, 313).
        this.add.image(512 - 302 * 0.42, 335 - 313 * 0.42, 'sports-target').setOrigin(0).setScale(0.42);
        ['lucas-front', 'gabriella-front'].forEach((key, index) => {
            this.players.push(this.add.image(index === 0 ? 230 : 794, 555, key)
                .setOrigin(0.5, 1).setScale(0.14).setDepth(20));
        });
        this.ball = this.add.image(230, 450, 'sports-ball').setDepth(40).setVisible(false);
        this.ball.setScale(44 / this.ball.width);
        this.impact = this.add.circle(512, 335, 5, 0xF4EBDD).setStrokeStyle(2, 0x1E2438).setDepth(35).setVisible(false);
        this.createScoreboard();
        this.banner = this.text(512, 235, '', 23).setDepth(110).setVisible(false);
        const bar = this.add.rectangle(512, 545, 340, 22, 0x1E2438).setStrokeStyle(2, 0xF4EBDD);
        const sweetSpot = this.add.rectangle(512, 545, 36, 22, 0xD8B36A, 0.5);
        this.marker = this.add.rectangle(342, 545, 5, 32, 0xF4EBDD);
        this.meter = this.add.container(0, 0, [bar, sweetSpot, this.marker]).setDepth(100).setVisible(false);
        this.crosshair = this.add.circle(512, 335, 7, 0xD8B36A, 0.9).setStrokeStyle(2, 0x1E2438).setDepth(36).setVisible(false);
        this.shade = this.add.rectangle(512, 384, 1024, 768, 0x1E2438, 0.6).setDepth(90).setVisible(false);
        const box = this.add.image(512, 653, 'dialog-box').setDisplaySize(780, 180);
        this.dialogText = this.add.text(332, 628, '', { fontFamily: 'Arial', fontSize: '24px', color: '#1E2438',
            wordWrap: { width: 480 }, lineSpacing: 8 });
        this.dialogName = this.add.text(397, 604, '', { fontFamily: 'Arial', fontSize: '18px', color: '#F4EBDD',
            fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.dialog = this.add.container(0, 0, [box, this.dialogText, this.dialogName]).setDepth(200).setVisible(false);
        this.portrait = this.add.image(145, 528, 'lucas-portrait').setScale(0.22).setDepth(150).setVisible(false);
        this.rules = this.add.container(0, 0).setDepth(120).setVisible(false);
        this.rules.add([
            this.text(512, 290, 'VALENDO NADA', 32),
            this.text(512, 380, '3 tentativas para cada jogador.\nAcerte o mais perto possível do centro.\nMaior pontuação vence.', 23),
            this.text(512, 485, 'Lucas: E • Gabriella: ENTER\n1º toque: força • 2º toque: lançar\nCentro da barra = altura do alvo.', 21),
            this.text(512, 595, 'E ou ENTER — Começar', 22)
        ]);
        const keyboard = this.input.keyboard!;
        this.interact = keyboard.addKey('E'); this.enter = keyboard.addKey('ENTER'); this.space = keyboard.addKey('SPACE');
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => this.startDialog(script.intro, () => {
                this.state = 'rules'; this.shade.setVisible(true); this.rules.setVisible(true);
            }));
        this.cameras.main.fadeIn(1000, 30, 36, 56);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.typingEvent?.remove(false));
    }

    private text (x: number, y: number, content: string, size: number)
    {
        return this.add.text(x, y, content, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#F4EBDD',
            backgroundColor: '#1E2438', padding: { x: 12, y: 8 }, align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    }

    private createScoreboard ()
    {
        this.add.image(512, 115, 'sports-score-panel').setScale(0.30).setDepth(100);
        [420, 603].forEach((x, index) => {
            const style = { fontFamily: 'Arial', color: '#1E2438', align: 'center' };
            this.add.text(x, 77, index === 0 ? 'LUCAS' : 'GABRIELLA', {
                ...style, fontSize: '18px', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(102);
            this.scoreTexts.push(this.add.text(x, 121, '0', {
                ...style, fontSize: '32px', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(102));
            this.attemptTexts.push(this.add.text(x, 163, '0/3 tentativas', {
                ...style, fontSize: '15px'
            }).setOrigin(0.5).setDepth(102));
        });
        this.roundText = this.text(512, 205, 'RODADA 1/3', 17).setDepth(103);
    }

    update (_time: number, delta: number)
    {
        const e = Phaser.Input.Keyboard.JustDown(this.interact);
        const enter = Phaser.Input.Keyboard.JustDown(this.enter);
        const space = Phaser.Input.Keyboard.JustDown(this.space);
        if (this.state === 'dialog' && (e || enter)) this.advanceDialog();
        else if (this.state === 'rules' && (e || enter))
        {
            this.rules.setVisible(false); this.shade.setVisible(false); this.beginTurn();
        }
        else if (this.state === 'power' || this.state === 'aim')
        {
            const activeKey = this.player === 0 ? e : enter;
            if (this.state === 'power')
            {
                this.phase += Math.min(delta, 50) / 650;
                this.power = (Math.sin(this.phase) + 1) / 2;
                this.marker.x = 342 + this.power * 340;
                if (activeKey)
                {
                    this.state = 'aim'; this.phase = -Math.PI / 2;
                    this.crosshair.setVisible(true);
                    this.banner.setText(`${this.playerName()} — ${this.keyName()}: lançar`);
                    this.drawAim();
                }
            }
            else
            {
                this.phase += Math.min(delta, 50) / 600;
                this.aim = (Math.sin(this.phase) + 1) / 2;
                this.drawAim();
                if (activeKey) this.launch();
            }
        }
        else if (this.state === 'tiebreak')
        {
            if (e || enter) { this.round++; this.player = 0; this.shade.setVisible(false); this.beginTurn(); }
            else if (space) { this.shade.setVisible(false); this.afterCompetition(); }
        }
        else if (this.state === 'card' && e) this.scene.restart();
    }

    private playerName () { return this.player === 0 ? 'PLAYER 1 — LUCAS' : 'PLAYER 2 — GABRIELLA'; }
    private keyName () { return this.player === 0 ? 'E' : 'ENTER'; }

    private beginTurn ()
    {
        this.updateScore();
        this.banner.setVisible(true).setText(this.playerName());
        if (this.round === 1) this.startDialog(this.player === 0 ? script.firstLucas : script.firstGabriella, () => this.beginPower());
        else if (this.round === 2 && this.player === 0) this.startDialog(script.second, () => this.beginPower());
        else if (this.round === 3 && this.player === 1 && Math.abs(this.scores[0] - this.scores[1]) <= 50)
            this.startDialog(script.close, () => this.beginPower());
        else this.beginPower();
    }

    private beginPower ()
    {
        this.state = 'power'; this.phase = -Math.PI / 2; this.power = 0; this.aim = 0;
        this.marker.x = 342;
        this.impact.setVisible(false); this.ball.setVisible(false); this.crosshair.setVisible(false);
        this.players.forEach((sprite, i) => sprite.setAlpha(i === this.player ? 1 : 0.65));
        this.banner.setText(`${this.playerName()} — ${this.keyName()}: travar força`).setVisible(true);
        this.meter.setVisible(true);
    }

    private drawAim ()
    {
        const x = 512 + (this.aim - 0.5) * 240, y = 335 + (0.5 - this.power) * 240;
        this.crosshair.setPosition(x, y);
    }

    private launch ()
    {
        if (this.state !== 'aim') return;
        this.state = 'flight'; this.meter.setVisible(false); this.crosshair.setVisible(false);
        this.banner.setText('…');
        const startX = this.players[this.player].x, startY = 455;
        const endX = 512 + (this.aim - 0.5) * 240, endY = 335 + (0.5 - this.power) * 240;
        const points = scoreImpact(Math.hypot(endX - 512, endY - 335));
        const baseScale = 44 / this.ball.width;
        this.ball.setPosition(startX, startY).setScale(baseScale).setVisible(true);
        const flight = { t: 0 };
        this.tweens.add({ targets: flight, t: 1, duration: 850, onUpdate: () => {
            this.ball.setPosition(Phaser.Math.Linear(startX, endX, flight.t),
                Phaser.Math.Linear(startY, endY, flight.t) - Math.sin(flight.t * Math.PI) * 110);
            this.ball.setScale(baseScale * (1 - 0.55 * flight.t));
        }, onComplete: () => {
            this.ball.setVisible(false); this.impact.setPosition(endX, endY).setVisible(true);
            this.scores[this.player] += points; this.attempts[this.player]++;
            if (this.round === 1 && this.player === 0) this.firstLucasScore = points;
            this.updateScore();
            this.banner.setText(`${this.player === 0 ? 'Lucas' : 'Gabriella'}: +${points} pontos`);
            this.time.delayedCall(1100, () => this.react(points));
        } });
    }

    private react (points: number)
    {
        const next = () => this.nextTurn();
        if (this.round === 1 && this.player === 0) this.startDialog(points >= 75 ? script.high : script.low, next);
        else if (this.round === 1 && this.player === 1 && points > this.firstLucasScore) this.startDialog(script.lead, next);
        else next();
    }

    private nextTurn ()
    {
        if (this.player === 0) { this.player = 1; this.beginTurn(); }
        else if (this.round < 3) { this.round++; this.player = 0; this.beginTurn(); }
        else this.showResult();
    }

    private updateScore ()
    {
        this.scoreTexts.forEach((text, i) => text.setText(String(this.scores[i])));
        this.attemptTexts.forEach((text, i) => text.setText(this.round <= 3 ? `${this.attempts[i]}/3 tentativas` : `${this.attempts[i]} tentativas`));
        this.roundText.setText(this.round <= 3 ? `RODADA ${this.round}/3` : `DESEMPATE ${this.round - 3}`);
    }

    private showResult ()
    {
        this.players.forEach(sprite => sprite.setAlpha(1));
        const difference = this.scores[0] - this.scores[1];
        this.banner.setText(difference === 0 ? 'EMPATE' : difference > 0 ? 'LUCAS VENCEU' : 'GABRIELLA VENCEU');
        let lines: RoutineLine[] = difference === 0 ? script.draw : difference > 0 ? script.lucasWins : script.gabriellaWins;
        // A resposta factual acompanha o número de rodadas, inclusive no desempate.
        if (difference > 0 && this.round > 3) lines = lines.map(line => line.text === 'Foram três.' ? { ...line, text: `Foram ${this.round} rodadas.` } : line);
        this.startDialog(lines, () => {
            if (difference === 0)
            {
                this.state = 'tiebreak'; this.shade.setVisible(true);
                this.banner.setText('EMPATE\nE ou ENTER — Mais uma rodada\nESPAÇO — Guardar o empate');
            }
            else this.afterCompetition();
        });
    }

    private afterCompetition ()
    {
        this.banner.setVisible(false); this.impact.setVisible(false);
        this.state = 'pause';
        this.tweens.add({ targets: this.players[0], x: 460, duration: 600 });
        this.tweens.add({ targets: this.players[1], x: 565, duration: 600, onComplete: () => {
            const variant = this.scores[0] > this.scores[1] ? script.afterLucas : this.scores[1] > this.scores[0] ? script.afterGabriella : script.afterDraw;
            this.startDialog([...script.after, ...variant, ...script.ending], () => this.showCard());
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
        this.add.image(512, 384, 'memory-card').setDisplaySize(600, 850).setDepth(300);
        this.add.text(512, 364, 'Valendo Nada', { fontFamily: 'Arial', fontSize: '26px', color: '#1E2438',
            fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
        this.add.text(512, 414, 'Porque com vocês, até brincadeira vira campeonato.', { fontFamily: 'Arial', fontSize: '20px',
            color: '#39435F', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5).setDepth(301);
        this.text(512, 703, 'E — Jogar de novo', 22).setDepth(302);
    }
}
