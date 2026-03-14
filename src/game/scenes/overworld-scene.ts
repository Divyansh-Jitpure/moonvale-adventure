import * as Phaser from "phaser";
import { defaultGameProgress, type GameArea, type QuestStage } from "@/lib/game-progress";
import { playSfx, preloadGameAudio, SOUND_KEYS, startAmbientLoop } from "@/game/audio/game-audio";
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
  MAP_DATA,
  MONK_FRAME,
  NPC_SCALE,
  PLAYER_MAX_HEALTH,
  PLAYER_SCALE,
  PLAYER_SPEED,
  PROJECTILE_SPEED,
  PROP_LAYOUTS,
  SCOUT_MAX_HEALTH,
  SPRINT_MULTIPLIER,
  TALK_DISTANCE,
  TILE_SIZE,
  WARRIOR_FRAME,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/game/overworld/overworld-data";
import { OverworldInputController } from "@/game/overworld/overworld-input";
import {
  DEFAULT_HINT,
  buildStoredProgress,
  getDialogueResolvedStage,
  getDialogueStartStage,
  getHintForStage,
  hasArcherRoute,
  hasWatchHollowRoute,
  hasWiderGroveRoute,
  isScoutResolved,
  readStoredProgress,
  saveStoredProgress,
  shouldActivateArcher,
  shouldDisableArcher,
  shouldHideGoldReward,
  shouldHideSigilReward,
} from "@/game/overworld/overworld-progress";
import { getQuestStageDetails } from "@/lib/quest-data";

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite; private npc!: Phaser.Physics.Arcade.Sprite;
  private scout!: Phaser.Physics.Arcade.Sprite; private archer!: Phaser.Physics.Arcade.Sprite;
  private gold!: Phaser.Physics.Arcade.Sprite; private sigil!: Phaser.Physics.Arcade.Sprite;
  private groveGate!: Phaser.GameObjects.Rectangle; private watchGate!: Phaser.GameObjects.Rectangle;
  private arrows!: Phaser.Physics.Arcade.Group; private attackZone!: Phaser.GameObjects.Zone;
  private props!: Phaser.Physics.Arcade.StaticGroup; private inputController!: OverworldInputController;
  private hintText!: Phaser.GameObjects.Text; private promptText!: Phaser.GameObjects.Text; private routeText!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Container; private panelLabel!: Phaser.GameObjects.Text; private panelText!: Phaser.GameObjects.Text; private aura!: Phaser.GameObjects.Arc;
  private lastAttackAt = 0; private lastShotAt = 0;
  private isAttacking = false; private attackActive = false; private hitThisSwing = false; private facing: "left" | "right" = "right";
  private dialogueOpen = false; private dialogueIndex = 0; private playerHealth = PLAYER_MAX_HEALTH; private scoutHealth = SCOUT_MAX_HEALTH; private archerHealth = ARCHER_MAX_HEALTH;
  private scoutAlive = true; private archerAlive = true; private goldCollected = false; private sigilCollected = false; private invulnerableUntil = 0;
  private questStage: QuestStage = defaultGameProgress.questStage; private inventoryGold = defaultGameProgress.inventory.goldToken; private inventorySigil = defaultGameProgress.inventory.arrowSigil;
  private currentArea: GameArea = "outpost";
  private spawnPoint: "default" | "groveGate" | "watchGate" = "default";
  private readonly scoutSpawn = new Phaser.Math.Vector2(1180, 290); private readonly archerSpawn = new Phaser.Math.Vector2(330, 250);

  constructor() { super("overworld"); }

  init(data?: { spawn?: "default" | "groveGate" | "watchGate" }) {
    this.spawnPoint = data?.spawn ?? "default";
  }

  preload() {
    preloadGameAudio(this);
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("house-1-blue", "/assets/buildings/house-1-blue.png");
    this.load.image("gold-resource", "/assets/rewards/gold-resource.png");
    this.load.image("arrow-sigil", "/assets/rewards/arrow-sigil.png");
    this.load.spritesheet("warrior-idle", "/assets/units/warrior/warrior-idle.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-run", "/assets/units/warrior/warrior-run.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("warrior-attack", "/assets/units/warrior/warrior-attack-1.png", { frameWidth: WARRIOR_FRAME, frameHeight: WARRIOR_FRAME });
    this.load.spritesheet("monk-idle", "/assets/units/npc/monk-idle.png", { frameWidth: MONK_FRAME, frameHeight: MONK_FRAME });
    this.load.spritesheet("pawn-idle-red", "/assets/units/enemy/pawn-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("pawn-run-red", "/assets/units/enemy/pawn-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-idle-red", "/assets/units/enemy/archer-idle-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
    this.load.spritesheet("archer-run-red", "/assets/units/enemy/archer-run-red.png", { frameWidth: ENEMY_FRAME, frameHeight: ENEMY_FRAME });
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT); this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createGround(); this.createProps(); this.createAnimations(); this.createPlayer(); this.createNpc(); this.createEnemies(); this.createRewards(); this.createUi(); this.createInput(); this.createColliders(); this.restoreProgress();
    startAmbientLoop(this, SOUND_KEYS.ambientOutpost, { volume: 0.1 });
  }

  update(time: number) {
    const input = this.inputController.readInput(); const movement = new Phaser.Math.Vector2(input.x, input.y);
    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < TALK_DISTANCE;
    const nearGroveGate = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1440, 742) < TALK_DISTANCE;
    const nearWatchGate = Phaser.Math.Distance.Between(this.player.x, this.player.y, 96, 742) < TALK_DISTANCE;
    if (movement.lengthSq() > 1) movement.normalize();
    if (movement.x !== 0) this.facing = movement.x < 0 ? "left" : "right";
    if (this.dialogueOpen) {
      this.player.setVelocity(0, 0); this.player.anims.play("warrior-idle", true);
      if (input.interact) this.advanceDialogue();
    } else {
      if (input.interact && nearNpc) this.openDialogue();
      if (input.interact && nearGroveGate && this.canEnterWiderGrove()) this.enterWiderGrove();
      if (input.interact && nearWatchGate && this.canEnterWatchHollow()) this.enterWatchHollow();
      if (input.attack && !this.isAttacking && time - this.lastAttackAt > 350) this.triggerAttack(time);
      if (!this.isAttacking) {
        const speed = PLAYER_SPEED * (input.sprint ? SPRINT_MULTIPLIER : 1);
        this.player.setVelocity(movement.x * speed, movement.y * speed);
        this.player.anims.play(movement.lengthSq() > 0.01 ? "warrior-run" : "warrior-idle", true);
      }
    }
    this.updateScout(); this.updateArcher(time); this.updateAttackZone(); this.updateUi(nearNpc, nearGroveGate, nearWatchGate); this.tryRewardPickup();
    if (this.attackActive) {
      if (this.scoutAlive) this.physics.overlap(this.attackZone, this.scout, () => { if (!this.hitThisSwing) { this.hitThisSwing = true; this.damageScout(); } });
      if (this.archerAlive) this.physics.overlap(this.attackZone, this.archer, () => { if (!this.hitThisSwing) { this.hitThisSwing = true; this.damageArcher(); } });
    }
  }

  private createGround() {
    const map = this.make.tilemap({ data: MAP_DATA, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE }); const tiles = map.addTilesetImage("terrain-tiles"); map.createLayer(0, tiles!, 0, 0);
    const path = this.add.graphics(); path.fillStyle(0xb28f62, 0.96); path.fillRoundedRect(180, 680, 1290, 128, 38); path.fillRoundedRect(900, 310, 120, 428, 32); path.fillRoundedRect(240, 190, 700, 90, 34); path.lineStyle(6, 0xcfb18c, 0.45); path.strokeRoundedRect(180, 680, 1290, 128, 38); path.strokeRoundedRect(900, 310, 120, 428, 32); path.strokeRoundedRect(240, 190, 700, 90, 34);
    const pond = this.add.ellipse(1230, 290, 280, 180, 0x327aa2, 1); pond.setStrokeStyle(6, 0xa7ebff, 0.35); this.add.image(1230, 290, "water-foam").setScale(0.48).setAlpha(0.72);
    const mist = this.add.graphics(); mist.fillGradientStyle(0xffffff, 0xffffff, 0x8fe0ff, 0x8fe0ff, 0.04); mist.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.groveGate = this.add.rectangle(1450, 744, 30, 150, 0x8cccb6, 0.24).setStrokeStyle(2, 0xd8f9ed, 0.45);
    this.watchGate = this.add.rectangle(90, 744, 30, 150, 0xc8b68c, 0.24).setStrokeStyle(2, 0xf8e8c8, 0.45);
  }

  private createProps() {
    this.props = this.physics.add.staticGroup();
    const house = this.props.create(980, 560, "house-1-blue").setScale(1.45).refreshBody(); house.setSize?.(112, 52, true); house.setOffset?.(8, 132);
    PROP_LAYOUTS.forEach(([texture, x, y, scale, bodyWidth, bodyHeight, offsetX, offsetY]) =>
      this.addProp(texture, x, y, scale, bodyWidth, bodyHeight, offsetX, offsetY),
    );
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(380, 735, "warrior-idle", 0); this.player.setScale(PLAYER_SCALE).setCollideWorldBounds(true).setSize(42, 30).setOffset(75, 154);
    this.attackZone = this.add.zone(this.player.x, this.player.y, 72, 56); this.physics.add.existing(this.attackZone); const body = this.attackZone.body as Phaser.Physics.Arcade.Body; body.setAllowGravity(false); body.setImmovable(true); body.enable = false;
    this.aura = this.add.circle(this.player.x, this.player.y + 8, 16, 0xd8ff7a, 0.4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08); this.cameras.main.setZoom(1.25);
    if (this.spawnPoint === "groveGate") this.player.setPosition(1340, 742);
    if (this.spawnPoint === "watchGate") this.player.setPosition(190, 742);
  }

  private createNpc() {
    this.npc = this.physics.add.sprite(820, 730, "monk-idle", 0); this.npc.setScale(NPC_SCALE).setImmovable(true).setSize(48, 32).setOffset(72, 152); (this.npc.body as Phaser.Physics.Arcade.Body).moves = false; this.npc.anims.play("monk-idle", true);
    this.promptText = this.add.text(0, 0, "Press E / X to speak", { fontFamily: "Segoe UI", fontSize: "16px", color: "#f5f0e3", backgroundColor: "#0f1a1fcc", padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  private createEnemies() {
    this.scout = this.physics.add.sprite(this.scoutSpawn.x, this.scoutSpawn.y, "pawn-idle-red", 0); this.scout.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154); this.scout.anims.play("pawn-idle-red", true);
    this.archer = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y, "archer-idle-red", 0); this.archer.setScale(ENEMY_SCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154); this.archer.anims.play("archer-idle-red", true); this.archer.disableBody(true, true);
    this.arrows = this.physics.add.group({ allowGravity: false, immovable: true });
  }

  private createRewards() {
    this.gold = this.physics.add.sprite(this.scoutSpawn.x + 18, this.scoutSpawn.y + 48, "gold-resource"); (this.gold.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); this.gold.setScale(0.36); this.gold.setCircle(28, 12, 12); this.gold.disableBody(true, true);
    this.sigil = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y + 44, "arrow-sigil"); (this.sigil.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); this.sigil.setScale(1.3); this.sigil.setCircle(22, 6, 6); this.sigil.disableBody(true, true);
  }

  private createUi() {
    this.hintText = this.add.text(24, 22, "Brother Alden guards the route ledger. Speak with him to begin.", { fontFamily: "Segoe UI", fontSize: "18px", color: "#f7f2e8" }).setScrollFactor(0).setDepth(30);
    this.routeText = this.add.text(24, 52, "Routes: pond road open | northern stones locked", { fontFamily: "Segoe UI", fontSize: "16px", color: "#b9d9ff" }).setScrollFactor(0).setDepth(30);
    const bg = this.add.rectangle(0, 0, 600, 170, 0x081015, 0.88).setStrokeStyle(2, 0xb89a72, 0.85);
    this.panelLabel = this.add.text(-260, -58, "", { fontFamily: "Segoe UI", fontSize: "18px", color: "#f0c989", fontStyle: "bold" });
    this.panelText = this.add.text(-260, -18, "", { fontFamily: "Segoe UI", fontSize: "20px", color: "#f7f2e8", wordWrap: { width: 520 }, lineSpacing: 6 });
    const footer = this.add.text(-260, 56, "Press E / X again to continue", { fontFamily: "Segoe UI", fontSize: "14px", color: "#a9c1c7" });
    this.panel = this.add.container(480, 540, [bg, this.panelLabel, this.panelText, footer]).setScrollFactor(0).setDepth(35).setVisible(false);
  }

  private restoreProgress() {
    if (typeof window === "undefined") return;
    const p = readStoredProgress(window.localStorage);
    this.currentArea = p.currentArea; this.playerHealth = p.playerHealth; this.questStage = p.questStage; this.inventoryGold = p.inventory.goldToken; this.inventorySigil = p.inventory.arrowSigil; this.goldCollected = this.inventoryGold > 0; this.sigilCollected = this.inventorySigil > 0;
    if (isScoutResolved(p.questStage)) { this.scoutAlive = false; this.scoutHealth = 0; this.scout.disableBody(true, true); }
    if (p.questStage === "scout_defeated") this.spawnReward(this.gold, this.scoutSpawn.x + 18, this.scoutSpawn.y + 36, 0.36);
    if (shouldActivateArcher(p.questStage)) this.activateArcher();
    if (shouldDisableArcher(p.questStage)) { this.archerAlive = false; this.archerHealth = 0; this.archer.disableBody(true, true); }
    if (p.questStage === "archer_defeated") this.spawnReward(this.sigil, this.archerSpawn.x, this.archerSpawn.y + 30, 1.3);
    if (shouldHideGoldReward(p.questStage)) this.gold.disableBody(true, true);
    if (shouldHideSigilReward(p.questStage)) this.sigil.disableBody(true, true);
    this.setHintText(getHintForStage(this.questStage));
  }

  private createInput() {
    this.inputController = new OverworldInputController(
      this,
      (message) => this.showControllerMessage(message),
      () => {
        this.setHintText("Controller disconnected. Keyboard is still active.");
      },
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
    this.physics.add.collider(this.player, this.props); this.physics.add.collider(this.player, this.npc); this.physics.add.collider(this.scout, this.props); this.physics.add.collider(this.scout, this.npc); this.physics.add.collider(this.archer, this.props); this.physics.add.collider(this.archer, this.npc);
    this.physics.add.collider(this.player, this.scout, () => { if (this.scoutAlive) this.damagePlayer(); }); this.physics.add.collider(this.player, this.archer, () => { if (this.archerAlive) this.damagePlayer(); });
    this.physics.add.overlap(this.player, this.gold, () => this.collectGold()); this.physics.add.overlap(this.player, this.sigil, () => this.collectSigil());
    this.physics.add.overlap(this.player, this.arrows, (_, arrow) => { this.damagePlayer(); (arrow as Phaser.Physics.Arcade.Sprite).destroy(); });
  }

  private addProp(texture: string, x: number, y: number, scale: number, bw: number, bh: number, ox: number, oy: number) {
    const prop = this.props.create(x, y, texture).setScale(scale).refreshBody(); prop.setSize?.(bw, bh, true); prop.setOffset?.(ox, oy);
  }

  private triggerAttack(time: number) {
    this.lastAttackAt = time; this.isAttacking = true; this.hitThisSwing = false; this.player.setVelocity(0, 0); this.player.anims.play("warrior-attack", true); this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { this.isAttacking = false; }); playSfx(this, SOUND_KEYS.swing, { rate: 1.05 });
    this.time.delayedCall(90, () => { this.attackActive = true; (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = true; });
    this.time.delayedCall(210, () => { this.attackActive = false; (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false; });
    this.tweens.add({ targets: this.aura, alpha: { from: 0.55, to: 0 }, scale: { from: 1, to: 2.1 }, duration: 280, ease: "Quad.Out" });
  }

  private updateScout() {
    if (!this.scoutAlive) { this.scout.setVelocity(0, 0); return; }
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.scout.x, this.scout.y); const leash = Phaser.Math.Distance.Between(this.scout.x, this.scout.y, this.scoutSpawn.x, this.scoutSpawn.y); const body = this.scout.body as Phaser.Physics.Arcade.Body;
    if (dist < AGGRO_DISTANCE || leash > LEASH_DISTANCE) { const target = leash > LEASH_DISTANCE ? this.scoutSpawn : new Phaser.Math.Vector2(this.player.x, this.player.y); this.physics.moveTo(this.scout, target.x, target.y, ENEMY_SPEED); this.scout.setFlipX(body.velocity.x < 0); this.scout.anims.play("pawn-run-red", true); }
    else if (leash > 10) { this.physics.moveTo(this.scout, this.scoutSpawn.x, this.scoutSpawn.y, ENEMY_SPEED * 0.8); this.scout.setFlipX(body.velocity.x < 0); this.scout.anims.play("pawn-run-red", true); }
    else { this.scout.setVelocity(0, 0); this.scout.anims.play("pawn-idle-red", true); }
  }

  private updateArcher(time: number) {
    if (!this.archer.active || !this.archerAlive) { this.archer.setVelocity(0, 0); return; }
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.archer.x, this.archer.y); const body = this.archer.body as Phaser.Physics.Arcade.Body;
    if (dist > ARCHER_RANGE) { this.physics.moveTo(this.archer, this.player.x, this.player.y, ARCHER_SPEED); this.archer.anims.play("archer-run-red", true); }
    else { this.archer.setVelocity(0, 0); this.archer.anims.play("archer-idle-red", true); if (time - this.lastShotAt > 1400 && !this.dialogueOpen) { this.lastShotAt = time; this.fireArrow(); } }
    this.archer.setFlipX(body.velocity.x < 0 || this.player.x < this.archer.x);
  }

  private fireArrow() {
    const arrow = this.arrows.create(this.archer.x, this.archer.y - 18, "arrow-sigil") as Phaser.Physics.Arcade.Sprite; arrow.setScale(1.2).setDepth(12);
    const dir = new Phaser.Math.Vector2(this.player.x - this.archer.x, this.player.y - this.archer.y).normalize(); arrow.setVelocity(dir.x * PROJECTILE_SPEED, dir.y * PROJECTILE_SPEED).setRotation(dir.angle());
    this.time.delayedCall(2600, () => { if (arrow.active) arrow.destroy(); });
  }

  private updateAttackZone() {
    const dir = this.facing === "left" ? -1 : 1; this.attackZone.setPosition(this.player.x + 44 * dir, this.player.y + 4); this.player.setFlipX(this.facing === "left"); this.aura.setPosition(this.player.x + 16 * dir, this.player.y + 8);
  }

  private updateUi(nearNpc: boolean, nearGroveGate: boolean, nearWatchGate: boolean) {
    this.promptText.setVisible((nearNpc || (nearGroveGate && this.canEnterWiderGrove()) || (nearWatchGate && this.canEnterWatchHollow())) && !this.dialogueOpen);
    this.promptText.setPosition(
      nearGroveGate && this.canEnterWiderGrove() ? 1395 : nearWatchGate && this.canEnterWatchHollow() ? 170 : this.npc.x,
      nearGroveGate && this.canEnterWiderGrove() ? 660 : nearWatchGate && this.canEnterWatchHollow() ? 660 : this.npc.y - 74,
    );
    this.promptText.setText(
      nearGroveGate && this.canEnterWiderGrove()
        ? "Press E / X to enter Wider Grove"
        : nearWatchGate && this.canEnterWatchHollow()
          ? "Press E / X to enter Watch Hollow"
          : "Press E / X to speak",
    );
    const scout = this.scoutAlive ? `Scout ${this.scoutHealth}/${SCOUT_MAX_HEALTH}` : "Scout clear";
    const archerRoute = hasArcherRoute(this.questStage);
    const archer = archerRoute ? (this.archerAlive ? `Archer ${this.archerHealth}/${ARCHER_MAX_HEALTH}` : "Archer clear") : "Archer locked";
    const grove = hasWiderGroveRoute(this.questStage)
      ? this.questStage === "wider_grove_completed" || this.questStage === "watch_hollow_available" || this.questStage === "watch_hollow_active" || this.questStage === "watch_hollow_completed"
        ? "Grove clear"
        : "Grove open"
      : "Grove locked";
    const hollow = hasWatchHollowRoute(this.questStage)
      ? this.questStage === "watch_hollow_completed"
        ? "Hollow clear"
        : "Hollow open"
      : "Hollow locked";
    this.routeText.setText(`Routes: ${scout} | ${archer} | ${grove} | ${hollow}`);
  }

  private damageScout() {
    if (!this.scoutAlive) return;
    this.scoutHealth -= 1; this.scout.setVelocity(this.facing === "left" ? -220 : 220, -40); this.cameras.main.shake(120, 0.003); playSfx(this, SOUND_KEYS.enemyHit, { rate: 1.08 });
    if (this.scoutHealth <= 0) { this.scoutAlive = false; this.scout.disableBody(true, true); this.questStage = "scout_defeated"; this.spawnReward(this.gold, this.scoutSpawn.x + 18, this.scoutSpawn.y + 36, 0.36); this.syncProgress(); this.setHintText("Scout defeated. Pick up the gold token and return to Alden."); }
    else this.setHintText(`Solid hit. Scout is reeling (${this.scoutHealth} left).`);
  }

  private damageArcher() {
    if (!this.archerAlive) return;
    this.archerHealth -= 1; this.archer.setVelocity(this.facing === "left" ? -220 : 220, -40); this.cameras.main.shake(140, 0.004); playSfx(this, SOUND_KEYS.enemyHit, { rate: 0.95 });
    if (this.archerHealth <= 0) { this.archerAlive = false; this.archer.disableBody(true, true); this.clearArrows(); this.questStage = "archer_defeated"; this.spawnReward(this.sigil, this.archerSpawn.x, this.archerSpawn.y + 30, 1.3); this.syncProgress(); this.setHintText("Archer defeated. Recover the arrow sigil."); }
    else this.setHintText(`The archer staggered (${this.archerHealth} left).`);
  }

  private damagePlayer() {
    if (this.time.now < this.invulnerableUntil) return;
    this.invulnerableUntil = this.time.now + 900; this.playerHealth = Math.max(10, this.playerHealth - 10); this.syncProgress(); this.cameras.main.shake(140, 0.004);
    this.tweens.add({ targets: this.player, alpha: { from: 0.45, to: 1 }, duration: 120, yoyo: true, repeat: 3 }); playSfx(this, SOUND_KEYS.playerHit, { rate: 0.92 }); this.setHintText(`Warrior hit. Health ${this.playerHealth} / ${PLAYER_MAX_HEALTH}.`);
  }

  private spawnReward(sprite: Phaser.Physics.Arcade.Sprite, x: number, y: number, scale: number) {
    sprite.enableBody(true, x, y, true, true); sprite.setScale(scale).setVelocity(0, 0); this.tweens.killTweensOf(sprite); this.tweens.add({ targets: sprite, y: sprite.y - 8, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }
  private collectGold() { if (this.goldCollected || !this.gold.active) return; this.goldCollected = true; this.inventoryGold = 1; this.questStage = "reward_collected"; this.gold.disableBody(true, true); playSfx(this, SOUND_KEYS.pickup, { rate: 1.04 }); this.syncProgress(); this.setHintText("Recovered the gold token. Return to Alden."); }
  private collectSigil() { if (this.sigilCollected || !this.sigil.active) return; this.sigilCollected = true; this.inventorySigil = 1; this.questStage = "route_relic_collected"; this.sigil.disableBody(true, true); playSfx(this, SOUND_KEYS.pickup, { rate: 0.9 }); this.syncProgress(); this.setHintText("Arrow sigil secured. Return to Alden."); }
  private tryRewardPickup() {
    if (!this.goldCollected && this.gold.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.gold.x, this.gold.y) < 52) this.collectGold();
    if (!this.sigilCollected && this.sigil.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.sigil.x, this.sigil.y) < 52) this.collectSigil();
  }

  private openDialogue() {
    const nextStage = getDialogueStartStage(this.questStage);
    if (nextStage !== this.questStage) {
      this.questStage = nextStage;
      if (nextStage === "second_route_active") this.activateArcher();
      this.syncProgress();
    }
    const d = getQuestStageDetails(this.questStage).dialogue; this.dialogueIndex = 0; this.panelLabel.setText(d.label); this.panelText.setText(d.lines[0]); this.dialogueOpen = true; this.panel.setVisible(true); this.setHintText("Dialogue active. Press E / X to continue.");
  }

  private advanceDialogue() {
    const d = getQuestStageDetails(this.questStage).dialogue; this.dialogueIndex += 1;
    if (this.dialogueIndex >= d.lines.length) {
      this.dialogueOpen = false; this.panel.setVisible(false);
      const resolvedStage = getDialogueResolvedStage(this.questStage);
      if (resolvedStage !== this.questStage) { this.questStage = resolvedStage; this.syncProgress(); }
      this.setHintText(getHintForStage(this.questStage)); return;
    }
    this.panelText.setText(d.lines[this.dialogueIndex]);
  }

  private activateArcher() {
    if (this.archer.active || !this.archerAlive) return;
    this.archerAlive = true; this.archerHealth = ARCHER_MAX_HEALTH; this.archer.enableBody(true, this.archerSpawn.x, this.archerSpawn.y, true, true); this.archer.anims.play("archer-idle-red", true);
  }

  private clearArrows() { this.arrows.getChildren().forEach((arrow) => (arrow as Phaser.Physics.Arcade.Sprite).destroy()); }
  private showControllerMessage(message: string) { this.setHintText(message); this.time.delayedCall(2400, () => this.setHintText(this.inputController.isControllerConnected ? getHintForStage(this.questStage) : DEFAULT_HINT)); }
  private setHintText(message: string) { if (!this.sys.isActive() || !this.hintText?.scene) return; this.hintText.setText(message); }
  private canEnterWiderGrove() { return this.questStage === "wider_grove_active" || this.questStage === "wider_grove_completed" || this.questStage === "watch_hollow_available" || this.questStage === "watch_hollow_active" || this.questStage === "watch_hollow_completed"; }
  private canEnterWatchHollow() { return this.questStage === "watch_hollow_active" || this.questStage === "watch_hollow_completed"; }
  private enterWiderGrove() { this.syncProgress("wider_grove"); this.scene.start("wider-grove"); }
  private enterWatchHollow() { this.syncProgress("watch_hollow"); this.scene.start("watch-hollow"); }
  private syncProgress(currentArea: GameArea = "outpost") { this.currentArea = currentArea; saveStoredProgress(buildStoredProgress({ playerHealth: this.playerHealth, questStage: this.questStage, currentArea: this.currentArea, inventoryGold: this.inventoryGold, inventorySigil: this.inventorySigil })); }
}
