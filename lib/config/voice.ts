export interface PresetVoice {
  id: string
  name: string
  description: string
}

// ElevenLabs pre-made voices compatible with eleven_multilingual_v2.
// Verify or replace voice IDs in the ElevenLabs dashboard under "Voices > Pre-made".
export const PRESET_VOICES: PresetVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Vrouwelijk, kalm' },
  { id: 'ANHrhmaFeVN0QJaa0PhL', name: 'Petra', description: 'Vrouwelijk' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Mannelijk, vriendelijk' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Mannelijk, krachtig' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Mannelijk, diep' },
]

export const ELEVENLABS_MODEL = 'eleven_v3'
export const ELEVENLABS_LANGUAGE_CODE = 'nl'

// Maximum characters used for voice previews
export const PREVIEW_MAX_CHARS = 300
