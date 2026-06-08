/* 
	LunarLander for BruceFW. The goal is to land sofly. Steering is intuitive.
	As usual - next/prev  to rotate, sel to fire thrusters and esc to quit.
	Coming soon: Difficulity level selection, scores, more suff to display

	by gib
*/

const DISPLAY_WIDTH = display.width();
const DISPLAY_HEIGHT = display.height();
const GRAVITY = 0.0001;
const THRUST = 0.05;
const ROTATE_BY = 0.1;
const MAX_V_X = 0.5;
const MAX_V_Y = 0.25;
const MAIN_COLOR = BRUCE_PRICOLOR;
const PAD_COLOR = ~BRUCE_PRICOLOR;
const BAR_COLOR = display.color(255, 255, 0);
const SEGMENT_WIDTH = 10;
const BURN_RATE = 5;

var terrain = [];
var pad = {x: 0, y: 0, w: 30};
var ship = {
    
	x: DISPLAY_WIDTH * 0.5,
	y: 20,
	oldX: DISPLAY_WIDTH * 0.5,
	oldY: 20,
	velX: 0,
	velY: 0,
	rotation: 0,
	fuel: 100,
	thrusting: false
};

function genTerrain(){

	terrain = [];
	var x  =  0;
	var y = DISPLAY_HEIGHT * 0.95 + random(-20, 20);
	while(x < DISPLAY_WIDTH){

		y += random(-20, 20);
		if(y < DISPLAY_HEIGHT * 0.55) y = DISPLAY_HEIGHT * 0.55;
		if(y > DISPLAY_HEIGHT - 20) y = DISPLAY_HEIGHT - 20;

		terrain.push({x: x, y: y});
		x += SEGMENT_WIDTH;
	}
    var last = terrain[terrain.length - 1];
    if(last.x !== DISPLAY_WIDTH){

        terrain.push({x: DISPLAY_WIDTH, y: last.y});
    }
	var p = 2 + random(0, terrain.length - 4);
	pad.x = terrain[p].x;
	pad.y = terrain[p].y;
	for(var i = p; i < p + 3; i++) terrain[i].y = pad.y;

    pad.w = terrain[p + 2].x - terrain[p].x;
    
}

function drawTerrain(){

	display.fill(BRUCE_BGCOLOR);
	for(var i = 0; i < terrain.length - 1; i++){

		display.drawLine(terrain[i].x, terrain[i].y, terrain[i + 1].x, terrain[i + 1].y, MAIN_COLOR);
	}
	display.drawFastHLine(pad.x, pad.y, pad.w, PAD_COLOR);
}

function reset(){

	ship.x = DISPLAY_WIDTH / 2;
	ship.y = 20;
	ship.oldX = ship.x;
	ship.oldY = ship.y;
	ship.velX = 0;
	ship.velY = 0;
	ship.rotation = 0;
	ship.fuel = 100;
	ship.thrusting = false;
	genTerrain();
	drawTerrain();
}

function groundY(x){

	for(var i = 0; i < terrain.length - 1; i++){

		var a = terrain[i];
		var b = terrain[i + 1];

		if(x >= a.x && x <= b.x){

			var t = (x - a.x) / (b.x - a.x);
			return a.y + (b.y - a.y) * t;
		}
	}
	return DISPLAY_HEIGHT;
}

function drawLocalTerrain(x, y, w, h){

	for(var i = 0; i < terrain.length - 1; i++){

		var x1 = terrain[i].x;
		var x2 = terrain[i + 1].x;
		if(x2 < x || x1 > x + w) continue;

		display.drawLine(terrain[i].x, terrain[i].y, terrain[i + 1].x, terrain[i + 1].y, MAIN_COLOR);
	}
	if(pad.x + pad.w >= x && pad.x <= x + w){

		display.drawFastHLine(pad.x, pad.y, pad.w, PAD_COLOR);
	}
}

function eraseShip(){
    
	display.drawFillRect(ship.oldX - 12, ship.oldY - 12, 24, 24, BRUCE_BGCOLOR);
	drawLocalTerrain(ship.oldX - 12, ship.oldY - 12, 24, 24);
}

function drawHud(){

	display.drawFillRect(5, 5, 50, 4, BRUCE_BGCOLOR);
	display.drawRect(4, 4, 52, 6, MAIN_COLOR);
	display.drawFillRect(5, 5, ship.fuel >> 1, 4, BAR_COLOR);
}

function drawShip(){

	var posX = ship.x;
	var posY = ship.y;
	var shipSin = Math.sin(ship.rotation);
	var shipCos = Math.cos(ship.rotation);
	var shipX1 = posX + shipSin * 6;
	var shipY1 = posY - shipCos * 6;
	var shipX2 = posX - shipCos * 4 - shipSin * 4;
	var shipY2 = posY - shipSin * 4 + shipCos * 4;
	var shipX3 = posX + shipCos * 4 - shipSin * 4;
	var shipY3 = posY + shipSin * 4 + shipCos * 4;
    display.drawTriangle(shipX1, shipY1, shipX2, shipY2, shipX3, shipY3, MAIN_COLOR);
}

function crash(){

    if(ship.fuel !== 0) dialog.error("You crashed. Try again! You can do it!", true);
    else dialog.error("You ran out of fuel. Try again! You can do it!", true);
	reset();
}

function land(){

    dialog.info("YOU WIN! with " + Math.round(ship.fuel) + "% fuel left.", true);
	reset();
}

function handleInput(){

	ship.thrusting = false;
	if(keyboard.getPrevPress()) ship.rotation -= ROTATE_BY;
	if(keyboard.getNextPress()) ship.rotation += ROTATE_BY;
	if(keyboard.getSelPress() && ship.fuel > 0){

		ship.thrusting = true;
		ship.velX += Math.sin(ship.rotation) * THRUST;
		ship.velY -= Math.cos(ship.rotation) * THRUST;
		ship.fuel -= BURN_RATE;
        drawHud();
	}
	if(keyboard.getEscPress()) return false;
	return true;
}

function update(){

	ship.oldX = ship.x;
	ship.oldY = ship.y;
	ship.velY += GRAVITY;
	if(ship.velX > MAX_V_X)ship.velX = MAX_V_X;
	if(ship.velX < -MAX_V_X)ship.velX = -MAX_V_X;
	if(ship.velY > MAX_V_Y)ship.velY = MAX_V_Y;
	if(ship.velY < -MAX_V_Y)ship.velY = -MAX_V_Y;

	ship.x += ship.velX;
	ship.y += ship.velY;
	if(ship.x < 0) ship.x = DISPLAY_WIDTH - 1;
	if(ship.x >= DISPLAY_WIDTH) ship.x = 0;
	if(ship.y + 6 >= groundY(ship.x)){

		if(ship.x >= pad.x && ship.x <= pad.x + pad.w && Math.abs(ship.velX) < 0.3 && Math.abs (ship.velY) < 0.5 && Math.abs(ship.rotation) < 0.3) land();
		else crash();
	}
}

function main(){

    reset();
    drawShip();
    drawHud();
    while(true){
        
        if(!handleInput())break;
        
        eraseShip();
        update();
        drawShip();
    }
}
main();