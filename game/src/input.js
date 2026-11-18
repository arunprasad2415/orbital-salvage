// Keyboard and pointer state. One listener set for the whole run; the game only
// reads `held`, `pressed` and the pointer each frame.
//
// Keys are stored by their logical name, not the raw KeyboardEvent.code: "KeyW"
// becomes "W", "ShiftLeft" becomes "SHIFT", so the game can ask for "W" and
// "SHIFT" and mean it whatever side of the keyboard was pressed.
export function attachInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { x: 640, y: 400, down: false, moved: 0 };

  const STICKY = {
    SHIFTLEFT: "SHIFT",
    SHIFTRIGHT: "SHIFT",
    CONTROLLEFT: "CTRL",
    CONTROLRIGHT: "CTRL",
    ALTLEFT: "ALT",
    ALTRIGHT: "ALT",
    ESCAPE: "ESC",
  };

  function name(e) {
    const code = (e.code || "").toUpperCase();
    if (code.startsWith("KEY") && code.length === 4) return code.slice(3);
    if (code.startsWith("DIGIT") && code.length === 6) return code.slice(5);
    return STICKY[code] ?? code;
  }

  const BLOCK = new Set(["SPACE", "ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT"]);

  window.addEventListener("keydown", (e) => {
    const k = name(e);
    if (BLOCK.has(k)) e.preventDefault();
    if (!held.has(k)) pressed.add(k);
    held.add(k);
  });

  window.addEventListener("keyup", (e) => held.delete(name(e)));
  window.addEventListener("blur", () => {
    held.clear();
    pointer.down = false;
  });

  function track(e) {
    const box = canvas.getBoundingClientRect();
    const sx = canvas.width / (box.width || 1);
    const sy = canvas.height / (box.height || 1);
    pointer.x = (e.clientX - box.left) * sx;
    pointer.y = (e.clientY - box.top) * sy;
    pointer.moved = 1.5;
  }

  canvas.addEventListener("mousemove", track);
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    track(e);
    pointer.down = true;
  });
  window.addEventListener("mouseup", () => {
    pointer.down = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  return {
    held,
    pressed,
    pointer,
    any(...keys) {
      return keys.some((k) => held.has(k));
    },
    took(...keys) {
      return keys.some((k) => pressed.has(k));
    },
    aim() {
      return pointer;
    },
    endFrame(dt) {
      pressed.clear();
      pointer.moved = Math.max(0, pointer.moved - dt);
    },
  };
}
