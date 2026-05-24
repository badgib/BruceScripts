/*
    A set of useful starting functions
    
    by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const display = require("display");
const dialog = require('dialog');

const fgColor = BRUCE_PRICOLOR;
const bgColor = BRUCE_BGCOLOR;

display.setTextColor(fgColor);
display.fill(bgColor);

display.setCursor(0, 0);
display.setTextSize(2.5);

function handleInput(){
        
    if(keyboard.getEscPress()){
        
        return false;
    }
    if(keyboard.getNextPress()){
        
        break;
    }
    if(keyboard.getPrevPress()){
        
        break;
    }
    if(keyboard.getSelPress()){
        
        break;
    }
}

function debugDisplay(debugData, bWaitForEsc){

    display.fill(bgColor);
    display.setTextColor(fgColor);
    display.setCursor(0, 0);
    display.setTextSize(0);
    display.println(debugData);
    if(!bWaitForEsc){

        while(true){
 
            if(keyboard.getAnyPress()){
                
                break;
            }
        }   
    }
}


function showSplash(){
    
    display.fill(bgColor);
    display.setCursor(0, 0);
    display.setTextSize(4);
    display.println("   Hello.")
    display.setTextSize(2);
    display.println("App will attempt to load\nfiles from /rttts. If not\n" +
        "found you still can load a\nmultiline file or select\n" +
        "some other folder, you'll\nget a choice.\n");
}

function loadFile(name){

    var raw = storage.read(name);
    raw = raw.replace(/\r/g, "");
    var lined = raw.split("\n");
    return lined;
}

function displayStuff(what){
    
    display.fill(bgColor);
    dialog.drawStatusBar();
    display.setTextSize(2.5);
    display.setCursor(0, 30);
    display.println("Playing:\n" + what + "\n\nEnjoy your melody!");
}

function main(){

    var bDoRun = true;
    showSplash();
    while(bDoRun){

        bDoRun = handleInput();
    }
}