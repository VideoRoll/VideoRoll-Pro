# 🎧audio-hacker
A magical library for controlling audio pitch and volume, based on [jungle.js](https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js)

# Installation
```
npm i audio-hacker

yarn add audio-hacker

pnpm add audio-hacker
```
# Initial Audiohacker

```javascript
import Audiohacker from 'audio-hacker';

const audioCtx = new AudioContext();

if (audioCtx.state !== 'running') {
    await audioCtx.resume();
}

const video = document.querySelector('video');

const source = audioCtx.createMediaElementSource(video);

const audioHacker = new Audiohacker(audioCtx, source);

```

# Update pitch
```javascript

// best step 0.01
audioHacker.setPitchOffset(0.22);
audioHacker.setPitchOffset(-0.12);

```

# Update volume
```javascript

// minimum value is 0;
audioHacker.setVolume(0.3);
audioHacker.setVolume(3.3);

```

# Update panner
```javascript

audioHacker.setPanner(true);
audioHacker.setPanner(false);

```

# Update stereoPanner
```javascript

audioHacker.setStereoPanner(1);
audioHacker.setStereoPanner(-1);

```

# Disconnect
```javascript

audioHacker.disconnect();

```

# What more

If you want to do it in a simpler way, use [Video Roll](https://github.com/VideoRoll/VideoRoll) browser extension. 
