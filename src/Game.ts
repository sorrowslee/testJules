import * as PIXI from 'pixi.js';
import { SlotPanel } from './SlotPanel';
import { UIButton } from './UIButton';

export class Game {
    public renderer!: PIXI.Renderer; // Definite assignment in initialize
    public stage!: PIXI.Container;
    public ticker!: PIXI.Ticker;
    public slotPanel!: SlotPanel;
    public spinButton!: UIButton;
    public balanceText!: PIXI.Text;
    public winMessageText!: PIXI.Text;
    
    public currentBalance: number = 100;
    public readonly BET_AMOUNT: number = 10;
    public readonly PAYOUT_PER_WINNING_LINE: number = 50;

    constructor() {
        console.log("Game constructor called");
        // Non-PIXI members are initialized with their declaration.
    }

    public async initialize(): Promise<void> {
        console.log("Game initializing...");
        const rendererOptions = {
            width: 800,
            height: 600,
            resolution: window.devicePixelRatio || 1,
            antialias: true,
        };
        this.renderer = await PIXI.autoDetectRenderer(rendererOptions);
        (document.body.appendChild(this.renderer.view as unknown as Node)); // PixiJS v8 expects HTMLCanvasElement
        
        // For PixiJS v8, background color is set on the renderer's background system
        this.renderer.background.color = 0x1099bb;

        this.stage = new PIXI.Container();
        // In PixiJS v8, PIXI.Ticker.shared is often used, or a new one can be created.
        // If creating a new one and it's not auto-started, ensure ticker.start() is called.
        this.ticker = PIXI.Ticker.shared; // Using shared ticker for v8

        // Diagnostic logs
        console.log('PIXI Renderer:', this.renderer);
        console.log('PIXI Stage:', this.stage);
        if (this.renderer && this.renderer.view) {
            console.log('PIXI Renderer View:', this.renderer.view);
        } else {
            console.log('PIXI Renderer or Renderer View is null or undefined!');
        }
        console.log('Document body:', document.body);

        // Log PixiJS version
        console.log(`PixiJS version: ${PIXI.VERSION}`);

        // Create and initialize the SlotPanel
        this.slotPanel = new SlotPanel(3, 5, this.renderer.screen.width, this.renderer.screen.height); 
        this.slotPanel.initializePanel(this.stage);

        // Create and add the spin button
        this.spinButton = new UIButton('Spin', 150, 50, this.handleSpin.bind(this));
        
        if (this.slotPanel) {
            const panelBounds = this.slotPanel.getPanelBounds();
            this.spinButton.x = this.renderer.screen.width / 2 - this.spinButton.width / 2;
            this.spinButton.y = (this.renderer.screen.height + panelBounds.height) / 2 + 30;
        } else {
            this.spinButton.x = this.renderer.screen.width / 2 - this.spinButton.width / 2;
            this.spinButton.y = this.renderer.screen.height - 70;
        }
        this.stage.addChild(this.spinButton);

        // Initialize and position Balance Text
        // For PixiJS v8, PIXI.TextStyle is an interface, not a class. Direct object literal is fine.
        this.balanceText = new PIXI.Text({
            text: `Balance: $${this.currentBalance}`,
            style: {
                fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left'
            }
        });
        this.balanceText.x = 20;
        this.balanceText.y = 20;
        this.stage.addChild(this.balanceText);

        // Initialize and position Win Message Text
        this.winMessageText = new PIXI.Text({
            text: '',
            style: {
                fontFamily: 'Arial', 
                fontSize: 20, 
                fill: 0x00ff00, 
                align: 'center', 
                stroke: { color: 0x000000, width: 2 } // v8 stroke style
            }
        });
        this.winMessageText.anchor.set(0.5);
        this.winMessageText.x = this.renderer.screen.width / 2;
        this.winMessageText.y = this.spinButton.y + this.spinButton.height + 30;
        this.stage.addChild(this.winMessageText);
        
        this.updateBalanceDisplay();

        // Add gameLoop to ticker
        this.ticker.add(this.gameLoop, this); // Pass context if gameLoop uses 'this'
        // If not using PIXI.Ticker.shared or if it's not auto-started:
        if (!this.ticker.started) {
            this.ticker.start();
        }
        console.log("Game initialization complete.");
    }

    private handleSpin(): void {
        if (this.spinButton.isDisabled) {
            return;
        }

        if (this.currentBalance < this.BET_AMOUNT) {
            this.winMessageText.text = "Not enough balance!";
            setTimeout(() => { if(this.winMessageText.text === "Not enough balance!") this.winMessageText.text = ''; }, 3000);
            return;
        }

        this.currentBalance -= this.BET_AMOUNT;
        this.updateBalanceDisplay();
        this.winMessageText.text = '';

        this.spinButton.disable();
        this.slotPanel.spin();

        setTimeout(() => {
            this.slotPanel.stop();
            const winningLines = this.slotPanel.checkWin();

            if (winningLines.length > 0) {
                const totalPayout = winningLines.length * this.PAYOUT_PER_WINNING_LINE;
                this.currentBalance += totalPayout;
                this.updateBalanceDisplay();

                let message = `WIN! +$${totalPayout} `;
                winningLines.forEach((win, index) => {
                    message += `(Line ${index + 1}: ${win.count}x${win.symbol})`;
                    if (index < winningLines.length - 1) {
                        message += ", ";
                    }
                });
                this.winMessageText.text = message;
            } else {
                this.winMessageText.text = "No Win.";
            }

            this.spinButton.enable();
            
            if (this.winMessageText.text !== "Not enough balance!") {
                 setTimeout(() => { this.winMessageText.text = ''; }, 5000);
            }

        }, 3000);
    }

    private updateBalanceDisplay(): void {
        if(this.balanceText) { // Check if balanceText is initialized
            this.balanceText.text = `Balance: $${this.currentBalance}`;
        }
    }

    public gameLoop(ticker: PIXI.Ticker | number): void { // PIXI.Ticker for v6+, number for delta in v4/v5
        // For v8, delta is often ticker.deltaTime or ticker.deltaMS
        // For simplicity and consistency with previous 'as any' for delta, let's assume delta comes from ticker
        let delta: number;
        if (typeof ticker === 'number') {
            delta = ticker; // For v4/v5 style delta
        } else {
            delta = ticker.deltaTime; // For v6+ style ticker object
        }

        if (this.slotPanel) {
            this.slotPanel.update(delta);
        }
        // Ensure renderer and stage are available before rendering
        if (this.renderer && this.stage) {
            this.renderer.render(this.stage);
        }
    }
}
