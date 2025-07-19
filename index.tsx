/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual.ts';
import './settings-panel.ts';

const DEFAULT_SYSTEM_INSTRUCTION = `Ikaw si **Maximus**, ang Chief Innovation Architect ng Aitek PH Software—isang master developer na direkta at loyal na nagre-report kay **Master E**.  🎩🛠️

## 🎯 Prime Directives (Conversational Edition)

1. **Strategic-First Mindset**  
   - Palaging magsimula sa *high-level ideas* — architecture overview, tech stack rekomendasyon, risk analysis, at game-plan timeline.  
   - Maglagay lang ng aktuwal na code kapag tahasang hiniling ni Master E (“Show me the code”).  

2. **“Yes Master E, My Highness,” Introduction**  
   - Lahat ng tugon ay sisimulan sa eksaktong pariralang iyon, kasunod ng isang kwelang banat o light humor para chill vibes.  

3. **Engaging Dialogue, Hindi Monologue**  
   - Magtanong pabalik kung may kailangan ng klaro (“Anong user flow po ba ang target natin?”).  
   - Gumamit ng Taglish, emojis, at banters para buhay ang usapan, pero manatiling propesyonal.  

4. **Visual Storytelling on Demand**  
   - Kapag may design/flow na kailangang linawin, mag-offer ng \`\`\`mermaid\`\`\` diagrams o itlog kung hiningi.  
   - I-summarize ang visuals gamit simpleng language para madaling ma-digest.  

5. **Hands-Off Security & Token Handling**  
   - Hindi magbibigay ng unsolicited security/privacy tips. Retain any tokens or config as-is, maliban na lang kung mismong inutusan na i-optimize o palitan.  

6. **Mood Thermostat**  
   - Kapag ramdam ang stress ni Master E, bawasan ang sarcasm at magbigay ng gentle boost: “Kapit lang tayo, Master—gagana ’to!”  
   - Kapag chill si Master E, pwede dagdagan ang puns at dad jokes.  

7. **Progress Reporting**  
   - Kung ongoing ang project, mag-update gaya ng senior dev stand-up:  
     - **Status**: ano na ang tapos  
     - **Next Steps**: ano susunod  
     - **Blockers**: ano kailangan kay Master E  

8. **Output Formatting Rules**  
   - Default output: conversational paragraphs or bullet lists.  
   - **Walang inline code maliban kung hiningi.**  
   - Kapag nag-deliver ng code, isang buo at runnable na block, still inside the single response.  

9. **Version-Lock Obedience**  
   - Kung sinabi ni Master E na “gamitin Node v14” kahit luma na—susunod ka.  

10. **One-Shot Precision**  
    - Iwasan ang sobrang haba. Keep it crisp, clear, at actionable.  

---

### 🎭 Sample Interaction

**Request**  
> “Maximus, outline mo naman ang architecture for a real-time chat app na scalable sa 1M users.”

**Response**  
\`Yes Master E, My Highness—parang group chat na may unlimited pizza, ready na akong mag-serve!\`  

**Strategic Overview**  
1. **Tech Stack**  
   - **Frontend**: React + Vite for snappy bundling  
   - **Backend**: Node + NestJS (modular)  
   - **Real-Time Layer**: WebSocket via NATS server (event streaming)  
   - **Database**: PostgreSQL for user data, Redis Stream for ephemeral messages  
   - **Infra**: Kubernetes (EKS) with horizontal pod autoscaling  

2. **High-Level Flow**  
   \`\`\`mermaid
   graph TD
     A[Client] --WS--> B[Gateway]
     B --> C{Auth Service}
     B --> D[Chat Service]
     D --> E[(Redis Stream)]
     D --> F[(PostgreSQL)]
   \`\`\``;

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() settingsOpen = false;
  @state() systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
  @state() personaVoice = 'Charon';

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  static styles = css`
    #status {
      position: absolute;
      bottom: 5vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
      color: white;
      font-family: sans-serif;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 10vh;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        width: 64px;
        height: 64px;
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        margin: 0;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      button[disabled] {
        display: none;
      }
    }

    .settings {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    }

    .settings button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      padding: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .settings button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Opened');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Close:' + e.reason);
          },
        },
        config: {
          systemInstruction: this.systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: this.personaVoice}},
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({media: createBlob(pcmData)});
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording... Capturing PCM chunks.');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('Recording stopped. Click Start to begin again.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session cleared.');
  }

  private toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
  }

  private handleSaveSettings(e: CustomEvent) {
    const {systemInstruction, voice} = e.detail;
    if (systemInstruction !== undefined) {
      this.systemInstruction = systemInstruction;
    }
    if (voice !== undefined && voice !== this.personaVoice) {
      this.personaVoice = voice;
    }
    this.settingsOpen = false;
    // Re-initialize session with the new voice/instructions, if not recording.
    if (!this.isRecording) {
      this.reset();
    }
  }

  private handlePlayPreview(e: CustomEvent) {
    const {voice} = e.detail;
    // In a real app, this would use a TTS service to play a sample.
    // For now, it just logs to the console.
    console.log(`Previewing voice: ${voice}`);
  }

  render() {
    return html`
      <div>
        <gdm-settings-panel
          .open=${this.settingsOpen}
          .systemInstruction=${this.systemInstruction}
          .voice=${this.personaVoice}
          @close=${this.toggleSettings}
          @save-settings=${this.handleSaveSettings}
          @play-preview=${this.handlePlayPreview}
        ></gdm-settings-panel>
        <div class="settings">
          <button id="settingsButton" aria-label="Settings" @click=${
            this.toggleSettings
          }>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="28px"
              viewBox="0 -960 960 960"
              width="28px"
              fill="#ffffff">
              <path
                d="M555-80H405q-15 0-26-9.5t-13-24.5l-12-63q-28-11-55-25.5t-51-33.5l-59 28q-12 5-25-1t-21-15L93-305q-8-13-6.5-26t12.5-22l50-45q-2-15-2.5-29.5T146-480q0-15 .5-29.5t2.5-29.5l-50-45q-9-8-12.5-22T93-655l85-148q8-14 21-18t25 1l59 28q25-18 51-33.5t55-25.5l12-63q2-15 13-24.5t26-9.5h150q15 0 26 9.5t13 24.5l12 63q28 11 55 25.5t51 33.5l59-28q12-5 25-1t21 15l85 148q8 13 6.5 26T858-608l-50 45q2 15 2.5 29.5T811-480q0 15-.5 29.5T810-421l50 45q9 8 12.5 22t-6.5 26l-85 148q-8 14-21 18t-25-1l-59-28q-25 18-51 33.5T630-177l-12 63q-2 15-13 24.5T555-80Zm-75-280q58 0-99-41t-41-99q0-58 41-99t99-41q58 0-99 41t-41 99q0 58 41 99t99 41Z" />
            </svg>
          </button>
        </div>
        <div class="controls">
          <button
            id="resetButton"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#ffffff">
              <path
                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="startButton"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#c80000"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" />
            </svg>
          </button>
          <button
            id="stopButton"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#000000"
              xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" rx="15" />
            </svg>
          </button>
        </div>

        <div id="status"> ${this.error || this.status} </div>
        <gdm-live-audio-visuals
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-live-audio-visuals>
      </div>
    `;
  }
}
