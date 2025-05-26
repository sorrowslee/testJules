import * as PIXI from 'pixi.js';
import { SlotPanel } from './SlotPanel'; // Ensure SlotPanel is imported
import { UIButton } from './UIButton';   // Import UIButton

export class Game {
    private app: PIXI.Application;
    private slotPanel: SlotPanel;
    private spinButton: UIButton;
    private balanceText: PIXI.Text;
    private winMessageText: PIXI.Text;
    private currentBalance: number = 100; // Initial balance
    private readonly BET_AMOUNT: number = 10; // Define bet amount
    private readonly PAYOUT_PER_WINNING_LINE: number = 50; // Define payout per line

    constructor() {
        // Initialize PixiJS Application
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb, // Light blue background
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // Append the PixiJS view to the HTML body
        document.body.appendChild(this.app.view as unknown as Node);

        // Set up a basic stage (the stage is automatically created with the Application)
        // You can add elements to this.app.stage
        // For example, let's add a simple text to confirm it's working
        // const welcomeText = new PIXI.Text('Welcome to the Game!', {
        //     fontFamily: 'Arial',
        //     fontSize: 24,
        //     fill: 0xffffff, // White color
        //     align: 'center',
        // });
        // welcomeText.x = this.app.screen.width / 2;
        // welcomeText.y = this.app.screen.height / 2;
        // welcomeText.anchor.set(0.5);
        // this.app.stage.addChild(welcomeText);

        // Log PixiJS version
        console.log(`PixiJS version: ${PIXI.VERSION}`);

        // Create and initialize the SlotPanel
        // Test with 3 rows, 5 columns
        this.slotPanel = new SlotPanel(3, 5, this.app.screen.width, this.app.screen.height); 
        this.slotPanel.initializePanel(this.app.stage);

        // Create and add the spin button
        this.spinButton = new UIButton('Spin', 150, 50, this.handleSpin.bind(this));
        
        // Position the button (example: below the slot panel)
        // Ensure slotPanel is valid before trying to get its bounds
        if (this.slotPanel) { // Check if slotPanel instance exists
            const panelBounds = this.slotPanel.getPanelBounds(); // Use the new public getter
            
            // To position relative to the stage center and below the panel:
            this.spinButton.x = this.app.screen.width / 2 - this.spinButton.width / 2;
            // Using panelBounds.height which is from getBounds()
            this.spinButton.y = (this.app.screen.height + panelBounds.height) / 2 + 30; 
            
        } else { // Fallback positioning if slotPanel is not ready (should ideally not happen)
            this.spinButton.x = this.app.screen.width / 2 - this.spinButton.width / 2;
            this.spinButton.y = this.app.screen.height - 70; // 70px from bottom
        }
        
        this.app.stage.addChild(this.spinButton);

        // Initialize and position Balance Text
        this.balanceText = new PIXI.Text(`Balance: $${this.currentBalance}`, {
            fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left'
        });
        this.balanceText.x = 20; // Padding from left
        this.balanceText.y = 20; // Padding from top
        this.app.stage.addChild(this.balanceText);

        // Initialize and position Win Message Text
        const winMessageStyle = { 
            fontFamily: 'Arial', 
            fontSize: 20, 
            fill: 0x00ff00, 
            align: 'center', 
            stroke: 0x000000, // Black stroke
            strokeThickness: 2 
        } as any; // Workaround for @types/pixi.js v5 mismatch with PixiJS v4.x code
        
        this.winMessageText = new PIXI.Text('', winMessageStyle); // Initially empty
        // Position below the spin button or centrally
        this.winMessageText.anchor.set(0.5);
        this.winMessageText.x = this.app.screen.width / 2;
        this.winMessageText.y = this.spinButton.y + this.spinButton.height + 30; // 30px below button
        this.app.stage.addChild(this.winMessageText);
        
        this.updateBalanceDisplay(); // Initial display of balance

        // Remove automatic spin and stop
        // this.slotPanel.spin(); // Removed
        // setTimeout(() => { // Removed
        //     this.slotPanel.stop();
        // }, 3000); 
    }

    private handleSpin(): void {
        if (this.spinButton.isDisabled) {
            return; // Do nothing if button is already disabled (e.g. mid-spin)
        }

        // Check for sufficient balance
        if (this.currentBalance < this.BET_AMOUNT) {
            this.winMessageText.text = "Not enough balance!";
            // Optional: Clear message after a few seconds
            setTimeout(() => { if(this.winMessageText.text === "Not enough balance!") this.winMessageText.text = ''; }, 3000);
            return; // Do not proceed with spin
        }

        // Deduct bet amount
        this.currentBalance -= this.BET_AMOUNT;
        this.updateBalanceDisplay();
        this.winMessageText.text = ''; // Clear previous win/no-win/error messages

        this.spinButton.disable(); // Disable button and change text to "Spinning..."
        this.slotPanel.spin();

        // Simulate spin duration and then stop
        setTimeout(() => {
            this.slotPanel.stop(); // This now internally calls checkWin()
            const winningLines = this.slotPanel.checkWin(); // Call it again to get results here for display

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

            this.spinButton.enable(); // Re-enable button and reset text
            
            // Optional: Clear win/no-win message after a few seconds (unless it's an error like "Not enough balance!")
            // The "Not enough balance!" message already has its own timed clear.
            if (this.winMessageText.text !== "Not enough balance!") {
                 setTimeout(() => { this.winMessageText.text = ''; }, 5000);
            }

        }, 3000); // Spin for 3 seconds
    }

    private updateBalanceDisplay(): void {
        this.balanceText.text = `Balance: $${this.currentBalance}`;
    }

    // We can add game loop logic here later
    public gameLoop(delta: number): void {
        // This is where game updates would happen
        // For now, let's just log delta
        // console.log(`Delta: ${delta}`);

        // Update the slot panel
        if (this.slotPanel) {
            this.slotPanel.update(delta);
        }
    }

    public start(): void {
        // Start the game loop
        // Type assertion as a workaround for @types/pixi.js v5 mismatch with PixiJS v4.x ticker behavior.
        // PixiJS v4 ticker's `add` method expects a callback like (delta: number) => void.
        // The v5 types might expect a TickerCallback compatible with (ticker: PIXI.Ticker) => void.
        this.app.ticker.add(this.gameLoop.bind(this) as any); // Workaround for @types/pixi.js v5 mismatch with PixiJS v4.x code
    }
}
