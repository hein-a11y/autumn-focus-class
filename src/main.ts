import Phaser from 'phaser';
import { gameConfig } from './config';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(gameConfig);

  const focusGame = () => {
    window.focus();
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.setAttribute('tabindex', '0');
      canvas.focus();
    }
  };

  // Auto focus canvas on game ready & click
  game.events.once('ready', () => {
    setTimeout(focusGame, 100);
  });

  document.addEventListener('pointerdown', focusGame);
  document.addEventListener('click', focusGame);
});
