import * as PIXI from 'pixi.js';
import { SlotPanel } from './SlotPanel'; // Ensure SlotPanel is imported
import { UIButton } from './UIButton';   // Import UIButton

export class Game {
    public renderer: PIXI.Renderer; // Changed to specific WebGL Renderer type
    public stage: PIXI.Container;
    public ticker: PIXI.Ticker;
    private slotPanel: SlotPanel;
    private spinButton: UIButton;
    private balanceText: PIXI.Text;
    private winMessageText: PIXI.Text;
    private currentBalance: number = 100; // Initial balance
    private readonly BET_AMOUNT: number = 10; // Define bet amount
    private readonly PAYOUT_PER_WINNING_LINE: number = 50; // Define payout per line

    constructor() {
        // Initialize Renderer, Stage, Ticker
        const rendererOptions = {
            width: 800,
            height: 600,
            resolution: window.devicePixelRatio || 1,
            antialias: true // Added for smoother graphics
        };
        this.renderer = PIXI.autoDetectRenderer(rendererOptions);
        document.body.appendChild(this.renderer.view as unknown as Node);
        this.renderer.backgroundColor = 0x1099bb; // Set background color

        this.stage = new PIXI.Container();
        this.ticker = new PIXI.Ticker();

        // Diagnostic logs
        console.log('PIXI Renderer:', this.renderer);
        console.log('PIXI Stage:', this.stage);
        if (this.renderer) {
            console.log('PIXI Renderer View:', this.renderer.view);
        } else {
            console.log('PIXI Renderer is null or undefined!');
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
        this.balanceText = new PIXI.Text(`Balance: $${this.currentBalance}`, {
            fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left'
        });
        this.balanceText.x = 20;
        this.balanceText.y = 20;
        this.stage.addChild(this.balanceText);

        // Initialize and position Win Message Text
        const winMessageStyle = { 
            fontFamily: 'Arial', 
            fontSize: 20, 
            fill: 0x00ff00, 
            align: 'center', 
            stroke: 0x000000,
            strokeThickness: 2 
        } as any; // Retain 'as any' due to ongoing type version mismatches
        
        this.winMessageText = new PIXI.Text('', winMessageStyle);
        this.winMessageText.anchor.set(0.5);
        this.winMessageText.x = this.renderer.screen.width / 2;
        this.winMessageText.y = this.spinButton.y + this.spinButton.height + 30;
        this.stage.addChild(this.winMessageText);
        
        this.updateBalanceDisplay();
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
        this.balanceText.text = `Balance: $${this.currentBalance}`;
    }

    public gameLoop(delta: number): void { // delta is provided by PIXI.Ticker
        if (this.slotPanel) {
            this.slotPanel.update(delta);
        }
        this.renderer.render(this.stage); // Render the stage
    }

    public start(): void {
        // Add gameLoop to ticker and start it
        this.ticker.add(this.gameLoop.bind(this) as any); // Using 'as any' due to previous Ticker type issues
        this.ticker.start();
    }
}
