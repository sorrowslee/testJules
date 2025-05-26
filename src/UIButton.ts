import * as PIXI from 'pixi.js';

export class UIButton extends PIXI.Container {
    private buttonGraphics: PIXI.Graphics;
    private buttonText: PIXI.Text;
    private callback: () => void;
    private buttonWidth: number;
    private buttonHeight: number;
    private originalText: string;
    private _isDisabled: boolean = false;

    constructor(text: string, width: number, height: number, callback: () => void) {
        super();
        this.originalText = text;
        this.buttonWidth = width;
        this.buttonHeight = height;
        this.callback = callback;

        // Make the container interactive
        this.interactive = true;
        // Workaround for @types/pixi.js v5 mismatch with PixiJS v4.x: buttonMode is on DisplayObject
        (this as PIXI.DisplayObject).buttonMode = true; // Show hand cursor on hover

        // Create button graphics (rounded rectangle)
        this.buttonGraphics = new PIXI.Graphics();
        this.drawButton(0x007bff, 0x0056b3); // Default blue colors, normal and hover/pressed
        this.addChild(this.buttonGraphics);

        // Create button text
        this.buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: Math.max(16, height * 0.4), // Responsive font size
            fill: 0xffffff, // White text
            align: 'center',
            fontWeight: 'bold',
        });
        this.buttonText.anchor.set(0.5);
        this.buttonText.x = width / 2;
        this.buttonText.y = height / 2;
        this.addChild(this.buttonText);

        // Event listeners
        this.on('pointerdown', this.onButtonDown.bind(this))
            .on('pointerup', this.onButtonUp.bind(this))
            .on('pointerupoutside', this.onButtonUp.bind(this)) // Handle if pointer dragged out
            .on('pointerover', this.onButtonOver.bind(this))
            .on('pointerout', this.onButtonOut.bind(this));
    }

    private drawButton(fillColor: number, borderColor: number, lineWidth: number = 2): void {
        this.buttonGraphics.clear();
        this.buttonGraphics.beginFill(fillColor);
        if (lineWidth > 0) {
            this.buttonGraphics.lineStyle(lineWidth, borderColor, 1);
        }
        this.buttonGraphics.drawRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, 10); // 10 is corner radius
        this.buttonGraphics.endFill();
    }

    private onButtonDown(): void {
        if (this._isDisabled) return;
        this.drawButton(0x0056b3, 0x004085); // Darker blue for pressed state
        this.y += 1; // Simple pressed effect
    }

    private onButtonUp(): void {
        if (this._isDisabled) return;
        this.drawButton(0x007bff, 0x0056b3); // Back to normal blue
        this.y -= 1;
        this.callback(); // Execute the callback on button release
    }

    private onButtonOver(): void {
        if (this._isDisabled) return;
        this.drawButton(0x0069d9, 0x005cbf); // Slightly lighter blue for hover
    }

    private onButtonOut(): void {
        if (this._isDisabled) { // If disabled, keep disabled appearance
             this.drawButton(0xaaaaaa, 0x888888); // Greyed out
        } else {
            this.drawButton(0x007bff, 0x0056b3); // Back to normal blue
        }
    }

    public setText(newText: string): void {
        this.buttonText.text = newText;
    }

    public disable(): void {
        this._isDisabled = true;
        this.interactive = false;
        // Workaround for @types/pixi.js v5 mismatch with PixiJS v4.x: buttonMode is on DisplayObject
        (this as PIXI.DisplayObject).buttonMode = false;
        this.setText("Spinning..."); // Or any text indicating it's busy
        this.drawButton(0xaaaaaa, 0x888888); // Greyed out
    }

    public enable(): void {
        this._isDisabled = false;
        this.interactive = true;
        // Workaround for @types/pixi.js v5 mismatch with PixiJS v4.x: buttonMode is on DisplayObject
        (this as PIXI.DisplayObject).buttonMode = true;
        this.setText(this.originalText);
        this.drawButton(0x007bff, 0x0056b3); // Back to normal state
    }

    get isDisabled(): boolean {
        return this._isDisabled;
    }
}
