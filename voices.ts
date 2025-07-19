/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Voice {
  name: string;
  description: string;
}

// A list of pre-built voices available for text-to-speech.
export const VOICES: Voice[] = [
  { name: 'Zephyr', description: 'Bright, Higher pitch' },
  { name: 'Puck', description: 'Upbeat, Middle pitch' },
  { name: 'Charon', description: 'Informative, Lower middle pitch' },
  { name: 'Kore', description: 'Firm, Middle pitch' },
  { name: 'Fenrir', description: 'Excitable, Lower middle pitch' },
  { name: 'Leda', description: 'Clear, Higher pitch' },
  { name: 'Orus', description: 'Firm, Lower middle pitch' },
  { name: 'Aoede', description: 'Breezy, Middle pitch' },
  { name: 'Callirrhoe', description: 'Easy-going, Middle pitch' },
  { name: 'Autonoe', description: 'Bright, Middle pitch' },
  { name: 'Enceladus', description: 'Breathy, Lower pitch' },
  { name: 'Iapetus', description: 'Gravelly, Lower pitch' },
  { name: 'Umbriel', description: 'Easy-going, Lower middle pitch' },
  { name: 'Algieba', description: 'Smooth, Lower pitch' },
  { name: 'Despina', description: 'Smooth, Middle pitch' },
  { name: 'Erinome', description: 'Clear, Middle pitch' },
  { name: 'Algenib', description: 'Gravelly, Lower pitch' },
  { name: 'Rasalgethi', description: 'Informative, Middle pitch' },
  { name: 'Laomedeia', description: 'Upbeat, Higher pitch' },
  { name: 'Achernar', description: 'Soft, Higher pitch' },
  { name: 'Alnilam', description: 'Firm, Lower middle pitch' },
  { name: 'Schedar', description: 'Even, Lower middle pitch' },
  { name: 'Gacrux', description: 'Mature, Middle pitch' },
  { name: 'Pulcherrima', description: 'Forward, Middle pitch' },
  { name: 'Achird', description: 'Friendly, Lower middle pitch' },
  { name: 'Zubenelgenubi', description: 'Casual, Lower middle pitch' },
  { name: 'Vindemiatrix', description: 'Gentle, Middle pitch' },
  { name: 'Sadachbia', description: 'Lively, Lower pitch' },
  { name: 'Sadaltager', description: 'Knowledgeable, Middle pitch' },
  { name: 'Sulafat', description: 'Warm, Middle pitch' },
];
