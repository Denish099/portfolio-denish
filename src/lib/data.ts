import {
  siAmazonaws,
  siAmazonec2,
  siAmazons3,
  siCplusplus,
  siDocker,
  siGit,
  siGithub,
  siGithubactions,
  siGo,
  siJavascript,
  siJenkins,
  siKubernetes,
  siMongodb,
  siNodedotjs,
  siPostgresql,
  siPostman,
  siPrisma,
  siReact,
  siTypescript,
  type SimpleIcon,
} from 'simple-icons';

export const PROFILE = {
  name: 'Denish Goyal',
  first: 'Denish',
  last: 'Goyal',
  role: 'Software Developer',
  email: 'gyldenish@gmail.com',
  github: 'https://github.com/Denish099',
  leetcode: 'https://leetcode.com/u/Denish-goyal/',
  linkedin: 'https://www.linkedin.com/in/denish-53b833245/',
  codeforces: 'https://codeforces.com/profile/gyldenish',
  resume: '/denish-goyal-resume.pdf',
  githubHandle: 'Denish099',
  leetcodeHandle: 'Denish-goyal',
  linkedinHandle: 'denish-53b833245',
  codeforcesHandle: 'gyldenish',
  location: 'India',
  education: {
    school: 'University of Petroleum and Energy Studies',
    degree: 'B.Tech, Computer Science',
    period: 'Aug 2023 — Jul 2027',
  },
  tagline: 'I build cloud-native systems and the interfaces that make them legible.',
} as const;

export interface Skill {
  id: string;
  label: string;
  category: 'Cloud & Infra' | 'Frontend' | 'Backend' | 'Data';
  color: string;
  accent: string;
  blurb: string;
  /** simple-icons glyph: a single SVG path on a 24×24 viewBox */
  icon: SimpleIcon;
}

export const SKILLS: Skill[] = [
  {
    id: 'aws',
    label: 'AWS',
    category: 'Cloud & Infra',
    color: '#ff9d2e',
    accent: '#ffd08a',
    blurb: 'EC2, S3, ECS and EKS — provisioning and shipping to real infrastructure.',
    icon: siAmazonaws,
  },
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    category: 'Cloud & Infra',
    color: '#3d7dff',
    accent: '#9dc0ff',
    blurb: 'Deployments, services and cluster state — driven from client-go.',
    icon: siKubernetes,
  },
  {
    id: 'docker',
    label: 'Docker',
    category: 'Cloud & Infra',
    color: '#2fb3f0',
    accent: '#a8e2ff',
    blurb: 'Container images and multi-service local stacks that mirror prod.',
    icon: siDocker,
  },
  {
    id: 'cicd',
    label: 'CI / CD',
    category: 'Cloud & Infra',
    color: '#b8ff3a',
    accent: '#e2ff9d',
    blurb: 'GitHub Actions and Jenkins pipelines — build, test, gate, release.',
    icon: siGithubactions,
  },
  {
    id: 'react',
    label: 'React.js',
    category: 'Frontend',
    color: '#3ee0ff',
    accent: '#b3f4ff',
    blurb: 'Component systems, canvas-heavy UI and interaction-led interfaces.',
    icon: siReact,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    category: 'Frontend',
    color: '#4a8dff',
    accent: '#a8c8ff',
    blurb: 'Types as design — the contract I write before the implementation.',
    icon: siTypescript,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    category: 'Frontend',
    color: '#ffcf34',
    accent: '#ffe89a',
    blurb: 'The language I reach for first, from DOM plumbing to WebGL.',
    icon: siJavascript,
  },
  {
    id: 'node',
    label: 'Node.js',
    category: 'Backend',
    color: '#5fd75f',
    accent: '#b6f0b6',
    blurb: 'REST services, auth flows and the glue between clients and data.',
    icon: siNodedotjs,
  },
  {
    id: 'cpp',
    label: 'C++',
    category: 'Backend',
    color: '#ff5f8f',
    accent: '#ffb0c6',
    blurb: 'Where I learned data structures, memory and algorithmic cost.',
    icon: siCplusplus,
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    category: 'Data',
    color: '#4b9dd6',
    accent: '#a9d6f0',
    blurb: 'Relational schema design, indexes and queries that stay fast.',
    icon: siPostgresql,
  },
  {
    id: 'prisma',
    label: 'Prisma',
    category: 'Data',
    color: '#8b5cff',
    accent: '#c9b3ff',
    blurb: 'Typed data access with migrations that are safe to run twice.',
    icon: siPrisma,
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    category: 'Data',
    color: '#4fd97a',
    accent: '#b0f2c4',
    blurb: 'Document modelling for content that refuses to sit in columns.',
    icon: siMongodb,
  },
];

/**
 * Supporting tools that appear in the icon cloud alongside SKILLS but have no
 * list row or readout of their own — each one is named elsewhere on the page.
 */
export interface Tool {
  id: string;
  label: string;
  color: string;
  icon: SimpleIcon;
}

export const TOOLS: Tool[] = [
  { id: 'go', label: 'Go', color: '#29c8f2', icon: siGo },
  { id: 'jenkins', label: 'Jenkins', color: '#f0705a', icon: siJenkins },
  { id: 'ec2', label: 'Amazon EC2', color: '#ffad3a', icon: siAmazonec2 },
  { id: 's3', label: 'Amazon S3', color: '#7fc95a', icon: siAmazons3 },
  { id: 'git', label: 'Git', color: '#ff6a4a', icon: siGit },
  { id: 'github', label: 'GitHub', color: '#d6dcf0', icon: siGithub },
  { id: 'postman', label: 'Postman', color: '#ff8a5c', icon: siPostman },
];

export interface Project {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  year: string;
  description: string;
  highlights: string[];
  stack: string[];
  color: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'brainly',
    index: '01',
    title: 'Brainly',
    subtitle: 'Second brain for everything you save and never revisit',
    year: '2026',
    description:
      'A single home for the things that normally scatter across twenty tabs — important tweets, YouTube links, notes and documents — captured, tagged and made searchable so saving something actually means finding it again.',
    highlights: [
      'Unified capture for tweets, YouTube links, notes and docs behind one typed REST API',
      'Tag-and-search retrieval layer so saved content stays reachable instead of buried',
      'Shareable brain: publish a curated slice of your collection with a single link',
    ],
    stack: ['React', 'TypeScript', 'Node.js', 'Prisma', 'PostgreSQL', 'MongoDB'],
    color: '#8b5cff',
  },
  {
    id: 'k8n',
    index: '02',
    title: 'K8N',
    subtitle: 'Visual IDE for Kubernetes',
    year: '2026',
    description:
      'A graph-based IDE that turns cluster work into something you can see. Drag pods, services and deployments onto a ReactFlow canvas; a Go backend translates the node/edge graph into valid Kubernetes manifests — no hand-written YAML.',
    highlights: [
      'Drag-and-drop canvas compiles a node/edge graph into valid K8s manifests',
      'Real-time cluster sync through the Go backend’s client-go SDK',
      'Inspect pod logs and resource relationships, then deploy from the IDE',
    ],
    stack: ['React', 'ReactFlow', 'Go', 'Kubernetes', 'Docker', 'REST APIs'],
    color: '#3d7dff',
  },
  {
    id: 'ratelimiter',
    index: '03',
    title: 'Rate Limiter',
    subtitle: 'Sub-millisecond token bucket in Go',
    year: '2026',
    description:
      'A concurrent rate-limiting service that throttles abusive traffic at the transport layer. Stateless and horizontally scalable by design, with unit and integration coverage so it can be trusted in front of real endpoints.',
    highlights: [
      'Token Bucket algorithm delivering sub-millisecond decision latency',
      'Stateless design that scales horizontally with zero-downtime protection',
      'Mitigates application-layer flood vectors at the TCP/IP boundary',
    ],
    stack: ['Go', 'TCP/IP', 'System Design', 'Docker'],
    color: '#b8ff3a',
  },
];

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  mode: string;
  summary: string;
  points: string[];
  stack: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    company: 'Chirpn IT Solutions',
    role: 'Software Engineering Intern',
    period: 'Jun 2024 — Aug 2024',
    mode: 'Remote',
    summary:
      'Worked on the service layer — designing and building REST APIs and the database schemas underneath them.',
    points: [
      'Built REST API endpoints covering the full request lifecycle: validation, error contracts and consistent JSON responses',
      'Designed relational database schemas — tables, relationships, constraints and indexes — from product requirements',
      'Translated feature specs into API contracts agreed with the frontend before implementation started',
      'Tested endpoints with Postman and wrote regression coverage so behaviour stayed pinned across changes',
    ],
    stack: ['Node.js', 'REST APIs', 'PostgreSQL', 'Postman', 'Git'],
  },
];

export const CAPABILITIES = [
  {
    n: '01',
    title: 'REST API design',
    body: 'Endpoints with explicit contracts — predictable status codes, typed payloads and error shapes a client can actually branch on.',
  },
  {
    n: '02',
    title: 'Database modelling',
    body: 'Schemas derived from access patterns rather than guesses: normalised where it matters, indexed where it hurts.',
  },
  {
    n: '03',
    title: 'Cloud & containers',
    body: 'Docker images, Kubernetes manifests and AWS deploys wired into CI/CD so releases are repeatable, not ceremonial.',
  },
  {
    n: '04',
    title: 'Interface engineering',
    body: 'React frontends that stay fast under real data — including canvas and WebGL surfaces like the one you are reading.',
  },
];
