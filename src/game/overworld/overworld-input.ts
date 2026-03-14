import * as Phaser from "phaser";

import { GAMEPAD_DEADZONE, type InputState } from "@/game/overworld/overworld-data";

type KeySet = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
};

export class OverworldInputController {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: KeySet;
  private lastPadAttack = false;
  private lastPadInteract = false;
  private controllerConnected = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onControllerMessage: (message: string) => void,
    private readonly onControllerDisconnected: () => void,
  ) {}

  setup() {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.keys = this.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    }) as KeySet;

    this.scene.input.gamepad?.on("connected", this.handlePhaserGamepadConnected);
    window.addEventListener("gamepadconnected", this.handleBrowserGamepadConnected);
    window.addEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("gamepadconnected", this.handleBrowserGamepadConnected);
      window.removeEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected);
    });
  }

  readInput(): InputState {
    const keyboardX =
      Number(this.cursors.right.isDown || this.keys.right.isDown) -
      Number(this.cursors.left.isDown || this.keys.left.isDown);
    const keyboardY =
      Number(this.cursors.down.isDown || this.keys.down.isDown) -
      Number(this.cursors.up.isDown || this.keys.up.isDown);

    let gamepadX = 0;
    let gamepadY = 0;
    let sprint = false;
    let attack = false;
    let interact = false;

    const pad = this.getActiveGamepad();
    if (pad) {
      const leftX = this.readAxisValue(pad, 0);
      const leftY = this.readAxisValue(pad, 1);
      const dPadX =
        Number(this.isPadPressed(pad, 15)) - Number(this.isPadPressed(pad, 14));
      const dPadY =
        Number(this.isPadPressed(pad, 13)) - Number(this.isPadPressed(pad, 12));
      const attackPressed = this.isPadPressed(pad, 1);
      const interactPressed = this.isPadPressed(pad, 2);

      gamepadX = Math.abs(leftX) > GAMEPAD_DEADZONE ? leftX : dPadX;
      gamepadY = Math.abs(leftY) > GAMEPAD_DEADZONE ? leftY : dPadY;
      sprint = this.isPadPressed(pad, 0);
      attack = attackPressed && !this.lastPadAttack;
      interact = interactPressed && !this.lastPadInteract;
      this.lastPadAttack = attackPressed;
      this.lastPadInteract = interactPressed;
      this.controllerConnected = true;
    } else {
      this.lastPadAttack = false;
      this.lastPadInteract = false;
      this.controllerConnected = false;
    }

    return {
      x: Phaser.Math.Clamp(keyboardX + gamepadX, -1, 1),
      y: Phaser.Math.Clamp(keyboardY + gamepadY, -1, 1),
      sprint: this.keys.sprint.isDown || sprint,
      attack: Phaser.Input.Keyboard.JustDown(this.keys.attack) || attack,
      interact: Phaser.Input.Keyboard.JustDown(this.keys.interact) || interact,
    };
  }

  get isControllerConnected() {
    return this.controllerConnected;
  }

  private getActiveGamepad() {
    const phaserPad = this.scene.input.gamepad?.getPad(0);
    if (phaserPad) {
      return phaserPad;
    }

    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      return null;
    }

    return navigator.getGamepads().find((pad): pad is Gamepad => pad !== null && pad.connected) ?? null;
  }

  private readAxisValue(pad: Phaser.Input.Gamepad.Gamepad | Gamepad, index: number) {
    if ("axes" in pad && pad.axes.length > index) {
      const axis = pad.axes[index];
      return typeof axis === "number" ? axis : axis.getValue();
    }

    return 0;
  }

  private isPadPressed(pad: Phaser.Input.Gamepad.Gamepad | Gamepad, index: number) {
    if ("buttons" in pad && pad.buttons.length > index) {
      return pad.buttons[index]?.pressed ?? false;
    }

    const map: Record<number, boolean | undefined> = {
      0: "A" in pad ? pad.A : undefined,
      1: "B" in pad ? pad.B : undefined,
      2: "X" in pad ? pad.X : undefined,
      12: "up" in pad ? pad.up : undefined,
      13: "down" in pad ? pad.down : undefined,
      14: "left" in pad ? pad.left : undefined,
      15: "right" in pad ? pad.right : undefined,
    };

    return map[index] ?? false;
  }

  private readonly handlePhaserGamepadConnected = (
    pad: Phaser.Input.Gamepad.Gamepad,
  ) => {
    this.controllerConnected = true;
    this.onControllerMessage(`Controller connected: ${pad.id}`);
  };

  private readonly handleBrowserGamepadConnected = (event: GamepadEvent) => {
    this.controllerConnected = true;
    this.onControllerMessage(`Controller connected: ${event.gamepad.id}`);
  };

  private readonly handleBrowserGamepadDisconnected = () => {
    this.controllerConnected = false;
    this.onControllerDisconnected();
  };
}
