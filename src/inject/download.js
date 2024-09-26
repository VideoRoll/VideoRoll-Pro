(function (window) {
    window.videoRollCurrentSource = {
        mediaSource: null,
        blobUrl: '',
        video: [],
        audio: []
    };

    // const originalCreateObjectURL = URL.createObjectURL;
    // URL.createObjectURL = function (blob) {
    //     const blobUrl = originalCreateObjectURL.apply(this, arguments);

    //     if (blob instanceof MediaSource) {
    //         window.videoRollCurrentSource.mediaSource = blob;
    //         window.videoRollCurrentSource.blobUrl = blobUrl;
    //         console.log('Blob URL:', blob, blobUrl);
    //     }

    //     return blobUrl;
    // };
    // const _endOfStream = window.MediaSource.prototype.endOfStream
    // window.MediaSource.prototype.endOfStream = function () {
    //     return _endOfStream.apply(this, arguments)
    // }

    // window.MediaSource.prototype.endOfStream.toString = function () {
    //     //  console.log('endOfStream hook is detecting!');
    //     return _endOfStream.toString();
    // }

    // const _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
    // window.MediaSource.prototype.addSourceBuffer = function (mime) {
    //     console.log(this === currentSource, this, currentSource);
    //     console.log('mime', mime);
    //     // if (this === window.videoRollCurrentSource.mediaSource) {
            
    //     // }

    //     // if (mime.toString().indexOf('audio') !== -1) {
    //     //     window.videoRollCurrentSource.audio = [];
    //     //     //    console.log('audio array cleared.');
    //     // } else if (mime.toString().indexOf('video') !== -1) {
    //     //     window.videoRollCurrentSource.video = [];
    //     // }
    //     let sourceBuffer = _addSourceBuffer.call(this, mime)
    //     const _append = sourceBuffer.appendBuffer
    //     sourceBuffer.appendBuffer = function (buffer) {
    //         //    console.log(mime, buffer);
    //         // if (mime.toString().indexOf('audio') !== -1) {
    //         //     window.videoRollCurrentSource.audio.push(buffer);
    //         // } else if (mime.toString().indexOf('video') !== -1) {
    //         //     window.videoRollCurrentSource.video.push(buffer)
    //         // }
    //         _append.call(this, buffer)
    //     }


    //     sourceBuffer.appendBuffer.toString = function () {
    //         //    console.log('appendSourceBuffer hook is detecting!');
    //         return _append.toString();
    //     }

    //     return sourceBuffer
    //     // return _addSourceBuffer.call(this, mime);
    // }

    // window.MediaSource.prototype.addSourceBuffer.toString = function () {
    //     // console.log('addSourceBuffer hook is detecting!');
    //     return _addSourceBuffer.toString();
    // }

    const _endOfStream = window.MediaSource.prototype.endOfStream
    window.MediaSource.prototype.endOfStream = function () {
        window.isComplete = 1;
        return _endOfStream.apply(this, arguments)
    }
    window.MediaSource.prototype.endOfStream.toString = function () {
        //  console.log('endOfStream hook is detecting!');
        return _endOfStream.toString();
    }

    const _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
    window.MediaSource.prototype.addSourceBuffer = function (mime) {
        // console.log("MediaSource.addSourceBuffer ", mime)
        if (mime.toString().indexOf('audio') !== -1) {
            window.audio = [];
            //    console.log('audio array cleared.');
        } else if (mime.toString().indexOf('video') !== -1) {
            window.video = [];
            //    console.log('video array cleared.');
        }
        let sourceBuffer = _addSourceBuffer.call(this, mime)
        const _append = sourceBuffer.appendBuffer
        sourceBuffer.appendBuffer = function (buffer) {
            //    console.log(mime, buffer);
            if (mime.toString().indexOf('audio') !== -1) {
                window.audio.push(buffer);
            } else if (mime.toString().indexOf('video') !== -1) {
                window.video.push(buffer)
            }
            _append.call(this, buffer)
        }

        sourceBuffer.appendBuffer.toString = function () {
            //    console.log('appendSourceBuffer hook is detecting!');
            return _append.toString();
        }
        return sourceBuffer
    }

    window.MediaSource.prototype.addSourceBuffer.toString = function () {
        // console.log('addSourceBuffer hook is detecting!');
        return _addSourceBuffer.toString();
    }

})(window)