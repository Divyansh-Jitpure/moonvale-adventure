import * as Phaser from "phaser";

import {
  AGGRO_DISTANCE,
  ANIMATION_CONFIGS,
  ARCHER_MAX_HEALTH,
  ARCHER_RANGE,
  ARCHER_SPEED,
  ENEMY_FRAME,
  ENEMY_SCALE,
  ENEMY_SPEED,
  LEASH_DISTANCE,
  MONK_FRAME,
  PLAYER_MAX_HEALTH,
  PLAYER_SCALE,
  PLAYER_SPEED,
  PROJECTILE_SPEED,
  SPRINT_MULTIPLIER,
  TALK_DISTANCE,
  WARRIOR_FRAME,
} from "@/game/overworld/overworld-data";
import { OverworldInputController } from "@/game/overworld/overworld-input";
import {
  buildStoredProgress,
  getHintForStage,
  hasWiderGroveRoute,
  readStoredProgress,
  saveStoredProgress,
} from "@/game/overworld/overworld-progress";

export class WiderGroveScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private scout!: Phaser.Physics.Arcade.Sprite;
  private archer!: Phaser.Physics.Arcade.Sprite;
  private exitMarker!: Phaser.GameObjects.Rectangle;
  private promptText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private routeText!: Phaser.GameObjects.Text;
  private aura!: Phaser.GameObjects.Arc;
  private attackZone!: Phaser.GameObjects.Zone;
  private props!: Phaser.Physics.Arcade.StaticGroup;
  private arrows!: Phaser.Physics.Arcade.Group;
  private inputController!: OverworldInputController;
  private lastAttackAt = 0;
  private lastShotAt = 0;
  private isAttacking = false;
  private attackActive = false;
  private hitThisSwing = false;
  private facing: "left" | "right" = "right";
  private playerHealth = PLAYER_MAX_HEALTH;
  private scoutHealth = 4;
  private archerHealth = ARCHER_MAX_HEALTH;
  private scoutAlive = true;
  private archerAlive = true;
  private invulnerableUntil = 0;
  private questStage = readStoredProgressSafe().questStage;
  private inventoryGold = readStoredProgressSafe().inventory.goldToken;
  private inventorySigil = readStoredProgressSafe().inventory.arrowSigil;
  private readonly scoutSpawn = new Phaser.Math.Vector2(530, 420);
  private readonly archerSpawn = new Phaser.Math.Vector2(1140, 250);

  constructor() {
    super("wider-grove");
  }

  preload() {
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("house-1-blue", "/assets/buildings/house-1-blue.png");
    this.load.image("arrow-sigil", "/assets/rewards/arrow-sigil.png");
    this.load.spritesheet("warrior-idle", "/assets/units/warrior/warrior-idle.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-run", "/assets/units/warrior/warrior-run.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-attack", "/assets/units/warrior/warrior-attack-1.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("pawn-idle-red", "/assets/units/enemy/pawn-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("pawn-run-red", "/assets/units/enemy/pawn-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-idle-red", "/assets/units/enemy/archer-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-run-red", "/assets/units/enemy/archer-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("monk-idle", "/assets/units/npc/monk-idle.png", { frameWidth: MONK_FRAME, frameHeight: MONK_FRAME });
  }

  create() {
    const progress = readStoredProgressSafe();
    if (!hasWiderGroveRoute(progress.questStage)) {
      this.scene.start("overworld");
      return;
    }

    this.questStage = progress.questStage === "wider_grove_available" ? "wider_grove_active" : progress.questStage;
    this.playerHealth = progress.playerHealth;
    this.inventoryGold = progress.inventory.goldToken;
    this.inventorySigil = progress.inventory.arrowSigil;

    this.cameras.main.setBounds(0, 0, 1536, 960);
    this.physics.world.setBounds(0, 0, 1536, 960);

    this.createGround();
    this.createProps();
    this.createPlayer();
    this.createEnemies();
    this.createUi();
    this.createInput();
    this.createAnimations();
    this.createColliders();

    if (this.questStage === "wider_grove_completed") {
      this.scoutAlive = false;
      this.archerAlive = false;
      this.scout.disableBody(true, true);
      this.archer.disableBody(true, true);
      this.clearArrows();
    } else {
      this.syncProgress("wider_grove");
    }

    this.hintText.setText(getHintForStage(this.questStage));
  }

  update(time: number) {
    const input = this.inputController.readInput();
    const movement = new Phaser.Math.Vector2(input.x, input.y);
    const nearExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, 108, 520) < TALK_DISTANCE;

    if (movement.lengthSq() > 1) movement.normalize();
    if (movement.x !== 0) this.facing = movement.x < 0 ? "left" : "right";

    if (input.interact && nearExit) {
      this.leaveForOutpost();
      return;
    }

    if (input.attack && !this.isAttacking && time - this.lastAttackAt > 350) this.triggerAttack(time);
    if (!this.isAttacking) {
      const speed = PLAYER_SPEED * (input.sprint ? SPRINT_MULTIPLIER : 1);
      this.player.setVelocity(movement.x * speed, movement.y * speed);
      this.player.anims.play(movement.lengthSq() > 0.01 ? "warrior-run" : "warrior-idle", true);
    }

    this.updateScout();
    this.updateArcher(time);
    this.updateAttackZone();
    this.updateUi(nearExit);

    if (this.attackActive) {
      if (this.scoutAlive) {
        this.physics.overlap(this.attackZone, this.scout, () => {
          if (!this.hitThisSwing) {
            this.hitThisSwing = true;
            this.damageScout();
          }
        });
      }

      if (this.archerAlive) {
        this.physics.overlap(this.attackZone, this.archer, () => {
          if (!this.hitThisSwing) {
            this.hitThisSwing = true;
            this.damageArcher();
          }
        });
      }
    }
  }

  private createGround() {
    const map = this.make.tilemap({
      data: Array.from({ length: 10 }, () => Array.from({ length: 16 }, () => 0)),
      tileWidth: 96,
      tileHeight: 96,
    });
    const tiles = map.addTilesetImage("terrain-tiles");
    map.createLayer(0, tiles!, 0, 0);

    this.add.rectangle(768, 480, 1536, 960, 0x16251d, 0.55);
    const lane = this.add.graphics();
    lane.fillStyle(0x8d7651, 0.96);
    lane.fillRoundedRect(60, 470, 1410, 126, 36);
    lane.fillRoundedRect(680, 170, 120, 410, 28);
    lane.lineStyle(6, 0xcfb18c, 0.4);
    lane.strokeRoundedRect(60, 470, 1410, 126, 36);
    lane.strokeRoundedRect(680, 170, 120, 410, 28);

    this.add.ellipse(1215, 220, 230, 130, 0x2f6b84, 1).setStrokeStyle(5, 0xa7ebff, 0.28);
    this.add.image(1215, 220, "water-foam").setScale(0.4).setAlpha(0.68);

    const mist = this.add.graphics();
    mist.fillGradientStyle(0xffffff, 0xffffff, 0x9add93, 0x9add93, 0.03);
    mist.fillRect(0, 0, 1536, 960);
  }

  private createProps() {
    this.props = this.physics.add.staticGroup();
    [
      ["tree-1", 210, 290, 0.42, 120, 72, 110, 174],
      ["tree-1", 355, 735, 0.44, 120, 72, 110, 174],
      ["tree-1", 880, 735, 0.42, 120, 72, 110, 174],
      ["tree-1", 1255, 665, 0.46, 120, 72, 110, 174],
      ["tree-1", 1325, 355, 0.38, 120, 72, 110, 174],
      ["tree-1", 1000, 120, 0.33, 120, 72, 110, 174],
      ["rock-2", 530, 610, 1.12, 44, 26, 10, 30],
      ["rock-2", 640, 325, 1.1, 44, 26, 10, 30],
      ["rock-2", 925, 455, 1.05, 44, 26, 10, 30],
      ["rock-2", 1135, 505, 1.16, 44, 26, 10, 30],
      ["rock-2", 1380, 555, 1.08, 44, 26, 10, 30],
    ].forEach(([texture, x, y, scale, bw, bh, ox, oy]) => {
      const prop = this.props.create(x as number, y as number, texture as string).setScale(scale as number).refreshBody();
      prop.setSize?.(bw as number, bh as number, true);
      prop.setOffset?.(ox as number, oy as number);
    });

    this.exitMarker = this.add.rectangle(92, 520, 34, 160, 0x9dd8b6, 0.3).setStrokeStyle(2, 0xcdf8e3, 0.55);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(170, 530, "warrior-idle", 0);
    this.player.setScale(PLAYER_SCALE).setCollideWorldBounds(true).setSize(42, 30).setOffset(75, 154);
    this.attackZone = this.add.zone(this.player.x, this.player.y, 72, 56);
    this.physics.add.existing(this.attackZone);
    const body = this.attackZone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.enable = false;
    this.aura = this.add.circle(this.player.x, this.player.y + 8, 16, 0xd8ff7a, 0.4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2);
  }

  private createEnemies() {
    this.scout = this.physics.add.sprite(this.scoutSpawn.x, this.scoutSpawn.y, "pawn-idle-red", 0);
    this.scout.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154);
    this.scout.anims.play("pawn-idle-red", true);

    this.archer = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y, "archer-idle-red", 0);
    this.archer.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154);
    this.archer.anims.play("archer-idle-red", true);

    this.arrows = this.physics.add.group({ allowGravity: false, immovable: true });
  }

  private createUi() {
    this.hintText = this.add
      .text(24, 22, "Wider grove route active.", {
        fontFamily: "Segoe UI",
        fontSize: "18px",
        color: "#f7f2e8",
      })
      .setScrollFactor(0)
      .setDepth(30);

    this.routeText = this.add
      .text(24, 52, "Pack: scout live | archer live", {
        fontFamily: "Segoe UI",
        fontSize: "16px",
        color: "#b9d9ff",
      })
      .setScrollFactor(0)
      .setDepth(30);

    this.promptText = this.add
      .text(0, 0, "Press E / X to return to Moonvale Outpost", {
        fontFamily: "Segoe UI",
        fontSize: "16px",
        color: "#f5f0e3",
        backgroundColor: "#0f1a1fcc",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  private createInput() {
    this.inputController = new OverworldInputController(
      this,
      (message) => this.showControllerMessage(message),
      () => this.hintText.setText("Controller disconnected. Keyboard is still active."),
    );
    this.inputController.setup();
  }

  private createAnimations() {
    ANIMATION_CONFIGS.forEach(([key, texture, start, end, frameRate, repeat]) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(texture, { start, end }),
          frameRate,
          repeat,
        });
      }
    });
  }

  private createColliders() {
    this.physics.add.collider(this.player, this.props);
    this.physics.add.collider(this.scout, this.props);
    this.physics.add.collider(this.archer, this.props);
    this.physics.add.collider(this.player, this.scout, () => {
      if (this.scoutAlive) this.damagePlayer();
    });
    this.physics.add.collider(this.player, this.archer, () => {
      if (this.archerAlive) this.damagePlayer();
    });
    this.physics.add.overlap(this.player, this.arrows, (_, arrow) => {
      this.damagePlayer();
      (arrow as Phaser.Physics.Arcade.Sprite).destroy();
    });
  }

  private triggerAttack(time: number) {
    this.lastAttackAt = time;
    this.isAttacking = true;
    this.hitThisSwing = false;
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

  private updateScout() {
    if (!this.scoutAlive) {
      this.scout.setVelocity(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.scout.x, this.scout.y);
    const leash = Phaser.Math.Distance.Between(this.scout.x, this.scout.y, this.scoutSpawn.x, this.scoutSpawn.y);
    const body = this.scout.body as Phaser.Physics.Arcade.Body;

    if (dist < AGGRO_DISTANCE || leash > LEASH_DISTANCE) {
      const target = leash > LEASH_DISTANCE ? this.scoutSpawn : new Phaser.Math.Vector2(this.player.x, this.player.y);
      this.physics.moveTo(this.scout, target.x, target.y, ENEMY_SPEED + 12);
      this.scout.setFlipX(body.velocity.x < 0);
      this.scout.anims.play("pawn-run-red", true);
    } else {
      this.scout.setVelocity(0, 0);
      this.scout.anims.play("pawn-idle-red", true);
    }
  }

  private updateArcher(time: number) {
    if (!this.archerAlive) {
      this.archer.setVelocity(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.archer.x, this.archer.y);
    const body = this.archer.body as Phaser.Physics.Arcade.Body;
    if (dist > ARCHER_RANGE - 40) {
      this.physics.moveTo(this.archer, this.player.x, this.player.y, ARCHER_SPEED);
      this.archer.anims.play("archer-run-red", true);
    } else {
      this.archer.setVelocity(0, 0);
      this.archer.anims.play("archer-idle-red", true);
      if (time - this.lastShotAt > 1200) {
        this.lastShotAt = time;
        this.fireArrow();
      }
    }
    this.archer.setFlipX(body.velocity.x < 0 || this.player.x < this.archer.x);
  }

  private fireArrow() {
    const arrow = this.arrows.create(this.archer.x, this.archer.y - 18, "arrow-sigil") as Phaser.Physics.Arcade.Sprite;
    arrow.setScale(1.1).setDepth(12);
    const dir = new Phaser.Math.Vector2(this.player.x - this.archer.x, this.player.y - this.archer.y).normalize();
    arrow.setVelocity(dir.x * PROJECTILE_SPEED, dir.y * PROJECTILE_SPEED).setRotation(dir.angle());
    this.time.delayedCall(2200, () => {
      if (arrow.active) arrow.destroy();
    });
  }

  private updateAttackZone() {
    const dir = this.facing === "left" ? -1 : 1;
    this.attackZone.setPosition(this.player.x + 44 * dir, this.player.y + 4);
    this.player.setFlipX(this.facing === "left");
    this.aura.setPosition(this.player.x + 16 * dir, this.player.y + 8);
  }

  private updateUi(nearExit: boolean) {
    this.promptText.setVisible(nearExit).setPosition(220, 446);
    const scout = this.scoutAlive ? `Scout ${this.scoutHealth}/4` : "Scout clear";
    const archer = this.archerAlive ? `Archer ${this.archerHealth}/${ARCHER_MAX_HEALTH}` : "Archer clear";
    this.routeText.setText(`Pack: ${scout} | ${archer}`);
  }

  private damageScout() {
    this.scoutHealth -= 1;
    this.scout.setVelocity(this.facing === "left" ? -220 : 220, -40);
    this.cameras.main.shake(120, 0.003);
    if (this.scoutHealth <= 0) {
      this.scoutAlive = false;
      this.scout.disableBody(true, true);
      this.checkCompletion();
    } else {
      this.hintText.setText(`Frontline scout staggered (${this.scoutHealth} left).`);
    }
  }

  private damageArcher() {
    this.archerHealth -= 1;
    this.archer.setVelocity(this.facing === "left" ? -220 : 220, -40);
    this.cameras.main.shake(140, 0.004);
    if (this.archerHealth <= 0) {
      this.archerAlive = false;
      this.archer.disableBody(true, true);
      this.clearArrows();
      this.checkCompletion();
    } else {
      this.hintText.setText(`Backline archer staggered (${this.archerHealth} left).`);
    }
  }

  private checkCompletion() {
    if (this.scoutAlive || this.archerAlive) {
      this.hintText.setText("One half of the pack is down. Finish the route.");
      return;
    }

    this.questStage = "wider_grove_completed";
    this.syncProgress("wider_grove");
    this.hintText.setText("Wider grove secured. Return west to the outpost.");
  }

  private damagePlayer() {
    if (this.time.now < this.invulnerableUntil) return;
    this.invulnerableUntil = this.time.now + 900;
    this.playerHealth = Math.max(0, this.playerHealth - 10);
    this.syncProgress("wider_grove");
    this.cameras.main.shake(140, 0.004);
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.45, to: 1 },
      duration: 120,
      yoyo: true,
      repeat: 3,
    });
    this.hintText.setText(`Warrior hit. Health ${this.playerHealth} / ${PLAYER_MAX_HEALTH}.`);
  }

  private leaveForOutpost() {
    this.syncProgress("outpost");
    this.scene.start("overworld", { spawn: "groveGate" });
  }

  private clearArrows() {
    this.arrows.getChildren().forEach((arrow) => (arrow as Phaser.Physics.Arcade.Sprite).destroy());
  }

  private showControllerMessage(message: string) {
    this.hintText.setText(message);
    this.time.delayedCall(2400, () => this.hintText.setText(getHintForStage(this.questStage)));
  }

  private syncProgress(currentArea: "outpost" | "wider_grove") {
    saveStoredProgress(
      buildStoredProgress({
        playerHealth: this.playerHealth,
        questStage: this.questStage,
        currentArea,
        inventoryGold: this.inventoryGold,
        inventorySigil: this.inventorySigil,
      }),
    );
  }
}

function readStoredProgressSafe() {
  if (typeof window === "undefined") {
    return {
      playerHealth: PLAYER_MAX_HEALTH,
      stamina: 72,
      questStage: "available" as const,
      currentArea: "outpost" as const,
      inventory: {
        goldToken: 0,
        arrowSigil: 0,
      },
    };
  }

  return readStoredProgress(window.localStorage);
}
