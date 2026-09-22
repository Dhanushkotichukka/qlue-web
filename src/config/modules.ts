/** Interview module + voice metadata shared across screens. */

export type ModuleKey = 'RESUME' | 'HR' | 'INTRO' | 'WEBSITE';

export interface ModuleMeta {
  key: ModuleKey;
  title: string;
  tagline: string;
  description: string;
  image: string;
  colorVar: string; // css var name for accent
  tintVar: string;
  dimensions: string[];
  needsResume?: boolean;
  needsUrl?: boolean;
}

export const MODULES: ModuleMeta[] = [
  {
    key: 'RESUME',
    title: 'Resume Interview',
    tagline: 'Technical deep-dive',
    description:
      'A technical interview built from your uploaded resume — projects, skills, and experience.',
    image: '/assets/images/Resume.png',
    colorVar: '--module-resume',
    tintVar: '--module-resume-tint',
    dimensions: ['Clarity', 'Fluency', 'Technical Vocabulary', 'Use of Examples'],
    needsResume: true,
  },
  {
    key: 'HR',
    title: 'HR Interview',
    tagline: 'Behavioral · STAR',
    description:
      'Behavioral questions using the STAR framework to sharpen how you tell your stories.',
    image: '/assets/images/hr.png',
    colorVar: '--module-hr',
    tintVar: '--module-hr-tint',
    dimensions: [
      'Teamwork',
      'Ethical Thinking',
      'Problem Solving',
      'Communication Clarity',
      'Self Awareness',
    ],
  },
  {
    key: 'INTRO',
    title: 'Self Introduction',
    tagline: 'Perfect your pitch',
    description:
      'Coaching for "tell me about yourself" — three focused turns to refine your opener.',
    image: '/assets/images/SelfIntro.png',
    colorVar: '--module-intro',
    tintVar: '--module-intro-tint',
    dimensions: ['Clarity', 'Structure', 'Confidence', 'Relevance'],
  },
  {
    key: 'WEBSITE',
    title: 'Website Tutor',
    tagline: 'Learn from any link',
    description:
      'Share a URL and get quizzed on its content — adaptive tutoring that tracks what you master.',
    image: '/assets/images/website.png',
    colorVar: '--module-web',
    tintVar: '--module-web-tint',
    dimensions: [
      'Comprehension Accuracy',
      'Learning Progression',
      'Critical Thinking',
      'Response Clarity',
      'Concept Retention',
    ],
    needsUrl: true,
  },
];

export function moduleMeta(key: string): ModuleMeta {
  return MODULES.find((m) => m.key === key.toUpperCase()) ?? MODULES[1];
}

export function moduleColorVar(key: string): string {
  return moduleMeta(key).colorVar;
}

export type VoiceMode = 'cost_saver' | 'premium';

/** Polly voice personas. Premium = generative (most natural, more credits);
 *  Cost Saver = neural (free-tier friendly). Preview clips live in assets. */
export interface Voice {
  id: string; // Polly VoiceId (also the display name in-app)
  descriptor: string;
  gender: 'Female' | 'Male';
  mode: VoiceMode;
  preview: string;
}

export const VOICES: Voice[] = [
  { id: 'Tiffany', descriptor: 'Most natural, lifelike', gender: 'Female', mode: 'premium', preview: '/assets/audios/tiffany.mp3' },
  { id: 'Ruth', descriptor: 'Warm & professional', gender: 'Female', mode: 'cost_saver', preview: '/assets/audios/ruth.mp3' },
  { id: 'Joanna', descriptor: 'Calm & articulate', gender: 'Female', mode: 'cost_saver', preview: '/assets/audios/joanna.mp3' },
  { id: 'Matthew', descriptor: 'Clear & authoritative', gender: 'Male', mode: 'cost_saver', preview: '/assets/audios/matthew.mp3' },
  { id: 'Stephen', descriptor: 'Friendly & natural', gender: 'Male', mode: 'cost_saver', preview: '/assets/audios/stephen.mp3' },
];

export function voiceById(id: string): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}
