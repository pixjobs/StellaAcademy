// ---------- shared primitives ----------
export type UID = string;

export type Difficulty = 'starter' | 'core' | 'challenge';

export type Img = {
  href: string;            // required so <img src> is always valid
  // --- THIS IS THE FIX ---
  // The `title` is now a required string. This enforces data integrity
  // and prevents runtime errors like `[object Object]` when a title is missing.
  // The data normalization we did in the page component now correctly satisfies this type.
  title: string;
  alt?: string;            // accessibility text
  credit?: string;         // photographer/source
  license?: string;        // e.g., "CC-BY-4.0", "All Rights Reserved"
  width?: number;
  height?: number;
  dominantColor?: `#${string}`; // hex (optional)
};

export type NoteType = 'concept' | 'formula' | 'reference' | 'image';

export type Note = {
  id: string;
  type: NoteType;
  title: string;
  body?: string;
  url?: string;
  imgHref?: string;
  createdAt: number;
};

export type LinkRef = {
  title: string;
  url: string;
  description?: string;
};

export type QuickAction = {
  label: string;           // button text
  prompt: string;          // chat prompt to send
  icon?: string;           // optional icon key (lucide name or custom)
};

// Lightweight assessment items you can render or feed to the LLM
export type AssessmentItem =
  | {
      kind: 'mcq';
      id: UID;
      question: string;
      options: string[];
      answerIndex: number;
      explanation?: string;
    }
  | {
      kind: 'open';
      id: UID;
      prompt: string;
      rubric?: string;
    };

// ---------- topics & plan ----------
export type EnrichedTopic = {
  // original
  title: string; // Made title required for consistency
  summary: string;
  images: Img[]; // Now uses the strict Img type
  keywords?: string[];

  // additions (all optional, safe for existing code)
  id?: UID;
  difficulty?: Difficulty;
  objectives?: string[];           // learning goals
  estimatedTimeMins?: number;      // e.g., 8
  initialImageIndex?: number;      // default 0 for MissionControl
  quickActions?: QuickAction[];    // extra buttons (beyond Explain/Quiz/Summary)
  contextNotes?: string;           // appended to chat context
  references?: LinkRef[];          // links for further reading
  assessment?: AssessmentItem[];   // mini-quiz/checks
  prerequisites?: string[];        // assumed prior knowledge
  tags?: string[];                 // extra taxonomy
  aiPrompts?: {                    // optional LLM templates
    summary?: string;
    quiz?: string;
    whatIf?: string;
    critique?: string;
  };
};

export type EnrichedMissionPlan = {
  // original
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];

  // additions (all optional)
  missionId?: UID;
  theme?: string;                  // e.g., "rocketry"
  level?: 'ks2' | 'ks3' | 'gcse' | 'a-level' | 'undergrad' | string;
  seed?: number;                   // generator reproducibility
  createdAt?: string;              // ISO timestamp
  version?: string;                // content version
  schemaVersion?: '1.1' | string;  // bump when you change this schema
  briefingMessage?: string;        // initial chat message (used by MissionControl)
  globalQuickActions?: QuickAction[];
  globalReferences?: LinkRef[];
  safety?: {
    allowedDomains?: string[];     // whitelist for link expansion
    contentWarnings?: string[];
  };
};