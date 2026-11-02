
class VoiceEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.recognition = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.visualizerState = 'idle';
    this.frequencyData = new Uint8Array(64);

    this.initAudioContext();
    this.initSpeechRecognition();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  playRingTone() {
    if (this.isMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 1.6);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    } catch (e) {
      console.error("Error playing ring tone:", e);
    }
  }

  playAircallRingTone() {
    if (this.isMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 659.25, time: 0, dur: 0.16 },
        { freq: 880.00, time: 0.16, dur: 0.28 },
        { freq: 1108.73, time: 0.44, dur: 0.42 }
      ];

      notes.forEach(n => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.001, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.12, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur + 0.02);
      });
    } catch (e) {
      console.error("Error playing Aircall ring tone:", e);
    }
  }

  playConnectedChime() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.error(e);
    }
  }

  playHangupBeep() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      [0, 0.15, 0.3].forEach(offset => {
        const now = this.audioCtx.currentTime + offset;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(425, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
      });
    } catch (e) {}
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.onUserSpeechResult) {
          this.onUserSpeechResult(transcript);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      };

      this.recognition.onerror = (err) => {
        console.warn("Speech recognition notice:", err.error);
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      };
    }
  }

  startListening(callback) {
    if (!this.recognition) {
      alert("Speech recognition is not supported in this browser. You can type in the input box or click objection buttons!");
      return;
    }
    this.onUserSpeechResult = callback;
    try {
      this.recognition.start();
      this.isListening = true;
      if (this.onListeningChange) this.onListeningChange(true);
    } catch (e) {
      console.warn("Recognition start issue:", e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    }
  }

  speakAIText(text, onComplete) {
    if (!('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Karen') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.visualizerState = 'speaking_ai';
    this.isSpeaking = true;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.visualizerState = 'connected';
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.visualizerState = 'connected';
      if (onComplete) onComplete();
    };

    if (!this.isMuted) {
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.isSpeaking = false;
        this.visualizerState = 'connected';
        if (onComplete) onComplete();
      }, 1500);
    }
  }

  attachCanvas(canvasElement) {
    this.canvas = canvasElement;
    if (!canvasElement) return;
    this.ctx = canvasElement.getContext('2d');
    this.startWaveformAnimation();
  }

  startWaveformAnimation() {
    if (!this.canvas || !this.ctx) return;
    let step = 0;

    const render = () => {
      const width = this.canvas.width = this.canvas.parentElement.clientWidth;
      const height = this.canvas.height = this.canvas.parentElement.clientHeight;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, width, height);
      step += 0.05;

      const centerY = height / 2;

      if (this.visualizerState === 'idle') {

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#1F293D';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (this.visualizerState === 'ringing') {

        const amplitude = 12 * Math.sin(step * 1.5);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * 0.03 + step * 2) * amplitude;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (this.visualizerState === 'speaking_ai') {

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 3) {
          const y = centerY +
            Math.sin(x * 0.04 + step * 3) * 18 * Math.cos(step * 0.7) +
            Math.sin(x * 0.08 - step * 2) * 8;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 3) {
          const y = centerY + Math.sin(x * 0.02 - step * 2.5) * 12;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (this.visualizerState === 'speaking_user') {

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * 0.05 + step * 4) * 20 * Math.sin(step);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (this.visualizerState === 'connected') {

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 5) {
          const y = centerY + Math.sin(x * 0.02 + step) * 4;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      this.animId = requestAnimationFrame(render);
    };

    render();
  }

  playBeep(freq = 880, duration = 0.09) {
    if (this.isMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Audio cue beep error", e);
    }
  }
}

window.voiceEngine = new VoiceEngine();
