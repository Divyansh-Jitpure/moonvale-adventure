import * as Phaser from "phaser";

const TERRAIN_TILE_SIZE = 96;
const MAP_COLUMNS = 16;
const MAP_ROWS = 12;
const WORLD_WIDTH = MAP_COLUMNS * TERRAIN_TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TERRAIN_TILE_SIZE;
const PLAYER_SPEED = 170;
const ENEMY_SPEED = 82;
const SPRINT_MULTIPLIER = 1.45;
const GAMEPAD_DEADZONE = 0.2;
const WARRIOR_FRAME_SIZE = 192;
const MONK_FRAME_SIZE = 192;
const PAWN_FRAME_SIZE = 192;
const PLAYER_SCALE = 0.5;
const NPC_SCALE = 0.48;
const ENEMY_SCALE = 0.5;
const INTERACTION_DISTANCE = 120;
const ENEMY_AGGRO_DISTANCE = 240;
const ENEMY_LEASH_DISTANCE = 340;
const PLAYER_MAX_HEALTH = 100;
const ENEMY_MAX_HEALTH = 3;

type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  attack: boolean;
  interact: boolean;
};

type DialogueState = {
  label: string;
  lines: string[];
};

const MAP_DATA = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLUMNS }, () => 0),
);

const DIALOGUE_BEFORE_COMBAT: DialogueState = {
  label: "Brother Alden",
  lines: [
    "A raider has been circling the pond road.",
    "Drive that scout away and bring back whatever it dropped.",
    "Use your sword, then return to me once the path is safe.",
  ],
};

const DIALOGUE_AFTER_COMBAT: DialogueState = {
  label: "Brother Alden",
  lines: [
    "The grove is safer already.",
    "You proved the outpost can carry a real combat loop now.",
    "Next we build on this with more enemies, rewards, and quest tracking.",
  ],
};

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private reward!: Phaser.Physics.Arcade.Sprite;
  private attackZone!: Phaser.GameObjects.Zone;
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
  private enemyHealthText!: Phaser.GameObjects.Text;
  private dialoguePanel!: Phaser.GameObjects.Container;
  private dialogueLabel!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private aura!: Phaser.GameObjects.Arc;
  private lastAttackAt = 0;
  private lastGamepadAttackPressed = false;
  private lastGamepadInteractPressed = false;
  private isAttacking = false;
  private attackActive = false;
  private enemyHitThisSwing = false;
  private controllerConnected = false;
  private facing: "left" | "right" = "right";
  private dialogueOpen = false;
  private dialogueIndex = 0;
  private playerHealth = PLAYER_MAX_HEALTH;
  private enemyHealth = ENEMY_MAX_HEALTH;
  private enemyAlive = true;
  private rewardCollected = false;
  private playerInvulnerableUntil = 0;
  private readonly enemySpawn = new Phaser.Math.Vector2(1180, 290);

  constructor() {
    super("overworld");
  }

  preload() {
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("house-1-blue", "/assets/buildings/house-1-blue.png");
    this.load.image("gold-resource", "/assets/rewards/gold-resource.png");

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
    this.load.spritesheet("pawn-idle-red", "/assets/units/enemy/pawn-idle-red.png", {
      frameWidth: PAWN_FRAME_SIZE,
      frameHeight: PAWN_FRAME_SIZE,
    });
    this.load.spritesheet("pawn-run-red", "/assets/units/enemy/pawn-run-red.png", {
      frameWidth: PAWN_FRAME_SIZE,
      frameHeight: PAWN_FRAME_SIZE,
    });
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createGround();
    this.createProps();
    this.createPlayer();
    this.createNpc();
    this.createEnemy();
    this.createReward();
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
        this.triggerAttack(time);
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

    this.updateEnemy(time);
    this.updateAttackZone();
    this.updateUi(nearNpc);

    if (this.attackActive && this.enemyAlive) {
      this.physics.overlap(
        this.attackZone,
        this.enemy,
        () => {
          if (this.enemyHitThisSwing) {
            return;
          }
          this.enemyHitThisSwing = true;
          this.damageEnemy();
        },
        undefined,
        this,
      );
    }
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
    this.addProp("rock-2", 1245, 370, 1, 44, 26, 10, 30);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(380, 735, "warrior-idle", 0);
    this.player.setScale(PLAYER_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(42, 30).setOffset(75, 154);

    this.attackZone = this.add.zone(this.player.x, this.player.y, 72, 56);
    this.physics.add.existing(this.attackZone);
    const attackBody = this.attackZone.body as Phaser.Physics.Arcade.Body;
    attackBody.setAllowGravity(false);
    attackBody.setImmovable(true);
    attackBody.enable = false;

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

  private createEnemy() {
    this.enemy = this.physics.add.sprite(
      this.enemySpawn.x,
      this.enemySpawn.y,
      "pawn-idle-red",
      0,
    );
    this.enemy.setScale(ENEMY_SCALE);
    this.enemy.setCollideWorldBounds(true);
    this.enemy.setSize(38, 28).setOffset(77, 154);
    this.enemy.anims.play("pawn-idle-red", true);
  }

  private createReward() {
    this.reward = this.physics.add.sprite(this.enemySpawn.x + 18, this.enemySpawn.y + 48, "gold-resource");
    this.reward.setScale(0.36);
    (this.reward.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.reward.setVisible(false);
    this.reward.disableBody(true, true);
  }

  private createUi() {
    this.hintText = this.add.text(
      24,
      22,
      "Brother Alden wants the red scout driven off. Press E / X to speak.",
      {
        fontFamily: "Segoe UI",
        fontSize: "18px",
        color: "#f7f2e8",
      },
    );
    this.hintText.setScrollFactor(0);
    this.hintText.setDepth(30);

    this.enemyHealthText = this.add.text(24, 52, "Scout: 3 / 3", {
      fontFamily: "Segoe UI",
      fontSize: "16px",
      color: "#ffb1b1",
    });
    this.enemyHealthText.setScrollFactor(0);
    this.enemyHealthText.setDepth(30);

    const panelBg = this.add
      .rectangle(0, 0, 580, 160, 0x081015, 0.86)
      .setStrokeStyle(2, 0xb89a72, 0.85);
    this.dialogueLabel = this.add.text(-250, -52, DIALOGUE_BEFORE_COMBAT.label, {
      fontFamily: "Segoe UI",
      fontSize: "18px",
      color: "#f0c989",
      fontStyle: "bold",
    });
    this.dialogueText = this.add.text(-250, -16, DIALOGUE_BEFORE_COMBAT.lines[0], {
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
    window.addEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("gamepadconnected", this.handleBrowserGamepadConnected);
      window.removeEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected);
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

    if (!this.anims.exists("pawn-idle-red")) {
      this.anims.create({
        key: "pawn-idle-red",
        frames: this.anims.generateFrameNumbers("pawn-idle-red", { start: 0, end: 7 }),
        frameRate: 9,
        repeat: -1,
      });
    }

    if (!this.anims.exists("pawn-run-red")) {
      this.anims.create({
        key: "pawn-run-red",
        frames: this.anims.generateFrameNumbers("pawn-run-red", { start: 0, end: 5 }),
        frameRate: 11,
        repeat: -1,
      });
    }
  }

  private createColliders() {
    this.physics.add.collider(this.player, this.props);
    this.physics.add.collider(this.player, this.npc);
    this.physics.add.collider(this.enemy, this.props);
    this.physics.add.collider(this.enemy, this.npc);
    this.physics.add.collider(this.player, this.enemy, () => {
      if (!this.enemyAlive) {
        return;
      }
      this.damagePlayer();
    });
    this.physics.add.overlap(this.player, this.reward, () => {
      this.collectReward();
    });
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

  private triggerAttack(time: number) {
    this.lastAttackAt = time;
    this.isAttacking = true;
    this.enemyHitThisSwing = false;
    this.player.setVelocity(0, 0);
    this.player.anims.play("warrior-attack", true);
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
    });

    this.time.delayedCall(90, () => {
      this.attackActive = true;
      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = true;
    });

    this.time.delayedCall(210, () => {
      this.attackActive = false;
      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
    });

    this.tweens.add({
      targets: this.aura,
      alpha: { from: 0.55, to: 0 },
      scale: { from: 1, to: 2.1 },
      duration: 280,
      ease: "Quad.Out",
    });
  }

  private updateEnemy(time: number) {
    if (!this.enemyAlive) {
      this.enemy.setVelocity(0, 0);
      return;
    }

    const enemyDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.enemy.x,
      this.enemy.y,
    );
    const leashDistance = Phaser.Math.Distance.Between(
      this.enemy.x,
      this.enemy.y,
      this.enemySpawn.x,
      this.enemySpawn.y,
    );
    const enemyBody = this.enemy.body as Phaser.Physics.Arcade.Body;

    if (time < this.playerInvulnerableUntil && enemyBody.speed > ENEMY_SPEED) {
      return;
    }

      if (enemyDistance < ENEMY_AGGRO_DISTANCE || leashDistance > ENEMY_LEASH_DISTANCE) {
        const target = leashDistance > ENEMY_LEASH_DISTANCE
          ? this.enemySpawn
          : new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.physics.moveTo(this.enemy, target.x, target.y, ENEMY_SPEED);
        this.enemy.setFlipX(enemyBody.velocity.x < 0);
        this.enemy.anims.play("pawn-run-red", true);
      } else if (leashDistance > 10) {
        this.physics.moveTo(this.enemy, this.enemySpawn.x, this.enemySpawn.y, ENEMY_SPEED * 0.8);
        this.enemy.setFlipX(enemyBody.velocity.x < 0);
        this.enemy.anims.play("pawn-run-red", true);
      } else {
      this.enemy.setVelocity(0, 0);
      this.enemy.anims.play("pawn-idle-red", true);
    }
  }

  private updateAttackZone() {
    const direction = this.facing === "left" ? -1 : 1;
    this.attackZone.setPosition(this.player.x + 44 * direction, this.player.y + 4);
    this.player.setFlipX(this.facing === "left");
    this.aura.setPosition(this.player.x + 16 * direction, this.player.y + 8);
  }

  private updateUi(nearNpc: boolean) {
    this.promptText.setVisible(nearNpc && !this.dialogueOpen);
    this.promptText.setPosition(this.npc.x, this.npc.y - 74);
    this.enemyHealthText.setText(
      this.enemyAlive ? `Scout: ${this.enemyHealth} / ${ENEMY_MAX_HEALTH}` : "Scout: defeated",
    );
    this.enemyHealthText.setColor(this.enemyAlive ? "#ffb1b1" : "#a5f1bc");
  }

  private damageEnemy() {
    if (!this.enemyAlive) {
      return;
    }

    this.enemyHealth -= 1;
    const knockbackX = this.facing === "left" ? -220 : 220;
    this.enemy.setVelocity(knockbackX, -40);
    this.cameras.main.shake(120, 0.003);

    if (this.enemyHealth <= 0) {
      this.enemyAlive = false;
      this.enemy.disableBody(true, true);
      this.spawnReward();
      this.hintText.setText("Scout defeated. Pick up the dropped gold and return to Brother Alden.");
      return;
    }

    this.hintText.setText(`Solid hit. The scout is reeling (${this.enemyHealth} left).`);
  }

  private damagePlayer() {
    if (this.time.now < this.playerInvulnerableUntil || !this.enemyAlive) {
      return;
    }

    this.playerInvulnerableUntil = this.time.now + 900;
    this.playerHealth = Math.max(0, this.playerHealth - 12);

    const direction = this.player.x < this.enemy.x ? -1 : 1;
    this.player.setVelocity(-180 * direction, -40);
    this.cameras.main.shake(140, 0.004);
    this.hintText.setText(`The scout clipped you. Warrior health ${this.playerHealth} / ${PLAYER_MAX_HEALTH}.`);

    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.45, to: 1 },
      duration: 120,
      yoyo: true,
      repeat: 3,
    });
  }

  private spawnReward() {
    this.reward.enableBody(true, this.enemySpawn.x + 18, this.enemySpawn.y + 36, true, true);
    this.reward.setVisible(true);
    this.reward.setVelocity(0, 0);
    this.reward.setScale(0.36);
    this.tweens.add({
      targets: this.reward,
      y: this.reward.y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private collectReward() {
    if (this.rewardCollected || !this.reward.active) {
      return;
    }

    this.rewardCollected = true;
    this.reward.disableBody(true, true);
    this.hintText.setText("Recovered the scout's gold. Return to Brother Alden for the next route.");
  }

  private getDialogueState(): DialogueState {
    return this.rewardCollected ? DIALOGUE_AFTER_COMBAT : DIALOGUE_BEFORE_COMBAT;
  }

  private openDialogue() {
    const dialogue = this.getDialogueState();
    this.dialogueIndex = 0;
    this.dialogueLabel.setText(dialogue.label);
    this.dialogueText.setText(dialogue.lines[this.dialogueIndex]);
    this.dialogueOpen = true;
    this.dialoguePanel.setVisible(true);
    this.hintText.setText("Dialogue active. Press E / X to continue.");
  }

  private advanceDialogue() {
    const dialogue = this.getDialogueState();
    this.dialogueIndex += 1;

    if (this.dialogueIndex >= dialogue.lines.length) {
      this.dialogueOpen = false;
      this.dialoguePanel.setVisible(false);
      this.hintText.setText(
        this.rewardCollected
          ? "Moonvale route secured. Next: enemy waves, pickups, and quest log updates."
          : "Brother Alden is waiting for proof. Clear the scout and bring back the drop.",
      );
      return;
    }

    this.dialogueText.setText(dialogue.lines[this.dialogueIndex]);
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
          ? "Controller active. Defeat the red scout near the pond road."
          : "Brother Alden wants the red scout driven off. Press E / X to speak.",
      );
    });
  }
}
