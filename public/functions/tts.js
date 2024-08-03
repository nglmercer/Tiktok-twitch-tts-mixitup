const TTS_API_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech?';
import AudioPlayer from '../htmlcomponents/AudioPlayer.js';
import {Queue, Controlmedia } from './Queueaudio.js';
import SpeechSynthesisRecorder from './speechSynthesisRecorder.js';

const audioPlayer = new AudioPlayer('audio', 
() => controlmedia.playPreviousAudio(), 
() => controlmedia.nextaudio()
);
const controlmedia = new Controlmedia(audioPlayer);
const recorder = new SpeechSynthesisRecorder();
audioPlayer.setAudioInfo('ASDASDASD');

let audioQueue = new Queue();
let lastReadText = null;
let audioMap = {};
let audioKeys = [];
let isPlaying = false;
// let audio = document.getElementById('audio');

async function fetchAudio(txt) {
    try {
        if (txt === lastReadText) {
            return;
        }

        lastReadText = txt;

        if (audioMap[txt]) {
            return audioMap[txt];
        }

        const params = new URLSearchParams({
            voice: getVoiceFromVoiceSelect(),
            text: txt
        });

        const resp = await fetch(TTS_API_ENDPOINT + params.toString());
        if (resp.status !== 200) {
            console.error("Mensaje incorrecto, status code:", resp.status);
            return;
        }

        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        audioMap[txt] = blobUrl;
        audioKeys.push(txt);

        return blobUrl;
    } catch (error) {
        console.error("Error fetchAudio:", error);
    }
}

function getVoiceFromVoiceSelect() {
    let voiceSelect = document.querySelector('#voiceSelectContainer select');
    if (voiceSelect) {
        return voiceSelect.value;
    } else {
        console.error('Voice select element not found');
        return null;
    }
}

function skipAudio() {
    audioPlayer.audio.pause();
    audioPlayer.audio.currentTime = 0;

    if (!audioQueue.isEmpty()) {
        controlmedia.nextaudio();
    } else {
        isPlaying = false;
    }
}


function leerMensajes(text) {
    console.log('leerMensajes', text);
    if (text) {
        fetchAudio(text).then(audioUrl => {
            if (audioUrl) {
                controlmedia.addSong(audioUrl);
                console.log('leerMensajes audioUrl', audioUrl);
            }
        });
    }
}
export class TTS {
    constructor() {
        this.recorder = null;
    }

    async speak(message) {
        console.log('TTS speak', message);

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = document.querySelector('#volume').value;

        const voices = speechSynthesis.getVoices();
        console.log("voices", voices);
        let voiceSelect = document.getElementById('voiceSelect');
        let selectedVoice = voices.find(voice => voice.name === voiceSelect.selectedOptions[0].getAttribute("data-name"));

        if (document.getElementById('randomVoice').checked) {
            selectedVoice = setRandomVoice(voices);
        }

        let speed = document.getElementById('randomSpeedValue').value;
        if (document.getElementById('randomSpeed').checked) {
            speed = setRandomSpeed();
        }

        let pitch = document.getElementById('randomPitchValue').value;
        if (document.getElementById('randomPitch').checked) {
            pitch = setRandomPitch();
        }

        if (message === lastReadText) {
            return;
        }

        lastReadText = message;

        this.recorder = new SpeechSynthesisRecorder({
            text: message,
            utteranceOptions: {
                voice: selectedVoice,
                rate: parseFloat(speed),
                pitch: parseFloat(pitch),
                volume: parseFloat(utterance.volume)
            }
        });

        try {
            const {tts, data} = await this.recorder.start().then(tts => tts.blob());
            const audioUrl = URL.createObjectURL(data);
            console.log('audioUrl', audioUrl);
            
            if (audioUrl) {
                controlmedia.addSong(audioUrl);
            }
            
            document.getElementById("audiotrack").pause();
            document.getElementById("audiotrack").currentTime = 0;
        } catch (error) {
            console.error('Error recording speech:', error);
        }
    }
}


function setRandomVoice(voices) {
    const randomIndex = Math.floor(Math.random() * voices.length);
    return voices[randomIndex];
}

function setRandomSpeed() {
    return (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
}

function setRandomPitch() {
    return (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
}
export { leerMensajes, skipAudio };
