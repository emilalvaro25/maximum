/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement, PropertyValues, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {VOICES} from './voices';
import {classMap} from 'lit/directives/class-map.js';
import {when} from 'lit/directives/when.js';

const arrowDownSVG = html`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M7 10l5 5 5-5z"/></svg>`;
const playSVG = html`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M8 5v14l11-7z"/></svg>`;
const checkSVG = html`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#8ab4f8"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
const voiceIconSVG = html`<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M12,4.44v.2c0,0.66,0.54,1.2,1.2,1.2c0.66,0,1.2-0.54,1.2-1.2v-0.2c1.48,0.61,2.5,2.07,2.5,3.72c0,2.21-1.79,4-4,4 s-4-1.79-4-4C8.9,6.51,9.92,5.05,11.4,4.44C11.59,4.42,11.79,4.4,12,4.44z"/></g></g></svg>`;

@customElement('gdm-settings-panel')
export class GdmSettingsPanel extends LitElement {
  @property({type: String}) systemInstruction = '';
  @property({type: String}) voice = 'Orus';
  @property({type: Boolean, reflect: true}) open = false;

  @state() private dropdownOpen = false;
  @state() private tempSystemInstruction: string;
  @state() private tempVoice: string;

  willUpdate(changedProperties: PropertyValues<this>) {
    // When the panel is opened, copy the initial properties to temporary state.
    if (changedProperties.has('open') && this.open) {
      this.tempSystemInstruction = this.systemInstruction;
      this.tempVoice = this.voice;
    }
  }

  private handleVoiceSelect(voiceName: string) {
    this.dropdownOpen = false;
    this.tempVoice = voiceName;
  }

  private playPreview(e: Event, voiceName: string) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('play-preview', {
        detail: {voice: voiceName},
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSave() {
    this.dispatchEvent(
      new CustomEvent('save-settings', {
        detail: {
          systemInstruction: this.tempSystemInstruction,
          voice: this.tempVoice,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private closePanel() {
    this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div class="panel-overlay" @click=${this.closePanel}></div>
      <div
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title">
        <div class="header">
          <h2 id="settings-title">Settings</h2>
          <button
            class="close-btn"
            @click=${this.closePanel}
            aria-label="Close settings">
            &times;
          </button>
        </div>
        <div class="content">
          <div class="form-group">
            <label for="system-instruction-input">Skills and Description</label>
            <textarea
              id="system-instruction-input"
              .value=${this.tempSystemInstruction}
              @input=${(e: Event) =>
                (this.tempSystemInstruction = (
                  e.target as HTMLTextAreaElement
                ).value)}></textarea>
          </div>

          <div class="form-group">
            <label id="voice-label">Voice</label>
            <div class="voice-dropdown">
              <button
                class="dropdown-selected"
                @click=${() => (this.dropdownOpen = !this.dropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded=${this.dropdownOpen}
                aria-labelledby="voice-label">
                <div class="dropdown-selected-text">
                  ${voiceIconSVG}
                  <span>${this.tempVoice}</span>
                </div>
                ${arrowDownSVG}
              </button>
              ${when(
                this.dropdownOpen,
                () => html`
                  <ul class="dropdown-list" role="listbox">
                    ${VOICES.map(
                      (v) => html`
                        <li
                          class=${classMap({
                            'dropdown-item': true,
                            selected: this.tempVoice === v.name,
                          })}
                          role="option"
                          aria-selected=${this.tempVoice === v.name}
                          @click=${() => this.handleVoiceSelect(v.name)}>
                          <button
                            class="play-btn"
                            @click=${(e: Event) => this.playPreview(e, v.name)}
                            aria-label=${`Preview voice ${v.name}`}>
                            ${playSVG}
                          </button>
                          <div class="voice-details">
                            <div class="voice-name">${v.name}</div>
                            <div class="voice-desc">${v.description}</div>
                          </div>
                          ${when(
                            this.tempVoice === v.name,
                            () =>
                              html`<span class="check-icon">${checkSVG}</span>`,
                          )}
                        </li>
                      `,
                    )}
                  </ul>
                `,
              )}
            </div>
          </div>
        </div>
        <div class="footer">
          <button class="save-btn" @click=${this.handleSave}>Save</button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Google Sans', sans-serif, system-ui;
    }
    :host(:not([open])) {
      display: none;
    }
    .panel-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
    }
    .panel {
      position: relative;
      background-color: #202124;
      color: #e8eaed;
      border-radius: 8px;
      padding: 24px;
      width: 400px;
      max-width: 90vw;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      z-index: 101;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-shrink: 0;
    }
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    .close-btn {
      background: none;
      border: none;
      color: #9aa0a6;
      font-size: 32px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .content {
      overflow-y: auto;
      flex-grow: 1;
      padding-right: 8px; /* For scrollbar */
      margin-right: -8px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      margin-bottom: 8px;
      color: #bdc1c6;
      font-weight: 500;
    }
    input,
    textarea {
      width: 100%;
      background-color: #3c4043;
      border: 1px solid #5f6368;
      border-radius: 4px;
      color: #e8eaed;
      padding: 10px 12px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    input:focus,
    textarea:focus {
      outline: none;
      border-color: #8ab4f8;
    }
    textarea {
      resize: vertical;
      min-height: 120px;
      height: 200px;
      font-family: inherit;
    }
    .voice-dropdown {
      position: relative;
    }
    .dropdown-selected {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #3c4043;
      border: 1px solid #5f6368;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      color: #e8eaed;
      transition: border-color 0.2s ease;
      text-align: left;
    }
    .dropdown-selected:focus,
    .dropdown-selected:hover {
      border-color: #8ab4f8;
      outline: none;
    }
    .dropdown-selected[aria-expanded='true'] {
      border-color: #8ab4f8;
    }
    .dropdown-selected-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .dropdown-list {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background-color: #2d2e31;
      border: 1px solid #5f6368;
      border-radius: 4px;
      margin: 0;
      max-height: 260px;
      overflow-y: auto;
      z-index: 110;
      padding: 4px;
      list-style: none;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 8px;
      cursor: pointer;
      gap: 12px;
      border-radius: 4px;
    }
    .dropdown-item:hover {
      background-color: #3c4043;
    }
    .dropdown-item.selected {
      background-color: rgba(138, 180, 248, 0.1);
    }
    .voice-details {
      flex-grow: 1;
      text-align: left;
    }
    .voice-name {
      font-weight: 500;
      font-size: 14px;
      color: #e8eaed;
    }
    .voice-desc {
      font-size: 12px;
      color: #9aa0a6;
    }
    .play-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .play-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .check-icon {
      margin-left: auto;
    }
    .content::-webkit-scrollbar {
      width: 8px;
    }
    .content::-webkit-scrollbar-track {
      background: #202124;
    }
    .content::-webkit-scrollbar-thumb {
      background: #5f6368;
      border-radius: 4px;
    }
    .content::-webkit-scrollbar-thumb:hover {
      background: #9aa0a6;
    }
    .dropdown-list::-webkit-scrollbar {
      width: 8px;
    }
    .dropdown-list::-webkit-scrollbar-track {
      background: #2d2e31;
    }
    .dropdown-list::-webkit-scrollbar-thumb {
      background: #5f6368;
      border-radius: 4px;
    }
    .dropdown-list::-webkit-scrollbar-thumb:hover {
      background: #9aa0a6;
    }
    .footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      flex-shrink: 0;
    }
    .save-btn {
      background-color: #8ab4f8;
      color: #202124;
      border: none;
      border-radius: 4px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .save-btn:hover {
      background-color: #9ac0f9;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-settings-panel': GdmSettingsPanel;
  }
}
