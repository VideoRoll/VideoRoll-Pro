document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const imgData = params.get('imgData');
    if (imgData) {
        document.getElementById('screenshot').src = imgData;
    }
});