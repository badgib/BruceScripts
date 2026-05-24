/*
    A script allowing fast access to transmit the mmost useful IR and/or RF files
    You can add new fields to it, modify them and such. In menu or by editing .conf

    by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const display = require("display");
const dialog = require('dialog');
const subghz = require('subghz');
const ir = require('ir');

const DISP_WIDTH = display.width();
const DISP_HEIGHT = display.height();

const CONF_FILE = {fs: "sd", path: "/GibsFiles/quickStart.conf"};

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setCursor(0, 0);
display.setTextSize(2.5);

const cols = 3;
const buttonW = 100;
const buttonH = 20;
const padding = 3;
const radius = 10;

var IRMenu = [];
var subGHzMenu = [];
var selectedMenu = [];

var selectedIndex = 0;
var scrollOffset = 0;


var bDoRun = true;
var bUpdatedIndex = false;
var bInMenu = true;
var bIsEditing = false;

function handleInput(){
        
    if(keyboard.getEscPress()){
        
        if(!bInMenu) bDoRun = false;
        else{

            bInMenu = false;
            display.fill(BRUCE_BGCOLOR);
            var quitFully = dialog.message("Fully quit or change menu?", {left: "Menu", right: "Quit"});
            if(quitFully === "right"){

                bDoRun = false;
            }
            else{

                bIsEditing = false;
                selectMenuType();
            }
        }
    }
    if(keyboard.getNextPress()){
        
        if(bInMenu){

            selectedIndex++;
            if(selectedIndex > selectedMenu.length - 1) selectedIndex = 0;
            bUpdatedIndex = true;
        }
    }
    if(keyboard.getPrevPress()){
        if(bInMenu){

            selectedIndex--;
            if(selectedIndex < 0) selectedIndex = selectedMenu.length -1;
            bUpdatedIndex = true;
        }
    }
    if(keyboard.getSelPress()){
        
        if(bInMenu && selectedMenu !== [] && !bIsEditing){

            bUpdatedIndex = true;
            runSelectedCommand();
        }
        else{

            selectEditTool();
        }
    }
}

function removeDupes(data){

    var seen = {};
    var result = [];

    for(var i = 0; i < data.length; i++){
        var key = data[i].id;

        if(key && !seen[key]){
            seen[key] = true;
            result.push(data[i]);
        }
    }

    return result;
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
    display.println("    Hello.")
    display.setTextSize(2);
    display.println("\nThis is a first-time splash. This script will now prepare" +
        "your .conf file for you and you won't see this splash again. Have fun!");
    pauseForInput();
    display.fill(BRUCE_BGCOLOR);
    display.setCursor(0, 0);
    display.println("\n\nYou'll be asked to provide at least one file so you can" + 
        "start with something. You can add more items later on");
    pauseForInput();
    display.fill(BRUCE_BGCOLOR);
}

function runSelectedCommand(){

    if(selectedMenu[selectedIndex]["mode"] === "IR"){

        try{

            ir.transmitFile(selectedMenu[selectedIndex]["file"]);
            display.drawFillRect(0, 100, DISP_WIDTH, DISP_HEIGHT - 100, BRUCE_BGCOLOR);
            dialog.info("Done!");
        }
        catch(erir){

            dialog.error("IR transmit error: " + erir);
        }
    }
    else{
        
        try{
    
            dialog.info("Transmitting...");
            subghz.transmitFile(selectedMenu[selectedIndex]["file"]);
            dialog.info("Done!");
        }
        catch(ersg){
    
            dialog.error("SubGHz transmit error: " + ersg);
        }
    }
    delay(500);
    display.fill(BRUCE_BGCOLOR);
}

function handleEditing(){

    display.fill(BRUCE_BGCOLOR);
    var whichMode = dialog.message("Let's narrow it down\nwhat type?", {left: "IR", right:"SubGHz"});
    if(whichMode === "IR"){

        selectedMenu = IRMenu;
    }
    else{
        
        selectedMenu = subGHzMenu;
    }
    bIsEditing = true;
    drawGrid(selectedMenu);
    
}

function selectMenuType(){
    
    display.fill(BRUCE_BGCOLOR);
    var chosenMenu = dialog.message("Choose menu:", {left: "IR", center: "Edit", right: "SubGHz"});
    if(chosenMenu === "IR"){
        
        selectedMenu = IRMenu;
        if(!bIsEditing) selectedIndex = 0;
    }
    else if(chosenMenu === "Edit"){
        
        handleEditing();
        if(!bIsEditing) selectedIndex = 0;
    }
    else{
        
        selectedMenu = subGHzMenu;
        if(!bIsEditing) selectedIndex = 0;
    }
    bUpdatedIndex = true;
    display.fill(BRUCE_BGCOLOR);
}

function loadConfig(){

    try{
        
        return storage.read(CONF_FILE);
    }
    catch(e1){

        return 0
    }
}

function parseConfig(){

    if(!loadConfig()){
        
        showSplash();
        firstConfig();
    }
    else{

        var loopArr = [];
        var tempConf = loadFile(CONF_FILE);
        for(var i = 0; i < tempConf.length; i++){
            loopArr = JSON.parse(tempConf[i], null, 2);
            if(loopArr["mode"] === "IR"){

                IRMenu.push({file: loopArr["file"], name: loopArr["name"], mode: loopArr["mode"]});
            }
            else{

                subGHzMenu.push({file: loopArr["file"], name: loopArr["name"], mode: loopArr["mode"]});
            }
        }
        return true;
    }
}

function selectEditTool(){

    var selectedTool = dialog.choice({"Add new one": "add_new", "Modify selected": "modify", "Reposition": "reposition", "Delete it": "delete"});
    if(selectedTool === "add_new"){

        addNewItem();
    }
    else if(selectedTool === "modify"){

        modifyItem();
    }
    else if(selectedTool === "reposition"){
     
        repositionItem();
    }
    else{

        removeProperOne(selectedMenu[selectedIndex]["mode"]);
        saveFullConfig();
    }
    bUpdatedIndex = true;
    bIsEditing = false;
    display.fill(BRUCE_BGCOLOR);
}

function modifyItem(){

    var tmpFile = dialog.pickFile();
    var tmpName = dialog.prompt(selectedMenu[selectedIndex]["name"], 14, "Input user-friendly name for the file");
    delay(100);
    var tmpMode = dialog.message("Is it IR or SubGHz?", {left: "IR", right: "SubGHz"});
    removeProperOne(selectedMenu[selectedIndex]["mode"]);
    putInProperPlace(tmpFile, tmpName, tmpMode);
    // addItemToConfig(tmpFile, tmpName, handleBrokenRight(tmpMode));
    saveFullConfig();
    // drawGrid(selectedMenu);
}

function addNewItem(){

    var addFile = dialog.pickFile();
    var addName = dialog.prompt("", 14, "Input user-friendly name for the file");
    delay(100);
    var addMode = dialog.message("Is it IR or SubGHz?", {left: "IR", right: "SubGHz"});

    putInProperPlace(addFile, addName, addMode);
    addItemToConfig(addFile, addName, handleBrokenRight(addMode));
    // saveFullConfig();
}

function repositionItem(){

    var itemToMove = selectedMenu.splice(selectedIndex, 1)[0];
    removeProperOne(itemToMove["mode"]);
    var chosenIndex = keyboard.numKeyboard("", 8, "Enter position");
    if(Number(chosenIndex) > selectedMenu.length) chosenIndex = selectedMenu.length - 1;
    reorderProperArray(chosenIndex, itemToMove);
    // putInProperPlace(itemToMove["file"], itemToMove["name"], itemToMove["mode"]);
    saveFullConfig();
    // drawGrid(selectedMenu);
}

function reorderProperArray(index, item){

    // item = JSON.stringify(item, null, 2);
    if(item["mode"] === "IR"){

        IRMenu.splice(index, 0, item);
    }
    else{
        
        subGHzMenu.splice(index, 0, item);
    }
}

function removeProperOne(removeMode){
    
    if(removeMode === "IR"){
    
        IRMenu.splice(selectedIndex, 1);
    }
    else{

        subGHzMenu.splice(selectedIndex, 1);
    }
}

function putInProperPlace(placeFile, placeName, placeMode){

    if(placeMode === "IR"){
        
        IRMenu.push({file: placeFile, name: placeName, mode: placeMode});
    }
    else{

        subGHzMenu.push({file: placeFile, name: placeName, mode: placeMode});
    }
}

function firstConfig(){

    var firstFile = dialog.pickFile();
    var firstName = dialog.prompt("", 14, "Input user-friendly name for the file");
    delay(100);
    var irOrSubGhz = dialog.message("Is it IR or SubGHz?", {left: "IR", right: "SubGHz"});
    putInProperPlace(firstFile, firstName, handleBrokenRight(irOrSubGhz));
    addItemToConfig(firstFile, firstName, handleBrokenRight(irOrSubGhz));
}

function handleBrokenRight(thisToBool){

    if(thisToBool === "right"){

        return "SubGHz";
    }
    else return thisToBool;
}

function saveFullConfig(){

    var saveArr = [];
    var saveStr = "";
    for(var i = 0; i < IRMenu.length; i++){
        
        if(saveArr[i] !== {}){
            
            saveArr.push(JSON.stringify(IRMenu[i], null, 2));
        }
    }
    for(var i = 0; i < subGHzMenu.length; i++){
        if(saveArr[i] !== {}){
            
            saveArr.push(JSON.stringify(subGHzMenu[i], null, 2));
        }
    }
    saveStr = saveArr.join("\n")
    storage.write(CONF_FILE, saveStr, "write");
}

function addItemToConfig(fileName, friendlyName, irOrSub){

    var tempObj = {file: fileName, name: friendlyName, mode: irOrSub};
    var tempStr = JSON.stringify(tempObj, null, 2);
    storage.write(CONF_FILE, "\n" + tempStr, "append");
}

function loadFile(name){

    var raw = storage.read(name);
    raw = raw.replace(/\r/g, "");
    var lined = raw.split("\n");
    lined = lined.filter(function(line){

        return line !== "";
    });
    return lined;
}

function drawGrid(items){

    display.setTextSize(0);

    var selectedRow = Math.floor(selectedIndex / cols);
    var rowHeight = buttonH + padding * 2;
    var visibleRows = Math.floor(DISP_HEIGHT / rowHeight);
    if(selectedRow * rowHeight - scrollOffset < 0){

        scrollOffset = selectedRow * rowHeight;
        display.fill(BRUCE_BGCOLOR);
    }
    
    if((selectedRow + 1) * rowHeight - scrollOffset > visibleRows * rowHeight){
        
        scrollOffset = (selectedRow + 1) * rowHeight - visibleRows * rowHeight;
        display.fill(BRUCE_BGCOLOR);
    }
    
    if(scrollOffset < 0){
        
        scrollOffset = 0;
        display.fill(BRUCE_BGCOLOR);
    }

    for(var i = 0; i < items.length; i++){

        var col = i % cols;
        var row = Math.floor(i / cols);
        var x = col * (buttonW + padding * 2) + 1;
        var y = row * (buttonH + padding * 2);
        var textOffset = Math.abs(items[i]["name"].length - 14);
        y -= scrollOffset;
        if(y < -buttonH || y > 170){

            continue;
        }
        if(i === selectedIndex){

            display.drawFillRoundRect(x - 1 + padding, y - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_SECCOLOR);
            display.drawRoundRect(x - 1 + padding, y - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_PRICOLOR);
            display.setTextColor(~BRUCE_PRICOLOR);
        }
        else{

            display.drawFillRoundRect(x - 1 + padding, y  - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_BGCOLOR);
            display.drawFillRoundRect(x + padding, y + padding, buttonW, buttonH, radius, BRUCE_SECCOLOR);
            display.setTextColor(BRUCE_PRICOLOR);
        }
        display.drawText(items[i]["name"], x + (textOffset * 6 / 2) + 10, y + buttonH / 2 - 1);
    }
    bUpdatedIndex = false;
    bInMenu = true;
}

function main(){

    display.setTextSize(0);
    parseConfig();
    selectMenuType();
    while(bDoRun){
        
        // if(!bInMenu) selectMenu();

        handleInput();
        if(bUpdatedIndex){

            drawGrid(selectedMenu);
        }
    }
}

main();
