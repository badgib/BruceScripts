/*
    Channel graph with complex features (WiP)
    Graph works, shows channel congestion.
    RSSI/SSID explorer coming real soon.
    
    by gib
*/

const keyboard = require('keyboard');
const display = require("display");
const dialog = require('dialog');
const wifi = require('wifi');

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setTextSize(0);

const X = 10;
const Y = 10;
const W = 300;
const H = 140;

var bDoRun = true;

function handleInput(){
        
    if(keyboard.getEscPress()){
        
        bDoRun = false;
    }
    if(keyboard.getNextPress()){
        
    }
    if(keyboard.getPrevPress()){
        
    }
    if(keyboard.getSelPress()){
        
    }
}

function debugDisplay(debugData, bWaitForEsc){

    display.fill(BRUCE_BGCOLOR);
    display.setTextColor(BRUCE_PRICOLOR);
    display.setCursor(0, 0);
    display.setTextSize(0);
    display.println(debugData);
    if(!bWaitForEsc) pauseForInput();
}

function pauseForInput(){

    while(true){
     
        if(keyboard.getAnyPress()){
            
            break;
        }
    }   
}

function showSplash(){
    
    display.fill(BRUCE_BGCOLOR);
    display.setCursor(0, 0);
    display.setTextSize(4);
    display.println("   Hello.")
    display.setTextSize(2);
    display.println("This is just a boilerplate");
}

function drawBarGraph(data){

    display.fill(BRUCE_BGCOLOR);
    var max = 0;
    for(var i = 0; i < data.length; i++){

        if (data[i] > max) max = data[i];
    }
    var count = data.length;
    var slotWidth = W / count;
    var barWidth = slotWidth * 0.8;
    for(var i = 0; i < count; i++){
        
        var barHeight = (data[i] / max) * (H - 10);
        var bx = X + i * slotWidth + (slotWidth - barWidth) / 2;
        var by = Y + H - barHeight;
        display.drawFillRect(Math.round(bx), Math.round(by), Math.round(barWidth), Math.round(barHeight), BRUCE_PRICOLOR);
        display.setCursor(bx + (i < 9 ? 7 : 3), Y + H + 5);
        display.print(i + 1);
        handleInput();
    }
    display.drawLine(X, Y, X, Y + H, BRUCE_PRICOLOR);
    display.drawLine(X, Y + H, X + W, Y + H, BRUCE_PRICOLOR);
}

function scanAndExtract(){

    var scanResult = wifi.scan();
    var channels = [];
    var counts = [];
    if(scanResult.length !== 0){

        for(var i = 0; i < scanResult.length; i++){

            channels.push(scanResult[i].channel);
        }
    }
    else return [];
    for(var i = 0; i < 14; i++){

        counts[i] = 0;
    }
    for(var i = 0; i < channels.length; i++){

        counts[channels[i] - 1]++;
    }
    return counts;
}

function main(){

    while(bDoRun){

        drawBarGraph(scanAndExtract());
        handleInput();
    }
}
main();

// ADD: select channel - show rssi and ssid of all networks on chosen channel
// Also fix the issue with having to spam esc to quit
// Using some "intervals" to scan and wait for esc in the meantime
