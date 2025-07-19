/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Analyser} from './analyser';

@customElement('gdm-live-audio-visuals')
export class GdmLiveAudioVisuals extends LitElement {
  private inputAnalyser: Analyser;
  private outputAnalyser: Analyser;

  private _outputNode: AudioNode;

  @property()
  set outputNode(node: AudioNode) {
    this._outputNode = node;
    this.outputAnalyser = new Analyser(this._outputNode);
  }

  get outputNode() {
    return this._outputNode;
  }

  private _inputNode: AudioNode;

  @property()
  set inputNode(node: AudioNode) {
    this._inputNode = node;
    this.inputAnalyser = new Analyser(this._inputNode);
  }

  get inputNode() {
    return this._inputNode;
  }

  private canvas: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;

  static styles = css`
    canvas {
      width: 100vw !important;
      height: 100vh !important;
      position: absolute;
      inset: 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
  }

  private getAverage(data: Uint8Array): number {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    // Use RMS to get a better sense of power
    for (const amplitude of data) {
      sum += amplitude * amplitude;
    }
    return Math.sqrt(sum / data.length) / 255;
  }

  private visualize() {
    requestAnimationFrame(() => this.visualize());

    if (!this.canvasCtx || !this.outputAnalyser || !this.inputAnalyser) {
      return;
    }

    this.inputAnalyser.update();
    this.outputAnalyser.update();

    const outputAvg = this.getAverage(this.outputAnalyser.data);
    const inputAvg = this.getAverage(this.inputAnalyser.data);

    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    this.canvasCtx.fillStyle = '#1A1A1A';
    this.canvasCtx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const baseRadius = Math.min(w, h) * 0.25;
    const pulse = (outputAvg * 0.7 + inputAvg * 0.3) * baseRadius * 0.8;
    const radius = baseRadius + pulse;

    const gradient = this.canvasCtx.createLinearGradient(
      centerX,
      centerY - radius,
      centerX,
      centerY + radius,
    );
    gradient.addColorStop(0, '#fef4ac');
    gradient.addColorStop(0.5, '#fbd56f');
    gradient.addColorStop(1, '#f38d41');

    this.canvasCtx.shadowBlur = 40;
    this.canvasCtx.shadowColor = 'rgba(251, 213, 111, 0.3)';

    this.canvasCtx.beginPath();
    this.canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.canvasCtx.fillStyle = gradient;
    this.canvasCtx.fill();

    this.canvasCtx.shadowBlur = 0;
  }

  private resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvasCtx.scale(dpr, dpr);
  }

  firstUpdated() {
    this.canvas = this.shadowRoot!.querySelector('canvas')!;
    this.canvasCtx = this.canvas.getContext('2d')!;
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
    this.visualize();
  }

  render() {
    return html`<canvas></canvas>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio-visuals': GdmLiveAudioVisuals;
  }
}
