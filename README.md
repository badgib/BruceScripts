# Gib's scripts for Bruce firmware

This is a combined repository of all the little bits of code I wrote. Some are even pretty useful, some are just an exercise but still fun, in my opinion.

## So what's what?

### LumixControl 

is a replacement for the terrible `Panasonic Image App` that's been annoying me whenever I needed a remote shutter. So I sniffed and prodded and got this little gem. It lets you snap photos, record videos and even preview your images on the screen! Yes, they're just thumbnails but it's enough to at least see if it's exposed correctly.

### TransmitMenu

Is an app that allows you to put all your frequently used IR and SubGHz codes in one place. No more scrolling through dozens of files to find one. Now they're all neatly sorted and easily accessible. It even extracts single IR commands and caches them into separate files so there's no spamming of all the saved commands.

### AllPlayer

Is a fun little RTTTS (think Nokia ringtones) files. It can read eithe a directory of files or one file with melodies (one per line). A gimmick? Yes. Useful? Kinda - you can always make people laugh when you play a melody from doom or mario... (NokiaPlayer was a first version, it sneaked in so I'm leaving it here but it's not updated, nor good)

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
