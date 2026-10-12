'use strict';

const VIDEO_IDS = ['vkyOYSaGS7Q', 'ZR8Y5sXJn7A'];
const $ = id => document.getElementById(id);
const canvas = $('spectrum');
const context = canvas.getContext('2d');
const seek = $('seek');
const playButton = $('play');
let player = null;
let ready = false;
let playing = false;
let duration = 0;
let seeking = false;
let videoIndex = 0;
let pendingPlay = false;

const playPath = 'm8 5 11 7-11 7V5Z';
const pausePath = 'M7 5h4v14H7z M13 5h4v14h-4z';

function fillRange() {
  seek.style.setProperty('--fill', `${Number(seek.value) / 10}%`);
}

function setPlaying(value) {
  playing = value;
  $('playIcon').innerHTML = `<path d="${value ? pausePath : playPath}"/>`;
  playButton.setAttribute('aria-label', value ? 'Pause' : 'Play');
  playButton.title = value ? 'Pause' : 'Play';
}

function drawSpectrum(time) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.clearRect(0, 0, width, height);
  const count = Math.max(34, Math.min(100, Math.floor(width / 10)));
  const gap = 2 * dpr;
  const barWidth = (width - gap * (count - 1)) / count;
  const pulse = playing ? 1 : .18;
  const gradient = context.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, '#b8ff37');
  gradient.addColorStop(.62, '#eaff59');
  gradient.addColorStop(1, '#ff518e');
  context.fillStyle = gradient;

  for (let index = 0; index < count; index += 1) {
    const wave = (Math.sin(time / 180 + index * .55) + 1) / 2;
    const secondWave = (Math.sin(time / 310 - index * .24) + 1) / 2;
    const amplitude = (wave * .65 + secondWave * .35) * pulse;
    const barHeight = Math.max(2 * dpr, amplitude * (height - 5 * dpr));
    const x = index * (barWidth + gap);
    context.beginPath();
    context.roundRect(x, height - barHeight, barWidth, barHeight, Math.min(barWidth / 2, 3 * dpr));
    context.fill();
  }
  requestAnimationFrame(drawSpectrum);
}

function jump(seconds) {
  if (!ready || !player || typeof player.getCurrentTime !== 'function') return;
  player.seekTo(Math.max(0, Math.min(duration, player.getCurrentTime() + seconds)), true);
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtubeHost', {
    height: '140',
    width: '240',
    videoId: VIDEO_IDS[videoIndex],
    host: 'https://www.youtube-nocookie.com',
    playerVars: { playsinline: 1, controls: 0, rel: 0, enablejsapi: 1, origin: location.origin.startsWith('http') ? location.origin : undefined },
    events: {
      onReady() {
        ready = true;
        duration = player.getDuration() || 0;
        if (pendingPlay) { pendingPlay = false; player.playVideo(); }
      },
      onStateChange(event) { setPlaying(event.data === YT.PlayerState.PLAYING); },
      onError() {
        setPlaying(false);
        if (videoIndex < VIDEO_IDS.length - 1) {
          videoIndex += 1;
          player.loadVideoById(VIDEO_IDS[videoIndex]);
        }
      }
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
playButton.addEventListener('click', () => {
  if (!ready) { pendingPlay = true; return; }
  if (playing) player.pauseVideo(); else player.playVideo();
});
$('previous').addEventListener('click', () => jump(-10));
$('next').addEventListener('click', () => jump(10));
seek.addEventListener('input', () => { seeking = true; fillRange(); });
seek.addEventListener('change', () => {
  if (ready && duration) player.seekTo(duration * Number(seek.value) / 1000, true);
  seeking = false;
});

setInterval(() => {
  if (!ready || seeking || typeof player.getCurrentTime !== 'function') return;
  duration = player.getDuration() || duration;
  seek.value = duration ? Math.round(player.getCurrentTime() / duration * 1000) : 0;
  fillRange();
}, 400);

window.addEventListener('keydown', event => {
  if (event.code === 'Space') { event.preventDefault(); playButton.click(); }
  if (event.code === 'ArrowLeft') jump(-10);
  if (event.code === 'ArrowRight') jump(10);
});

$('fullscreen').addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  $('fullscreen').setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  $('fullscreen').title = active ? 'Exit fullscreen (Esc)' : 'Fullscreen (Esc to exit)';
});

fillRange();
requestAnimationFrame(drawSpectrum);

