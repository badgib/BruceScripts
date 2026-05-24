/*
    This app allows you to connect to your Lumix camera and dontrol it remotely (still and start/stop recording)
    It displays some basic information and has all the connectivity tidbits baked in to allow for hassleless
    operation, no matter your setting. It creates a conf file for ease of repeated uses.

    MAC address might be completely useless, might probe useful later. Still need to figure out rest of the APIs
    One thing for sure - the wifi pass is just lower-case MAC with 'a' as a prefix. That's it. So might be useful
    Anywho Most of the tinkering is done, time to sniff more for the desktop app

    by gib
*/

const display = require('display');
const keyboard = require('keyboard');
const wifi = require('wifi');
const dialog = require('dialog');
const storage = require('storage');

const settingsLocation = {fs: "sd", path: "/GibsFiles/LumixControl.conf"};
const recModeCommands = ["Capture photo", "Start recording", "Playback"];
const playModeCommands = ["Download file", "Go back"];
const displayWidth = display.width();
const displayHeight = display.height();

var cameraIP = "";
var cameraMAC = "";
var directSSID = "";
var directPass = "";
var networkSSID = "";
var networkPass = "";

var bDoRun = true;
var bAddFlare = false;
var bCmdChanged = true;
var bIsRecording = false;
var bSelectedPlay = false;
var lastMode = "rec";
var lastRec = "";
var lastTemp = "";
var lastBatt = "";
var shotsLeft = "";
var selectedRec = 0;
var lastPollTime = 0;
var pollInterval = 2000;
var totalImages = 0;
var currentImage = 0;
var imgArrayIndex = 0;
var currentFullPath = "";

var savedIPs = [];
var savedMACs = [];
var savedSSIDs = [];
var savedPasses = [];
var fileNamesDict = {};
var thumbnailArray = [];
var filesReadFromDir = [];

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);
storage.mkdir("/GibsFiles");
storage.mkdir("/GibsFiles/cache");
storage.mkdir("/GibsFiles/downloads");

function generateBody(startingIndex, amount){

    return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n" +
            "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n" +
            "  <s:Body>\r\n" +
            "    <u:Browse xmlns:u=\"urn:schemas-upnp-org:service:ContentDirectory:1\" xmlns:pana=\"urn:schemas-panasonic-com:pana\">\r\n" +
            "      <ObjectID>0</ObjectID>\r\n" +
            "      <BrowseFlag>BrowseDirectChildren</BrowseFlag>\r\n" +
            "      <Filter>*</Filter>\r\n" +
            "      <StartingIndex>" + startingIndex + "</StartingIndex>\r\n" +
            "      <RequestedCount>" + amount + "</RequestedCount>\r\n" +
            "      <SortCriteria></SortCriteria>\r\n" +
            "      <pana:X_FromCP>LumixLink2.0</pana:X_FromCP>\r\n" +
            "    </u:Browse>\r\n" +
            "  </s:Body>\r\n" +
            "</s:Envelope>";
}

function getImageNames(amount){

    bAddFlare = random(0, 100) < 88 ? true : false;

    if(lastMode === "rec") fetchCommand("/cam.cgi?mode=camcmd&value=playmode");

    try{
        var response = wifi.httpFetch("http://" + cameraIP + "/cam.cgi?mode=get_content_info");
        totalImages = Number(parseValue(response.body, "total_content_number"));
        var filesInDirectory = storage.readdir("/GibsFiles/cache/", {withFileTypes: true});
        for(var i = 0; i < filesInDirectory.length; i++){

            filesReadFromDir.push(filesInDirectory[i].name);
        }
        filesReadFromDir = removeDupes(filesReadFromDir);
    }
    catch(ergin){
        
        dialog.error("getImageNames: " + ergin, true);
    }
    try{
        var POSTBody = generateBody(totalImages - amount, amount);
        var response = wifi.httpFetch("http://" + cameraIP + ":60606/Server0/CDS_control", {
            
            method: "POST",
            body: POSTBody,
            headers: { "Host": cameraIP + ":60606",
                        "Content-Type": "text/xml; charset=\"utf-8\"",
                        "User-Agent": "Panasonic Android/1 DM-CP",
                        "SOAPACTION": "\"urn:schemas-upnp-org:service:ContentDirectory:1#Browse\"",
                        "Content-Length": to_string(POSTBody.length)
                        }});
        var imageNames = parseImageNames(response.body);
        populateObject(imageNames);
        imgArrayIndex = thumbnailArray.length - 1;
        return imageNames;
    }
    catch(erpb){

        dialog.error("POST error: " + erpb, false);
    }
}

function fetchFullFile(name){

    display.fill(BRUCE_BGCOLOR);
    delay(10);
    var doWeDownload = dialog.message("Do you want to download\n" + name + "?", {left: "No", right: "Yes"});
    if(doWeDownload === "right"){

        fetchBinaryFIle(thumbnailArray[imgArrayIndex], "cache/", true);
        fetchBinaryFIle(name, "downloads/");
        display.fill(BRUCE_BGCOLOR);
    }
    displayImage(imgArrayIndex);
}

function fetchBinaryFIle(name, destination, override){

    if(override === undefined) override = false;
    try{
        
        if(!override){
            var bDidWeFindIt = false;
            for(var i = 0; i < filesReadFromDir.length; i++){
                    
                if(filesReadFromDir[i] === name){

                    bDidWeFindIt = true;
                    break;
                }
            }
        }
        if(!bDidWeFindIt || override){

            var imgBin = wifi.httpFetch("http://" + cameraIP + ":50001/" + name, {binaryResponse: true, headers:{"Connection": "Keep-Alive", "Accept-Encoding": "gzip", "User-Agent": "Apache-HttpClient"}});
            currentFullPath = {fs: "sd", path: "/GibsFiles/" + destination + name};
            storage.write(currentFullPath, imgBin.body, "write");
            filesReadFromDir.push(name);
        }
    }
    catch(erfbf){
        
        dialog.error("Error fetching img: " + erfbf, true);
    }
}

function fetchCommand(command){
    
    if(!cameraIP || !command) return null;
    try{

        return wifi.httpFetch("http://" + cameraIP + command);
    }
    catch(erfc){

        // dialog.error("Fetch error: " + erfc);
    }
}

function handleInput(){

    if(keyboard.getEscPress()){

        if(lastMode === "play"){

            bSelectedPlay = !bSelectedPlay;
            bCmdChanged = true;
            drawGUI();
        }
        else{

            bDoRun = false;
        }
    }
    if(keyboard.getNextPress()){

        if(lastMode === "rec"){
        
            selectedRec++;
            if(selectedRec >= recModeCommands.length) selectedRec = 0;
            bCmdChanged = true;
        }
        else{
            
            imgArrayIndex++;
            if(imgArrayIndex >= thumbnailArray.length) imgArrayIndex = 0;
            displayImage(imgArrayIndex);
            bSelectedPlay = false;
        }
    }
    if(keyboard.getPrevPress()){
        
        if(lastMode === "rec"){
            
            selectedRec--;
            if(selectedRec < 0) selectedRec = recModeCommands.length - 1;
            bCmdChanged = true;
        }
        else{
            
            imgArrayIndex--;
            if(imgArrayIndex < 0) imgArrayIndex = thumbnailArray.length - 1;
            displayImage(imgArrayIndex);
            bSelectedPlay = false;
        }
    }
    if(keyboard.getSelPress()){

        if(lastMode === "rec"){

            recCommands(selectedRec);
        }
        else if(bSelectedPlay){

            playCommands(Number(bSelectedPlay));
        }
        else{

            var tmpChoice = dialog.choice(fileNamesDict[thumbnailArray[imgArrayIndex]], true);
            fetchFullFile(tmpChoice);
        }
    }
}

function playCommands(index){

    switch(index){

        case 0:
            imgArrayIndex = thumbnailArray.length - 1;
            displayImage(imgArrayIndex);
            break;
        case 1:

            selectedRec = 0;
            fetchCommand("/cam.cgi?mode=camcmd&value=recmode");
            break;
        
        default:

            dialog.error("Something went wrong " + index);
            break;
    }
}

function recCommands(index){

    switch(index){

        case 0:

            var bDidSnap = fetchCommand("/cam.cgi?mode=camcmd&value=capture");
            if(bDidSnap.ok){
                
                var bButDidItReally = parseValue(bDidSnap.body, "result");
                display.setCursor(110, 150);
                if(bButDidItReally) display.println("  DONE  ");
            }
            break;
        case 1:

            var startStop = bIsRecording ? "video_recstop" : "video_recstart";
            fetchCommand("/cam.cgi?mode=camcmd&value=" + startStop);
            bIsRecording = !bIsRecording;
            drawGUI();
            break;
        case 2:

            bSelectedPlay = false;
            fetchCommand("/cam.cgi?mode=camcmd&value=playmode");
            lastMode = "play";
            getImageNames(50);
            displayImage(imgArrayIndex);
            break;
        default:

            dialog.error("Something went wrong " + index, true);
            break;
    }
}

function populateObject(data){

    var dtMap = {};

    for(var i = 0; i < data.length; i++){

        var tmpFile = data[i];
        var prefix = tmpFile.substr(0, 2);
        var dot = tmpFile.indexOf(".");
        if(dot === -1) continue;
        var tmpID = tmpFile.substring(2, dot);

        if (prefix === "DT") {

            thumbnailArray.push(tmpFile);
            if(!fileNamesDict[tmpFile]){

                fileNamesDict[tmpFile] = [];
            }
            dtMap[tmpID] = tmpFile;
        }
    }
    for(var j = 0; j < data.length; j++){

        var tmpFile2 = data[j];
        var prefix2 = tmpFile2.substr(0, 2);
        var dot2 = tmpFile2.indexOf(".");
        if(dot2 === -1) continue;

        if(prefix2 === "DT") continue;

        var tmpID2 = tmpFile2.substring(2, dot2);
        var dtFile = dtMap[tmpID2];

        if(dtFile){

            if(!fileNamesDict[dtFile]){
                fileNamesDict[dtFile] = [];
            }

            fileNamesDict[dtFile].push(tmpFile2);
            var noDUpes = removeDupes(fileNamesDict[dtFile]);
            fileNamesDict[dtFile] = noDUpes.concat();
        }
    }
    var tempArray = removeDupes(thumbnailArray);
    thumbnailArray = tempArray.concat();
}

function displayImage(index){

    try{

        display.fill(BRUCE_BGCOLOR);
        currentImage = thumbnailArray[index];
        fetchBinaryFIle(currentImage, "cache/");
        currentFullPath = {fs: "sd", path: "/GibsFiles/cache/" + currentImage};
        dialog.drawStatusBar();
        display.drawJpg(currentFullPath, 80, 30);
        display.setCursor(83, 150);
        display.setTextColor(BRUCE_PRICOLOR);
        display.setTextSize(2.5);
        display.println(currentImage);
    }
    catch(erdi){

        display.error("image error: " + erdi);
    }
}

function parseImageNames(names){

    var re = /:50001\/(D[^<\s]+)(?:&lt;\/res&gt;)/g;

    var out = [];
    var tmp;

    while((tmp = re.exec(names)) !== null){

        out.push(tmp[1]);
    }
    return out;
}

function parseValue(data, tag) {

    try{
        return data.match(new RegExp("<" + tag + ">(.*?)</" + tag + ">"))[1];
    }
    catch(evv){

        return null;
    }
}

function drawShape(shape, x, y, width, height, radius, color0, color1, direction){

    if (shape === undefined) shape = random(0, 9);
    if (x === undefined) x = random(0, displayWidth / 2);
    if (y === undefined) y = random(0, displayHeight / 2);
    if (width === undefined) width = random(0, displayWidth);
    if (height === undefined) height = random(0, displayHeight);
    if (radius === undefined) radius = random(0, displayHeight / 4);
    if (color0 === undefined) color0 = random(0, 65535);
    if (color1 === undefined) color1 = random(0, 65535);
    if (direction === undefined) direction = (random(0, 1) < 0.5 ? "horizontal" : "vertical");

    switch(shape){

        case 0:
            display.drawPixel(x * 2, y * 2, color0);
            break;
        case 1:
            display.drawLine(x * 2, y * 2, width, height, color0);
            break;
        case 2:
            display.drawRect(x, y, width, height, color0);
            break;
        case 3:
            display.drawFillRect(x, y, width, height, color0);
            break;
        case 4:
            display.drawFillRectGradient(x, y, width, height, color0, color1, direction);
            break;
        case 5:
            display.drawRoundRect(x, y, width, height, radius, color0);
            break;
        case 6:
            display.drawFillRoundRect(x, y, width, height, radius, color0);
            break;
        case 7:
            display.drawCircle(x * 2, y * 2, radius, color0);
            break;
        case 8:
            display.drawFillCircle(x * 2, y * 2, radius, color0);
            break;
    }
}

function removeDupes(data){

    var seen = {};
    var result = [];
    for(var i = 0; i < data.length; i++){

        if(!seen[data[i]] && data[i].trim() !== ""){
            seen[data[i]] = true;
            result.push(data[i]);
        }
    }
    return result;
}

function autoPoll(){

    var nowTime = now();
    if(nowTime - lastPollTime > pollInterval){
        
        lastPollTime = nowTime;
        try{

            var response = fetchCommand("/cam.cgi?mode=getstate");
        }
        catch(erap){
            
            display.println("Error polling: " + erap);
        }
        if(response.body){
            
            var currentMode = parseValue(response.body, "cammode");
            var currentRec = parseValue(response.body, "rec");
            var currentTemp = parseValue(response.body, "temperature");
            var currentBatt = parseValue(response.body, "batt");
            var currentShots = parseValue(response.body, "remaincapacity");

            if(currentMode !== lastMode || currentRec !== lastRec || currentTemp !== lastTemp || currentShots !== shotsLeft || currentBatt !== lastBatt){

                lastMode = currentMode;
                lastRec = currentRec;
                lastTemp = currentTemp;
                lastBatt = currentBatt;
                shotsLeft = currentShots;
                if(lastMode !== "play") drawGUI();
            }
        }
    }
}

function drawGUI(){

    display.fill(BRUCE_BGCOLOR);
    dialog.drawStatusBar();
    display.setCursor(0, 30);
    display.setTextColor(BRUCE_PRICOLOR);
    display.setTextSize(2.5);
    if(bAddFlare) drawShape();
    if(lastMode === "rec"){

        for(var i = 0; i < recModeCommands.length; i++){
                
            if((i === selectedRec && !bIsRecording)){
                
                display.println("> " + recModeCommands[i]);
            }
            else if(i === selectedRec && bIsRecording && recModeCommands[i] === "Start recording"){
                
                display.println("> Stop recording");
            }
            else if(recModeCommands[i] === "Start recording" && bIsRecording){
                
                display.println("  Stop recording");
            }
            else if(i === selectedRec){
                
                display.println("> " + recModeCommands[i]);
            }
            else if(recModeCommands === undefined || selectedRec >= recModeCommands.length){
                
                dialog.error("GUI ERROR: " + recModeCommands.length + " " + selectedRec);
            }
            else{
                
                display.println("  " + recModeCommands[i]);
            }
        }
    }
    else{

        for(var i = 0; i < playModeCommands.length; i++){

            // var f = bSelectedPlay ? 1 : 0;
            if(i === (bSelectedPlay ? 1 : 0)){

                display.println("> " + playModeCommands[i]);
            }
            else{

                display.println("  " + playModeCommands[i]);
            }
        }
    }
    bCmdChanged = false;
    display.println("\nMode: " + lastMode + "  Temp: " + lastTemp + (lastMode === "play" ? "" : "\nRec: " + lastRec + " Shots left: " + shotsLeft));
    display.println("Battery: " + lastBatt);
    if(lastMode === "play"){
        
        display.setCursor(230, 30);
        display.println(thumbnailArray.length + "/" + totalImages);
    }
}

function saveSettings(){

    savedIPs.push(cameraIP);
    savedMACs.push(cameraMAC);
    savedSSIDs.push(networkSSID);
    savedPasses.push(networkPass);
    savedIPs = removeDupes(savedIPs);
    savedMACs = removeDupes(savedMACs);
    savedSSIDs = removeDupes(savedSSIDs);
    savedPasses = removeDupes(savedPasses);
    var result = savedIPs.join(",") + "\n" + savedMACs.join(",") + "\n" + savedSSIDs.join(",") + "\n" + savedPasses.join(",") + "\n" + directSSID + "\n" + directPass;
    result = result.replace(/\r/g, "");
    storage.write(settingsLocation, result, "write");
}

function loadSettings(location){

    var raw = storage.read(location);
    raw = raw.replace(/\r/g, "");
    var lines = raw.split("\n");
    savedIPs = lines[0].split(",");
    savedMACs = lines[1].split(",");
    savedSSIDs = lines[2].split(",");
    savedPasses = lines[3].split(",");
    directSSID = lines[4];
    directPass = lines[5];
}

function tryConnecting(ssid, pass){

    if(ssid !== "" && pass !== ""){

        try{
            
            dialog.info("Connecting to " + ssid);
            wifi.connect(ssid, 10, pass);
            display.fill(BRUCE_BGCOLOR);
        }
        catch(ertc){
            
            dialog.error("Failed connecting to " + ertc);
        }
    }
}

function debugDisplay(debugData, bWaitForEsc){

    display.fill(BRUCE_BGCOLOR);
    display.setTextColor(BRUCE_PRICOLOR);
    display.setCursor(0, 0);
    display.setTextSize(2);
    display.println(debugData);
    if(!bWaitForEsc){

        while(true){
 
            if(keyboard.getAnyPress()){
                
                break;
            }
        }   
    }
}

function getSSID(){

    var SSIDList = [];
    var scanResults = wifi.scan();
    for(var i = 0; i < scanResults.length; i++){
        
        SSIDList.push(scanResults[i]["SSID"]);
    }
    SSIDList.push("hidden");
    var chosenSSID = dialog.choice(SSIDList);
    if(chosenSSID === "hidden"){

        var chosenSSID = keyboard.keyboard("", 32, "SSID");
    }
}

function newWanConnection(){

    var selectedSSID = getSSID();
    var selectedPass = keyboard.keyboard("", 64, "Password");
    savedSSIDs.push(selectedSSID);
    savedPasses.push(selectedPass);
    savedSSIDs = removeDupes(savedSSIDs);
    savedPasses = removeDupes(savedPasses);
    tryConnecting(selectedSSID, selectedPass);
}

function directMode(){

    if(wifi.connected()) wifi.disconnect();
    if(directSSID === ""){

        directSSID = getSSID();
        directPass = keyboard.keyboard("", 64, "Password");
    }
    tryConnecting(directSSID, directPass);
}

function wanMode(){

    if(savedSSIDs.length > 0 && savedSSIDs[0] !== ""){

        for(var i = 0; i < savedSSIDs.length; i++){

            tryConnecting(savedSSIDs[i], savedPasses[i]);
        }
    }
    else{

        newWanConnection();
    }
}

function chooseMode(){

    display.fill(BRUCE_BGCOLOR);
    // if(!wifi.connected()){
        
        // STUPID! Returns: "Direct" or "right"
        if(dialog.message("Choose mode of operation\nfor your camera,\nplease", {left: "Direct", right: "Use WAN"}) === "Direct"){
            
            directMode();
        }
        else{

            wanMode();
        }
    // }
}

function checkIPs(){

    if(wifi.connected()){

        if(savedIPs.length > 0){
            
            var bShookHand = false;
            for(var ip = 0; ip < savedIPs.length; ip++){
                
                cameraIP = savedIPs[ip];
                for(var mac = 0; mac < savedMACs.length; mac++){
                    
                    cameraMAC = savedMACs[mac];
                    dialog.info("Trying IP: " + cameraIP + " MAC: " + cameraMAC);
                    bShookHand = doTheHandshake();
                    if(bShookHand) break;
                }
            }
            return bShookHand;
        }
    }
    else return false;
}

function getCameraCreds(){

    display.fill(BRUCE_BGCOLOR);
    var IPManual = savedIPs.concat();
    var MACManual = savedMACs.concat();
    IPManual.push("enter new");
    MACManual.push("enter new");
    cameraIP = dialog.choice(IPManual);
    if(cameraIP === "enter new"){
        
        cameraIP = keyboard.numKeyboard("192.168.54.1", 16, "Camera IP");
    }
    cameraMAC = dialog.choice(MACManual);
    if(cameraMAC === "enter new"){
    
        cameraMAC = keyboard.keyboard("00AA11BB22CC", 16, "Camera MAC");
        cameraMAC = to_upper_case(cameraMAC);
    }
    savedIPs.push(cameraIP);
    savedMACs.push(cameraMAC);
}

function doTheHandshake(){

    try{
        fetchCommand(":60606/" + cameraMAC + "/Server0/ddd");
        var handshakeResponse = fetchCommand("/cam.cgi?mode=accctrl&type=req_acc&value=4D454930-0100-1000-8001-" + cameraMAC + "&value2=Brumix");
        if(handshakeResponse.body !== ""){

            fetchCommand("/cam.cgi?mode=camcmd&value=recmode");
            bDoRun = true;
            return true;
        }
        else{
            
            bDoRun = false;
            return false;
        }
    }
    catch(erhs){

        // dialog.error("Handshake failed: " + erhs, false);
    }
}

function tryRestoring(){

    try{
        
        loadSettings(settingsLocation);
    }
    catch(ertr){

        restoreFromFile();
    }
}

function restoreFromFile(){

    try{
        display.fill(BRUCE_BGCOLOR);
        dialog.drawStatusBar();
        var doLoadSettings = dialog.message("Config file not found.\nDo you have one?", {left: "No", right: "Yes"}); // STUPID! Returns: "No" or "right"
        if(doLoadSettings === "right"){

            var selectedPath = dialog.pickFile("/", "conf");
            loadSettings(selectedPath);
        }
    }
    catch(errff){

        dialog.error("restoreFromFile: " + selectedPath + " - " + errff);
    }
}

function initialise(){

    tryRestoring();
    var isDirect = chooseMode();
    var didItGoThrough = false;
    if(!checkIPs() && wifi.connected()){

        getCameraCreds();
        didItGoThrough = doTheHandshake();
    }
    if(!wifi.connected() && !didItGoThrough){

        dialog.error("Failed to connect. Check settings and try again", false);
    }
    else{

        saveSettings();
    }
}

function mainLoop(){

    initialise();
    try{
        while(bDoRun){

            handleInput();
            autoPoll();
            if(bCmdChanged){
                
                drawGUI();
            }
        }
    }
    catch(err){

        dialog.error("Mainloop Error: " + err, true);
    }
}

mainLoop();
