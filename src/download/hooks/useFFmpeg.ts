import { FFmpeg } from '@ffmpeg/ffmpeg';
import { markRaw } from 'vue';

export function useFFmpeg() {
    const ffmpeg = markRaw(new FFmpeg());
    return ffmpeg;
}

export * from '@ffmpeg/util';