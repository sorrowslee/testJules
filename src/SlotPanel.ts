import * as PIXI from 'pixi.js';

// Define Symbol Types
export enum SymbolType {
    A = "SymbolA",
    B = "SymbolB",
    C = "SymbolC",
    D = "SymbolD",
    E = "SymbolE",
}

// Helper function/map for symbol colors
export const SymbolColors: Record<SymbolType, number> = {
    [SymbolType.A]: 0xFF0000, // Red
    [SymbolType.B]: 0x00FF00, // Green
    [SymbolType.C]: 0x0000FF, // Blue
    [SymbolType.D]: 0xFFFF00, // Yellow
    [SymbolType.E]: 0xFF00FF, // Magenta
};

// Define type for a position on the grid
export type SymbolPosition = { col: number; row: number };

// Winning lines are now generated dynamically for horizontal wins.
// const winningLines: SymbolPosition[][] = [ ... ]; // REMOVED

export class SlotPanel {
    private rows: number; // Number of visible symbols per reel
    private cols: number; // Number of reels
    private container: PIXI.Container;
    private reels: PIXI.Graphics[][] = []; // Stores the graphics for each symbol on each reel: reels[colIndex][rowIndex]
    private finalSymbols: SymbolType[][] = []; // Stores the final SymbolType for each cell: finalSymbols[colIndex][rowIndex]
    private isSpinning: boolean = false;

    // Define symbol properties
    private symbolWidth: number = 100;
    private symbolHeight: number = 100;
    private symbolPadding: number = 10; // Padding between symbols
    private screenWidth: number; // To store screen width for centering
    private screenHeight: number; // To store screen height for centering

    constructor(rows: number, cols: number, screenWidth: number, screenHeight: number) {
        this.rows = rows;
        this.cols = cols;
        this.container = new PIXI.Container();
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
    }

    public initializePanel(stage: PIXI.Container): void {
        this.finalSymbols = []; // Initialize finalSymbols array
        for (let c = 0; c < this.cols; c++) { // Iterate through columns (reels)
            this.reels[c] = [];
            this.finalSymbols[c] = []; // Initialize inner array for this column
            for (let r = 0; r < this.rows; r++) { // Iterate through rows (symbols in a reel)
                // Create a placeholder graphic
                const symbol = new PIXI.Graphics();
                const randomSymbolType = this.getRandomSymbolType();
                this.finalSymbols[c][r] = randomSymbolType; // Store initial symbol, will be overwritten by stop()

                symbol.beginFill(SymbolColors[randomSymbolType]);
                symbol.drawRect(0, 0, this.symbolWidth, this.symbolHeight);
                symbol.endFill();

                // Position the symbol
                symbol.x = c * (this.symbolWidth + this.symbolPadding);
                symbol.y = r * (this.symbolHeight + this.symbolPadding);

                // Add to the container and store reference
                this.container.addChild(symbol);
                this.reels[c][r] = symbol;
            }
        }

        // Center the panel on the stage
        const panelWidth = this.cols * (this.symbolWidth + this.symbolPadding) - (this.cols > 0 ? this.symbolPadding : 0);
        const panelHeight = this.rows * (this.symbolHeight + this.symbolPadding) - (this.rows > 0 ? this.symbolPadding : 0);
        
        this.container.x = (this.screenWidth - panelWidth) / 2;
        this.container.y = (this.screenHeight - panelHeight) / 2;


        // Add the panel's container to the main stage
        stage.addChild(this.container);
    }

    // Placeholder for future spin method
    public spin(): void {
        console.log('Spinning the slots!');
        // Reset alpha of all symbols before spinning
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                if (this.reels[c] && this.reels[c][r]) {
                    this.reels[c][r].alpha = 1.0;
                }
            }
        }
        this.isSpinning = true;
        // Logic for changing symbols will go here (handled in update)
    }

    public stop(): void {
        console.log('Stopping the slots!');
        this.isSpinning = false;
        this.finalSymbols = []; // Clear/initialize previous final symbols

        // Land on final symbols and store them
        for (let c = 0; c < this.cols; c++) {
            this.finalSymbols[c] = []; // Initialize array for the current column
            for (let r = 0; r < this.rows; r++) {
                const symbolGraphic = this.reels[c][r];
                const finalSymbolType = this.getRandomSymbolType(); // For now, land on random symbols
                
                this.finalSymbols[c][r] = finalSymbolType; // Store the final symbol type

                symbolGraphic.clear();
                symbolGraphic.beginFill(SymbolColors[finalSymbolType]);
                symbolGraphic.drawRect(0, 0, this.symbolWidth, this.symbolHeight);
                symbolGraphic.endFill();
            }
        }
        this.checkWin(); // Check for wins after stopping
    }

    public checkWin(): { line: SymbolPosition[], symbol: SymbolType, count: number }[] {
        console.log("Checking for wins...");
        if (!this.finalSymbols || this.finalSymbols.length === 0 || this.finalSymbols.length !== this.cols) {
            console.log("No final symbols to check or finalSymbols not initialized correctly for all columns.");
            return []; // Return empty array if no symbols or incorrect init
        }

        const winningResults: { line: SymbolPosition[], symbol: SymbolType, count: number }[] = [];

        // Check for horizontal wins only
        for (let r = 0; r < this.rows; r++) { // Iterate through each row
            const firstSymbolType = this.finalSymbols[0][r]; // Symbol in the first column of the current row
            let isWinningLine = true;
            let currentLinePositions: SymbolPosition[] = [{col: 0, row: r}];

            for (let c = 1; c < this.cols; c++) { // Iterate through remaining columns in that row
                currentLinePositions.push({col: c, row: r});
                if (this.finalSymbols[c][r] !== firstSymbolType) {
                    isWinningLine = false;
                    break; // No need to check further columns in this row
                }
            }

            if (isWinningLine && this.cols > 0) { // A win must have at least one symbol if cols > 0
                winningResults.push({ line: currentLinePositions, symbol: firstSymbolType, count: this.cols });
                
                // Simple visual indication: make winning symbols slightly transparent
                currentLinePositions.forEach(pos => {
                     if (this.reels[pos.col] && this.reels[pos.col][pos.row]) {
                        this.reels[pos.col][pos.row].alpha = 0.7;
                    }
                });
            }
        }

        if (winningResults.length > 0) {
            console.log("WIN DETECTED!");
            winningResults.forEach(win => {
                console.log(`Line: ${win.line.map(p => `(col:${p.col},row:${p.row})`).join(', ')}, Symbol: ${win.symbol}, Count: ${win.count}`);
            });
        } else {
            console.log("No winning lines.");
        }
        return winningResults; // Return the array of winning lines
    }

    // This method will be called by the game loop
    public update(delta: number): void {
        if (!this.isSpinning) {
            return;
        }

        // Rapidly change symbols in each reel
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                const symbolGraphic = this.reels[c][r];
                const randomSymbolType = this.getRandomSymbolType();
                symbolGraphic.clear(); // Clear previous drawing
                symbolGraphic.beginFill(SymbolColors[randomSymbolType]);
                symbolGraphic.drawRect(0, 0, this.symbolWidth, this.symbolHeight);
                symbolGraphic.endFill();
            }
        }
    }

    private getRandomSymbolType(): SymbolType {
        const symbolValues = Object.values(SymbolType);
        const randomIndex = Math.floor(Math.random() * symbolValues.length);
        return symbolValues[randomIndex];
    }
}
