/**
 * Copyright 2024, Gomi 
 * this library is based on jungle.js(https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js)
 *
 * Copyright 2012, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*/

const delayTime = 0.1;
const fadeTime = 0.05;
const bufferTime = 0.1;

export default class Audiohacker {
    context: AudioContext;
    mediaSource: MediaElementAudioSourceNode;
    input: GainNode;
    output: GainNode;
    shiftDownBuffer: AudioBuffer;
    shiftUpBuffer: AudioBuffer;

    mod1: AudioBufferSourceNode;
    mod2: AudioBufferSourceNode;
    mod1Gain: GainNode;
    mod2Gain: GainNode;
    mod3Gain: GainNode;
    mod4Gain: GainNode;
    modGain1: GainNode;
    modGain2: GainNode;
    fade1: AudioBufferSourceNode;
    fade2: AudioBufferSourceNode;
    mix1: GainNode;
    mix2: GainNode;
    delay1: DelayNode;
    delay2: DelayNode;
    delay: DelayNode;
    panner: PannerNode;
    pannerGain: GainNode;
    pannerFilter: BiquadFilterNode;
    pannerConvolver: ConvolverNode;
    pannerCompressor: DynamicsCompressorNode;
    stereo: StereoPannerNode;

    constructor(
        context: AudioContext,
        mediaSource: MediaElementAudioSourceNode
    ) {
        this.context = context;
        this.mediaSource = mediaSource;
        // Create nodes for the input and output of this "module".
        const input = context.createGain();
        const output = context.createGain();
        this.input = input;
        this.output = output;

        // Delay modulation.
        const mod1 = context.createBufferSource();
        const mod2 = context.createBufferSource();
        const mod3 = context.createBufferSource();
        const mod4 = context.createBufferSource();
        this.shiftDownBuffer = this.createDelayTimeBuffer(
            context,
            bufferTime,
            fadeTime,
            false
        );
        this.shiftUpBuffer = this.createDelayTimeBuffer(
            context,
            bufferTime,
            fadeTime,
            true
        );
        mod1.buffer = this.shiftDownBuffer;
        mod2.buffer = this.shiftDownBuffer;
        mod3.buffer = this.shiftUpBuffer;
        mod4.buffer = this.shiftUpBuffer;
        mod1.loop = true;
        mod2.loop = true;
        mod3.loop = true;
        mod4.loop = true;

        // for switching between oct-up and oct-down
        const mod1Gain = context.createGain();
        const mod2Gain = context.createGain();
        const mod3Gain = context.createGain();
        mod3Gain.gain.value = 0;
        const mod4Gain = context.createGain();
        mod4Gain.gain.value = 0;

        mod1.connect(mod1Gain);
        mod2.connect(mod2Gain);
        mod3.connect(mod3Gain);
        mod4.connect(mod4Gain);

        // Delay amount for changing pitch.
        const modGain1 = context.createGain();
        const modGain2 = context.createGain();

        const delay1 = context.createDelay();
        const delay2 = context.createDelay();
        mod1Gain.connect(modGain1);
        mod2Gain.connect(modGain2);
        mod3Gain.connect(modGain1);
        mod4Gain.connect(modGain2);
        modGain1.connect(delay1.delayTime);
        modGain2.connect(delay2.delayTime);

        // Crossfading.
        const fade1 = context.createBufferSource();
        const fade2 = context.createBufferSource();
        const fadeBuffer = this.createFadeBuffer(context, bufferTime, fadeTime);
        fade1.buffer = fadeBuffer;
        fade2.buffer = fadeBuffer;
        fade1.loop = true;
        fade2.loop = true;

        const mix1 = context.createGain();
        const mix2 = context.createGain();
        mix1.gain.value = 0;
        mix2.gain.value = 0;

        fade1.connect(mix1.gain);
        fade2.connect(mix2.gain);

        // Connect processing graph.
        input.connect(delay1);
        input.connect(delay2);
        delay1.connect(mix1);
        delay2.connect(mix2);
        mix1.connect(output);
        mix2.connect(output);

        // Start
        const t = context.currentTime + 0.05;
        const t2 = t + bufferTime - fadeTime;
        mod1.start(t);
        mod2.start(t2);
        mod3.start(t);
        mod4.start(t2);
        fade1.start(t);
        fade2.start(t2);

        this.mod1 = mod1;
        this.mod2 = mod2;
        this.mod1Gain = mod1Gain;
        this.mod2Gain = mod2Gain;
        this.mod3Gain = mod3Gain;
        this.mod4Gain = mod4Gain;
        this.modGain1 = modGain1;
        this.modGain2 = modGain2;
        this.fade1 = fade1;
        this.fade2 = fade2;
        this.mix1 = mix1;
        this.mix2 = mix2;
        this.delay1 = delay1;
        this.delay2 = delay2;

        this.setPitchDelay(delayTime);

        this.output.connect(this.context.destination);
        mediaSource.connect(this.input);
    }

    createFadeBuffer(
        context: AudioContext,
        activeTime: number,
        fadeTime: number
    ): AudioBuffer {
        const length1 = activeTime * context.sampleRate;
        const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
        const length = length1 + length2;
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const p = buffer.getChannelData(0);

        const fadeLength = fadeTime * context.sampleRate;

        const fadeIndex1 = fadeLength;
        const fadeIndex2 = length1 - fadeLength;

        // 1st part of cycle
        for (let i = 0; i < length1; ++i) {
            let value;

            if (i < fadeIndex1) {
                value = Math.sqrt(i / fadeLength);
            } else if (i >= fadeIndex2) {
                value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
            } else {
                value = 1;
            }

            p[i] = value;
        }

        // 2nd part
        for (let i = length1; i < length; ++i) {
            p[i] = 0;
        }

        return buffer;
    }

    createDelayTimeBuffer(
        context: AudioContext,
        activeTime: number,
        fadeTime: number,
        shiftUp: boolean
    ): AudioBuffer {
        const length1 = activeTime * context.sampleRate;
        const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
        const length = length1 + length2;
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const p = buffer.getChannelData(0);

        // 1st part of cycle
        for (let i = 0; i < length1; ++i) {
            if (shiftUp)
                // This line does shift-up transpose
                p[i] = (length1 - i) / length;
            // This line does shift-down transpose
            else p[i] = i / length1;
        }

        // 2nd part
        for (let i = length1; i < length; ++i) {
            p[i] = 0;
        }

        return buffer;
    }

    setPitchOffset(mult: number): void {
        if (mult > 0) {
            // pitch up
            this.mod1Gain.gain.value = 0;
            this.mod2Gain.gain.value = 0;
            this.mod3Gain.gain.value = 1;
            this.mod4Gain.gain.value = 1;
        } else {
            // pitch down
            this.mod1Gain.gain.value = 1;
            this.mod2Gain.gain.value = 1;
            this.mod3Gain.gain.value = 0;
            this.mod4Gain.gain.value = 0;
        }
        this.setPitchDelay(delayTime * Math.abs(mult));
    }

    setPitchDelay(delayTime: number): void {
        this.modGain1.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
        this.modGain2.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
    }

    setVolume(volume: number): void {
        this.output.gain.value = volume;
    }

    setDelay(delay: number): void {
        // this.mediaSource.disconnect(this.delay);
        this.mediaSource.connect(this.input);
        if (!this.delay) {
            this.delay = this.context.createDelay(120.0);
        }
        if (delay === 0 && this.delay?.delayTime.value > 0) {
            this.delay.delayTime.value = 0;
            try {
                this.mediaSource.disconnect(this.delay);
                this.delay.disconnect(this.context.destination);
            } catch (e) {}

            this.delay = null;
            this.mediaSource.connect(this.input);
        } else if (delay > 0) {
            try {
                this.mediaSource.disconnect(this.input);
            } catch (e) {}

            // this.delay.connect(this.input);
            this.mediaSource.connect(this.delay);
            this.delay.connect(this.context.destination);
            this.delay.delayTime.value = delay;
        }
    }

    lerp(start, end, t) {
        return start + (end - start) * t; // 线性插值函数
    }

    setStereoPanner(value: number) {
        if (!this.stereo) {
            this.stereo = this.context.createStereoPanner();
        }

        if (value !== 0) {
            try {
                this.mediaSource?.disconnect(this.input);
                this.mediaSource?.connect(this.stereo);
                this.stereo.connect(this.context.destination);
            } catch (e) {}
        } else {
            if ((this.delay && this.delay.delayTime.value === 0) && !this.panner) {
                this.mediaSource?.connect(this.input);
            }

            this.mediaSource?.disconnect(this.stereo);
            this.stereo?.disconnect(this.context.destination);

            this.stereo = null;
        }
        this.stereo.pan.value = value;
    }

    setPanner(isOn: boolean) {
        if (!this.panner) {
            this.panner = this.context.createPanner();
            this.pannerGain = this.context.createGain();
            this.pannerFilter = this.context.createBiquadFilter();
            this.pannerConvolver = this.context.createConvolver();
            this.pannerCompressor = this.context.createDynamicsCompressor();
        }
        if (isOn === true) {
            try {
                this.mediaSource.disconnect(this.input);
                // this.pannerGain.disconnect(this.pannerGain);
                // this.mediaSource.disconnect(this.delay);
                // this.delay.disconnect(this.context.destination);
            } catch (e) {}

            this.panner.panningModel = "HRTF"; // 使用 HRTF（头相关传递函数）
            this.panner.distanceModel = "linear"; //
            this.panner.refDistance = 1; // 参考距离
            this.panner.maxDistance = 1000; // 最大距离
            this.panner.rolloffFactor = 1; // 衰减因子
            this.panner.coneInnerAngle = 360;
            // this.panner.coneOuterAngle = 90; // 外径
            // this.panner.coneOuterGain = 0.3;
            this.pannerGain.gain.value = 1;
        
            // 定义音源移动的参数
            const speed = 1; // 移动速度
            // const radius = 20; // 移动半径
            const a = 10; // 椭圆长轴
            const b = 8; // 椭圆短轴

            let angle = 0; // 角度

            const animate = () => {
                if (!this.panner) return;

                // 计算 x, y, z 坐标，模拟围绕原点的圆周运动
                const x = a * Math.sin(angle);
                const y = b * Math.cos(angle);
        
                // 使用线性插值平滑过渡位置
                this.panner.setPosition(
                    this.lerp(this.panner.positionX.value, x, 0.1),
                    this.lerp(this.panner.positionY.value, y, 0.1),
                    1
                );

                // 更新角度，循环移动
                angle += speed * 0.01; // 适当增大角度，以控制移动速度

                // 循环调用 animate，创建平滑动画
                requestAnimationFrame(animate);
            };

            // 开始动画
            animate();

            // // this.panner.connect(this.input);
            // this.panner.connect(this.pannerGain);
            this.mediaSource.connect(this.panner);
            this.panner.connect(this.context.destination);
        } else {
            try {
                this.mediaSource?.disconnect(this.panner);
                this.panner?.disconnect(this.context.destination);
                if ((this.delay && this.delay.delayTime.value === 0) && !this.stereo) {
                    this.mediaSource?.connect(this.input);
                }
            } catch (e) {}
            this.panner = null;
            this.pannerFilter = null;
            this.pannerGain = null;
            this.pannerConvolver = null;
            this.pannerCompressor = null
        }
    }

    disconnect(): void {
        this.input?.disconnect();
        this.output?.disconnect();
        this.delay?.disconnect();
        this.panner?.disconnect();
        this.stereo?.disconnect();
    }
}
