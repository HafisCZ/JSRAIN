Array.prototype.removeIf = function(callback) {
	var iter = this.length;
	while (iter--) {
		if (callback(this[iter], iter)) this.splice(iter, 1);
	}
};

class Loader {
	constructor() {
		this.data = {};
	}
	
	load(src) {
		console.log('loader.load()');
		
		this.data[src] = new Image();
		this.data[src].src = src;
	}
	
	get(src) {
		if (this.data[src] === undefined) {
			this.load(src);
		}
		
		return this.data[src];
	}
}

var loader = new Loader();

class Sprite {
	constructor(src, rows, cols) {
		this.img = loader.get(src);
		
		this.rows = rows;
		this.cols = cols;
		this.size = [this.img.width / cols, this.img.height / rows];
		
		this.tile = [0, 0];
		this.scale = [1, 1];
		this.span = [1, 1];
	}
	
	draw(gc, x, y) {
		/*
			TODO FIX STUTTER ?
		*/
		if (this.span[0] > 0 && this.span[1] > 0) {
            var sx = this.tile[1] * this.size[0];
            var sy = this.tile[0] * this.size[1];
            var sw = this.span[1] * this.size[0];
            var sh = this.span[0] * this.size[1];

			if (sw >= 1 && sh >= 1) {
				if (this.scale[0] < 0 || this.scale[1] < 0) {
					gc.save();
					
					gc.translate(x + this.size[0] / 2, y + this.size[1] / 2);
					gc.scale(this.scale[0], this.scale[1]);
					gc.rotate(2 * Math.PI);
					
					gc.drawImage(this.img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
					gc.restore();
				} else {
					gc.drawImage(this.img, sx, sy, sw, sh, x, y, sw, sh);
				}
			}
        }
	}
	
	setScale(x, y) {
		this.scale = [x, y];
	}
	
	setTile(r, c) {
		if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
			this.tile = [r, c];
		}
	}
	
	setSpan(r, c) {
		this.span = [r, c];
	}
}

class AnimatedSprite extends Sprite {
	constructor(src, rows, cols, delay, tiles) {
		super(src, rows, cols);
		this.delay = delay;
		this.tiles = tiles;
		
		this.selector = 0;
		this.time = 0;
		
		this.playing = false;
	}
	
	play() {
		if (!this.playing) {
			this.playing = true;
			this.selector = 0;
			this.time = 0;
			
			this.setTile(this.tiles[this.selector][0], this.tiles[this.selector][1]);
		}
	}
	
	stop() {
		if (this.playing) {
			this.playing = false;
			
			this.setTile(this.tiles[0][0], this.tiles[0][1]);
		}
	}
	
	tick() {
		if (this.playing) {
			if (++this.time >= this.delay) {
				if (++this.selector >= this.tiles.length) {
					this.selector = 1;
				}
				
				this.time = 0;
				this.setTile(this.tiles[this.selector][0], this.tiles[this.selector][1]);
			}
		}
	}
}

class Entity {
	constructor(x, y, w, h, level) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		
		this.dx = 0;
		this.dy = 0;
		
		this.level = level;
		
		this.alive = true;
	}
	
	getCenterX() {
		return this.x + this.w / 2;
	}
	
	getCenterY() {
		return this.y + this.h / 2;
	}
	
	distanceTo(x, y) {
		return Math.sqrt(Math.pow(x - this.getCenterX(), 2) + Math.pow(y - this.getCenterY(), 2));
	}
	
	aabb(entity) {
        return entity.x + entity.w > this.x && this.x + this.w > entity.x && entity.y + entity.h > this.y && this.y + this.h > entity.y;
	}
	
	tick() {
	
	}
}

class SpriteEntity extends Entity {
	constructor(x, y, w, h, level, sprite, offx, offy) {
		super(x, y, w, h, level);
		
		this.sprite = sprite;
		this.offx = offx;
		this.offy = offy;
	}
	
	draw(gc) {
		this.sprite.draw(gc, this.x + this.offx, this.y + this.offy);
	}
}

class KeyEventAdapter {
	constructor() {
		this.ckey = {};
		this.pkey = {};
		this.click = undefined;
	}
	
	mouse(x, y, down) {
		if (down) {
			this.click = [x, y];
		} else {
			this.click = undefined;
		}
	}
	
	clickIn(x, y, w, h) {
		if (this.click) {
			return x <= this.click[0] && x + w >= this.click[0] && y <= this.click[1] && y + h >= this.click[1];
		} else {
			return false;
		}
	}

	set(key, down) {
		this.ckey[key] = down;
	}
	
	isHeld(key) {
		return (this.ckey[key] === undefined ? false : this.ckey[key]);
	}
	
	wasHeld(key) {
		return (this.pkey[key] === undefined ? false : this.pkey[key]);
	}
	
	isPressed(key) {
		return this.isHeld(key) && !this.wasHeld(key);
	}
	
	tick() {
		for (var key in this.ckey) this.pkey[key] = this.ckey[key];
	}
}

class Mob extends SpriteEntity {
	constructor(x, y, w, h, level, sprite, offx, offy) {
		super(x, y, w, h, level, sprite, offx, offy);
	}
}

class Item extends SpriteEntity {
	constructor(x, y, w, h, level, dx, dy, sprite, offx, offy) {
		super(x, y, w, h, level, sprite, offx, offy);
		
		this.dx = dx;
		this.dy = dy;
	}
	
	tick() {
		this.x += this.dx;
		this.y += this.dy;
		
		if (this.y + this.h > 700 /40 * 33) this.alive = false;
		if (this.level.aabbPlayer(this)) {
			this.effect();
			this.alive = false;
		}
	}
	
	effect() {
	
	}
}

class Spawner extends Entity {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level);
		
		this.rate = rate;
		this.mult = mult;
		this.rand = rand;
		this.limit = rand;
		
		this.count = 0;
	}
	
	spawn() {
	
	}
	
	tick() {
		if (this.count++ >= this.limit) {
			this.count = 0;
			this.limit = this.rate + (this.rand  > 1 ? Math.floor(Math.random() * this.rand) : 0);
			
			for (var i = 0; i < this.mult; i++) this.spawn();
		}
	}
	
	getRandomX() {
		return this.x + (this.w === 0 ? 0 : Math.random() * this.w);
	}
	
	getRandomY() {
		return this.y + (this.h === 0 ? 0 : Math.random() * this.h);
	}
}

class Particle extends Entity {
	constructor(x, y, w, h, level) {
		super(x, y, w, h, level);
	}
}

class Player extends Mob {
	constructor(x, y, level) {
		super(x, y, 47, 65, level, new AnimatedSprite('res/entity/player.png', 2, 4, 8, [[0,0],[1,0],[1,1],[1,2],[1,3]]), -4, -1);
		
		this.speed = this.level.properties.upgrades.pass_movement ? 0.7 : 0.5;
	}
	
	tick() {
		var kb = this.level.kb;
		
		if (kb.isHeld('d') && !kb.isHeld('a')) this.dx = Math.min(this.dx + this.speed, 10);
		if (kb.isHeld('a') && !kb.isHeld('d')) this.dx = Math.max(this.dx - this.speed, -10);
		if (!kb.isHeld('a') && !kb.isHeld('d')) {
			if (this.dx > 0) {
				this.dx = Math.max(this.dx - this.speed, 0);
			} else if (this.dx < 0) {
				this.dx = Math.min(this.dx + this.speed, 0);
			}
		}
		
		if (kb.isHeld('w') && !this.jump) {
			this.jump = true;
			this.dy = -10;
			
			this.level.properties.stats.jumps++;
		}
		
		if (kb.isPressed('f')) {
			this.level.properties.activate(this);
		}
		
		this.x += this.dx;
		this.y += this.dy;
		if (this.jump) this.dy += 0.5;
		
		if (this.x < 0) {
			this.x = 0;
			this.dx = 0;
		} else if (this.x + this.w > 1000) {
			this.x = 1000 - this.w;
			this.dx = 0;
		}
		
		if (this.y < 0) {
			this.y = 0;
			this.dy = 0;
		} else if (this.y + this.h > 700 / 40 * 33) {
			this.y = 700 / 40 * 33 - this.h;
			this.dy = 0;
			
			this.jump = false;
		}
		
		if (this.dx != 0) {
			this.sprite.setScale((this.dx > 0 ? 1 : -1), 1);
			this.sprite.play();
		} else {
			this.sprite.stop();
		}
		this.sprite.tick();
	}
}

class Acid extends Mob {
	constructor(x, y, level, dx, dy) {
		super(x, y, 10, 10, level, new AnimatedSprite('res/entity/acid.png', 1, 4, 10, [[0,0],[0,1],[0,2],[0,3],[0,0]]), -1, -14);

		this.dx = dx;
		this.dy = dy;
		
		this.sprite.play();
	}

	tick() {
		this.x += this.dx;
		this.y += this.dy;

		if (this.y + this.h >= 700 / 40 * 33) {
			this.y = 700 / 40 * 33 - this.h;
			
			this.alive = false;
			this.spawnParticles(0);
		}
		
		if (this.level.aabbPlayer(this)) {
			this.level.properties.addDamage();
			
			this.y -= this.h;
			if (this.level.properties.player.health > 0) {
				this.spawnParticles(-1);
			}
			
			this.alive = false;
		}
		
		this.sprite.tick();
	}
	
	spawnParticles(dy) {
		for (var i = 0; i < 5; i++) {
			var size = Math.floor(Math.random() * 6) + 1;
			var dx = Math.random() * 5 - 2.5;
			
			this.level.add(new AcidParticle(this.x, this.y + this.h - size, size, size, this.level, dx, dy));
		}
	}
}

class Energy extends Item {
	constructor(x, y, level) {
		super(x, y, 7, 7, level, 0, 4, new Sprite('res/entity/energy.png', 1, 1), -4, -4);
	}
	
	effect() {
		this.level.properties.stats.collected_nodes++;
		this.level.properties.addEnergy(1);
	}
}

class Armor extends Item {
	constructor(x, y, level) {
		super(x, y, 20, 30, level, 0, 4, new Sprite('res/entity/armor.png', 1, 1), 0, 0);
	}
	
	effect() {
		this.level.properties.stats.collected_armor++;
		this.level.properties.addArmor(1);
	}
}

class Star extends Item {
	constructor(x, y, level) {
		super(x, y, 7, 7, level, 0, 6, new Sprite('res/entity/star.png', 1, 1), -4, -4);
	}
	
	effect() {
		this.level.properties.stats.collected_stars++;
		switch (Math.floor(Math.random() * 4)) {
			case 0: {
				this.level.properties.addEnergy(5);
				break;
			}
			case 1: {
				this.level.properties.addArmor(2);
				break;
			}
			case 2: {
				this.level.properties.addExp(10 * 60);
				break;
			}
		}
	}
}

class AcidParticle extends Particle {
	constructor(x, y, w, h, level, dx, dy) {
		super(x, y, w, h, level);
		
		this.dx = dx;
		this.dy = dy;
		
		this.color = Math.floor(Math.random() * 2) === 0 ? '#adff2f' : '#7cfc00';
		
		this.despawn = false;
		this.despawnTicks = 10 + Math.floor(Math.random() * 21);
	}
	
	draw(gc) {
		gc.fillStyle = this.color;
		gc.fillRect(this.x, this.y, this.w, this.h);
	}
	
	tick() {
		this.x += this.dx;
		this.y += this.dy;
		
        if (this.dx > 0) {
            this.dx = Math.max(0, this.dx - 0.2);
        } else if (this.dx < 0) {
            this.dx = Math.min(0, this.dx + 0.2);
        }

        if (this.x < 0) {
            this.x = 0;
            this.dx *= -1;
        } else if (this.x + this.w > 1000) {
            this.x = 1000 - this.w;
            this.dx *= -1;
        }

        if (this.y + this.h > 700 / 40 * 33) {
            this.y = 700 / 40 * 33 - this.h;
            this.despawn = true;
            this.dy = 0;
        } else {
            this.dy += 0.5;
        }

        if (this.despawn) {
            this.despawnTicks--;

            if (this.despawnTicks <= 0) this.alive = false;
        }
	}
}

class RainParticle extends Particle {
	constructor(x, y, w, h, level, dx, dy) {
		super(x, y, w, h, level);
		
		this.dx = dx;
		this.dy = dy;
		
		this.color = Math.random(2) === 0 ? '#6495ed' : '#c1d8e6';
	}
	
	draw(gc) {
		gc.globalAlpha = 0.1;
		gc.fillStyle = this.color;
		gc.fillRect(this.x, this.y, this.w, this.h);
		gc.globalAlpha = 1.0;
	}
	
	tick() {
		this.x += this.dx;
		this.y += this.dy;
		
		if ((this.level.mobs.length > 0 && this.level.aabbPlayer(this)) || this.y > 700 / 40 * 33 - this.h) this.alive = false;
	}
}

class ShockParticle extends Particle {
	constructor(x, y, level) {
		super(x, y, 0, 0, level);
		
		this.radius = 0;
	}
	
	draw(gc) {
		gc.strokeStyle = '#f0f8ff';
		gc.beginPath();
		gc.arc(this.x, this.y, this.radius, Math.PI, 2 * Math.PI);
		gc.stroke();
	}
	
	tick() {
		this.radius += 8;
		if (this.radius > 1000) this.alive = false;
		
		for (var i = 0; i < this.level.mobs.length; i++) {
			if (this.level.mobs[i] instanceof Acid) {
				if (this.level.mobs[i].distanceTo(this.x, this.y) <= this.radius) {
					this.level.mobs[i].alive = false;
				}
			}
		}
	}
}

class ArmorSpawner extends Spawner {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level, rate, rand, mult);
	}
	
	spawn() {
		this.level.add(new Armor(this.getRandomX(), this.getRandomY(), this.level));
	}
}

class AcidSpawner extends Spawner {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level, rate, rand, mult);
	}
	
	spawn() {
		this.level.add(new Acid(this.getRandomX(), this.getRandomY(), this.level, 0, 10));
	}
}

class EnergySpawner extends Spawner {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level, rate, rand, mult);
	}
	
	spawn() {
		this.level.add(new Energy(this.getRandomX(), this.getRandomY(), this.level));
	}
}

class StarSpawner extends Spawner {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level, rate, rand, mult);
	}
	
	spawn() {
		this.level.add(new Star(this.getRandomX(), this.getRandomY(), this.level));
	}
}

class RainSpawner extends Spawner {
	constructor(x, y, w, h, level, rate, rand, mult) {
		super(x, y, w, h, level, rate, rand, mult);
	}
	
	spawn() {
		this.level.add(new RainParticle(this.getRandomX(), this.getRandomY(), 1, 10 + Math.random() * 31, this.level, 0, 10, + Math.random() * 31));
	}
}

class Skill {
	constructor(burnout, mult) {
		this.burnout = burnout;
		this.mult = mult;
	}
	
	effect() {
		
	}
}

class ShockwaveSkill extends Skill {
	constructor() {
		super(2 * 60, 3);
	}
	
	effect(x, y, level) {
		level.add(new ShockParticle(x, 700 / 40 * 33, level));
	}
}

class ArmorSkill extends Skill {
	constructor() {
		super(6, 5);
	}
	
	effect(x, y, level) {
		level.properties.addArmor(1);
	}
}

class ExperienceSkill extends Skill {
	constructor() {
		super(30 * 60, 2);
	}
	
	effect(x, y, level) {
		level.properties.setExperienceBoost(2, 30 * 60);
	}
}

class Properties {
	constructor(level) {
		this.level = level;
		
		this.player;
		this.upgrades;
		this.stats;
		
		this.skills = [
			{
				burnout: 0,
				mult: 0
			},
			new ShockwaveSkill(),
			new ArmorSkill(),
			new ExperienceSkill()
		];
	}
	
	resetPlayer() {
		this.player = {
			health: this.upgrades.maxhealth,
			armor: 0,
			energy: 0,
			experience: 0,
			active_skill: false,
			active_boost: false,
			skill_burnout: 0,
			boost_burnout: 0,
			expmult: 1
		};
	}
	
	load() {	
		this.upgrades = localStorage.getItem('prop_upgrade') ? JSON.parse(localStorage.getItem('prop_upgrade')) : {
			maxhealth: 3,
			level: 1,
			points: 0,
			selected_skill: 0,
			pass_movement: false,
			pass_powerrate: false,
			skill_shockwave: false,
			skill_doublexp: false,
			skill_spawnarmor: false
		};
		
		this.stats = localStorage.getItem('prop_statistics') ? JSON.parse(localStorage.getItem('prop_statistics')) : {
			jumps: 0,
			experience_gained: 0,
			damage_taken: 0,
			collected_nodes: 0,
			collected_stars: 0,
			collected_armor: 0,
			activations: 0
		};
		
		this.resetPlayer();
	}
	
	addDamage() {
		this.stats.damage_taken++;
		
		if (this.player.armor > 0) {
			this.player.armor--;
		} else if (this.player.health > 0) {
			this.player.health--;
			if (this.player.health === 0) {
				this.level.setState('gameover');
			}
		}
	}
	
	addEnergy(amount) {
		if (this.upgrades.selected_skill > 0) {
			if (this.player.energy < 100) {
				this.player.energy += amount * this.skills[this.upgrades.selected_skill].mult * (this.upgrades.pass_powerrate ? 2 : 1);
			}
		}
	}
	
	addExp(amount) {	
		this.stats.experience_gained += amount;
		this.player.experience += amount * this.player.expmult * 100 / (40 * 60 * Math.pow(1.18, this.upgrades.level - 1));
		
		if (this.player.experience >= 100) {
			this.player.experience = 0;
			
			this.upgrades.level++;
			this.upgrades.points++;
		}
	}
	
	addArmor(amount) {
		if (this.player.health > this.player.armor) {
			this.player.armor += Math.min(this.player.health - this.player.armor, amount);
		}
	}		
	
	activate(entity) {
		if (this.upgrades.selected_skill > 0) {
			if (this.player.energy >= 100) {
				this.player.energy = 100;
				
				this.player.active_skill = true;
				this.player.skill_burnout = this.skills[this.upgrades.selected_skill].burnout;
				this.skills[this.upgrades.selected_skill].effect(entity.getCenterX(), entity.getCenterY(), this.level);
				
				this.stats.activations++;
			}
		}
	}
	
	setExperienceBoost(mult, duration) {
		this.player.expmult = mult;
		this.player.boost_burnout = duration;
		this.player.active_boost = true;
	}
	
	save() {
		localStorage.setItem('prop_upgrade', JSON.stringify(this.upgrades));
		localStorage.setItem('prop_statistics', JSON.stringify(this.stats));
	}
	
	tick() {
		this.addExp(1);
		
		if (this.player.active_boost) {
			if (--this.player.boost_burnout < 0) {
				this.player.expmult = 1;
				this.player.active_boost = false;
			}
		}
		
		if (this.player.active_skill) {
			this.player.energy = 100 * this.player.skill_burnout / this.skills[this.upgrades.selected_skill].burnout;
			if (--this.player.skill_burnout < 0) {
				this.player.energy = 0;
				this.player.active_skill = false;
			}
		}
	}
}

class Overlay {
	constructor(x, y, properties) {
		this.x = x;
		this.y = y;
		this.properties = properties;
		
		this.hltBar = new Sprite('res/gui/bars/health.png', 1, 10);
		this.armBar = new Sprite('res/gui/bars/armor.png', 1, 10);
		this.expBar = new Sprite('res/gui/bars/experience.png', 2, 100);
		this.pwrBar = new Sprite('res/gui/bars/energy.png', 2, 100);
		
		this.ablIco = new Sprite('res/gui/icons/ability.png', 1, 4);
		this.hltIco = new Sprite('res/gui/icons/health.png', 1, 1);
		this.expIco = new Sprite('res/gui/icons/experience.png', 1, 1);
		this.pwrIco = new Sprite('res/gui/icons/energy.png', 1, 1);
		
		this.sqFrame = new Sprite('res/gui/icons/frame.png', 1, 1);
		this.rcFrame = new Sprite('res/gui/bars/frame.png', 1, 1);
	}
	
	resetOverlay() {
		this.hltBar.setSpan(1, this.properties.player.health);
		this.armBar.setSpan(1, 0);
		this.expBar.setSpan(1, 0);
		this.pwrBar.setSpan(1, 0);
		
		if (this.properties.upgrades.selected_skill > 0) {
			this.ablIco.setTile(0, this.properties.upgrades.selected_skill - 1);
		}
	}
	
	tick() {
		this.hltBar.setSpan(1, this.properties.player.health);
		this.armBar.setSpan(1, this.properties.player.armor);
		this.expBar.setSpan(1, this.properties.player.experience);
		this.pwrBar.setSpan(1, this.properties.player.energy);
		
		if (this.properties.player.active_skill || this.properties.player.energy >= 100) {
			this.pwrBar.setTile(1, 0);
		} else {
			this.pwrBar.setTile(0, 0);
		}
		
		if (this.properties.player.boost_burnout > 0) {
			this.expBar.setTile(1, 0);
		} else {
			this.expBar.setTile(0, 0);
		}
	}
	
	draw(gc) {
		this.drawStatic(gc);
		
		this.hltBar.draw(gc, this.x + 20, this.y + 10);
		this.armBar.draw(gc, this.x + 20, this.y + 10);
		this.expBar.draw(gc, this.x + 20, this.y + 30);
		this.pwrBar.draw(gc, this.x + 20, this.y + 50);
		
		gc.fillStyle = '#f7df1e';
		gc.fillText('' + this.properties.upgrades.level, this.x + 230, this.y + 42);
	}
	
	drawStatic(gc) {
		this.hltIco.draw(gc, this.x + 2, this.y + 10);
		this.expIco.draw(gc, this.x + 2, this.y + 30);
		
		this.rcFrame.draw(gc, this.x + 20, this.y + 10);
		this.rcFrame.draw(gc, this.x + 20, this.y + 30);
		
		if (this.properties.upgrades.selected_skill > 0) {
			this.pwrIco.draw(gc, this.x + 2, this.y + 50);
			this.rcFrame.draw(gc, this.x + 20, this.y + 50);
			
			this.sqFrame.draw(gc, this.x + 20, this.y + 70);
			this.ablIco.draw(gc, this.x + 22, this.y + 72);
		}
	}
}

class Button {
	constructor(x, y, w, h, tx, call) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		
		this.tx = tx;
		this.call = call;
	}
	
	draw(gc) {
		gc.fillStyle = '#778899';
		gc.textAlign = 'center';
		gc.font = '20px Impact bold';
		gc.fillText(this.tx, this.x, this.y);
	}
	
	tick(kb) {
		if (kb.clickIn(this.x - this.w / 2, this.y - this.h / 2 - this.h / 4, this.w, this.h)) {
			this.call();
		}
	}
}

class Page {
	constructor(level) {
		this.level = level;
	}
	
	tick(kb) {
	
	}
	
	draw(gc) {
	
	}
}

class Menu extends Page {
	constructor(level) {
		super(level);
		
		this.but1 = new Button(500, 700 / 2 + 50, 100, 25, 'PLAY', function() {
			level.setState('game');
		});
		
		this.but2 = new Button(500, 700 / 2 + 80, 100, 25, 'UPGRADES', function() {
			level.setState('upgrades');
		});
		
		this.but3 = new Button(500, 700 / 2 + 110, 100, 25, 'STATISTICS', function() {
			level.setState('stats');
		});
		
		this.but4 = new Button(500, 700 / 2 + 140, 100, 25, 'HELP', function() {
			level.setState('help');
		});
		
	}
	
	tick(kb) {
		this.but1.tick(kb);
		this.but2.tick(kb);
		this.but3.tick(kb);
		this.but4.tick(kb);
	}
	
	draw(gc) {
		gc.fillStyle = '#704db7';
		gc.font = '70px bold';
		gc.textAlign = 'center';
		
		gc.fillText('RAIN', 500, 700 / 2);
		
		this.but1.draw(gc);
		this.but2.draw(gc);
		this.but3.draw(gc);
		this.but4.draw(gc);
	}
}

class Help extends Page {
	constructor(level) {
		super(level);
		
		this.but1 = new Button(50, 30, 100, 25, 'BACK', function() {
			level.setState('menu');
		});
	}
	
	tick(kb) {
		this.but1.tick(kb);
	}
	
	draw(gc) {
		this.but1.draw(gc);
				
		gc.fillStyle = '#778899';
		gc.font = '40px bold';
		gc.textAlign = 'center';
		
		gc.fillText('CONTROLS', 500, 700 / 3);
		
		gc.fillStyle = '#778899';
		gc.font = '20px bold';
		gc.fillText('A', 500 - 80, 700 / 3 + 50);
		gc.fillText('D', 500 - 80, 700 / 3 + 80);
		gc.fillText('W', 500 - 80, 700 / 3 + 110);
		gc.fillText('F', 500 - 80, 700 / 3 + 140);
		
		gc.fillText('Move left', 500 + 80, 700 / 3 + 50);
		gc.fillText('Move right', 500 + 80, 700 / 3 + 80);
		gc.fillText('Jump', 500 + 80, 700 / 3 + 110);
		gc.fillText('Activate skill', 500 + 80, 700 / 3 + 140);
	}
}

class Statistics extends Page {
	constructor(level) {
		super(level);
		
		this.but1 = new Button(50, 30, 100, 25, 'BACK', function() {
			level.setState('menu');
		});
	}
	
	tick(kb) {
		this.but1.tick(kb);
	}
	
	draw(gc) {
		this.but1.draw(gc);
				
		gc.fillStyle = '#778899';
		gc.font = '40px bold';
		gc.textAlign = 'center';
		
		gc.fillText('STATISTICS', 500, 700 / 4);
		
		gc.fillStyle = '#778899';
		gc.font = '20px bold';
		
		gc.fillText('Damage taken:', 500 - 80, 700 / 4 + 50);
		gc.fillText('Experience gained:', 500 - 80, 700 / 4 + 80);
		gc.fillText('Times jumped:', 500 - 80, 700 / 4 + 110);
		gc.fillText('Nodes collected:', 500 - 80, 700 / 4 + 140);
		gc.fillText('Stars collected:', 500 - 80, 700 / 4 + 170);
		gc.fillText('Shields collected:', 500 - 80, 700 / 4 + 200);
		gc.fillText('Skills activated:', 500 - 80, 700 / 4 + 230);
		
		gc.textAlign = 'left';
		gc.fillText(this.level.properties.stats.damage_taken, 500 + 80, 700 / 4 + 50);
		gc.fillText(this.level.properties.stats.experience_gained, 500 + 80, 700 / 4 + 80);
		gc.fillText(this.level.properties.stats.jumps, 500 + 80, 700 / 4 + 110);
		gc.fillText(this.level.properties.stats.collected_nodes, 500 + 80, 700 / 4 + 140);
		gc.fillText(this.level.properties.stats.collected_stars, 500 + 80, 700 / 4 + 170);
		gc.fillText(this.level.properties.stats.collected_armor, 500 + 80, 700 / 4 + 200);
		gc.fillText(this.level.properties.stats.activations, 500 + 80, 700 / 4 + 230);
	}
}

class Gameover extends Page {
	constructor(level) {
		super(level);

		this.but1 = new Button(500, 700 / 2 + 90, 100, 25, 'RETURN TO MENU', function() {
			level.setState('menu');
		});
	}
	
	draw(gc) {
		gc.fillStyle = '#e8f0ff';
		gc.font = '30px bold';
		gc.textAlign = 'center';
		gc.fillText('You died', 500, 700 / 2);
			
		this.but1.draw(gc);
	}
	
	tick(kb) {
		this.but1.tick(kb);
	}
}

class Pause extends Page {
	constructor(level) {
		super(level);
		
		this.but1 = new Button(500, 700 / 2 + 50, 100, 25, 'UNPAUSE', function() {
			level.setState('pause');
		});
		
		this.but2 = new Button(500, 700 / 2 + 90, 100, 25, 'RETURN TO MENU', function() {
			level.setState('menu');
		});
	}
	
	draw(gc) {
		gc.fillStyle = '#e8f0ff';
		gc.font = '30px bold';
		gc.textAlign = 'center';
			
		gc.fillText('Game paused', 500, 700 / 2);
			
		this.but1.draw(gc);
		this.but2.draw(gc);
	}
	
	tick(kb) {
		this.but1.tick(kb);
		this.but2.tick(kb);
	}
}

class Upgrades extends Page {
	constructor(level) {
		super(level);
		
		this.level.properties.load();
		
		this.but1 = new Button(50, 30, 100, 25, 'BACK', function() {
			level.setState('menu');
		});
		
		this.buts = [];
		this.buts.push(new Button(500 + 70, 700 / 4 + 50, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (level.properties.upgrades.maxhealth < 10) {
					level.properties.upgrades.points--;
					level.properties.upgrades.maxhealth++;
					
					level.properties.save();
				}
			}
		}));
		this.buts.push(new Button(500 + 70, 700 / 4 + 80, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (!level.properties.upgrades.pass_powerrate) {
					level.properties.upgrades.points--;
					level.properties.upgrades.pass_powerrate = true;
					
					level.properties.save();
				}
			}
		}));
		this.buts.push(new Button(500 + 70, 700 / 4 + 110, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (!level.properties.upgrades.pass_movement) {
					level.properties.upgrades.points--;
					level.properties.upgrades.pass_movement = true;
					
					level.properties.save();
				}
			}
		}));
		this.buts.push(new Button(500 + 70, 700 / 4 + 140, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (!level.properties.upgrades.skill_doublexp) {
					level.properties.upgrades.points--;
					level.properties.upgrades.skill_doublexp = true;
					
					level.properties.save();
				}
			} else if (level.properties.upgrades.skill_doublexp) {
				level.properties.upgrades.selected_skill = 3;
				level.properties.save();
			}
		}));
		this.buts.push(new Button(500 + 70, 700 / 4 + 170, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (!level.properties.upgrades.skill_spawnarmor) {
					level.properties.upgrades.points--;
					level.properties.upgrades.skill_spawnarmor = true;
					
					level.properties.save();
				}
			} else if (level.properties.upgrades.skill_spawnarmor) {
				level.properties.upgrades.selected_skill = 2;
				level.properties.save();
			}
		}));
		this.buts.push(new Button(500 + 70, 700 / 4 + 200, 25, 25, '+', function() {
			if (level.properties.upgrades.points > 0) {
				if (!level.properties.upgrades.skill_shockwave) {
					level.properties.upgrades.points--;
					level.properties.upgrades.skill_shockwave = true;
					
					level.properties.save();
				}
			} else if (level.properties.upgrades.skill_shockwave) {
				level.properties.upgrades.selected_skill = 1;
				level.properties.save();
			}
		}));
	}
	
	tick(kb) {
		this.but1.tick(kb);
		for (var i = 0; i < this.buts.length; i++) {
			this.buts[i].tick(kb);
		}
	}
	
	draw(gc) {
		this.but1.draw(gc);
				
		gc.fillStyle = '#778899';
		gc.font = '30px bold';
		gc.textAlign = 'center';
		
		gc.fillText('UPGRADES', 500, 700 / 4 - 50);
		
		gc.fillStyle = '#778899';
		gc.font = '20px bold';
		
		gc.fillText(this.level.properties.upgrades.points + ' points remaining', 500, 700 / 4 - 10);

		gc.textAlign = 'right';
		gc.fillText('Health', 500 - 80, 700 / 4 + 50);
		gc.fillText('Power gain', 500 - 80, 700 / 4 + 80);
		gc.fillText('Walk speed', 500 - 80, 700 / 4 + 110);
		gc.fillText('Experience boost', 500 - 80, 700 / 4 + 140);
		gc.fillText('Armor boost', 500 - 80, 700 / 4 + 170);
		gc.fillText('Shockwave', 500 - 80, 700 / 4 + 200);
		
		gc.textAlign = 'center';
		
		gc.fillText(this.level.properties.upgrades.maxhealth, 500, 700 / 4 + 50);
		
		if (this.level.properties.upgrades.pass_powerrate) {
			gc.fillText('Owned', 500, 700 / 4 + 80);
		}
		
		if (this.level.properties.upgrades.pass_movement) {
			gc.fillText('Owned', 500, 700 / 4 + 110);
		}
		
		if (this.level.properties.upgrades.skill_doublexp) {
			gc.fillText((this.level.properties.upgrades.selected_skill == 3) ? 'Selected' : 'Owned', 500, 700 / 4 + 140);
		}
		
		if (this.level.properties.upgrades.skill_spawnarmor) {
			gc.fillText((this.level.properties.upgrades.selected_skill == 2) ? 'Selected' : 'Owned', 500, 700 / 4 + 170);
		}
		
		if (this.level.properties.upgrades.skill_shockwave) {
			gc.fillText((this.level.properties.upgrades.selected_skill == 1) ? 'Selected' : 'Owned', 500, 700 / 4 + 200);
		}
		
		this.but1.draw(gc);
		for (var i = 0; i < this.buts.length; i++) {
			this.buts[i].draw(gc);
		}
	}
}

class Level {
	constructor(gc, kb) {
		this.kb = kb;
		this.gc = gc;
		
		this.page = new Menu(this);
		this.state = 'menu';
		
		this.mobs = [];
		this.particles = [];
		this.spawners = [];
		
		this.background = new Sprite('res/background/background.png', 1, 1);
		
		this.properties = new Properties(this);
		this.properties.load();
		
		this.overlay = new Overlay(0, 0, this.properties);
		this.add(new RainSpawner(0, -20, 1000, 0, this, 0, 0, 3));
	}
	
	add(entity) {
		if (entity instanceof SpriteEntity) {
			this.mobs.push(entity);
		} else if (entity instanceof Particle) {
			this.particles.push(entity);
		} else if (entity instanceof Spawner) {
			this.spawners.push(entity);
		}
	}
	
	draw() {
		this.gc.clearRect(0, 0, 1000, 700);
		this.background.draw(this.gc, 0, 0);
		
		for (var i = 0; i < this.particles.length; i++) this.particles[i].draw(this.gc);
		for (var i = 0; i < this.mobs.length; i++) this.mobs[i].draw(this.gc);
		
		switch (this.state) {
			case 'menu':
			case 'pause':
			case 'upgrades':
			case 'gameover':
			case 'stats':
			case 'help': {
				if (this.page) {
					this.gc.save();
					this.page.draw(this.gc);
					this.gc.restore();
				}
				
				break;
			}
			case 'game': {
				this.overlay.draw(this.gc);
				break;
			}
		}
	}
	
	tick() {
		switch (this.state) {
			case 'menu':
			case 'upgrades':
			case 'stats':
			case 'gameover':
			case 'help': {
				for (var i = 0; i < this.spawners.length; i++) this.spawners[i].tick();
				for (var i = 0; i < this.mobs.length; i++) this.mobs[i].tick();
				for (var i = 0; i < this.particles.length; i++) this.particles[i].tick();
				
				this.mobs.removeIf((e) => !e.alive);
				this.particles.removeIf((e) => !e.alive);
				this.spawners.removeIf((e) => !e.alive);
				
				if (this.page) {
					this.page.tick(this.kb);
				}
				
				break;
			}
			case 'game': {
				for (var i = 0; i < this.spawners.length; i++) this.spawners[i].tick();
				for (var i = 0; i < this.mobs.length; i++) this.mobs[i].tick();
				for (var i = 0; i < this.particles.length; i++) this.particles[i].tick();
			
				this.properties.tick();
				this.overlay.tick();
				
				this.mobs.removeIf((e) => !e.alive);
				this.particles.removeIf((e) => !e.alive);
				this.spawners.removeIf((e) => !e.alive);
				
				break;
			}
			case 'pause': {
				if (this.page) {
					this.page.tick(this.kb);
				}
				
				break;
			}
		}
	}
	
	stop() {
		this.mobs = [];
		
		this.particles.removeIf((e) => !(e instanceof RainParticle));
		this.spawners.splice(1, this.spawners.length - 1);
	}
	
	play() {
		this.properties.load();
		
		this.add(new Player(500 - 47 / 2, 700 / 40 * 33 - 65, this));	
		this.add(new AcidSpawner(0, -50, 1000, 0, this, 10, 5, 2));
		this.add(new ArmorSpawner(0, -50, 1000, 0, this, 60 * 60, 10 * 60, 1));
		this.add(new EnergySpawner(0, -50, 1000, 0, this, 60, 10, 1));
		this.add(new StarSpawner(0, -50, 1000, 0, this, 20 * 60, 0, 1));
		
		this.overlay.resetOverlay();
	}
	
	aabbPlayer(entity) {
		return this.mobs[0].aabb(entity);
	}
	
	setState(state) {
		this.kb.click = [0, 0];
		switch (state) {
			case 'menu': {
				if (this.page instanceof Pause || !this.page) {
					this.stop();
				}
				
				this.page = new Menu(this);
				this.state = 'menu';
				
				break;
			}
			case 'pause': {
				if (this.page instanceof Pause) {
					this.state = 'game';
					this.page = undefined;
				} else if (this.page) {
					this.state = 'menu';
					this.page = new Menu(this);
				} else if (this.state === 'game') {
					this.state = state;
					this.page = new Pause(this);
				}
				
				break;
			}
			case 'game': {
				this.state = 'game';
				this.page = undefined;
				
				this.play();
				break;
			}
			case 'upgrades': {
				this.state = 'upgrades';
				this.page = new Upgrades(this);
				break;
			}
			case 'help': {
				this.state = 'help';
				this.page = new Help(this);
				break;
			}
			case 'stats': {
				this.state = 'stats';
				this.page = new Statistics(this);
				break;
			}
			case 'gameover': {
				this.properties.save();
								
				this.stop();
				
				this.state = 'gameover';
				this.page = new Gameover(this);
				break;
			}
		}
	}
}

class LevelWrapper {
	constructor(kb) {
		this.canvas = document.getElementById('content');
		this.canvas.addEventListener('mousedown', (evnt) => kb.mouse(evnt.pageX - this.canvas.offsetLeft, evnt.pageY - this.canvas.offsetTop, true), true);
		this.canvas.addEventListener('mouseup', (evnt) => kb.mouse(evnt.pageX - this.canvas.offsetLeft, evnt.pageY - this.canvas.offsetTop, false), true);
		
		this.cont2d = this.canvas.getContext('2d');
		
		this.level = new Level(this.cont2d, kb);
		setInterval((level) => {
			level.tick();
			level.draw();
			
			if (kb.isPressed('Escape')) {
				level.setState('pause');
			}
			
			kb.tick();
		}, 1000 / 60, this.level);
	}
}

loader.load('res/entity/player.png');
loader.load('res/entity/acid.png');
loader.load('res/entity/energy.png');
loader.load('res/entity/armor.png');
loader.load('res/entity/star.png');

loader.load('res/gui/bars/frame.png');
loader.load('res/gui/bars/health.png');
loader.load('res/gui/bars/armor.png');
loader.load('res/gui/bars/experience.png');
loader.load('res/gui/bars/energy.png');

loader.load('res/gui/icons/ability.png');
loader.load('res/gui/icons/health.png');
loader.load('res/gui/icons/experience.png');
loader.load('res/gui/icons/energy.png');
loader.load('res/gui/icons/frame.png');

loader.load('res/background/background.png');

window.onload = function() {
	var keyboard = new KeyEventAdapter();
	document.addEventListener('keydown', (evt) => keyboard.set(evt.key, true), true);
	document.addEventListener('keyup', (evt) => keyboard.set(evt.key, false), true);

	var game = new LevelWrapper(keyboard);
}
