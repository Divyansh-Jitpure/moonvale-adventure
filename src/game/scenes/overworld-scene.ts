import * as Phaser from "phaser";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;
const PLAYER_SPEED = 170;
const SPRINT_MULTIPLIER = 1.45;
const GAMEPAD_DEADZONE = 0.2;
const WARRIOR_FRAME_SIZE = 192;
const PLAYER_SCALE = 0.5;

type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  attack: boolean;
};

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    sprint: Phaser.Input.Keyboard.Key;
    pulse: Phaser.Input.Keyboard.Key;
  };
  private hintText!: Phaser.GameObjects.Text;
  private aura!: Phaser.GameObjects.Arc;
  private lastPulseAt = 0;
  private lastGamepadAttackPressed = false;
  private isAttacking = false;
  private facing: "left" | "right" = "right";
  private controllerConnected = false;

  constructor() {
    super("overworld");
  }

  preload() {
    this.load.spritesheet("warrior-idle", "/assets/units/warrior/warrior-idle.png", {
      frameWidth: WARRIOR_FRAME_SIZE,
      frameHeight: WARRIOR_FRAME_SIZE,
    });
    this.load.spritesheet("warrior-run", "/assets/units/warrior/warrior-run.png", {
      frameWidth: WARRIOR_FRAME_SIZE,
      frameHeight: WARRIOR_FRAME_SIZE,
    });
    this.load.spritesheet("warrior-attack", "/assets/units/warrior/warrior-attack-1.png", {
      frameWidth: WARRIOR_FRAME_SIZE,
      frameHeight: WARRIOR_FRAME_SIZE,
    });
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createEnvironment();
    this.createPlayer();
    this.createUi();
    this.createInput();
  }

  update(time: number) {
    const input = this.readInput();
    const movement = new Phaser.Math.Vector2(input.x, input.y);

    if (movement.lengthSq() > 1) {
      movement.normalize();
    }

    if (movement.x !== 0) {
      this.facing = movement.x < 0 ? "left" : "right";
    }

    if (input.attack && !this.isAttacking && time - this.lastPulseAt > 350) {
      this.lastPulseAt = time;
      this.isAttacking = true;
      this.player.setVelocity(0, 0);
      this.player.anims.play("warrior-attack", true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
      });

      this.tweens.add({
        targets: this.aura,
        alpha: { from: 0.55, to: 0 },
        scale: { from: 1, to: 2.1 },
        duration: 280,
        ease: "Quad.Out",
      });
    }

    if (!this.isAttacking) {
      const speed = PLAYER_SPEED * (input.sprint ? SPRINT_MULTIPLIER : 1);
      this.player.setVelocity(movement.x * speed, movement.y * speed);

      if (movement.lengthSq() > 0.01) {
        this.player.anims.play("warrior-run", true);
      } else {
        this.player.anims.play("warrior-idle", true);
      }
    }

    this.player.setFlipX(this.facing === "left");
    this.aura.setPosition(this.player.x + (this.facing === "left" ? -16 : 16), this.player.y + 8);
  }

  private createEnvironment() {
    this.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      0x16312f,
    );

    const meadow = this.add.graphics();
    meadow.fillGradientStyle(0x284d43, 0x284d43, 0x142826, 0x142826, 1);
    meadow.fillEllipse(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1040, 760);

    const path = this.add.graphics();
    path.fillStyle(0xb28f62, 1);
    path.fillRoundedRect(240, 500, 1120, 148, 50);
    path.fillRoundedRect(720, 250, 170, 640, 50);

    const water = this.add.graphics();
    water.fillStyle(0x1b5876, 1);
    water.fillEllipse(1220, 300, 280, 180);
    water.lineStyle(4, 0x8bd6ff, 0.35);
    water.strokeEllipse(1220, 300, 280, 180);

    for (let i = 0; i < 24; i += 1) {
      const x = Phaser.Math.Between(90, WORLD_WIDTH - 90);
      const y = Phaser.Math.Between(90, WORLD_HEIGHT - 90);
      const size = Phaser.Math.Between(26, 42);
      const tree = this.add.circle(x, y, size, 0x29543f);
      tree.setAlpha(0.92);
      this.add.circle(x - 10, y - 10, size * 0.48, 0x4f8a5b, 0.3);
    }

    for (let i = 0; i < 80; i += 1) {
      this.add.circle(
        Phaser.Math.Between(40, WORLD_WIDTH - 40),
        Phaser.Math.Between(40, WORLD_HEIGHT - 40),
        Phaser.Math.Between(2, 5),
        Phaser.Math.RND.pick([0xe0bf79, 0xa8d672, 0x6fcf97]),
        0.75,
      );
    }
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      "warrior-idle",
      0,
    );
    this.player.setScale(PLAYER_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(42, 30).setOffset(75, 154);

    this.aura = this.add
      .circle(this.player.x, this.player.y + 8, 16, 0xd8ff7a, 0.4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);

    this.createAnimations();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.35);
  }

  private createUi() {
    this.hintText = this.add.text(
      24,
      22,
      "Explore the grove. Keyboard is active. Press any controller button to sync a gamepad.",
      {
        fontFamily: "Segoe UI",
        fontSize: "18px",
        color: "#f7f2e8",
      },
    );
    this.hintText.setScrollFactor(0);
    this.hintText.setDepth(10);
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      pulse: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as OverworldScene["wasd"];

    this.input.gamepad?.on("connected", (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.controllerConnected = true;
      this.showControllerMessage(`Controller connected: ${pad.id}`);
    });

    window.addEventListener("gamepadconnected", this.handleBrowserGamepadConnected);
    window.addEventListener(
      "gamepaddisconnected",
      this.handleBrowserGamepadDisconnected,
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener(
        "gamepadconnected",
        this.handleBrowserGamepadConnected,
      );
      window.removeEventListener(
        "gamepaddisconnected",
        this.handleBrowserGamepadDisconnected,
      );
    });
  }

  private readInput(): InputState {
    const keyboardX =
      Number(this.cursors.right.isDown || this.wasd.right.isDown) -
      Number(this.cursors.left.isDown || this.wasd.left.isDown);
    const keyboardY =
      Number(this.cursors.down.isDown || this.wasd.down.isDown) -
      Number(this.cursors.up.isDown || this.wasd.up.isDown);

    let gamepadX = 0;
    let gamepadY = 0;
    let gamepadSprint = false;
    let gamepadAttack = false;

    const pad = this.getActiveGamepad();
    if (pad) {
      const leftStickX = this.readAxisValue(pad, 0);
      const leftStickY = this.readAxisValue(pad, 1);
      const dpadX = Number(this.isPadPressed(pad, 15)) - Number(this.isPadPressed(pad, 14));
      const dpadY = Number(this.isPadPressed(pad, 13)) - Number(this.isPadPressed(pad, 12));

      gamepadX =
        Math.abs(leftStickX) > GAMEPAD_DEADZONE ? leftStickX : dpadX;
      gamepadY =
        Math.abs(leftStickY) > GAMEPAD_DEADZONE ? leftStickY : dpadY;
      gamepadSprint = this.isPadPressed(pad, 0);
      gamepadAttack =
        this.isPadPressed(pad, 1) && !this.lastGamepadAttackPressed;
      this.lastGamepadAttackPressed = this.isPadPressed(pad, 1);
      this.controllerConnected = true;
    } else {
      this.lastGamepadAttackPressed = false;
      this.controllerConnected = false;
    }

    return {
      x: Phaser.Math.Clamp(keyboardX + gamepadX, -1, 1),
      y: Phaser.Math.Clamp(keyboardY + gamepadY, -1, 1),
      sprint: this.wasd.sprint.isDown || gamepadSprint,
      attack: Phaser.Input.Keyboard.JustDown(this.wasd.pulse) || gamepadAttack,
    };
  }

  private getActiveGamepad() {
    const phaserPad = this.input.gamepad?.getPad(0);
    if (phaserPad) {
      return phaserPad;
    }

    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      return null;
    }

    const browserPad = navigator
      .getGamepads()
      .find((pad): pad is Gamepad => pad !== null && pad.connected);

    return browserPad ?? null;
  }

  private readAxisValue(
    pad: Phaser.Input.Gamepad.Gamepad | Gamepad,
    axisIndex: number,
  ) {
    if ("axes" in pad && pad.axes.length > axisIndex) {
      const axis = pad.axes[axisIndex];
      return typeof axis === "number" ? axis : axis.getValue();
    }

    return 0;
  }

  private isPadPressed(
    pad: Phaser.Input.Gamepad.Gamepad | Gamepad,
    buttonIndex: number,
  ) {
    if ("buttons" in pad && pad.buttons.length > buttonIndex) {
      return pad.buttons[buttonIndex]?.pressed ?? false;
    }

    const phaserButtonMap: Record<number, boolean | undefined> = {
      0: "A" in pad ? pad.A : undefined,
      1: "B" in pad ? pad.B : undefined,
      12: "up" in pad ? pad.up : undefined,
      13: "down" in pad ? pad.down : undefined,
      14: "left" in pad ? pad.left : undefined,
      15: "right" in pad ? pad.right : undefined,
    };

    return phaserButtonMap[buttonIndex] ?? false;
  }

  private readonly handleBrowserGamepadConnected = (event: GamepadEvent) => {
    this.controllerConnected = true;
    this.showControllerMessage(`Controller connected: ${event.gamepad.id}`);
  };

  private readonly handleBrowserGamepadDisconnected = () => {
    this.controllerConnected = false;
    this.hintText.setText(
      "Controller disconnected. Keyboard is still active.",
    );
  };

  private showControllerMessage(message: string) {
    this.hintText.setText(message);
    this.time.delayedCall(2400, () => {
      this.hintText.setText(
        this.controllerConnected
          ? "Controller active. Explore the grove or open the HUD for controls."
          : "Explore the grove. Keyboard is active. Press any controller button to sync a gamepad.",
      );
    });
  }

  private createAnimations() {
    if (this.anims.exists("warrior-idle")) {
      return;
    }

    this.anims.create({
      key: "warrior-idle",
      frames: this.anims.generateFrameNumbers("warrior-idle", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "warrior-run",
      frames: this.anims.generateFrameNumbers("warrior-run", { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "warrior-attack",
      frames: this.anims.generateFrameNumbers("warrior-attack", { start: 0, end: 3 }),
      frameRate: 14,
      repeat: 0,
    });
  }
}
