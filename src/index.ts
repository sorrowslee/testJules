import { Game } from './Game';

window.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    try {
        await game.initialize();
        console.log("Game initialized successfully.");
        // The game.start() method was removed from Game.ts as its logic
        // (starting the ticker) is now part of the initialize() method.
    } catch (error) {
        console.error("Error initializing game:", error);
    }
});
