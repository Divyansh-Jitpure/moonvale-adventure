import * as Phaser from "phaser";

const TERRAIN_TILE_SIZE = 96;
const MAP_COLUMNS = 16;
const MAP_ROWS = 12;
const WORLD_WIDTH = MAP_COLUMNS * TERRAIN_TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TERRAIN_TILE_SIZE;
const PLAYER_SPEED = 170;
const SPRINT_MULTIPLIER = 1.45;
const GAMEPAD_DEADZONE = 0.2;
const WARRIOR_FRAME_SIZE = 192;
const MONK_FRAME_SIZE = 192;
const PLAYER_SCALE = 0.5;
const NPC_SCALE = 0.48;
const INTERACTION_DISTANCE = 120;

type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  attack: boolean;
  interact: boolean;
};

type NpcDialogue = {
  id: string;
  label: string;
  lines: string[];
};

const MAP_DATA = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLUMNS }, () => 0),
);

const DIALOGUE: NpcDialogue = {
  id: "monk",
  label: "Brother Alden",
  lines: [
    "Moonvale finally has a path worth walking.",
    "Test your sword around the outpost, then return when the grove feels alive.",
    "Your next milestone is simple: world first, then enemies, then quests.",
  ],
};

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private props!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    sprint: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    interact: Phaser.Input.Keyboard.Key;
  };
  private hintText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private dialoguePanel!: Phaser.GameObjects.Container;
  private dialogueLabel!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private aura!: Phaser.GameObjects.Arc;
  private lastAttackAt = 0;
  private lastGamepadAttackPressed = false;
  private lastGamepadInteractPressed = false;
  private isAttacking = false;
  private controllerConnected = false;
  private facing: "left" | "right" = "right";
  private dialogueOpen = false;
  private dialogueIndex = 0;

  constructor() {
    super("overworld");
  }

  preload() {
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("house-1-blue", "/assets/buildings/house-1-blue.png");

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
    this.load.spritesheet("monk-idle", "/assets/units/npc/monk-idle.png", {
      frameWidth: MONK_FRAME_SIZE,
      frameHeight: MONK_FRAME_SIZE,
    });
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createGround();
    this.createProps();
    this.createPlayer();
    this.createNpc();
    this.createUi();
    this.createInput();
    this.createAnimations();
    this.createColliders();
  }

  update(time: number) {
    const input = this.readInput();
    const movement = new Phaser.Math.Vector2(input.x, input.y);
    const nearNpc = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.npc.x,
      this.npc.y,
    ) < INTERACTION_DISTANCE;

    if (movement.lengthSq() > 1) {
      movement.normalize();
    }

    if (movement.x !== 0) {
      this.facing = movement.x < 0 ? "left" : "right";
    }

    if (this.dialogueOpen) {
      this.player.setVelocity(0, 0);
      this.player.anims.play("warrior-idle", true);

      if (input.interact) {
        this.advanceDialogue();
      }
    } else {
      if (input.interact && nearNpc) {
        this.openDialogue();
      }

      if (input.attack && !this.isAttacking && time - this.lastAttackAt > 350) {
        this.lastAttackAt = time;
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
        this.player.anims.play(
          movement.lengthSq() > 0.01 ? "warrior-run" : "warrior-idle",
          true,
        );
      }
    }

    this.player.setFlipX(this.facing === "left");
    this.promptText.setVisible(nearNpc && !this.dialogueOpen);
    this.promptText.setPosition(this.npc.x, this.npc.y - 74);
    this.aura.setPosition(
      this.player.x + (this.facing === "left" ? -16 : 16),
      this.player.y + 8,
    );
  }

  private createGround() {
    const map = this.make.tilemap({
      data: MAP_DATA,
      tileWidth: TERRAIN_TILE_SIZE,
      tileHeight: TERRAIN_TILE_SIZE,
    });
    const tiles = map.addTilesetImage("terrain-tiles");
    map.createLayer(0, tiles!, 0, 0);

    const path = this.add.graphics();
    path.fillStyle(0xb28f62, 0.96);
    path.fillRoundedRect(180, 680, 1180, 128, 38);
    path.fillRoundedRect(900, 310, 120, 428, 32);
    path.lineStyle(6, 0xcfb18c, 0.45);
    path.strokeRoundedRect(180, 680, 1180, 128, 38);
    path.strokeRoundedRect(900, 310, 120, 428, 32);

    const pond = this.add.ellipse(1230, 290, 280, 180, 0x327aa2, 1);
    pond.setStrokeStyle(6, 0xa7ebff, 0.35);
    this.add.image(1230, 290, "water-foam").setScale(0.48).setAlpha(0.72);

    const mist = this.add.graphics();
    mist.fillGradientStyle(0xffffff, 0xffffff, 0x8fe0ff, 0x8fe0ff, 0.04);
    mist.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  private createProps() {
    this.props = this.physics.add.staticGroup();

    const house = this.props
      .create(980, 560, "house-1-blue")
      .setScale(1.45)
      .refreshBody();
    house.setSize?.(112, 52, true);
    house.setOffset?.(8, 132);

    this.addProp("tree-1", 230, 490, 0.42, 120, 72, 110, 174);
    this.addProp("tree-1", 1275, 705, 0.42, 120, 72, 110, 174);
    this.addProp("tree-1", 1290, 460, 0.36, 120, 72, 110, 174);
    this.addProp("rock-2", 1120, 250, 1.1, 44, 26, 10, 30);
    this.addProp("rock-2", 300, 790, 1, 44, 26, 10, 30);
    this.addProp("rock-2", 1180, 770, 1.18, 44, 26, 10, 30);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(
      380,
      735,
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

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.25);
  }

  private createNpc() {
    this.npc = this.physics.add.sprite(820, 730, "monk-idle", 0);
    this.npc.setScale(NPC_SCALE);
    this.npc.setImmovable(true);
    (this.npc.body as Phaser.Physics.Arcade.Body).moves = false;
    this.npc.setSize(48, 32).setOffset(72, 152);
    this.npc.anims.play("monk-idle", true);

    this.promptText = this.add.text(0, 0, "Press E / X to speak", {
      fontFamily: "Segoe UI",
      fontSize: "16px",
      color: "#f5f0e3",
      backgroundColor: "#0f1a1fcc",
      padding: { x: 10, y: 6 },
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setDepth(20);
    this.promptText.setVisible(false);
  }

  private createUi() {
    this.hintText = this.add.text(
      24,
      22,
      "Moonvale Outpost online. Follow the road to the monk and press E / X.",
      {
        fontFamily: "Segoe UI",
        fontSize: "18px",
        color: "#f7f2e8",
      },
    );
    this.hintText.setScrollFactor(0);
    this.hintText.setDepth(30);

    const panelBg = this.add
      .rectangle(0, 0, 580, 160, 0x081015, 0.86)
      .setStrokeStyle(2, 0xb89a72, 0.85);
    this.dialogueLabel = this.add.text(-250, -52, DIALOGUE.label, {
      fontFamily: "Segoe UI",
      fontSize: "18px",
      color: "#f0c989",
      fontStyle: "bold",
    });
    this.dialogueText = this.add.text(-250, -16, DIALOGUE.lines[0], {
      fontFamily: "Segoe UI",
      fontSize: "20px",
      color: "#f7f2e8",
      wordWrap: { width: 500 },
      lineSpacing: 6,
    });
    const footer = this.add.text(-250, 50, "Press E / X again to continue", {
      fontFamily: "Segoe UI",
      fontSize: "14px",
      color: "#a9c1c7",
    });

    this.dialoguePanel = this.add.container(480, 540, [
      panelBg,
      this.dialogueLabel,
      this.dialogueText,
      footer,
    ]);
    this.dialoguePanel.setScrollFactor(0);
    this.dialoguePanel.setDepth(35);
    this.dialoguePanel.setVisible(false);
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    }) as OverworldScene["keys"];

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

  private createAnimations() {
    if (!this.anims.exists("warrior-idle")) {
      this.anims.create({
        key: "warrior-idle",
        frames: this.anims.generateFrameNumbers("warrior-idle", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("warrior-run")) {
      this.anims.create({
        key: "warrior-run",
        frames: this.anims.generateFrameNumbers("warrior-run", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.anims.exists("warrior-attack")) {
      this.anims.create({
        key: "warrior-attack",
        frames: this.anims.generateFrameNumbers("warrior-attack", { start: 0, end: 3 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!this.anims.exists("monk-idle")) {
      this.anims.create({
        key: "monk-idle",
        frames: this.anims.generateFrameNumbers("monk-idle", { start: 0, end: 5 }),
        frameRate: 7,
        repeat: -1,
      });
    }
  }

  private createColliders() {
    this.physics.add.collider(this.player, this.props);
    this.physics.add.collider(this.player, this.npc);
  }

  private addProp(
    texture: string,
    x: number,
    y: number,
    scale: number,
    bodyWidth: number,
    bodyHeight: number,
    bodyOffsetX: number,
    bodyOffsetY: number,
  ) {
    const prop = this.props.create(x, y, texture).setScale(scale).refreshBody();
    prop.setSize?.(bodyWidth, bodyHeight, true);
    prop.setOffset?.(bodyOffsetX, bodyOffsetY);
  }

  private readInput(): InputState {
    const keyboardX =
      Number(this.cursors.right.isDown || this.keys.right.isDown) -
      Number(this.cursors.left.isDown || this.keys.left.isDown);
    const keyboardY =
      Number(this.cursors.down.isDown || this.keys.down.isDown) -
      Number(this.cursors.up.isDown || this.keys.up.isDown);

    let gamepadX = 0;
    let gamepadY = 0;
    let gamepadSprint = false;
    let gamepadAttack = false;
    let gamepadInteract = false;

    const pad = this.getActiveGamepad();
    if (pad) {
      const leftStickX = this.readAxisValue(pad, 0);
      const leftStickY = this.readAxisValue(pad, 1);
      const dpadX = Number(this.isPadPressed(pad, 15)) - Number(this.isPadPressed(pad, 14));
      const dpadY = Number(this.isPadPressed(pad, 13)) - Number(this.isPadPressed(pad, 12));
      const attackPressed = this.isPadPressed(pad, 1);
      const interactPressed = this.isPadPressed(pad, 2);

      gamepadX = Math.abs(leftStickX) > GAMEPAD_DEADZONE ? leftStickX : dpadX;
      gamepadY = Math.abs(leftStickY) > GAMEPAD_DEADZONE ? leftStickY : dpadY;
      gamepadSprint = this.isPadPressed(pad, 0);
      gamepadAttack = attackPressed && !this.lastGamepadAttackPressed;
      gamepadInteract = interactPressed && !this.lastGamepadInteractPressed;
      this.lastGamepadAttackPressed = attackPressed;
      this.lastGamepadInteractPressed = interactPressed;
      this.controllerConnected = true;
    } else {
      this.lastGamepadAttackPressed = false;
      this.lastGamepadInteractPressed = false;
      this.controllerConnected = false;
    }

    return {
      x: Phaser.Math.Clamp(keyboardX + gamepadX, -1, 1),
      y: Phaser.Math.Clamp(keyboardY + gamepadY, -1, 1),
      sprint: this.keys.sprint.isDown || gamepadSprint,
      attack: Phaser.Input.Keyboard.JustDown(this.keys.attack) || gamepadAttack,
      interact: Phaser.Input.Keyboard.JustDown(this.keys.interact) || gamepadInteract,
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

    return (
      navigator
        .getGamepads()
        .find((pad): pad is Gamepad => pad !== null && pad.connected) ?? null
    );
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
      2: "X" in pad ? pad.X : undefined,
      12: "up" in pad ? pad.up : undefined,
      13: "down" in pad ? pad.down : undefined,
      14: "left" in pad ? pad.left : undefined,
      15: "right" in pad ? pad.right : undefined,
    };

    return phaserButtonMap[buttonIndex] ?? false;
  }

  private openDialogue() {
    this.dialogueIndex = 0;
    this.dialogueText.setText(DIALOGUE.lines[this.dialogueIndex]);
    this.dialogueOpen = true;
    this.dialoguePanel.setVisible(true);
    this.hintText.setText("Dialogue active. Press E / X to continue.");
  }

  private advanceDialogue() {
    this.dialogueIndex += 1;

    if (this.dialogueIndex >= DIALOGUE.lines.length) {
      this.dialogueOpen = false;
      this.dialoguePanel.setVisible(false);
      this.hintText.setText(
        "Brother Alden marked the grove. Next: enemies, pickups, and quest tracking.",
      );
      return;
    }

    this.dialogueText.setText(DIALOGUE.lines[this.dialogueIndex]);
  }

  private readonly handleBrowserGamepadConnected = (event: GamepadEvent) => {
    this.controllerConnected = true;
    this.showControllerMessage(`Controller connected: ${event.gamepad.id}`);
  };

  private readonly handleBrowserGamepadDisconnected = () => {
    this.controllerConnected = false;
    this.hintText.setText("Controller disconnected. Keyboard is still active.");
  };

  private showControllerMessage(message: string) {
    this.hintText.setText(message);
    this.time.delayedCall(2400, () => {
      this.hintText.setText(
        this.controllerConnected
          ? "Controller active. Visit Brother Alden at the outpost house."
          : "Moonvale Outpost online. Follow the road to the monk and press E / X.",
      );
    });
  }
}
