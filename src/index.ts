import { Game } from './Game';

window.addEventListener('DOMContentLoaded', () => {
    // Create a new game instance
    const game = new Game();

    // Start the game (if you have a start method in your Game class)
    // For example, if Game class has a public start() method:
    game.start();

    // Optional: Log to confirm the game started
    console.log('Game instance created and started.');
});
