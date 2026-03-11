import * as Phaser from "phaser";
import { defaultGameProgress, GAME_PROGRESS_STORAGE_KEY, readGameProgress, saveGameProgress, type QuestStage } from "@/lib/game-progress";

const TS = 96, COLS = 16, ROWS = 12, WW = COLS * TS, WH = ROWS * TS;
const PLAYER_SPEED = 170, ENEMY_SPEED = 82, ARCHER_SPEED = 68, PROJECTILE_SPEED = 210;
const SPRINT = 1.45, DEADZONE = 0.2, WFRAME = 192, MFRAME = 192, EFRAME = 192;
const PSCALE = 0.5, NSCALE = 0.48, ESCALE = 0.5, TALK_DIST = 120, AGGRO = 240, LEASH = 340, ARCHER_RANGE = 310;
const PLAYER_MAX = 100, SCOUT_MAX = 3, ARCHER_MAX = 4;

type InputState = { x: number; y: number; sprint: boolean; attack: boolean; interact: boolean };
type DialogueState = { label: string; lines: string[] };
const MAP_DATA = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
const DIALOGUE: Record<QuestStage, DialogueState> = {
  available: { label: "Brother Alden", lines: ["The pond road is unsafe.", "Drive off the red scout and bring me its token."] },
  accepted: { label: "Brother Alden", lines: ["The scout is still near the pond.", "Remove it and collect the gold token."] },
  scout_defeated: { label: "Brother Alden", lines: ["I heard steel on the road.", "Pick up the gold token before you return."] },
  reward_collected: { label: "Brother Alden", lines: ["Good. The first route is proven.", "Speak again and I will open the northern stones."] },
  completed: { label: "Brother Alden", lines: ["The first route is recorded.", "The northern stones are next."] },
  second_route_available: { label: "Brother Alden", lines: ["A red archer took the northern stones.", "Push north, defeat it, and recover its sigil."] },
  second_route_active: { label: "Brother Alden", lines: ["The archer won't rush you.", "Keep moving and close the gap."] },
  archer_defeated: { label: "Brother Alden", lines: ["The shots have stopped.", "Find the arrow sigil and bring it back."] },
  route_relic_collected: { label: "Brother Alden", lines: ["That sigil seals the route.", "Hand it over and Moonvale gains a second road."] },
  second_route_completed: { label: "Brother Alden", lines: ["Two routes secured.", "Next comes a deeper grove and more threats."] },
};

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite; private npc!: Phaser.Physics.Arcade.Sprite;
  private scout!: Phaser.Physics.Arcade.Sprite; private archer!: Phaser.Physics.Arcade.Sprite;
  private gold!: Phaser.Physics.Arcade.Sprite; private sigil!: Phaser.Physics.Arcade.Sprite;
  private arrows!: Phaser.Physics.Arcade.Group; private attackZone!: Phaser.GameObjects.Zone;
  private props!: Phaser.Physics.Arcade.StaticGroup; private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; sprint: Phaser.Input.Keyboard.Key; attack: Phaser.Input.Keyboard.Key; interact: Phaser.Input.Keyboard.Key };
  private hintText!: Phaser.GameObjects.Text; private promptText!: Phaser.GameObjects.Text; private routeText!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Container; private panelLabel!: Phaser.GameObjects.Text; private panelText!: Phaser.GameObjects.Text; private aura!: Phaser.GameObjects.Arc;
  private lastAttackAt = 0; private lastShotAt = 0; private lastPadAttack = false; private lastPadInteract = false;
  private isAttacking = false; private attackActive = false; private hitThisSwing = false; private controllerConnected = false; private facing: "left" | "right" = "right";
  private dialogueOpen = false; private dialogueIndex = 0; private playerHealth = PLAYER_MAX; private scoutHealth = SCOUT_MAX; private archerHealth = ARCHER_MAX;
  private scoutAlive = true; private archerAlive = false; private goldCollected = false; private sigilCollected = false; private invulnerableUntil = 0;
  private questStage: QuestStage = defaultGameProgress.questStage; private inventoryGold = defaultGameProgress.inventory.goldToken; private inventorySigil = defaultGameProgress.inventory.arrowSigil;
  private readonly scoutSpawn = new Phaser.Math.Vector2(1180, 290); private readonly archerSpawn = new Phaser.Math.Vector2(330, 250);

  constructor() { super("overworld"); }

  preload() {
    this.load.image("terrain-tiles", "/assets/terrain/tileset/tilemap-color1.png");
    this.load.image("water-foam", "/assets/terrain/tileset/water-foam.png");
    this.load.image("tree-1", "/assets/terrain/resources/tree-1.png");
    this.load.image("rock-2", "/assets/terrain/resources/rock-2.png");
    this.load.image("house-1-blue", "/assets/buildings/house-1-blue.png");
    this.load.image("gold-resource", "/assets/rewards/gold-resource.png");
    this.load.image("arrow-sigil", "/assets/rewards/arrow-sigil.png");
    this.load.spritesheet("warrior-idle", "/assets/units/warrior/warrior-idle.png", { frameWidth: WFRAME, frameHeight: WFRAME });
    this.load.spritesheet("warrior-run", "/assets/units/warrior/warrior-run.png", { frameWidth: WFRAME, frameHeight: WFRAME });
    this.load.spritesheet("warrior-attack", "/assets/units/warrior/warrior-attack-1.png", { frameWidth: WFRAME, frameHeight: WFRAME });
    this.load.spritesheet("monk-idle", "/assets/units/npc/monk-idle.png", { frameWidth: MFRAME, frameHeight: MFRAME });
    this.load.spritesheet("pawn-idle-red", "/assets/units/enemy/pawn-idle-red.png", { frameWidth: EFRAME, frameHeight: EFRAME });
    this.load.spritesheet("pawn-run-red", "/assets/units/enemy/pawn-run-red.png", { frameWidth: EFRAME, frameHeight: EFRAME });
    this.load.spritesheet("archer-idle-red", "/assets/units/enemy/archer-idle-red.png", { frameWidth: EFRAME, frameHeight: EFRAME });
    this.load.spritesheet("archer-run-red", "/assets/units/enemy/archer-run-red.png", { frameWidth: EFRAME, frameHeight: EFRAME });
  }

  create() {
    this.cameras.main.setBounds(0, 0, WW, WH); this.physics.world.setBounds(0, 0, WW, WH);
    this.createGround(); this.createProps(); this.createPlayer(); this.createNpc(); this.createEnemies(); this.createRewards(); this.createUi(); this.createInput(); this.createAnimations(); this.createColliders(); this.restoreProgress();
  }

  update(time: number) {
    const input = this.readInput(); const movement = new Phaser.Math.Vector2(input.x, input.y);
    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < TALK_DIST;
    if (movement.lengthSq() > 1) movement.normalize();
    if (movement.x !== 0) this.facing = movement.x < 0 ? "left" : "right";
    if (this.dialogueOpen) {
      this.player.setVelocity(0, 0); this.player.anims.play("warrior-idle", true);
      if (input.interact) this.advanceDialogue();
    } else {
      if (input.interact && nearNpc) this.openDialogue();
      if (input.attack && !this.isAttacking && time - this.lastAttackAt > 350) this.triggerAttack(time);
      if (!this.isAttacking) {
        const speed = PLAYER_SPEED * (input.sprint ? SPRINT : 1);
        this.player.setVelocity(movement.x * speed, movement.y * speed);
        this.player.anims.play(movement.lengthSq() > 0.01 ? "warrior-run" : "warrior-idle", true);
      }
    }
    this.updateScout(); this.updateArcher(time); this.updateAttackZone(); this.updateUi(nearNpc);
    if (this.attackActive) {
      if (this.scoutAlive) this.physics.overlap(this.attackZone, this.scout, () => { if (!this.hitThisSwing) { this.hitThisSwing = true; this.damageScout(); } });
      if (this.archerAlive) this.physics.overlap(this.attackZone, this.archer, () => { if (!this.hitThisSwing) { this.hitThisSwing = true; this.damageArcher(); } });
    }
  }

  private createGround() {
    const map = this.make.tilemap({ data: MAP_DATA, tileWidth: TS, tileHeight: TS }); const tiles = map.addTilesetImage("terrain-tiles"); map.createLayer(0, tiles!, 0, 0);
    const path = this.add.graphics(); path.fillStyle(0xb28f62, 0.96); path.fillRoundedRect(180, 680, 1180, 128, 38); path.fillRoundedRect(900, 310, 120, 428, 32); path.fillRoundedRect(240, 190, 700, 90, 34); path.lineStyle(6, 0xcfb18c, 0.45); path.strokeRoundedRect(180, 680, 1180, 128, 38); path.strokeRoundedRect(900, 310, 120, 428, 32); path.strokeRoundedRect(240, 190, 700, 90, 34);
    const pond = this.add.ellipse(1230, 290, 280, 180, 0x327aa2, 1); pond.setStrokeStyle(6, 0xa7ebff, 0.35); this.add.image(1230, 290, "water-foam").setScale(0.48).setAlpha(0.72);
    const mist = this.add.graphics(); mist.fillGradientStyle(0xffffff, 0xffffff, 0x8fe0ff, 0x8fe0ff, 0.04); mist.fillRect(0, 0, WW, WH);
  }

  private createProps() {
    this.props = this.physics.add.staticGroup();
    const house = this.props.create(980, 560, "house-1-blue").setScale(1.45).refreshBody(); house.setSize?.(112, 52, true); house.setOffset?.(8, 132);
    [["tree-1",230,490,0.42,120,72,110,174],["tree-1",1275,705,0.42,120,72,110,174],["tree-1",1290,460,0.36,120,72,110,174],["tree-1",180,250,0.35,120,72,110,174],["tree-1",520,120,0.33,120,72,110,174],["rock-2",1120,250,1.1,44,26,10,30],["rock-2",300,790,1,44,26,10,30],["rock-2",1180,770,1.18,44,26,10,30],["rock-2",1245,370,1,44,26,10,30],["rock-2",400,210,1.15,44,26,10,30],["rock-2",650,235,1.05,44,26,10,30]].forEach(([t,x,y,s,bw,bh,ox,oy])=>this.addProp(t as string,x as number,y as number,s as number,bw as number,bh as number,ox as number,oy as number));
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(380, 735, "warrior-idle", 0); this.player.setScale(PSCALE).setCollideWorldBounds(true).setSize(42, 30).setOffset(75, 154);
    this.attackZone = this.add.zone(this.player.x, this.player.y, 72, 56); this.physics.add.existing(this.attackZone); const body = this.attackZone.body as Phaser.Physics.Arcade.Body; body.setAllowGravity(false); body.setImmovable(true); body.enable = false;
    this.aura = this.add.circle(this.player.x, this.player.y + 8, 16, 0xd8ff7a, 0.4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08); this.cameras.main.setZoom(1.25);
  }

  private createNpc() {
    this.npc = this.physics.add.sprite(820, 730, "monk-idle", 0); this.npc.setScale(NSCALE).setImmovable(true).setSize(48, 32).setOffset(72, 152); (this.npc.body as Phaser.Physics.Arcade.Body).moves = false; this.npc.anims.play("monk-idle", true);
    this.promptText = this.add.text(0, 0, "Press E / X to speak", { fontFamily: "Segoe UI", fontSize: "16px", color: "#f5f0e3", backgroundColor: "#0f1a1fcc", padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  private createEnemies() {
    this.scout = this.physics.add.sprite(this.scoutSpawn.x, this.scoutSpawn.y, "pawn-idle-red", 0); this.scout.setScale(ESCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154); this.scout.anims.play("pawn-idle-red", true);
    this.archer = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y, "archer-idle-red", 0); this.archer.setScale(ESCALE).setCollideWorldBounds(true).setSize(38, 28).setOffset(77, 154); this.archer.anims.play("archer-idle-red", true); this.archer.disableBody(true, true);
    this.arrows = this.physics.add.group({ allowGravity: false, immovable: true });
  }

  private createRewards() {
    this.gold = this.physics.add.sprite(this.scoutSpawn.x + 18, this.scoutSpawn.y + 48, "gold-resource"); (this.gold.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); this.gold.setScale(0.36); this.gold.disableBody(true, true);
    this.sigil = this.physics.add.sprite(this.archerSpawn.x, this.archerSpawn.y + 44, "arrow-sigil"); (this.sigil.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); this.sigil.setScale(1.3); this.sigil.disableBody(true, true);
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
    const p = readGameProgress(window.localStorage.getItem(GAME_PROGRESS_STORAGE_KEY));
    this.playerHealth = p.playerHealth; this.questStage = p.questStage; this.inventoryGold = p.inventory.goldToken; this.inventorySigil = p.inventory.arrowSigil; this.goldCollected = this.inventoryGold > 0; this.sigilCollected = this.inventorySigil > 0;
    if (this.isScoutResolved(p.questStage)) { this.scoutAlive = false; this.scoutHealth = 0; this.scout.disableBody(true, true); }
    if (p.questStage === "scout_defeated") this.spawnReward(this.gold, this.scoutSpawn.x + 18, this.scoutSpawn.y + 36, 0.36);
    if (["second_route_active","archer_defeated","route_relic_collected","second_route_completed"].includes(p.questStage)) this.activateArcher();
    if (["archer_defeated","route_relic_collected","second_route_completed"].includes(p.questStage)) { this.archerAlive = false; this.archerHealth = 0; this.archer.disableBody(true, true); }
    if (p.questStage === "archer_defeated") this.spawnReward(this.sigil, this.archerSpawn.x, this.archerSpawn.y + 30, 1.3);
    if (["reward_collected","completed","second_route_available","second_route_active","archer_defeated","route_relic_collected","second_route_completed"].includes(p.questStage)) this.gold.disableBody(true, true);
    if (["route_relic_collected","second_route_completed"].includes(p.questStage)) this.sigil.disableBody(true, true);
    this.hintText.setText(this.getHintForStage());
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S, left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D, sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT, attack: Phaser.Input.Keyboard.KeyCodes.SPACE, interact: Phaser.Input.Keyboard.KeyCodes.E }) as OverworldScene["keys"];
    this.input.gamepad?.on("connected", (pad: Phaser.Input.Gamepad.Gamepad) => { this.controllerConnected = true; this.showControllerMessage(`Controller connected: ${pad.id}`); });
    window.addEventListener("gamepadconnected", this.handleBrowserGamepadConnected); window.addEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { window.removeEventListener("gamepadconnected", this.handleBrowserGamepadConnected); window.removeEventListener("gamepaddisconnected", this.handleBrowserGamepadDisconnected); });
  }

  private createAnimations() {
    [["warrior-idle","warrior-idle",0,7,10,-1],["warrior-run","warrior-run",0,5,12,-1],["warrior-attack","warrior-attack",0,3,14,0],["monk-idle","monk-idle",0,5,7,-1],["pawn-idle-red","pawn-idle-red",0,7,9,-1],["pawn-run-red","pawn-run-red",0,5,11,-1],["archer-idle-red","archer-idle-red",0,7,9,-1],["archer-run-red","archer-run-red",0,5,11,-1]].forEach(([k,t,s,e,f,r])=>{ if (!this.anims.exists(k as string)) this.anims.create({ key:k as string, frames:this.anims.generateFrameNumbers(t as string,{start:s as number,end:e as number}), frameRate:f as number, repeat:r as number }); });
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

  private readInput(): InputState {
    const kx = Number(this.cursors.right.isDown || this.keys.right.isDown) - Number(this.cursors.left.isDown || this.keys.left.isDown);
    const ky = Number(this.cursors.down.isDown || this.keys.down.isDown) - Number(this.cursors.up.isDown || this.keys.up.isDown);
    let gx = 0, gy = 0, gs = false, ga = false, gi = false; const pad = this.getActiveGamepad();
    if (pad) {
      const lx = this.readAxisValue(pad, 0), ly = this.readAxisValue(pad, 1), dx = Number(this.isPadPressed(pad, 15)) - Number(this.isPadPressed(pad, 14)), dy = Number(this.isPadPressed(pad, 13)) - Number(this.isPadPressed(pad, 12));
      const ap = this.isPadPressed(pad, 1), ip = this.isPadPressed(pad, 2); gx = Math.abs(lx) > DEADZONE ? lx : dx; gy = Math.abs(ly) > DEADZONE ? ly : dy; gs = this.isPadPressed(pad, 0); ga = ap && !this.lastPadAttack; gi = ip && !this.lastPadInteract; this.lastPadAttack = ap; this.lastPadInteract = ip; this.controllerConnected = true;
    } else { this.lastPadAttack = false; this.lastPadInteract = false; this.controllerConnected = false; }
    return { x: Phaser.Math.Clamp(kx + gx, -1, 1), y: Phaser.Math.Clamp(ky + gy, -1, 1), sprint: this.keys.sprint.isDown || gs, attack: Phaser.Input.Keyboard.JustDown(this.keys.attack) || ga, interact: Phaser.Input.Keyboard.JustDown(this.keys.interact) || gi };
  }

  private getActiveGamepad() {
    const phaserPad = this.input.gamepad?.getPad(0); if (phaserPad) return phaserPad;
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    return navigator.getGamepads().find((pad): pad is Gamepad => pad !== null && pad.connected) ?? null;
  }
  private readAxisValue(pad: Phaser.Input.Gamepad.Gamepad | Gamepad, i: number) { if ("axes" in pad && pad.axes.length > i) { const axis = pad.axes[i]; return typeof axis === "number" ? axis : axis.getValue(); } return 0; }
  private isPadPressed(pad: Phaser.Input.Gamepad.Gamepad | Gamepad, i: number) { if ("buttons" in pad && pad.buttons.length > i) return pad.buttons[i]?.pressed ?? false; const map: Record<number, boolean | undefined> = { 0: "A" in pad ? pad.A : undefined, 1: "B" in pad ? pad.B : undefined, 2: "X" in pad ? pad.X : undefined, 12: "up" in pad ? pad.up : undefined, 13: "down" in pad ? pad.down : undefined, 14: "left" in pad ? pad.left : undefined, 15: "right" in pad ? pad.right : undefined }; return map[i] ?? false; }

  private triggerAttack(time: number) {
    this.lastAttackAt = time; this.isAttacking = true; this.hitThisSwing = false; this.player.setVelocity(0, 0); this.player.anims.play("warrior-attack", true); this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { this.isAttacking = false; });
    this.time.delayedCall(90, () => { this.attackActive = true; (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = true; });
    this.time.delayedCall(210, () => { this.attackActive = false; (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false; });
    this.tweens.add({ targets: this.aura, alpha: { from: 0.55, to: 0 }, scale: { from: 1, to: 2.1 }, duration: 280, ease: "Quad.Out" });
  }

  private updateScout() {
    if (!this.scoutAlive) { this.scout.setVelocity(0, 0); return; }
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.scout.x, this.scout.y); const leash = Phaser.Math.Distance.Between(this.scout.x, this.scout.y, this.scoutSpawn.x, this.scoutSpawn.y); const body = this.scout.body as Phaser.Physics.Arcade.Body;
    if (dist < AGGRO || leash > LEASH) { const target = leash > LEASH ? this.scoutSpawn : new Phaser.Math.Vector2(this.player.x, this.player.y); this.physics.moveTo(this.scout, target.x, target.y, ENEMY_SPEED); this.scout.setFlipX(body.velocity.x < 0); this.scout.anims.play("pawn-run-red", true); }
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

  private updateUi(nearNpc: boolean) {
    this.promptText.setVisible(nearNpc && !this.dialogueOpen); this.promptText.setPosition(this.npc.x, this.npc.y - 74);
    const scout = this.scoutAlive ? `Scout ${this.scoutHealth}/${SCOUT_MAX}` : "Scout clear"; const archerRoute = ["second_route_available","second_route_active","archer_defeated","route_relic_collected","second_route_completed"].includes(this.questStage); const archer = archerRoute ? (this.archerAlive ? `Archer ${this.archerHealth}/${ARCHER_MAX}` : "Archer clear") : "Archer locked"; this.routeText.setText(`Routes: ${scout} | ${archer}`);
  }

  private damageScout() {
    if (!this.scoutAlive) return;
    this.scoutHealth -= 1; this.scout.setVelocity(this.facing === "left" ? -220 : 220, -40); this.cameras.main.shake(120, 0.003);
    if (this.scoutHealth <= 0) { this.scoutAlive = false; this.scout.disableBody(true, true); this.questStage = "scout_defeated"; this.spawnReward(this.gold, this.scoutSpawn.x + 18, this.scoutSpawn.y + 36, 0.36); this.syncProgress(); this.hintText.setText("Scout defeated. Pick up the gold token and return to Alden."); }
    else this.hintText.setText(`Solid hit. Scout is reeling (${this.scoutHealth} left).`);
  }

  private damageArcher() {
    if (!this.archerAlive) return;
    this.archerHealth -= 1; this.archer.setVelocity(this.facing === "left" ? -220 : 220, -40); this.cameras.main.shake(140, 0.004);
    if (this.archerHealth <= 0) { this.archerAlive = false; this.archer.disableBody(true, true); this.clearArrows(); this.questStage = "archer_defeated"; this.spawnReward(this.sigil, this.archerSpawn.x, this.archerSpawn.y + 30, 1.3); this.syncProgress(); this.hintText.setText("Archer defeated. Recover the arrow sigil."); }
    else this.hintText.setText(`The archer staggered (${this.archerHealth} left).`);
  }

  private damagePlayer() {
    if (this.time.now < this.invulnerableUntil) return;
    this.invulnerableUntil = this.time.now + 900; this.playerHealth = Math.max(0, this.playerHealth - 10); this.syncProgress(); this.cameras.main.shake(140, 0.004);
    this.tweens.add({ targets: this.player, alpha: { from: 0.45, to: 1 }, duration: 120, yoyo: true, repeat: 3 }); this.hintText.setText(`Warrior hit. Health ${this.playerHealth} / ${PLAYER_MAX}.`);
  }

  private spawnReward(sprite: Phaser.Physics.Arcade.Sprite, x: number, y: number, scale: number) {
    sprite.enableBody(true, x, y, true, true); sprite.setScale(scale).setVelocity(0, 0); this.tweens.killTweensOf(sprite); this.tweens.add({ targets: sprite, y: sprite.y - 8, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }
  private collectGold() { if (this.goldCollected || !this.gold.active) return; this.goldCollected = true; this.inventoryGold = 1; this.questStage = "reward_collected"; this.gold.disableBody(true, true); this.syncProgress(); this.hintText.setText("Recovered the gold token. Return to Alden."); }
  private collectSigil() { if (this.sigilCollected || !this.sigil.active) return; this.sigilCollected = true; this.inventorySigil = 1; this.questStage = "route_relic_collected"; this.sigil.disableBody(true, true); this.syncProgress(); this.hintText.setText("Arrow sigil secured. Return to Alden."); }

  private openDialogue() {
    if (this.questStage === "available") { this.questStage = "accepted"; this.syncProgress(); }
    else if (this.questStage === "completed") { this.questStage = "second_route_available"; this.syncProgress(); }
    else if (this.questStage === "second_route_available") { this.questStage = "second_route_active"; this.activateArcher(); this.syncProgress(); }
    const d = DIALOGUE[this.questStage]; this.dialogueIndex = 0; this.panelLabel.setText(d.label); this.panelText.setText(d.lines[0]); this.dialogueOpen = true; this.panel.setVisible(true); this.hintText.setText("Dialogue active. Press E / X to continue.");
  }

  private advanceDialogue() {
    const d = DIALOGUE[this.questStage]; this.dialogueIndex += 1;
    if (this.dialogueIndex >= d.lines.length) {
      this.dialogueOpen = false; this.panel.setVisible(false);
      if (this.questStage === "reward_collected") { this.questStage = "completed"; this.syncProgress(); }
      else if (this.questStage === "route_relic_collected") { this.questStage = "second_route_completed"; this.syncProgress(); }
      this.hintText.setText(this.getHintForStage()); return;
    }
    this.panelText.setText(d.lines[this.dialogueIndex]);
  }

  private activateArcher() {
    if (this.archer.active || !this.archerAlive) return;
    this.archerAlive = true; this.archerHealth = ARCHER_MAX; this.archer.enableBody(true, this.archerSpawn.x, this.archerSpawn.y, true, true); this.archer.anims.play("archer-idle-red", true);
  }

  private clearArrows() { this.arrows.getChildren().forEach((arrow) => (arrow as Phaser.Physics.Arcade.Sprite).destroy()); }
  private getHintForStage() {
    switch (this.questStage) {
      case "available":
      case "accepted": return "Brother Alden wants the pond road scout removed.";
      case "scout_defeated": return "Scout defeated. Pick up the gold token.";
      case "reward_collected": return "Gold recovered. Return to Alden for route clearance.";
      case "completed": return "First route secured. Speak to Alden again for the northern stones.";
      case "second_route_available": return "Alden can now open the northern stones route.";
      case "second_route_active": return "Second route live. Defeat the red archer in the north.";
      case "archer_defeated": return "Archer down. Recover the arrow sigil.";
      case "route_relic_collected": return "Sigil secured. Return to Alden to close the route.";
      case "second_route_completed": return "Two routes secured. Moonvale is ready for a larger grove.";
      default: return "Moonvale route ledger active.";
    }
  }

  private isScoutResolved(stage: QuestStage) { return ["scout_defeated","reward_collected","completed","second_route_available","second_route_active","archer_defeated","route_relic_collected","second_route_completed"].includes(stage); }
  private readonly handleBrowserGamepadConnected = (event: GamepadEvent) => { this.controllerConnected = true; this.showControllerMessage(`Controller connected: ${event.gamepad.id}`); };
  private readonly handleBrowserGamepadDisconnected = () => { this.controllerConnected = false; this.hintText.setText("Controller disconnected. Keyboard is still active."); };
  private showControllerMessage(message: string) { this.hintText.setText(message); this.time.delayedCall(2400, () => this.hintText.setText(this.controllerConnected ? this.getHintForStage() : "Brother Alden guards the route ledger. Speak with him to begin.")); }
  private syncProgress() { saveGameProgress({ playerHealth: this.playerHealth, stamina: defaultGameProgress.stamina, questStage: this.questStage, inventory: { goldToken: this.inventoryGold, arrowSigil: this.inventorySigil } }); }
}
