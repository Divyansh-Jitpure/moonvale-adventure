import * as Phaser from "phaser";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;
const PLAYER_SPEED = 170;
const SPRINT_MULTIPLIER = 1.45;
const GAMEPAD_DEADZONE = 0.2;

type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  pulse: boolean;
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

  constructor() {
    super("overworld");
  }

  preload() {
    this.load.spritesheet("hero", "/hero-spritesheet.svg", {
      frameWidth: 32,
      frameHeight: 48,
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

    const speed = PLAYER_SPEED * (input.sprint ? SPRINT_MULTIPLIER : 1);
    this.player.setVelocity(movement.x * speed, movement.y * speed);

    if (movement.lengthSq() > 0.01) {
      if (Math.abs(movement.x) > Math.abs(movement.y)) {
        this.player.anims.play("hero-walk-side", true);
        this.player.setFlipX(movement.x < 0);
      } else if (movement.y < 0) {
        this.player.anims.play("hero-walk-up", true);
        this.player.setFlipX(false);
      } else {
        this.player.anims.play("hero-walk-down", true);
        this.player.setFlipX(false);
      }
    } else {
      this.player.anims.stop();
      this.player.setFrame(0);
    }

    if (input.pulse && time - this.lastPulseAt > 350) {
      this.lastPulseAt = time;
      this.tweens.add({
        targets: this.aura,
        alpha: { from: 0.55, to: 0 },
        scale: { from: 1, to: 2.1 },
        duration: 280,
        ease: "Quad.Out",
      });
    }

    this.aura.setPosition(this.player.x, this.player.y + 18);
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
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "hero", 0);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(26, 20).setOffset(3, 28);

    this.aura = this.add
      .circle(this.player.x, this.player.y + 18, 14, 0xd8ff7a, 0.4)
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
      "Explore the grove. Keyboard and controller are both active.",
      {
        fontFamily: "Arial",
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

    this.input.gamepad?.once("connected", (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.hintText.setText(`Controller connected: ${pad.id}`);
      this.time.delayedCall(2400, () => {
        this.hintText.setText(
          "Explore the grove. Keyboard and controller are both active.",
        );
      });
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
    let gamepadPulse = false;

    const pad = this.input.gamepad?.getPad(0);
    if (pad) {
      const leftStickX = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
      const leftStickY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
      const dpadX = Number(pad.right) - Number(pad.left);
      const dpadY = Number(pad.down) - Number(pad.up);

      gamepadX =
        Math.abs(leftStickX) > GAMEPAD_DEADZONE ? leftStickX : dpadX;
      gamepadY =
        Math.abs(leftStickY) > GAMEPAD_DEADZONE ? leftStickY : dpadY;
      gamepadSprint = pad.A;
      gamepadPulse = pad.B;
    }

    return {
      x: Phaser.Math.Clamp(keyboardX + gamepadX, -1, 1),
      y: Phaser.Math.Clamp(keyboardY + gamepadY, -1, 1),
      sprint: this.wasd.sprint.isDown || gamepadSprint,
      pulse: Phaser.Input.Keyboard.JustDown(this.wasd.pulse) || gamepadPulse,
    };
  }

  private createAnimations() {
    if (this.anims.exists("hero-walk-down")) {
      return;
    }

    this.anims.create({
      key: "hero-walk-down",
      frames: this.anims.generateFrameNumbers("hero", { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "hero-walk-side",
      frames: this.anims.generateFrameNumbers("hero", { start: 3, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "hero-walk-up",
      frames: this.anims.generateFrameNumbers("hero", { start: 6, end: 8 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
