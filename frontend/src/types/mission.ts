/**
 * @file mission.ts
 * @description
 * Contains the core, hardened type definitions for mission plans, topics, and all
 * related data structures. These types are designed to be strict, self-documenting,
 * and safe for use across the application.
 */

// ---------- Shared Primitives ----------

/**
 * A branded type for unique identifiers. This prevents regular strings from being
 * assigned to ID fields by mistake, increasing type safety.
 * @example const userId: UID = 'user-12345' as UID;
 */
export type UID = string & { readonly __brand: 'UID' };

/**
 * Defines the difficulty levels for topics or assessments.
 */
export type Difficulty = 'starter' | 'core' | 'challenge';

/**
 * A union of common SPDX license identifiers for media assets.
 * The `(string & {})` allows for any other string, providing flexibility.
 */
export type License =
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC0-1.0'
  | 'Public Domain'
  | 'All Rights Reserved'
  | (string & {});

/**
 * Represents a single media asset, such as an image or video.
 */
export type Img = {
  /** The direct, resolvable URL to the image resource. */
  href: string;
  /** A title or caption for the image, used in UI lists and overlays. */
  title?: string;
  /** Accessibility text describing the image for screen readers. */
  alt?: string;
  /** The name of the photographer or the source of the image (e.g., "NASA/JPL-Caltech"). */
  credit?: string;
  /** The license under which the media is provided. */
  license?: License;
  /** The intrinsic width of the image in pixels. */
  width?: number;
  /** The intrinsic height of the image in pixels. */
  height?: number;
  /** An optional dominant color of the image in CSS hex format, for UI placeholders. */
  dominantColor?: `#${string}`;
  
  /** The unique NASA ID for the image, if applicable. */
  nasaId?: string;

  /** The type of media, either 'image' or 'video'. Defaults to 'image'. */
  mediaType?: 'image' | 'video' | 'audio';
};

/** The type returned by the Mars Rover Photos API for a single photo.
 * See https://api.nasa.gov/#mars-rover-photos for details.
 */
export interface MarsPhoto {
  id: number;
  sol: number;
  camera: {
    id: number;
    name: string; // e.g., "FHAZ"
    rover_id: number;
    full_name: string; // e.g., "Front Hazard Avoidance Camera"
  };
  img_src: string;
  earth_date: string;
  rover: {
    id: number;
    name: string;
    landing_date: string;
    launch_date: string;
    status: string;
  };
}

/**
 * The type of a contextual note.
 */
export type NoteType = 'concept' | 'formula' | 'reference' | 'image';

/**
 * A contextual note that can be attached to a topic or mission.
 */
export type Note = {
  id: UID;
  type: NoteType;
  title: string;
  body?: string;
  url?: string;
  imgHref?: string;
  /** The creation date as a Unix timestamp in milliseconds. */
  createdAt: number;
};

/**
 * A reference link for further reading.
 */
export type LinkRef = {
  title:string;
  url: string;
  description?: string;
};

/**
 * A predefined action a user can take, which translates to a specific LLM prompt.
 */
export type QuickAction = {
  /** The text displayed on the button for this action. */
  label: string;
  /** The chat prompt that will be sent to the LLM when this action is triggered. */
  prompt: string;
  /** An optional icon name, typically from a library like Lucide. */
  icon?: string;
};

/**
 * A discriminated union representing different kinds of assessment items.
 */
export type AssessmentItem =
  | {
      kind: 'mcq';
      id: UID;
      question: string;
      /** An array of potential answers. Should contain at least two options. */
      options: string[];
      /** The zero-based index of the correct option in the `options` array. */
      answerIndex: number;
      explanation?: string;
    }
  | {
      kind: 'open';
      id: UID;
      prompt: string;
      /** A description of the criteria for a correct or complete answer. */
      rubric?: string;
    };

// ---------- Topics & Plan ----------

/**
 * Represents a single, enriched topic within a mission plan. This is the core
 * unit of learning content.
 */
export type EnrichedTopic = {
  // --- Core Content ---
  title: string;
  summary: string;
  images: Img[];
  keywords?: string[];

  // --- Metadata & Structure ---
  id?: UID;
  difficulty?: Difficulty;
  /** A list of learning goals for this topic. */
  objectives?: string[];
  /** The estimated time to complete the topic, in minutes. */
  estimatedTimeMins?: number;
  /** The default image to show when the topic is first viewed. Defaults to 0. */
  initialImageIndex?: number;
  /** A list of assumed prior knowledge for this topic. */
  prerequisites?: string[];
  /** Additional tags for filtering and categorization. */
  tags?: string[];

  // --- Interactive Elements ---
  /** Context-specific quick actions for this topic. */
  quickActions?: QuickAction[];
  /** A string of text to be implicitly added to the context for chat interactions. */
  contextNotes?: string;
  /** A list of external links for further reading. */
  references?: LinkRef[];
  /** A collection of questions or tasks to check for understanding. */
  assessment?: AssessmentItem[];

  // --- AI & Generation ---
  /** Optional, specific LLM prompt templates for standardized actions on this topic. */
  aiPrompts?: {
    summary?: string;
    quiz?: string;
    whatIf?: string;
    critique?: string;
  };
};

/**
 * Represents the complete, final mission plan ready for the frontend.
 */
export type EnrichedMissionPlan = {
  // --- Core Content ---
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];

  // --- Metadata ---
  missionId?: UID;
  /** A high-level theme for the mission (e.g., "rocketry", "planetary-science"). */
  theme?: string;
  /** The target educational level for the content. */
  level?: 'ks2' | 'ks3' | 'gcse' | 'a-level' | 'undergrad' | string;
  /** The seed used for the random number generator, for reproducibility. */
  seed?: number;
  /** The creation date of the mission plan in ISO 8601 format. */
  createdAt?: string;
  /** The semantic version of the content (e.g., "1.0.0"). */
  version?: string;
  /** The version of this schema, to be incremented on breaking changes. */
  schemaVersion?: '1.1' | string;

  // --- Interactive Elements ---
  /** An initial message to be displayed in the chat interface when the mission loads. */
  briefingMessage?: string;
  /** Quick actions that apply to the entire mission, not just a specific topic. */
  globalQuickActions?: QuickAction[];
  /** A list of references relevant to the entire mission. */
  globalReferences?: LinkRef[];

  // --- Safety & Security ---
  safety?: {
    /** A whitelist of allowed domains for external links to prevent malicious redirection. */
    allowedDomains?: string[];
    /** Any content warnings that should be displayed to the user before starting. */
    contentWarnings?: string[];
  };
};