// Keyboard and mouse state. Movement is WASD or arrows; aiming is the mouse; firing is
// click or hold, with space as an alternative so the game is playable keyboard-only.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: canvas.width * 0.5, y: canvas.height * 0.5, down: false };
    this.pressed = new Set();   // edge-triggered keys, cleared each frame by consume()
    this.onFirstGesture = null;

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      this._gesture();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener("mousedown", (e) => { e.preventDefault(); this.mouse.down = true; this._gesture(); });
    window.addEventListener("mouseup", () => { this.mouse.down = false; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  _gesture() {
    if (this.onFirstGesture) { this.onFirstGesture(); this.onFirstGesture = null; }
  }

  axis() {
    const k = this.keys;
    const x = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    const y = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    return { x, y };
  }

  firing() { return this.mouse.down || this.keys.has(" "); }

  // True once per key press, for actions that must not repeat while held.
  hit(...names) {
    for (const n of names) if (this.pressed.has(n)) return true;
    return false;
  }

  endFrame() { this.pressed.clear(); }
}
