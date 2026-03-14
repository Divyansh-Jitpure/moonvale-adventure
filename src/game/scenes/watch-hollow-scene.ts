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
  hasWatchHollowRoute,
  readStoredProgress,
  saveStoredProgress,
} from "@/game/overworld/overworld-progress";

export class WatchHollowScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private scoutFront!: Phaser.Physics.Arcade.Sprite;
  private scoutRear!: Phaser.Physics.Arcade.Sprite;
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
  private scoutFrontHealth = 3;
  private scoutRearHealth = 3;
  private archerHealth = ARCHER_MAX_HEALTH;
  private scoutFrontAlive = true;
  private scoutRearAlive = true;
  private archerAlive = true;
  private invulnerableUntil = 0;
  private questStage = readStoredProgressSafe().questStage;
  private inventoryGold = readStoredProgressSafe().inventory.goldToken;
  private inventorySigil = readStoredProgressSafe().inventory.arrowSigil;
  private readonly scoutFrontSpawn = new Phaser.Math.Vector2(540, 505);
  private readonly scoutRearSpawn = new Phaser.Math.Vector2(760, 355);
  private readonly archerSpawn = new Phaser.Math.Vector2(1165, 250);

  constructor() {
    super("watch-hollow");
  }

  preload() {
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("arrow-sigil", "/assets/rewards/arrow-sigil.png");
    this.load.spritesheet("warrior-idle", "/assets/units/warrior/warrior-idle.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-run", "/assets/units/warrior/warrior-run.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-attack", "/assets/units/warrior/warrior-attack-1.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("pawn-idle-red", "/assets/units/enemy/pawn-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("pawn-run-red", "/assets/units/enemy/pawn-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-idle-red", "/assets/units/enemy/archer-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-run-red", "/assets/units/enemy/archer-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
  }

  create() {
    const progress = readStoredProgressSafe();
    if (!hasWatchHollowRoute(progress.questStage)) {
      this.scene.start("overworld");
      return;
    }

    this.questStage = progress.questStage === "watch_hollow_available" ? "watch_hollow_active" : progress.questStage;
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

    if (this.questStage === "watch_hollow_completed") {
      this.scoutFrontAlive = false;
      this.scoutRearAlive = false;
      this.archerAlive = false;
      this.scoutFront.disableBody(true, true);
      this.scoutRear.disableBody(true, true);
      this.archer.disableBody(true, true);
      this.clearArrows();
    } else {
      this.syncProgress("watch_hollow");
    }

    this.setHintText(getHintForStage(this.questStage));
  }

  update(time: number) {
    const input = this.inputController.readInput();
    const movement = new Phaser.Math.Vector2(input.x, input.y);
    const nearExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, 140, 540) < TALK_DISTANCE;

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

    this.updateScout(this.scoutFront, this.scoutFrontSpawn, this.scoutFrontAlive, ENEMY_SPEED + 8);
    this.updateScout(this.scoutRear, this.scoutRearSpawn, this.scoutRearAlive, ENEMY_SPEED + 16);
    this.updateArcher(time);
    this.updateAttackZone();
    this.updateUi(nearExit);

    if (this.attackActive) {
      this.applyAttackHit(this.scoutFront, this.scoutFrontAlive, () => this.damageScout("front"));
      this.applyAttackHit(this.scoutRear, this.scoutRearAlive, () => this.damageScout("rear"));
      this.applyAttackHit(this.archer, this.archerAlive, () => this.damageArcher());
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

    this.add.rectangle(768, 480, 1536, 960, 0x162018, 0.5);
    const lane = this.add.graphics();
    lane.fillStyle(0x856d4d, 0.96);
    lane.fillRoundedRect(110, 510, 1330, 116, 34);
    lane.fillRoundedRect(650, 200, 120, 370, 30);
    lane.fillRoundedRect(950, 180, 300, 88, 30);
    lane.lineStyle(6, 0xc6a97c, 0.35);
    lane.strokeRoundedRect(110, 510, 1330, 116, 34);
    lane.strokeRoundedRect(650, 200, 120, 370, 30);
    lane.strokeRoundedRect(950, 180, 300, 88, 30);

    this.add.ellipse(1255, 200, 210, 120, 0x355e72, 1).setStrokeStyle(5, 0xa7ebff, 0.25);
    this.add.image(1255, 200, "water-foam").setScale(0.36).setAlpha(0.64);
  }

  private createProps() {
    this.props = this.physics.add.staticGroup();
    [
      ["tree-1", 210, 290, 0.42, 120, 72, 110, 174],
      ["tree-1", 310, 710, 0.44, 120, 72, 110, 174],
      ["tree-1", 560, 170, 0.37, 120, 72, 110, 174],
      ["tree-1", 985, 705, 0.42, 120, 72, 110, 174],
      ["tree-1", 1315, 585, 0.44, 120, 72, 110, 174],
      ["tree-1", 1355, 325, 0.38, 120, 72, 110, 174],
      ["rock-2", 480, 615, 1.1, 44, 26, 10, 30],
      ["rock-2", 630, 392, 1.08, 44, 26, 10, 30],
      ["rock-2", 905, 540, 1.05, 44, 26, 10, 30],
      ["rock-2", 1080, 330, 1.1, 44, 26, 10, 30],
      ["rock-2", 1260, 520, 1.12, 44, 26, 10, 30],
    ].forEach(([texture, x, y, scale, bw, bh, ox, oy]) => {
      const prop = this.props.create(x as number, y as number, texture as string).setScale(scale as number).refreshBody();
      prop.setSize?.(bw as number, bh as number, true);
      prop.setOffset?.(ox as number, oy as number);
    });

    this.exitMarker = this.add.rectangle(126, 540, 34, 160, 0xceb989, 0.32).setStrokeStyle(2, 0xf8e7c1, 0.55);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(210, 545, "warrior-idle", 0);
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
    this.scoutFront = this.physics.add.sprite(this.scoutFrontSpawn.x, this.scoutFrontSpawn.y, "pawn-idle-red", 0);
    this.scoutFront.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154);
    this.scoutFront.anims.play("pawn-idle-red", true);

    this.scoutRear = this.physics.add.sprite(this.scoutRearSpawn.x, this.scoutRearSpawn.y, "pawn-idle-red", 0);
    this.scoutRear.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154);
    this.scoutRear.anims.play("pawn-idle-red", true);

    this.archer = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y, "archer-idle-red", 0);
    this.archer.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154);
    this.archer.anims.play("archer-idle-red", true);

    this.arrows = this.physics.add.group({ allowGravity: false, immovable: true });
  }

  private createUi() {
    this.hintText = this.add.text(24, 22, "Watch Hollow route active.", { fontFamily: "Segoe UI", fontSize: "18px", color: "#f7f2e8" }).setScrollFactor(0).setDepth(30);
    this.routeText = this.add.text(24, 52, "Pack: front scout live | rear scout live | archer live", { fontFamily: "Segoe UI", fontSize: "16px", color: "#b9d9ff" }).setScrollFactor(0).setDepth(30);
    this.promptText = this.add.text(0, 0, "Press E / X to return to Moonvale Outpost", { fontFamily: "Segoe UI", fontSize: "16px", color: "#f5f0e3", backgroundColor: "#0f1a1fcc", padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  private createInput() {
    this.inputController = new OverworldInputController(
      this,
      (message) => this.showControllerMessage(message),
      () => this.setHintText("Controller disconnected. Keyboard is still active."),
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
    this.physics.add.collider(this.scoutFront, this.props);
    this.physics.add.collider(this.scoutRear, this.props);
    this.physics.add.collider(this.archer, this.props);
    this.physics.add.collider(this.player, this.scoutFront, () => { if (this.scoutFrontAlive) this.damagePlayer(); });
    this.physics.add.collider(this.player, this.scoutRear, () => { if (this.scoutRearAlive) this.damagePlayer(); });
    this.physics.add.collider(this.player, this.archer, () => { if (this.archerAlive) this.damagePlayer(); });
    this.physics.add.overlap(this.player, this.arrows, (_, arrow) => { this.damagePlayer(); (arrow as Phaser.Physics.Arcade.Sprite).destroy(); });
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
    this.tweens.add({ targets: this.aura, alpha: { from: 0.55, to: 0 }, scale: { from: 1, to: 2.1 }, duration: 280, ease: "Quad.Out" });
  }

  private updateScout(enemy: Phaser.Physics.Arcade.Sprite, spawn: Phaser.Math.Vector2, alive: boolean, speed: number) {
    if (!alive) {
      enemy.setVelocity(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    const leash = Phaser.Math.Distance.Between(enemy.x, enemy.y, spawn.x, spawn.y);
    const body = enemy.body as Phaser.Physics.Arcade.Body;

    if (dist < AGGRO_DISTANCE || leash > LEASH_DISTANCE) {
      const target = leash > LEASH_DISTANCE ? spawn : new Phaser.Math.Vector2(this.player.x, this.player.y);
      this.physics.moveTo(enemy, target.x, target.y, speed);
      enemy.setFlipX(body.velocity.x < 0);
      enemy.anims.play("pawn-run-red", true);
    } else if (leash > 10) {
      this.physics.moveTo(enemy, spawn.x, spawn.y, speed * 0.82);
      enemy.setFlipX(body.velocity.x < 0);
      enemy.anims.play("pawn-run-red", true);
    } else {
      enemy.setVelocity(0, 0);
      enemy.anims.play("pawn-idle-red", true);
    }
  }

  private updateArcher(time: number) {
    if (!this.archerAlive) {
      this.archer.setVelocity(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.archer.x, this.archer.y);
    const body = this.archer.body as Phaser.Physics.Arcade.Body;
    if (dist > ARCHER_RANGE - 20) {
      this.physics.moveTo(this.archer, this.player.x, this.player.y, ARCHER_SPEED);
      this.archer.anims.play("archer-run-red", true);
    } else {
      this.archer.setVelocity(0, 0);
      this.archer.anims.play("archer-idle-red", true);
      if (time - this.lastShotAt > 1180) {
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
    this.promptText.setVisible(nearExit).setPosition(250, 468);
    const front = this.scoutFrontAlive ? `Front ${this.scoutFrontHealth}/3` : "Front clear";
    const rear = this.scoutRearAlive ? `Rear ${this.scoutRearHealth}/3` : "Rear clear";
    const archer = this.archerAlive ? `Archer ${this.archerHealth}/${ARCHER_MAX_HEALTH}` : "Archer clear";
    this.routeText.setText(`Pack: ${front} | ${rear} | ${archer}`);
  }

  private applyAttackHit(enemy: Phaser.Physics.Arcade.Sprite, alive: boolean, onHit: () => void) {
    if (!alive || this.hitThisSwing) return;
    this.physics.overlap(this.attackZone, enemy, () => {
      if (!this.hitThisSwing) {
        this.hitThisSwing = true;
        onHit();
      }
    });
  }

  private damageScout(which: "front" | "rear") {
    const enemy = which === "front" ? this.scoutFront : this.scoutRear;
    const nextHealth = (which === "front" ? this.scoutFrontHealth : this.scoutRearHealth) - 1;

    enemy.setVelocity(this.facing === "left" ? -220 : 220, -40);
    this.cameras.main.shake(120, 0.003);

    if (which === "front") this.scoutFrontHealth = nextHealth;
    else this.scoutRearHealth = nextHealth;

    if (nextHealth <= 0) {
      if (which === "front") this.scoutFrontAlive = false;
      else this.scoutRearAlive = false;
      enemy.disableBody(true, true);
      this.checkCompletion();
    } else {
      this.setHintText(`${which === "front" ? "Front" : "Rear"} scout staggered (${nextHealth} left).`);
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
      this.setHintText(`Watch Hollow archer staggered (${this.archerHealth} left).`);
    }
  }

  private checkCompletion() {
    if (this.scoutFrontAlive || this.scoutRearAlive || this.archerAlive) {
      this.setHintText("The western pack is breaking. Finish the route.");
      return;
    }

    this.questStage = "watch_hollow_completed";
    this.syncProgress("watch_hollow");
    this.setHintText("Watch Hollow secured. Return east to Moonvale.");
  }

  private damagePlayer() {
    if (this.time.now < this.invulnerableUntil) return;
    this.invulnerableUntil = this.time.now + 900;
    this.playerHealth = Math.max(10, this.playerHealth - 10);
    this.syncProgress("watch_hollow");
    this.cameras.main.shake(140, 0.004);
    this.tweens.add({ targets: this.player, alpha: { from: 0.45, to: 1 }, duration: 120, yoyo: true, repeat: 3 });
    this.setHintText(`Warrior hit. Health ${this.playerHealth} / ${PLAYER_MAX_HEALTH}.`);
  }

  private leaveForOutpost() {
    this.syncProgress("outpost");
    this.scene.start("overworld", { spawn: "watchGate" });
  }

  private clearArrows() {
    this.arrows.getChildren().forEach((arrow) => (arrow as Phaser.Physics.Arcade.Sprite).destroy());
  }

  private showControllerMessage(message: string) {
    this.setHintText(message);
    this.time.delayedCall(2400, () => this.setHintText(getHintForStage(this.questStage)));
  }

  private setHintText(message: string) {
    if (!this.sys.isActive() || !this.hintText?.scene) return;
    this.hintText.setText(message);
  }

  private syncProgress(currentArea: "outpost" | "watch_hollow") {
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
