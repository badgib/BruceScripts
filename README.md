# Gib's scripts for Bruce firmware

This is a combined repository of all the little bits of code I wrote. Some are even pretty useful, some are just an exercise but still fun, in my opinion.

## So what's what?

### LumixControl 

is a replacement for the terrible `Panasonic Image App` that's been annoying me whenever I needed a remote shutter. So I sniffed and prodded and got this little gem. It lets you snap photos, record videos and even preview your images on the screen! Yes, they're just thumbnails but it's enough to at least see if it's exposed correctly.

### TransmitMenu

Is an app that allows you to put all your frequently used IR and SubGHz codes in one place. No more scrolling through dozens of files to find one. Now they're all neatly sorted and easily accessible. It even extracts single IR commands and caches them into separate files so there's no spamming of all the saved commands.

### AllPlayer

Is a fun little RTTTS (think Nokia ringtones) files. It can read eithe a directory of files or one file with melodies (one per line). A gimmick? Yes. Useful? Kinda - you can always make people laugh when you play a melody from doom or mario... (NokiaPlayer was a first version, it sneaked in so I'm leaving it here but it's not updated, nor good)

### PoolShark

A tiny version of billiards. It's in its infancy and many things need to be added etc. But core gameplay seems to work - you can hit the cue ball, it can hit other balls, they scatter all around and even can go into the pockets! What are you waiting for? Just give it a try! You'll be astonished what can be done on such a tiny device

### TextEdit

Very basic text editor. I figured out that it might be just good enough when in a pinch and without any other way of modifying files. But yeah, it's barebones and was just an exercise.

### BouncyBalls

This one is fun! Yes, it's just a bunch of bouncing balls... But those have physics! Mass! They collide! And all that with pretty decent framerate too! Use next to spawn more, prev to despawn random, select to nudge random, esc to quit. This was also an exercise that was fun! Go ahead, try playing with it

### ShapeSpam/PixelFun/TrippyShark

Basically the same codebase but with different intents. Plans changed so now they're all in here. Another exercise but with interesting results. I wanted to go through the display library and experiment and this is the outcome. Randomness is fun

### BoilerPlate

Is my go-to template to start fresh projects with ease, not much to say about it

### BitSPlay

This one just represents a dec value in binary using some graphics, one of the first projects, purely for the exercise

### Cube3D

Another simple exercise, name should tell it all. There's not much more to it

## Bugs found

### dialog.message()

dialog.message(str, {left: "LEFT", center: "CENTER" right: "RIGHT"}) should always return keys. But it doesn't. For some reason right is broken and instead it returns the value

### ir.transmitFile()
### serial.cmd(ir tx_from_file)
### IR SpamAll from file menu

Both of those commands suffer from the same issue. They don't transmit anything. Tried that on a couple files and it's refusing to transmit anything in those modes of operation. I had to work around it by reading the files and sending it via serial.cmd(ir tx) which might fail when someone will try to use a raw file, I'm sure

## Undocumented?

### display.drawArc(x, y, r, ir, startAngle, endAngle, fgCol, bgCol, smooth), draw(Fill)Triangle(x1,y1,x2,y2,x3,y3, c), 

### display.setBrightness() and getBrightness

Those work as suspected, restore isn't yet clear but I didn't play around too much with it

### display.drawFastHLine(x, y, w/h, c) and drawFastVLine

Those also work as intended. Seem great for fast horizontal and vertical ones, good to know

### drawWideLine(x1, y1, x2, y2, w, c)

This one isn't the greatest. It's slow, aliasing is bad and I don't recommend using it at all, yet

### display.drawTriangle(x1, y1, x2, y2, x3, y3, c) and drawFillTriangle

Those seem to work a-ok and draw nice triangles

### keyboard.numKeyboard

Like name suggests - it spawns a nice numpad

 keyboard.getKeysPressed() setLongPress
    JS_SetPropertyStr(ctx, obj, "grove_sda", JS_NewInt32(ctx, bruceConfigPins.i2c_bus.sda));
    JS_SetPropertyStr(ctx, obj, "grove_scl", JS_NewInt32(ctx, bruceConfigPins.i2c_bus.scl));
    JS_SetPropertyStr(ctx, obj, "serial_tx", JS_NewInt32(ctx, bruceConfigPins.uart_bus.tx));
    JS_SetPropertyStr(ctx, obj, "serial_rx", JS_NewInt32(ctx, bruceConfigPins.uart_bus.rx));
    JS_SetPropertyStr(ctx, obj, "spi_sck", JS_NewInt32(ctx, SPI_SCK_PIN));
    JS_SetPropertyStr(ctx, obj, "spi_mosi", JS_NewInt32(ctx, SPI_MOSI_PIN));
    JS_SetPropertyStr(ctx, obj, "spi_miso", JS_NewInt32(ctx, SPI_MISO_PIN));
    JS_SetPropertyStr(ctx, obj, "spi_ss", JS_NewInt32(ctx, SPI_SS_PIN));
    JS_SetPropertyStr(ctx, obj, "ir_tx", JS_NewInt32(ctx, TXLED));
    JS_SetPropertyStr(ctx, obj, "ir_rx", JS_NewInt32(ctx, RXLED));

    i2c!!
    JSValue native_runtimeToBackground(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv);
JSValue native_runtimeToForeground(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv);
JSValue native_runtimeIsForeground(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv);
JSValue native_runtimeMain(JSContext