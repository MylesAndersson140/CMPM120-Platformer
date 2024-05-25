class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 20;
        this.SCALE = 2.0;
    }

    create() {
        this.hasKey = false;
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);
        this.jumpSound = this.sound.add('jumpSound');
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tilesetIndus = this.map.addTilesetImage("platformerPack_industrial_tilesheet", "tilemap_tiles_indus");
        this.tilesetSnow = this.map.addTilesetImage("snow_tile_sheet", "tilemap_tiles_snow");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tileset, this.tilesetIndus, this.tilesetSnow], 0, 0);
        //this.breakableLayer = this.map.createLayer("Breakable", [this.tileset], 0, 0);
        //this.breakableLayer.setCollisionByProperty({ collides: true });
        //this.breakableTiles = this.breakableLayer.filterTiles(tile => tile.index === 28);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.keys = this.map.createFromObjects("Key", {
            name: "Key",
            key: "tilemap_sheet",
            frame: 27
        });

        this.flag = this.map.createFromObjects("Finish", {
            name: "Finish",
            key: "tilemap_sheet",
            frame: 111
        });

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.keyGroup = this.add.group(this.keys);
        this.flagGroup = this.add.group(this.flag);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.showStartScreen();
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });
        this.physics.add.overlap(my.sprite.player, this.keyGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.hasKey = true;
        });
        
        this.physics.add.overlap(my.sprite.player, this.flagGroup, (obj1, obj2) => {
            obj2.destroy(); // remove flag on overlap
            this.showEndScreen();
        });


        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_03.png', 'spark_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.05},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
    }

    showStartScreen() {
        const textX = my.sprite.player.x;
        const textY = my.sprite.player.y - 300;
    
        this.titleText = this.add.text(textX, textY, "Welcome to Nifty Ice Jumps!", {
            fontSize: '32px',
            fill: '#ffffff',
            align: 'center',
            origin: { x: 0.5, y: 0.5 }
        });
    
        this.startText = this.add.text(textX, textY + 40, "Press any key to begin!", {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center',
            origin: { x: 0.5, y: 0.5 }
        });
    
        this.input.keyboard.once('keydown', () => {
            this.titleText.destroy();
            this.startText.destroy();
        });
    }

    showEndScreen() {
        this.physics.pause();
        my.sprite.player.setTint(0xff0000);
        my.sprite.player.anims.play('idle');
    
        const textX = my.sprite.player.x - 50;
        const textY = my.sprite.player.y - 100;

        this.endText = this.add.text(textX, textY, "You have won!", {
            fontSize: '16px',
            fill: '#0000ff',
            align: 'center',
            origin: { x: 0.5, y: 0.5 }
        });

        this.restartText = this.add.text(textX - 55, textY + 40, "Press any key to restart", {
            fontSize: '16px',
            fill: '#0000ff',
            align: 'center',
            origin: { x: 0.5, y: 0.5 }
        });
    
        this.input.keyboard.on('keydown', () => {
            this.endText.destroy();
            this.restartText.destroy();
            this.scene.restart();
        });
    }

    handleGroundCollision(player, tile) {
        if (tile.properties && tile.properties.restart) {
            // Place the player back at the beginning
            player.setPosition(30, 345); // Adjust the coordinates as needed
        }
    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSound.play();
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}