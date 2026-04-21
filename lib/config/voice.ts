export interface PresetVoice {
  id: string
  name: string
  description: string
  // Path relative to /public — place the file at public/voice-previews/<filename>.mp3
  previewPath: string
}

// ElevenLabs pre-made voices. Verify or replace voice IDs in the ElevenLabs dashboard.
// For each voice, drop a pre-generated sample at the corresponding previewPath.
export const PRESET_VOICES: PresetVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Vrouwelijk, kalm', previewPath: '/voice-previews/rachel.mp3' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',   description: 'Mannelijk, diep',  previewPath: '/voice-previews/adam.mp3' },
]

export const ELEVENLABS_MODEL = 'eleven_v3'
export const ELEVENLABS_LANGUAGE_CODE = 'nl'

// Maximum characters used for voice previews
export const PREVIEW_MAX_CHARS = 300
