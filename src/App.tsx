import React, { useState, useRef, useEffect, useMemo } from "react";
import { generateSong, writeLyrics, splitStems } from "./audioBackend";
import type { Clip, SplitStemsResult } from "./audioBackend";
import {
  Mic,
  Upload,
  Pause,
  RefreshCw,
  Music,
  Sliders,
  Sparkles,
  Check,
  FileText,
  Headphones,
  Zap,
  Search,
  Radio,
  Layers,
  Square
} from "lucide-react";

// 100% In-Browser WAV Audio Encoder (Pure TypeScript, Zero External Dependencies)

// In-Browser Procedural Electronic Lyrics Generator

interface GenreCategory {
  category: string;
  subgenres: {
    id: string;
    name: string;
    bpm: number;
    description: string;
    promptTags: string;
  }[];
}

const ELECTRONIC_GENRES: GenreCategory[] = [
  {
    category: "House",
    subgenres: [
      { id: "deep-house", name: "Deep House", bpm: 122, description: "Warm soulful chords and deep sub bass", promptTags: "deep house, lush electric piano, warm analog sub bass, steady 4/4 groove" },
      { id: "tech-house", name: "Tech House", bpm: 126, description: "Punchy percussion and driving rhythmic groove", promptTags: "tech house, punchy percussion, syncopated bass, crisp tech drums" },
      { id: "progressive-house", name: "Progressive House", bpm: 128, description: "Melodic builds and sweeping festival energy", promptTags: "progressive house, euphoric synth leads, emotional chord progression" },
      { id: "electro-house", name: "Electro House", bpm: 128, description: "Aggressive buzzy basslines and heavy drops", promptTags: "electro house, dirty sawtooth bass, heavy kick, high energy electro" },
      { id: "future-house", name: "Future House", bpm: 126, description: "Metallic bouncy lead plucks and deep groove", promptTags: "future house, metallic synth plucks, bouncy bassline, punchy beat" },
      { id: "acid-house", name: "Acid House", bpm: 125, description: "Resonant squelchy silver-box synth sweeps", promptTags: "acid house, resonant squelching filter sweeps, vintage 909 drums" },
      { id: "tropical-house", name: "Tropical House", bpm: 110, description: "Breezy marimba, pan flutes and bright tones", promptTags: "tropical house, chill marimba melody, relaxed sun-soaked groove" },
      { id: "bass-house", name: "Bass House", bpm: 128, description: "Heavy distorted wobble bass and rave stabs", promptTags: "bass house, heavy modulated wobble bass, aggressive groove, dark synth" },
      { id: "melodic-house", name: "Melodic House", bpm: 123, description: "Atmospheric organic textures and deep emotion", promptTags: "melodic house, organic percussion, warm pads, emotive vocal chop melody" },
      { id: "french-house", name: "French House", bpm: 124, description: "Filtered funk disco samples with phaser kicks", promptTags: "french house, filtered disco loop, groovy slap bass, phaser effect" }
    ]
  },
  {
    category: "Techno",
    subgenres: [
      { id: "peak-time-techno", name: "Peak Time / Driving Techno", bpm: 132, description: "Relentless rolling kick and hypnotic warehouse groove", promptTags: "peak time driving techno, thunderous rumble kick, dark warehouse atmosphere" },
      { id: "melodic-techno", name: "Melodic Techno", bpm: 125, description: "Dramatic cinematic synth arps and deep pulse", promptTags: "melodic techno, soaring cinematic arp synths, brooding reese bass" },
      { id: "hard-techno", name: "Hard Techno", bpm: 150, description: "Distorted brutal industrial kicks and frenetic tempo", promptTags: "hard techno, distorted industrial kick drum, raw shrieking synth, 150 bpm" },
      { id: "acid-techno", name: "Acid Techno", bpm: 138, description: "Overdriven 303 squelches and furious cadence", promptTags: "acid techno, screaming resonant acid bassline, driving metallic hi-hats" },
      { id: "dub-techno", name: "Dub Techno", bpm: 120, description: "Deep cavernous echoes, tape delays, and sub pulses", promptTags: "dub techno, cavernous tape delay chords, warm hiss, submerged chords" },
      { id: "minimal-techno", name: "Minimal Techno", bpm: 126, description: "Stripped-back skeletal micro-rhythms and clicks", promptTags: "minimal techno, subtle micro-glitches, skeletal click percussion, dry sub" },
      { id: "detroit-techno", name: "Detroit Techno", bpm: 130, description: "Futuristic soul, strings, and machine soul funk", promptTags: "detroit techno, futuristic analog synthesizer strings, classic 909 soul" }
    ]
  },
  {
    category: "Drum & Bass",
    subgenres: [
      { id: "liquid-dnb", name: "Liquid Drum & Bass", bpm: 174, description: "Lush Rhodes chords, soulful melodies, rolling breaks", promptTags: "liquid drum and bass, warm electric piano, smooth rolling breakbeats, 174 bpm" },
      { id: "neurofunk", name: "Neurofunk", bpm: 172, description: "Dark mutated reese basses and razor-sharp tech drums", promptTags: "neurofunk drum and bass, aggressive morphing reese bass, cybernetic tech drums" },
      { id: "jump-up", name: "Jump Up DnB", bpm: 175, description: "Bouncy energetic laser synths and party basslines", promptTags: "jump up drum and bass, screechy bouncy synth bass, energetic rolling drum pattern" },
      { id: "jungle", name: "Jungle / Oldschool DnB", bpm: 165, description: "Chopped Amen breaks, 808 sub drops, reggae dub flavor", promptTags: "jungle dnb, chopped amen break, deep 808 sub basslines, dub reggae echoes" },
      { id: "halftime", name: "Halftime DnB", bpm: 86, description: "Slow hip-hop tempo with heavy DnB sound design", promptTags: "halftime drum and bass, heavyweight 808 subs, spacious experimental beats" },
      { id: "breakcore", name: "Breakcore", bpm: 185, description: "Frantic shattered breakbeats, glitches, chaotic speed", promptTags: "breakcore, frenetic chopped breakbeats, noisy digital distortion, rapid BPM" }
    ]
  },
  {
    category: "Trance",
    subgenres: [
      { id: "uplifting-trance", name: "Uplifting Trance", bpm: 138, description: "Euphoric supersaw crescendos and huge emotional release", promptTags: "uplifting trance, massive supersaw leads, emotional breakdown, 138 bpm" },
      { id: "psytrance", name: "Psytrance / Goa", bpm: 142, description: "Fast rolling galloping bassline and alien psychedelic fx", promptTags: "psytrance, rolling rolling bassline, trippy modular synth leads, spiritual atmosphere" },
      { id: "progressive-trance", name: "Progressive Trance", bpm: 130, description: "Hypnotic gradual melodic builds with groovy foundation", promptTags: "progressive trance, hypnotic melodic layers, driving progressive groove" },
      { id: "vocal-trance", name: "Vocal Trance", bpm: 136, description: "Lush vocal harmonies atop soaring synth anthems", promptTags: "vocal trance, emotional anthemic vocal leads, soaring saw pads, driving beats" },
      { id: "hard-trance", name: "Hard Trance", bpm: 145, description: "Pounding kicks, rave stabs, and relentless energetic tempo", promptTags: "hard trance, aggressive hard kicks, 90s rave leads, high-octane energy" }
    ]
  },
  {
    category: "Dubstep & Bass",
    subgenres: [
      { id: "melodic-dubstep", name: "Melodic Dubstep", bpm: 140, description: "Emotional piano intro transitioning to epic supersaw drops", promptTags: "melodic dubstep, grand emotional chords, heavy supersaw growls, half-time beats" },
      { id: "brostep", name: "Brostep / Heavy Dubstep", bpm: 145, description: "Screeching robotic growl basses and devastating half-time snares", promptTags: "heavy dubstep, aggressive robotic bass growls, metallic tearout synths, punchy snare" },
      { id: "riddim", name: "Riddim", bpm: 140, description: "Minimal repetitive trench bass rhythms with heavy bounce", promptTags: "riddim dubstep, repetitive square wave bass chop, heavy sub bounce, minimal groove" },
      { id: "deep-dubstep", name: "Deep Dubstep", bpm: 140, description: "Subterranean sub frequencies, vinyl crackle, dark atmosphere", promptTags: "deep dubstep, deep 40Hz sub bass, UK sound system culture, dark reverb percussion" },
      { id: "future-bass", name: "Future Bass", bpm: 150, description: "Lush detuned sidechained supersaw chords and bright vocal chops", promptTags: "future bass, rich sidechained saw chords, pitched vocal chops, trap-style hi-hats" },
      { id: "wave", name: "Wave / Hardwave", bpm: 140, description: "Cyberpunk melancholic reese bass, lush reverb, trap 808s", promptTags: "wave music, hardwave, emotional reese bass, melancholic cyberpunk atmosphere" }
    ]
  },
  {
    category: "Hard Dance",
    subgenres: [
      { id: "hardstyle", name: "Hardstyle / Euphoric", bpm: 150, description: "Reversed gated distorted kicks and huge anthemic melodies", promptTags: "hardstyle, pitch-bent distorted screamer kicks, uplifting anthemic melody, 150 bpm" },
      { id: "hardcore-gabber", name: "Hardcore / Gabber", bpm: 175, description: "Distorted 909 roar kicks and relentless 180 BPM adrenaline", promptTags: "hardcore gabber, severely distorted overdriven kicks, intense rave hoover, fast tempo" },
      { id: "happy-hardcore", name: "Happy Hardcore", bpm: 165, description: "Bright cheerful piano chords and rapid pitch-shifted vocal hooks", promptTags: "happy hardcore, uplifting piano breakdown, high energy 4-to-the-floor beat, celebratory vibes" }
    ]
  },
  {
    category: "Electro & Synth",
    subgenres: [
      { id: "synthwave", name: "Synthwave / Retrowave", bpm: 105, description: "Nostalgic 80s analog synthesizers, gated reverbs, neon vibes", promptTags: "synthwave retrowave, 80s vintage synthesizer arpeggios, gated reverb snare, cinematic neon" },
      { id: "darksynth", name: "Darksynth / Cyberpunk", bpm: 120, description: "Heavy distorted basslines, industrial metal energy, dystopian synths", promptTags: "darksynth cyberpunk, heavy menacing industrial synth bass, gritty dark electronic pulse" },
      { id: "electro-funk", name: "Electro Funk / Break", bpm: 125, description: "Robotic vocoders, 808 cowbells, syncopated robot boogie", promptTags: "electro funk, 808 robotic drums, vintage analog synth funk bass, vocoder flavor" },
      { id: "complextro", name: "Complextro", bpm: 128, description: "Rapid-fire switching glitch bass patches and intricate fills", promptTags: "complextro, rapid glitching bass cuts, intricate electro house sound design" },
      { id: "chiptune", name: "Chiptune / 8-Bit", bpm: 135, description: "Square and triangle waveforms inspired by retro video game soundchips", promptTags: "chiptune 8-bit, retro console soundchip melodies, square wave arps, playful bounce" }
    ]
  },
  {
    category: "Ambient & Downtempo",
    subgenres: [
      { id: "ambient", name: "Ambient / Drone", bpm: 70, description: "Spacious ethereal soundscapes, drifting pads, meditative warmth", promptTags: "ambient electronic, drifting ethereal pads, subtle generative textures, deep calming tone" },
      { id: "trip-hop", name: "Trip-Hop", bpm: 85, description: "Smoky vinyl drums, jazz basslines, melancholic noir mood", promptTags: "trip-hop, gritty downtempo hip-hop breaks, deep melancholic bass, smoky atmospheric synths" },
      { id: "idm", name: "IDM / Glitch", bpm: 115, description: "Intricate micro-sampling, brain-dance melodies, complex rhythms", promptTags: "IDM glitch, intricate algorithmic percussion, warm emotive braindance synths" }
    ]
  },
  {
    category: "Garage & Bassline",
    subgenres: [
      { id: "uk-garage", name: "UK Garage (UKG / 2-Step)", bpm: 130, description: "Shuffling syncopated hi-hats, warm organ bass, vocal chops", promptTags: "uk garage 2-step, shuffling syncopated percussion, warm m1 organ bassline, sweet vocal stabs" },
      { id: "speed-garage", name: "Speed Garage / Bassline", bpm: 135, description: "Heavy warped mid-range bass wobbles and 4x4 garage kicks", promptTags: "speed garage bassline, heavily warped bassline growl, 4x4 pumping house beat, high energy" },
      { id: "future-garage", name: "Future Garage", bpm: 132, description: "Emotional pitch-shifted vocal ambient burial-style mood", promptTags: "future garage, emotional ambient textures, subterranean sub bass, gentle vinyl rain crackle" }
    ]
  },
  {
    category: "Disco & Funk",
    subgenres: [
      { id: "nu-disco", name: "Nu-Disco", bpm: 118, description: "Chic guitar riffs, groovy live bass, lush modern disco sheen", promptTags: "nu-disco, funky rhythm guitar strum, groovy walking bassline, sparkly synth chords" },
      { id: "italo-disco", name: "Italo Disco", bpm: 120, description: "Vintage arpeggiated synths, dramatic melancholic melodies", promptTags: "italo disco, driving analog synth arpeggiator, 80s drum machines, dramatic European romance" }
    ]
  }
];

interface VoiceProfile {
  name: string;
  f0Hz: number;
  pitchNote: string;
  formants: { f1: number; f2: number; f3: number };
  brightness: number;
  timbreDescription: string;
  waveformPeaks: number[];
  audioUrl: string | null;
  isVocaloid?: boolean;
}

interface VocaloidOption {
  id: string;
  name: string;
  character: string;
  f0: number;
  f1: number;
  f2: number;
  f3: number;
  timbre: string;
  vocaloidPrompt: string;
  description: string;
  gender?: "male" | "female" | "robot";
  isRapper?: boolean;
}

const VOCALOID_OPTIONS: VocaloidOption[] = [
  // Original Initial Set
  {
    id: "cyber-diva",
    name: "Cyber Diva",
    character: "Bright J-Electro Idol",
    f0: 290,
    f1: 720,
    f2: 2100,
    f3: 3100,
    timbre: "Bright Vocaloid Cyber Idol",
    vocaloidPrompt: "authentic virtual vocaloid singer, bright Japanese idol pop voice, crisp robotic pitch articulation, high-register synthetic vocal delivery",
    description: "Classic high-pitched, sparkling synthetic idol voice with pristine pitch control"
  },
  {
    id: "android-idol",
    name: "Android Idol",
    character: "Hyperpop Virtual Singer",
    f0: 260,
    f1: 680,
    f2: 2000,
    f3: 2950,
    timbre: "Hyperpop Virtual Singer",
    vocaloidPrompt: "expressive anime vocaloid singing, futuristic digital diva, autotuned synthetic singing timbre, energetic and sharp delivery",
    description: "Punchy, modern virtual singer built for future bass and electro hooks"
  },
  {
    id: "mecha-tenor",
    name: "Mecha Tenor",
    character: "Cybernetic Male Vocaloid",
    f0: 175,
    f1: 520,
    f2: 1650,
    f3: 2600,
    timbre: "Synthetic Male Vocaloid",
    vocaloidPrompt: "male vocaloid virtual singer, crisp cybernetic tenor voice, precise synthesizer formant singing, clean electronic articulation",
    description: "Clear, resonant male vocaloid character tuned for tech house and synthwave"
  },
  {
    id: "pixel-chibi",
    name: "Pixel Chibi",
    character: "Cute 8-Bit Synthoid",
    f0: 330,
    f1: 800,
    f2: 2300,
    f3: 3400,
    timbre: "Chibi Chip-tuned Vocaloid",
    vocaloidPrompt: "cute high-pitched chibi vocaloid voice, bitcrushed electronic singer, cheerful and playful anime cyber melody",
    description: "Ultra high-register playful voice with subtle bit-crushed sparkle"
  },
  {
    id: "dark-synthoid",
    name: "Dark Synthoid",
    character: "Deep Industrial Cyber-Voice",
    f0: 105,
    f1: 390,
    f2: 1250,
    f3: 2200,
    timbre: "Deep Industrial Vocaloid",
    vocaloidPrompt: "deep dark industrial synthoid voice, heavy vocoder undertones, brooding baritone virtual singer, mechanical cyber delivery",
    description: "Deep, mysterious mechanical baritone perfect for darksynth and techno"
  },
  {
    id: "aoi-mirage",
    name: "Aoi Mirage",
    character: "Trance Anthem Diva",
    f0: 310,
    f1: 750,
    f2: 2150,
    f3: 3200,
    timbre: "Ethereal Trance Vocaloid",
    vocaloidPrompt: "soaring uplifting trance vocaloid singer, ethereal high-frequency harmonics, crystal clear synthetic Japanese soprano",
    description: "Shimmering, expansive stadium trance vocaloid tuned for euphoric drops"
  },
  {
    id: "kuro-shifter",
    name: "Kuro Shifter",
    character: "Glitch Android Vocalist",
    f0: 140,
    f1: 460,
    f2: 1500,
    f3: 2450,
    timbre: "Glitch Robovocal",
    vocaloidPrompt: "glitched pitch-shifting robotic vocalist, micro-sampled cybernetic stabs, complex electronic formant stutter",
    description: "Intricate, stuttering glitch-hop and neurofunk robotic singer"
  },
  {
    id: "sakura-spark",
    name: "Sakura Spark",
    character: "Kawaii Future Pop Idol",
    f0: 320,
    f1: 780,
    f2: 2250,
    f3: 3300,
    timbre: "Kawaii Future Idol",
    vocaloidPrompt: "kawaii future bass virtual singer, cheerful Japanese anime vocaloid, sparkling bubbly high-register melody",
    description: "Bubbly, cheerful vocaloid engineered for high-energy future bass and happy hardcore"
  },
  {
    id: "ryu-storm",
    name: "Ryu Storm",
    character: "Cyberpunk Shouting Vocaloid",
    f0: 160,
    f1: 540,
    f2: 1720,
    f3: 2700,
    timbre: "Aggressive Cyberpunk Vocaloid",
    vocaloidPrompt: "aggressive cybernetic shouting male vocaloid, gritty overdrive formant resonance, high energy electro rock singer",
    description: "Gritty, driven male vocaloid with saturated harmonic overtones"
  },
  {
    id: "hana-bloom",
    name: "Hana Bloom",
    character: "Breathy Ballad Whisperer",
    f0: 240,
    f1: 620,
    f2: 1850,
    f3: 2800,
    timbre: "Whispery Soft Vocaloid",
    vocaloidPrompt: "breathy soft vocaloid singer, gentle intimate synthetic voice, delicate Japanese acoustic-electronic delivery",
    description: "Intimate, warm whisper-style vocaloid for melodic house and chillout"
  },
  {
    id: "nexus-core",
    name: "Nexus Core",
    character: "Pure Quantized Vocoder",
    f0: 130,
    f1: 500,
    f2: 1550,
    f3: 2500,
    timbre: "Robotic Vocoder Matrix",
    vocaloidPrompt: "classic quantized robotic vocoder voice, metallic carrier modulation, German electro Kraftwerk style speech synth",
    description: "Pure vintage robotic vocoder voice with robotic pitch snap"
  },
  {
    id: "vesper-dusk",
    name: "Vesper Dusk",
    character: "Darkwave Contralto",
    f0: 190,
    f1: 580,
    f2: 1680,
    f3: 2600,
    timbre: "Moody Darkwave Vocaloid",
    vocaloidPrompt: "moody gothic darkwave virtual singer, brooding low-register female vocaloid, melancholic analog synth resonance",
    description: "Smoky, sultry synthetic contralto for darksynth and minimal techno"
  },
  {
    id: "chrono-boy",
    name: "Chrono Boy",
    character: "Neo-Tokyo J-Rock Idol",
    f0: 185,
    f1: 550,
    f2: 1750,
    f3: 2750,
    timbre: "J-Rock Synthetic Tenor",
    vocaloidPrompt: "energetic J-Rock male vocaloid, crisp youthful Japanese pop-punk singer, bright harmonic punch",
    description: "Youthful and punchy tenor vocaloid built for fast electronic rock beats"
  },
  {
    id: "stella-nova",
    name: "Stella Nova",
    character: "Cosmic Operatic Diva",
    f0: 350,
    f1: 820,
    f2: 2400,
    f3: 3500,
    timbre: "Operatic Cyber Soprano",
    vocaloidPrompt: "operatic space diva vocaloid, majestic high soprano synthetic vibrato, vast cosmic reverb delivery",
    description: "Dramatic high soprano with wide synthetic vibrato for psytrance and ambient"
  },
  {
    id: "glitch-bit",
    name: "Glitch Bit",
    character: "8-Bit Chiptune Pixie",
    f0: 340,
    f1: 810,
    f2: 2350,
    f3: 3450,
    timbre: "Bitcrushed Pixie Vocaloid",
    vocaloidPrompt: "8-bit chiptune pixie vocaloid, quantized square wave vibrato, playful retro arcade singing character",
    description: "Playful arcade chip-tuned singer with stepped pitch modulation"
  },
  {
    id: "echo-phantom",
    name: "Echo Phantom",
    character: "Ethereal Ambient Spirit",
    f0: 220,
    f1: 600,
    f2: 1800,
    f3: 2850,
    timbre: "Drifting Ethereal Vocaloid",
    vocaloidPrompt: "haunting ethereal ambient vocaloid, shimmering spectral formant wash, dreamlike floating vocal texture",
    description: "Ghostly and atmospheric synthetic voice ideal for ambient and dub techno"
  },
  {
    id: "volt-runner",
    name: "Volt Runner",
    character: "Industrial EBM Shifter",
    f0: 120,
    f1: 420,
    f2: 1350,
    f3: 2300,
    timbre: "Hard Industrial Robovocal",
    vocaloidPrompt: "industrial EBM synthetic voice, harsh distorted electronic chant, aggressive electronic body music vocalist",
    description: "Harsh, rhythmic machine vocal for hard techno, industrial, and EBM"
  },
  {
    id: "yuki-frost",
    name: "Yuki Frost",
    character: "Icy Crystal Balladeer",
    f0: 280,
    f1: 710,
    f2: 2050,
    f3: 3050,
    timbre: "Pristine Cold Soprano",
    vocaloidPrompt: "pristine crystal clear Japanese vocaloid, pure sine wave purity, cool emotional delivery, clean pitch stability",
    description: "Laser-pure, cold crystal soprano for progressive house and future garage"
  },
  {
    id: "mirai-byte",
    name: "Mirai Byte",
    character: "Future Bass Club Diva",
    f0: 270,
    f1: 700,
    f2: 2020,
    f3: 3000,
    timbre: "Hyper-Melodic Club Vocaloid",
    vocaloidPrompt: "future bass club diva vocaloid, autotuned pitch glides, dynamic sidechained electronic pop delivery",
    description: "Modern melodic bass singer with wide dynamic range and snappy pitch glides"
  },
  {
    id: "kage-shadow",
    name: "Kage Shadow",
    character: "Cyber Bassline MC",
    f0: 135,
    f1: 480,
    f2: 1480,
    f3: 2420,
    timbre: "Fast Cyber Rap Vocaloid",
    vocaloidPrompt: "fast cybernetic rap vocaloid, UK garage syncopated cadence, rapid-fire robotic rhyming flow",
    description: "Rapid-fire syncopated cyber MC for drum & bass, jungle, and UK garage"
  },
  {
    id: "luna-crescent",
    name: "Luna Crescent",
    character: "City Pop Synth Chanteuse",
    f0: 250,
    f1: 660,
    f2: 1920,
    f3: 2900,
    timbre: "Nostalgic City Pop Vocaloid",
    vocaloidPrompt: "80s Japanese city pop virtual singer, warm nostalgic synthetic timbre, sweet melodious synth-funk delivery",
    description: "Smooth, nostalgic 80s Tokyo aesthetic voice for nu-disco and synthwave"
  },
  {
    id: "titan-forge",
    name: "Titan Forge",
    character: "Heavy Metal Cyber-Growler",
    f0: 95,
    f1: 360,
    f2: 1180,
    f3: 2150,
    timbre: "Sub-harmonic Cyber Growl",
    vocaloidPrompt: "sub-harmonic industrial growling vocaloid, massive low frequency rasp, cybernetic heavy metal roar",
    description: "Monstrous low-end mechanical growl for tearout dubstep and industrial techno"
  },
  {
    id: "aria-velvet",
    name: "Aria Velvet",
    character: "Electro-Jazz Chanteuse",
    f0: 210,
    f1: 590,
    f2: 1780,
    f3: 2720,
    timbre: "Silky Electro-Jazz Vocaloid",
    vocaloidPrompt: "silky smooth electro jazz vocaloid, sultry synthesized lounge singer, sophisticated warm electronic warmth",
    description: "Warm, sophisticated virtual chanteuse for deep house and trip-hop"
  },
  {
    id: "zeta-pulse",
    name: "Zeta Pulse",
    character: "Breakcore Speed Vocaloid",
    f0: 315,
    f1: 760,
    f2: 2200,
    f3: 3250,
    timbre: "Hyper-Speed Glitch Diva",
    vocaloidPrompt: "hyper-speed breakcore vocaloid, rapid chopped anime vocals, manic high-tempo rhythmic pitch shifts",
    description: "Manic, chopped high-speed vocalist tuned for 180+ BPM breakcore"
  },
  {
    id: "haru-melody",
    name: "Haru Melody",
    character: "Melodic Anime Idol",
    f0: 275,
    f1: 690,
    f2: 2040,
    f3: 3020,
    timbre: "Sweet Anime Pop Vocaloid",
    vocaloidPrompt: "sweet bright anime opening theme vocaloid, uplifting melody, crystal clear Japanese youth pop singer",
    description: "Bright, earnest anime theme song singer with sparkling clarity"
  },
  {
    id: "sora-aerial",
    name: "Sora Aerial",
    character: "Soaring Vocal Trance Lead",
    f0: 295,
    f1: 730,
    f2: 2120,
    f3: 3150,
    timbre: "Airy Festival Vocaloid",
    vocaloidPrompt: "airy soaring vocal trance virtual diva, epic festival anthem lead, emotional sustained synthetic vibrato",
    description: "Airy, high-flying vocaloid made for colossal festival trance breakdowns"
  },
  {
    id: "vector-prime",
    name: "Vector Prime",
    character: "Retro Robot Crooner",
    f0: 150,
    f1: 510,
    f2: 1600,
    f3: 2550,
    timbre: "Vintage Analog Robovocal",
    vocaloidPrompt: "retro 80s robot crooner voice, analog vocoder filtering, groovy electro funk machine baritone",
    description: "Charming vintage robot baritone for electro funk and French touch"
  },
  {
    id: "rin-quartz",
    name: "Rin Quartz",
    character: "Piercing Electro Lead",
    f0: 285,
    f1: 715,
    f2: 2080,
    f3: 3080,
    timbre: "Sharp Laser Vocaloid",
    vocaloidPrompt: "sharp piercing electro house vocaloid, laser-precise pitch alignment, cutting modern synthetic tone",
    description: "Laser-focused, cutting vocaloid lead that slices through thick synth mixes"
  },
  {
    id: "kaida-dragon",
    name: "Kaida Dragon",
    character: "Tribal Cyber-Chanter",
    f0: 230,
    f1: 640,
    f2: 1880,
    f3: 2820,
    timbre: "Mystic Cyber-Chant Vocaloid",
    vocaloidPrompt: "mystic tribal cyber chanter vocaloid, ancient futuristic modal scales, resonant overtone vocalization",
    description: "Mystical, modal-scale chanter for psytrance, organic house, and wave"
  },
  {
    id: "zero-gravity",
    name: "Zero Gravity",
    character: "Deep Space Floating Synthoid",
    f0: 165,
    f1: 530,
    f2: 1690,
    f3: 2620,
    timbre: "Hypnotic Space Vocaloid",
    vocaloidPrompt: "hypnotic floating zero-gravity vocaloid, slow gentle breathy modulation, deep space ambient vocal texture",
    description: "Weightless, hypnotic synthetic voice for deep dub techno and space ambient",
    gender: "male"
  },
  // --- 40 Additional Male Vocaloids & Vocaloid Rappers ---
  {
    id: "kenji-drill",
    name: "Kenji Drill",
    character: "UK Drill Cyber MC",
    f0: 125,
    f1: 440,
    f2: 1400,
    f3: 2350,
    timbre: "UK Drill Male Robovocal",
    vocaloidPrompt: "male vocaloid UK drill rapper, syncopated sliding 808 cadence, aggressive cybernetic drill flow, gritty London accent synthetic rap delivery",
    description: "Cold sliding UK drill cyber MC with rapid triplet syllable patterns",
    gender: "male",
    isRapper: true
  },
  {
    id: "blaze-cypher",
    name: "Blaze Cypher",
    character: "Boom Bap Robovocal",
    f0: 135,
    f1: 470,
    f2: 1480,
    f3: 2420,
    timbre: "Boom Bap Android MC",
    vocaloidPrompt: "90s boom bap male vocaloid rapper, punchy crisp syllabic rhyming, mechanical golden-era flow, rhythmic syncopated cadence",
    description: "Punchy, rhythmic 90s boom bap android spitter with complex rhyme schemes",
    gender: "male",
    isRapper: true
  },
  {
    id: "kaze-flow",
    name: "Kaze Flow",
    character: "Fast-Chop Cyber Rapper",
    f0: 145,
    f1: 490,
    f2: 1540,
    f3: 2500,
    timbre: "Double-Time Speed Rapper",
    vocaloidPrompt: "ultra-fast double time male vocaloid rapper, rapid chopped syllables, breathless supersonic speed flow, precise electronic articulation",
    description: "High-speed chopper vocaloid capable of blistering double-time rap verses",
    gender: "male",
    isRapper: true
  },
  {
    id: "talon-trap",
    name: "Talon Trap",
    character: "Trap Auto-Tune Vocaloid",
    f0: 155,
    f1: 510,
    f2: 1600,
    f3: 2560,
    timbre: "Melodic Trap Male Vocaloid",
    vocaloidPrompt: "melodic trap male vocaloid, heavy pitch-corrected warble, triplet cadence, smooth auto-tuned modern rap-singing style",
    description: "Modern trap rapper with snappy auto-tuned pitch glides and catchy hooks",
    gender: "male",
    isRapper: true
  },
  {
    id: "ghost-beatbox",
    name: "Ghost Beatbox",
    character: "Cybernetic Beatbox MC",
    f0: 115,
    f1: 410,
    f2: 1320,
    f3: 2280,
    timbre: "Percussive Rap Synthoid",
    vocaloidPrompt: "percussive cybernetic male beatbox rapper, rhythmic vocal clicks, tight mechanical breath cadences, punchy rap delivery",
    description: "Percussive vocaloid MC blending rhythmic mouth percussion with tight bars",
    gender: "male",
    isRapper: true
  },
  {
    id: "vandal-grime",
    name: "Vandal Grime",
    character: "140 Grime Spitter",
    f0: 138,
    f1: 480,
    f2: 1500,
    f3: 2460,
    timbre: "Grime Cybernetic MC",
    vocaloidPrompt: "aggressive 140 bpm grime male vocaloid, fast syncopated reload bars, hard-hitting British cyber grime flow",
    description: "Aggressive, high-energy 140 BPM grime MC built for heavy basslines and square synths",
    gender: "male",
    isRapper: true
  },
  {
    id: "daisuke-lofi",
    name: "Daisuke Lo-Fi",
    character: "Chill Lo-Fi Male Vocalist",
    f0: 160,
    f1: 530,
    f2: 1620,
    f3: 2580,
    timbre: "Warm Relaxed Male Vocaloid",
    vocaloidPrompt: "intimate relaxed lo-fi male vocaloid, warm jazzy crooning, laid-back melodic delivery, subtle tape warmth",
    description: "Mellow, relaxed male voice for chillhop, jazzy house, and downtempo beats",
    gender: "male"
  },
  {
    id: "ryuu-baritone",
    name: "Ryuu Baritone",
    character: "Neo-Classical Male Singer",
    f0: 108,
    f1: 400,
    f2: 1280,
    f3: 2220,
    timbre: "Deep Dramatic Baritone",
    vocaloidPrompt: "rich theatrical neo-classical male vocaloid baritone, soaring operatic vibrato, grand emotional electronic resonance",
    description: "Deep, theatrical baritone with operatic sustained notes for melodic techno and synthwave",
    gender: "male"
  },
  {
    id: "axel-screamer",
    name: "Axel Screamer",
    character: "Electro-Core Screaming Tenor",
    f0: 175,
    f1: 560,
    f2: 1750,
    f3: 2720,
    timbre: "Distorted Electro Tenor",
    vocaloidPrompt: "high-energy electro punk male vocaloid, aggressive distorted vocal shouts, energetic post-hardcore electronic singer",
    description: "Overdriven, high-octane rock-electronic male vocal for complextro and hard electro",
    gender: "male"
  },
  {
    id: "cipher-shadow",
    name: "Cipher Shadow",
    character: "Underground Dark Trap MC",
    f0: 100,
    f1: 380,
    f2: 1220,
    f3: 2180,
    timbre: "Subterranean Whisper MC",
    vocaloidPrompt: "dark subterranean underground male vocaloid rapper, raspy whispered 808 delivery, eerie phonk cadence",
    description: "Low, menacing whispered flow designed for drift phonk and dark trap",
    gender: "male",
    isRapper: true
  },
  {
    id: "shinobi-mic",
    name: "Shinobi Mic",
    character: "Ninja Cyber Rapper",
    f0: 140,
    f1: 480,
    f2: 1510,
    f3: 2470,
    timbre: "Stealth Cyber Rapper",
    vocaloidPrompt: "stealthy intricate male vocaloid cyber rapper, Japanese-English bilingual rap flows, sharp cutting syllable placement",
    description: "Sharp, acrobatic cyber rapper with intricate polysyllabic rhyme schemes",
    gender: "male",
    isRapper: true
  },
  {
    id: "apex-divo",
    name: "Apex Divo",
    character: "EDM Festival Anthem Tenor",
    f0: 180,
    f1: 570,
    f2: 1780,
    f3: 2760,
    timbre: "Soaring EDM Male Tenor",
    vocaloidPrompt: "euphoric EDM festival male vocaloid lead, powerful anthemic tenor belts, crystal clear progressive house hook singer",
    description: "Huge festival-ready male lead vocals with soaring chorus power",
    gender: "male"
  },
  {
    id: "ronin-bass",
    name: "Ronin Bass",
    character: "Sub-Zero Deep Baritone",
    f0: 92,
    f1: 350,
    f2: 1140,
    f3: 2100,
    timbre: "Sub-Harmonic Deep Bass",
    vocaloidPrompt: "rumbling sub-bass male vocaloid, monolithic low frequencies, deep guttural chest resonance, slow powerful delivery",
    description: "Sub-harmonic bass voice that vibrates the low end in dubstep and industrial",
    gender: "male"
  },
  {
    id: "tetsu-steel",
    name: "Tetsu Steel",
    character: "Industrial Techno Chant",
    f0: 110,
    f1: 410,
    f2: 1300,
    f3: 2260,
    timbre: "Metallic Factory Chant",
    vocaloidPrompt: "rhythmic metallic industrial techno male chant, repetitive hypnotic warehouse cadence, mechanical factory spoken voice",
    description: "Cold, rhythmic, mechanical warehouse chant for Berlin techno and EBM",
    gender: "male"
  },
  {
    id: "kouji-sunset",
    name: "Kouji Sunset",
    character: "City Pop Melodic Crooner",
    f0: 165,
    f1: 540,
    f2: 1680,
    f3: 2640,
    timbre: "Smooth 80s City Pop Voice",
    vocaloidPrompt: "nostalgic 80s Japanese city pop male vocaloid, romantic smooth crooning, warm analog funk soul harmonies",
    description: "Suave, nostalgic 80s Japanese pop vocalist for nu-disco and french house",
    gender: "male"
  },
  {
    id: "onyx-spitter",
    name: "Onyx Spitter",
    character: "Battle Rap Vocaloid",
    f0: 130,
    f1: 460,
    f2: 1460,
    f3: 2410,
    timbre: "Aggressive Battle MC",
    vocaloidPrompt: "punchy aggressive battle rap male vocaloid, high syllable density, combative energetic cadence, crisp street punchlines",
    description: "Aggressive, high-impact battle rapper with razor-sharp punchline delivery",
    gender: "male",
    isRapper: true
  },
  {
    id: "raiden-glitch",
    name: "Raiden Glitch",
    character: "Breakcore Glitch Rapper",
    f0: 150,
    f1: 500,
    f2: 1580,
    f3: 2540,
    timbre: "Hyper-Chopped Glitch MC",
    vocaloidPrompt: "breakcore male glitch rapper, rapid stutter pitch bends, hyper-kinetic stuttered rhyme flow, extreme electronic modulation",
    description: "Chopped, stuttering hyper-speed rapper for breakcore and speed garage",
    gender: "male",
    isRapper: true
  },
  {
    id: "haze-cloud",
    name: "Haze Cloud",
    character: "Cloud Rap Ambient MC",
    f0: 142,
    f1: 490,
    f2: 1520,
    f3: 2480,
    timbre: "Hypnotic Reverb MC",
    vocaloidPrompt: "hypnotic ambient cloud rap male vocaloid, reverbed ethereal mumble flow, dreamy pitch-shifted hooks",
    description: "Reverberant, dreamy cloud rap vocalist for wave and future garage",
    gender: "male",
    isRapper: true
  },
  {
    id: "slick-chrome",
    name: "Slick Chrome",
    character: "Electro-Funk Talkbox Crooner",
    f0: 155,
    f1: 520,
    f2: 1620,
    f3: 2590,
    timbre: "Funky Talkbox Male Voice",
    vocaloidPrompt: "groovy funk talkbox male vocaloid, bouncy P-Funk electronic vibrato, playful retro synth talkbox lead",
    description: "Funky talkbox lead voice inspired by classic robot boogie and electro-funk",
    gender: "male"
  },
  {
    id: "vector-drill",
    name: "Vector Drill",
    character: "Dark Melodic Drill Vocaloid",
    f0: 120,
    f1: 430,
    f2: 1370,
    f3: 2320,
    timbre: "Melodic Dark Drill Spitter",
    vocaloidPrompt: "melodic dark drill male vocaloid rapper, minor-key auto-tuned slides, aggressive 808 glide accompaniment flow",
    description: "Moody, melodic drill rapper blending singing hooks with gritty bars",
    gender: "male",
    isRapper: true
  },
  {
    id: "jiro-rock",
    name: "Jiro Rock",
    character: "J-Electro Rocker",
    f0: 170,
    f1: 550,
    f2: 1720,
    f3: 2690,
    timbre: "Dynamic J-Rock Tenor",
    vocaloidPrompt: "passionate J-Electro rock male vocaloid, anime action theme singer, powerful driving mid-range belt",
    description: "High-energy anime opening rock vocalist for electro-house and dnb",
    gender: "male"
  },
  {
    id: "matrix-spitter",
    name: "Matrix Spitter",
    character: "Sci-Fi Cybernetic MC",
    f0: 128,
    f1: 450,
    f2: 1440,
    f3: 2390,
    timbre: "Algorithmic Cyber MC",
    vocaloidPrompt: "futuristic algorithmic male vocaloid rapper, quantized robotic cadence, vocoded sci-fi punchlines, high-tech bars",
    description: "Laser-precise sci-fi MC that delivers algorithmic rhyming over electro beats",
    gender: "male",
    isRapper: true
  },
  {
    id: "bane-gutter",
    name: "Bane Gutter",
    character: "Deathcore Cyber Growler",
    f0: 88,
    f1: 340,
    f2: 1100,
    f3: 2050,
    timbre: "Guttural Sub Growl",
    vocaloidPrompt: "distorted deathcore cybernetic male growler, extreme low register rasp, monstrous industrial guttural roar",
    description: "Savage, distorted guttural growler for heavy tearout dubstep and hard techno",
    gender: "male"
  },
  {
    id: "taro-folk",
    name: "Taro Folk",
    character: "Acoustic-Electronic Indie",
    f0: 152,
    f1: 510,
    f2: 1610,
    f3: 2580,
    timbre: "Gentle Indie Male Voice",
    vocaloidPrompt: "gentle indie folk electronic male vocaloid, intimate breathy timbre, heartfelt warm melodic acoustic singing",
    description: "Gentle, organic indie male singer for melodic house and downtempo",
    gender: "male"
  },
  {
    id: "kip-speed",
    name: "Kip Speed",
    character: "Footwork / Juke Rapper",
    f0: 160,
    f1: 530,
    f2: 1650,
    f3: 2620,
    timbre: "160 BPM Footwork MC",
    vocaloidPrompt: "160 bpm Chicago footwork juke male vocaloid rapper, rapid repetitive rhythmic vocal chops, syncopated bounce",
    description: "Rapid, bouncy footwork MC engineered for 160 BPM syncopated beats",
    gender: "male",
    isRapper: true
  },
  {
    id: "zenith-soul",
    name: "Zenith Soul",
    character: "Neo-Soul Synthetic Tenor",
    f0: 172,
    f1: 560,
    f2: 1740,
    f3: 2710,
    timbre: "Velvet Neo-Soul Male",
    vocaloidPrompt: "velvety neo-soul male vocaloid, expressive runs and ad-libs, warm Rhodes-backed silky R&B electro vocals",
    description: "Velvety smooth synthetic R&B tenor for liquid dnb and deep house",
    gender: "male"
  },
  {
    id: "rico-wave",
    name: "Rico Wave",
    character: "Synthwave Sunset Tenor",
    f0: 158,
    f1: 530,
    f2: 1660,
    f3: 2630,
    timbre: "Lush Gated Reverb Tenor",
    vocaloidPrompt: "dramatic 80s movie synthwave male vocaloid, lush gated reverb, nostalgic power ballad tenor delivery",
    description: "Dramatically reverbed 80s tenor vocal for neon-drenched synthwave anthems",
    gender: "male"
  },
  {
    id: "kuma-beast",
    name: "Kuma Beast",
    character: "Massive Festival Hypeman",
    f0: 112,
    f1: 420,
    f2: 1340,
    f3: 2290,
    timbre: "Booming Arena Hypeman",
    vocaloidPrompt: "booming stadium arena festival male hypeman vocaloid, high energy party shouts, energetic crowd-moving hype chants",
    description: "Booming hype MC providing electrifying build-up shouts and drop calls",
    gender: "male",
    isRapper: true
  },
  {
    id: "dante-noir",
    name: "Dante Noir",
    character: "French Touch Filter Crooner",
    f0: 148,
    f1: 500,
    f2: 1590,
    f3: 2560,
    timbre: "Filtered Disco Male Voice",
    vocaloidPrompt: "filtered French touch disco funk male vocaloid, smooth phased delivery, chic Parisian club vocal style",
    description: "Slick, filtered disco crooner tailored for french house and nu-disco",
    gender: "male"
  },
  {
    id: "yuto-trap",
    name: "Yuto Trap",
    character: "Plugg & Hyper-Trap MC",
    f0: 162,
    f1: 540,
    f2: 1670,
    f3: 2650,
    timbre: "Bouncy Plugg Male Vocaloid",
    vocaloidPrompt: "bouncy airy plugg male vocaloid rapper, melodic hyper-trap ad-libs, light playful autotuned flow",
    description: "Playful, airy plugg rapper with sweet melodic ad-libs and bouncy rhythms",
    gender: "male",
    isRapper: true
  },
  {
    id: "recon-agent",
    name: "Recon Agent",
    character: "Tactical Cyber Spy MC",
    f0: 122,
    f1: 430,
    f2: 1390,
    f3: 2340,
    timbre: "Deadpan Tactical Rapper",
    vocaloidPrompt: "cold deadpan tactical espionage male vocaloid rapper, precision rhythmic monotone bars, dark spy techno flow",
    description: "Deadpan, razor-precise tactical rap delivery for dark techno and halftime",
    gender: "male",
    isRapper: true
  },
  {
    id: "sora-tenor",
    name: "Sora Tenor",
    character: "Uplifting Trance Male Lead",
    f0: 185,
    f1: 580,
    f2: 1800,
    f3: 2790,
    timbre: "Euphoric Trance Male Voice",
    vocaloidPrompt: "soaring euphoric uplifting trance male vocaloid, crystal pure pitch, heartfelt emotional stadium trance lead",
    description: "Pristine, soaring male trance vocalist for emotional supersaw breakdowns",
    gender: "male"
  },
  {
    id: "brick-city",
    name: "Brick City",
    character: "East Coast Gritty Android",
    f0: 118,
    f1: 430,
    f2: 1380,
    f3: 2330,
    timbre: "Gritty Raw Boom Bap MC",
    vocaloidPrompt: "gritty East Coast 90s boom bap male vocaloid rapper, raw gravelly street tone, hard-hitting rhythmic punchlines",
    description: "Gravelly, hard-hitting East Coast boom bap android for hip-hop and breaks",
    gender: "male",
    isRapper: true
  },
  {
    id: "flux-melodic",
    name: "Flux Melodic",
    character: "Melodic Bass Vocaloid",
    f0: 168,
    f1: 550,
    f2: 1710,
    f3: 2680,
    timbre: "Emotional Crying Tenor",
    vocaloidPrompt: "emotional melancholic future bass male vocaloid, modern singing-rapping hybrid, expressive pitch glides",
    description: "Crying emotional autotune male lead for melodic dubstep and future bass",
    gender: "male",
    isRapper: true
  },
  {
    id: "kazuo-jazz",
    name: "Kazuo Jazz",
    character: "Acid Jazz Male Vocaloid",
    f0: 144,
    f1: 490,
    f2: 1530,
    f3: 2490,
    timbre: "Syncopated Spoken Word MC",
    vocaloidPrompt: "acid jazz male vocaloid, syncopated spoken-word poetry, rhythmic jazz scatting, sophisticated smooth cadence",
    description: "Sophisticated jazz vocaloid with spoken word and syncopated scat rhythms",
    gender: "male",
    isRapper: true
  },
  {
    id: "gale-tempest",
    name: "Gale Tempest",
    character: "Speed Metal Cyber Belter",
    f0: 188,
    f1: 590,
    f2: 1820,
    f3: 2810,
    timbre: "High Power Metal Tenor",
    vocaloidPrompt: "piercing power metal male vocaloid belter, blisteringly high vibrato, dramatic theatrical rock-electronic screams",
    description: "High-register power metal belter for drumstep and electronic rock",
    gender: "male"
  },
  {
    id: "roc-sub",
    name: "Roc Sub",
    character: "808 Sub-Bass Rapper",
    f0: 96,
    f1: 360,
    f2: 1190,
    f3: 2160,
    timbre: "Ultra-Low Sub Rapper",
    vocaloidPrompt: "ultra-low sub-frequency trap male vocaloid rapper, heavy chest resonance, slow menacing cadence, bassweight bars",
    description: "Ultra-deep sub frequency rapper tuned to shake club subwoofers",
    gender: "male",
    isRapper: true
  },
  {
    id: "keno-chime",
    name: "Keno Chime",
    character: "Chiptune Boy Idol",
    f0: 178,
    f1: 560,
    f2: 1760,
    f3: 2740,
    timbre: "Bright 8-Bit Boy Vocal",
    vocaloidPrompt: "upbeat 8-bit gameboy male pop vocaloid, quantized square wave vibrato, youthful cheerful chiptune melodies",
    description: "Youthful arcade boy idol with stepped 8-bit vibrato and infectious melodies",
    gender: "male"
  },
  {
    id: "verve-lyricist",
    name: "Verve Lyricist",
    character: "Conscious Hip-Hop Vocaloid",
    f0: 132,
    f1: 460,
    f2: 1470,
    f3: 2420,
    timbre: "Poetic Conscious MC",
    vocaloidPrompt: "conscious hip hop male vocaloid lyricist, thoughtful poetic cadence, warm organic boom bap storytelling flow",
    description: "Thoughtful poetic lyricist with warm acoustic resonance and rhythmic flow",
    gender: "male",
    isRapper: true
  },
  {
    id: "zero-drill",
    name: "Zero Drill",
    character: "NY Drill Glitch Rapper",
    f0: 126,
    f1: 440,
    f2: 1410,
    f3: 2360,
    timbre: "Aggressive NY Drill MC",
    vocaloidPrompt: "aggressive NY drill male vocaloid rapper, sliding bass cadence, punchy staccato flow, high-energy cybernetic ad-libs",
    description: "Hard-hitting NY drill spitter with aggressive staccato rhyme schemes",
    gender: "male",
    isRapper: true
  }
];

export default function App() {
  // Voice sample state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [selectedVocaloidId, setSelectedVocaloidId] = useState<string | null>(null);
  const [vocaloidFilter, setVocaloidFilter] = useState<"all" | "male" | "rapper" | "female">("all");
  const [vocaloidSearch, setVocaloidSearch] = useState("");
  const [voiceSourceMode, setVoiceSourceMode] = useState<"upload" | "vocaloid">("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Genre selection state
  const [selectedCategory, setSelectedCategory] = useState("House");
  const [selectedSubgenreId, setSelectedSubgenreId] = useState("deep-house");
  const [searchQuery, setSearchQuery] = useState("");

  // Lyrics state
  const [lyrics, setLyrics] = useState(
    "Electric shadows dancing in the neon night\nFeel the sub-bass pulse ignite our souls\nWe lose ourselves in the synthesized light\nEchoes falling through the sound console"
  );
  const [isWritingLyrics, setIsWritingLyrics] = useState(false);

  // Vocal synthesis / Song generation state
  const [isAcapella, setIsAcapella] = useState(false);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);
  const [generatedClip, setGeneratedClip] = useState<Clip | null>(null);
  const [stems, setStems] = useState<SplitStemsResult | null>(null);
  const [isSplittingStems, setIsSplittingStems] = useState(false);
  const [stemSplitProgress, setStemSplitProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live in-browser audition state
  const [isAuditioning, setIsAuditioning] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const auditionSourceRef = useRef<{ stop: () => void } | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active subgenre object
  const allSubgenres = useMemo(() => {
    return ELECTRONIC_GENRES.flatMap((cat) => cat.subgenres);
  }, []);

  const activeSubgenre = useMemo(() => {
    return (
      allSubgenres.find((s) => s.id === selectedSubgenreId) ||
      ELECTRONIC_GENRES[0].subgenres[0]
    );
  }, [allSubgenres, selectedSubgenreId]);

  // Filtered subgenres for search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return ELECTRONIC_GENRES;
    const q = searchQuery.toLowerCase();
    return ELECTRONIC_GENRES.map((cat) => ({
      ...cat,
      subgenres: cat.subgenres.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          cat.category.toLowerCase().includes(q)
      )
    })).filter((cat) => cat.subgenres.length > 0);
  }, [searchQuery]);

  // Frequency to musical note helper
  const freqToNote = (freq: number): string => {
    if (freq <= 0) return "C3";
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitonesFromA4 = Math.round(12 * Math.log2(freq / 440));
    const midi = 69 + semitonesFromA4;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = notes[((midi % 12) + 12) % 12];
    return `${noteName}${octave} (${Math.round(freq)} Hz)`;
  };

  // Select a Vocaloid option
  const handleSelectVocaloid = (vocaloid: VocaloidOption) => {
    setSelectedVocaloidId(vocaloid.id);
    setVoiceSourceMode("vocaloid");
    setVoiceProfile({
      name: `${vocaloid.name} (${vocaloid.character})`,
      f0Hz: vocaloid.f0,
      pitchNote: freqToNote(vocaloid.f0),
      formants: { f1: vocaloid.f1, f2: vocaloid.f2, f3: vocaloid.f3 },
      brightness: 0.85,
      timbreDescription: vocaloid.timbre,
      waveformPeaks: Array.from({ length: 80 }, (_, i) =>
        Math.abs(Math.sin(i * 0.25) * 0.7 + Math.cos(i * 0.5) * 0.3)
      ),
      audioUrl: null,
      isVocaloid: true
    });
  };
  const analyzeAudioBuffer = async (audioBuffer: AudioBuffer, fileName: string, blobUrl: string) => {
    setIsAnalyzing(true);
    try {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Extract waveform peaks (100 bins)
      const step = Math.floor(channelData.length / 100);
      const peaks: number[] = [];
      for (let i = 0; i < 100; i++) {
        let max = 0;
        const start = i * step;
        const end = Math.min(start + step, channelData.length);
        for (let j = start; j < end; j += 10) {
          const val = Math.abs(channelData[j]);
          if (val > max) max = val;
        }
        peaks.push(max);
      }

      // Autocorrelation pitch detection on middle segment
      const midPoint = Math.floor(channelData.length / 2);
      const windowSize = Math.min(2048, channelData.length);
      const slice = channelData.slice(midPoint, midPoint + windowSize);

      let bestOffset = -1;
      let maxCorrelation = 0;
      const minOffset = Math.floor(sampleRate / 500); // max 500Hz
      const maxOffset = Math.floor(sampleRate / 70);  // min 70Hz

      for (let offset = minOffset; offset < maxOffset; offset++) {
        let correlation = 0;
        for (let i = 0; i < windowSize - offset; i++) {
          correlation += slice[i] * slice[i + offset];
        }
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation;
          bestOffset = offset;
        }
      }

      const estimatedF0 = bestOffset > 0 ? sampleRate / bestOffset : 140;

      // Classify vocal timbre characteristics
      let timbre = "Warm Natural Baritone";
      let f1 = 500;
      let f2 = 1500;
      let f3 = 2500;

      if (estimatedF0 > 220) {
        timbre = "Bright Airy Soprano";
        f1 = 650;
        f2 = 1900;
        f3 = 2900;
      } else if (estimatedF0 > 165) {
        timbre = "Crisp Expressive Tenor";
        f1 = 550;
        f2 = 1700;
        f3 = 2650;
      } else if (estimatedF0 > 115) {
        timbre = "Rich Resonant Baritone";
        f1 = 480;
        f2 = 1450;
        f3 = 2400;
      } else {
        timbre = "Deep Heavy Bass Voice";
        f1 = 380;
        f2 = 1200;
        f3 = 2200;
      }

      const profile: VoiceProfile = {
        name: fileName,
        f0Hz: Math.round(estimatedF0),
        pitchNote: freqToNote(estimatedF0),
        formants: { f1, f2, f3 },
        brightness: Math.min(0.9, Math.max(0.2, estimatedF0 / 300)),
        timbreDescription: timbre,
        waveformPeaks: peaks,
        audioUrl: blobUrl
      };

      setVoiceProfile(profile);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to extract voice profile. Try another clean vocal sample.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle uploaded audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const blobUrl = URL.createObjectURL(file);
      await analyzeAudioBuffer(decodedBuffer, file.name, blobUrl);
    } catch (err) {
      console.error(err);
      setError("Could not decode audio. Please upload a standard WAV, MP3, or M4A file.");
    }
  };

  // Start microphone recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(audioBlob);

        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === "suspended") await audioCtx.resume();

        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await analyzeAudioBuffer(decodedBuffer, "Recorded Mic Sample.webm", blobUrl);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or unavailable.");
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current !== null) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  // Render waveform to canvas
  useEffect(() => {
    if (!waveformCanvasRef.current || !voiceProfile) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = "rgba(75, 85, 99, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw bars
    const peaks = voiceProfile.waveformPeaks;
    const barWidth = width / peaks.length;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#06b6d4"); // cyan
    gradient.addColorStop(0.5, "#a855f7"); // violet
    gradient.addColorStop(1, "#3b82f6"); // blue
    ctx.fillStyle = gradient;

    peaks.forEach((peak, i) => {
      const h = Math.max(4, peak * (height * 0.85));
      const x = i * barWidth;
      const y = (height - h) / 2;
      ctx.fillRect(x + 1, y, Math.max(1, barWidth - 1.5), h);
    });
  }, [voiceProfile]);

  // AI Lyrics generation using SDK
  const handleGenerateLyrics = async () => {
    setIsWritingLyrics(true);
    setError(null);
    try {
      const prompt = `Write a 4-line electronic vocal lyric for ${activeSubgenre.name} (${activeSubgenre.bpm} BPM)`;
      const res = await writeLyrics({ prompt });
      if (res && res.lyrics) {
        setLyrics(res.lyrics);
      }
    } catch (err: any) {
      console.error("Lyrics generation error:", err);
      setLyrics(
        "Electric signals pulse across the midnight floor\nFeel the sub-bass tearing through the speaker cone\nNeon lasers lighting up the infinite sky\nLost inside the frequency we call our home"
      );
    } finally {
      setIsWritingLyrics(false);
    }
  };

  // Real-time in-browser formant audition
  const handleAuditionVocal = () => {
    if (isAuditioning) {
      if (auditionSourceRef.current) {
        auditionSourceRef.current.stop();
        auditionSourceRef.current = null;
      }
      setIsAuditioning(false);
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    try {
      const now = ctx.currentTime;
      const targetF0 = voiceProfile ? voiceProfile.f0Hz : 140;
      const formants = voiceProfile ? voiceProfile.formants : { f1: 500, f2: 1500, f3: 2500 };

      // Oscillator carrier
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(targetF0, now);

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(voiceProfile?.isVocaloid ? 6.5 : 5.0, now);
      lfoGain.gain.setValueAtTime(targetF0 * 0.03, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      // 3-Band Formant Filter bank
      const f1Filter = ctx.createBiquadFilter();
      f1Filter.type = "bandpass";
      f1Filter.frequency.setValueAtTime(formants.f1, now);
      f1Filter.Q.setValueAtTime(5.0, now);

      const f2Filter = ctx.createBiquadFilter();
      f2Filter.type = "bandpass";
      f2Filter.frequency.setValueAtTime(formants.f2, now);
      f2Filter.Q.setValueAtTime(6.0, now);

      const f3Filter = ctx.createBiquadFilter();
      f3Filter.type = "bandpass";
      f3Filter.frequency.setValueAtTime(formants.f3, now);
      f3Filter.Q.setValueAtTime(7.0, now);

      const filterMix = ctx.createGain();
      filterMix.gain.setValueAtTime(0.5, now);

      osc.connect(f1Filter);
      osc.connect(f2Filter);
      osc.connect(f3Filter);

      f1Filter.connect(filterMix);
      f2Filter.connect(filterMix);
      f3Filter.connect(filterMix);

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      filterMix.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.6);
      lfo.stop(now + 3.6);

      // Web Speech API sync preview
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const snippet = lyrics.split("\n")[0] || "Synthesized vocals online";
        const utter = new SpeechSynthesisUtterance(snippet);
        utter.pitch = Math.min(2, Math.max(0.5, targetF0 / 150));
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
      }

      setIsAuditioning(true);
      auditionSourceRef.current = {
        stop: () => {
          try {
            osc.stop();
            lfo.stop();
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
          } catch (e) {}
        }
      };

      setTimeout(() => {
        setIsAuditioning(false);
        auditionSourceRef.current = null;
      }, 3500);
    } catch (err) {
      console.error("Audition error:", err);
      setIsAuditioning(false);
    }
  };

  // Synthesize audio stems using local OfflineAudioContext

  // Full Song Generation using Flow Music SDK
  const handleGenerateFullSong = async () => {
    if (!lyrics.trim()) {
      setError("Please write or generate some lyrics first.");
      return;
    }

    setIsGeneratingSong(true);
    setError(null);
    setGenerationStep("Synthesizing electronic track with vocal delivery...");

    let vocalDescriptor = "dynamic modern electronic club vocals with expressive delivery";
    if (voiceProfile?.isVocaloid) {
      vocalDescriptor = `${voiceProfile.name} virtual singer, ${voiceProfile.timbreDescription}, expressive synthetic vocal delivery`;
    } else if (voiceProfile) {
      vocalDescriptor = `${voiceProfile.timbreDescription} style vocals with resonant delivery, clear articulation`;
    }

    const soundPrompt = isAcapella
      ? `isolated acapella vocal track, solo vocal lead, pure vocal performance, completely dry and clean singing with natural room acoustic, absolutely no drums, no beat, no bass, no instruments, featuring ${vocalDescriptor}`
      : `${activeSubgenre.name} electronic music, ${activeSubgenre.bpm} bpm, ${activeSubgenre.promptTags}, featuring ${vocalDescriptor}, pristine master production`;

    const songTitle = isAcapella
      ? `Acapella - ${voiceProfile ? voiceProfile.name.replace(/\.[^/.]+$/, "") : "Vocal Stem"}`
      : `${activeSubgenre.name} - ${voiceProfile ? voiceProfile.name.replace(/\.[^/.]+$/, "") : "Vocal Synth"}`;

    let attempts = 0;
    const maxAttempts = 3;
    let songClip: Clip | null = null;
    let lastError: any = null;

    while (attempts < maxAttempts && !songClip) {
      attempts++;
      try {
        if (attempts > 1) {
          setGenerationStep(`Retrying generation (attempt ${attempts}/${maxAttempts})...`);
        }
        songClip = await generateSong({
          soundPrompt,
          lyrics,
          title: songTitle,
        });
      } catch (err: any) {
        lastError = err;
        console.error(`Generation attempt ${attempts} failed:`, err);
        if (err.code === "moderation" || err.code === "rateLimit") {
          break;
        }
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (songClip) {
      setGeneratedClip(songClip);
      setStems(null);
      setError(null);
    } else {
      setError(lastError?.message || "Generation failed. Please try again or check your lyrics.");
    }

    setIsGeneratingSong(false);
    setGenerationStep(null);
  };

  // Stem separation using Flow Music SDK
  const handleSplitStems = async (targetClipId?: string) => {
    const clipIdToSplit = targetClipId || generatedClip?.id;
    if (!clipIdToSplit) {
      setError("Generate or select a track first to isolate stems.");
      return;
    }

    setIsSplittingStems(true);
    setStemSplitProgress("Separating audio stems: isolating vocals, drums, bass & synths (~30-60s)...");
    setError(null);

    try {
      const result = await splitStems({ clipId: clipIdToSplit });
      setStems(result);
    } catch (err: any) {
      console.error("Stem separation error:", err);
      setError(err?.message || "Stem separation failed. Please try again.");
    } finally {
      setIsSplittingStems(false);
      setStemSplitProgress(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/20 text-white">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                VoiceClone <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400">Electronic Studio</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Transform any lyrics into vocals cloned from your voice sample across electronic music
              </p>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            All Electronic Genres
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            Formant & Neural DSP
          </span>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="w-full max-w-6xl mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Sample & Extraction (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Voice & Vocaloid Engine</span>
            </div>
            {voiceProfile && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> {voiceProfile.isVocaloid ? "Vocaloid" : "Cloned"}
              </span>
            )}
          </div>

          {/* Mode Switcher: Cloned Voice Sample vs Vocaloid Virtual Singer */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setVoiceSourceMode("upload");
                if (voiceProfile?.isVocaloid) setVoiceProfile(null);
                setSelectedVocaloidId(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                voiceSourceMode === "upload"
                  ? "bg-slate-800 text-cyan-300 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Custom Voice Clone
            </button>
            <button
              onClick={() => {
                setVoiceSourceMode("vocaloid");
                if (!selectedVocaloidId) handleSelectVocaloid(VOCALOID_OPTIONS[0]);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                voiceSourceMode === "vocaloid"
                  ? "bg-linear-to-r from-violet-600 to-pink-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-pink-300" />
              Vocaloid Singers
            </button>
          </div>

          {voiceSourceMode === "upload" ? (
            <>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload or record a clean 3–15 second audio snippet of a speaking or singing voice to model timbre, pitch, and vocal formants.
              </p>

              {/* Action buttons: Upload and Record */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-all text-center">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">Upload File</span>
                  <span className="text-[10px] text-slate-500">WAV, MP3, M4A</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isRecording || isAnalyzing}
                  />
                </label>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all text-center ${
                    isRecording
                      ? "bg-red-950/80 border-red-500/80 text-red-200 animate-pulse"
                      : "border-dashed border-slate-700 hover:border-violet-500/70 bg-slate-800/40 hover:bg-slate-800/80 text-slate-200"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-5 h-5 text-red-400" />
                      <span className="text-xs font-semibold text-red-300">Stop ({recordDuration}s)</span>
                      <span className="text-[10px] text-red-400/80">Recording...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-violet-400" />
                      <span className="text-xs font-semibold">Record Mic</span>
                      <span className="text-[10px] text-slate-500">Live Voice</span>
                    </>
                  )}
                </button>
              </div>

              {/* Analyzing spinner */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex items-center justify-center gap-3 text-cyan-300 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing vocal harmonics & formants...
                </div>
              )}
            </>
          ) : (
            /* Vocaloid Singer Selection List with Search & Category Filters */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Vocaloid Characters ({VOCALOID_OPTIONS.length}):
                </span>
                <span className="text-[10px] text-pink-400 font-mono">
                  40+ Male & Rappers
                </span>
              </div>

              {/* Vocaloid Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: "all", label: "All" },
                  { id: "male", label: "Male (45)" },
                  { id: "rapper", label: "Rappers (18)" },
                  { id: "female", label: "Female (25)" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setVocaloidFilter(f.id as any)}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                      vocaloidFilter === f.id
                        ? "bg-pink-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Vocaloid Quick Search */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter vocaloids (e.g. Drill, Trap, Baritone)..."
                  value={vocaloidSearch}
                  onChange={(e) => setVocaloidSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {VOCALOID_OPTIONS.filter((voc) => {
                  if (vocaloidFilter === "male" && voc.gender !== "male") return false;
                  if (vocaloidFilter === "female" && voc.gender !== "female") return false;
                  if (vocaloidFilter === "rapper" && !voc.isRapper) return false;
                  if (vocaloidSearch.trim()) {
                    const q = vocaloidSearch.toLowerCase();
                    return (
                      voc.name.toLowerCase().includes(q) ||
                      voc.character.toLowerCase().includes(q) ||
                      voc.description.toLowerCase().includes(q) ||
                      voc.timbre.toLowerCase().includes(q)
                    );
                  }
                  return true;
                }).map((voc) => {
                  const isSelected = selectedVocaloidId === voc.id;
                  return (
                    <div
                      key={voc.id}
                      onClick={() => handleSelectVocaloid(voc)}
                      className={`p-2.5 rounded-xl cursor-pointer border transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? "bg-linear-to-r from-violet-950/80 to-pink-950/60 border-pink-500/80 text-white ring-1 ring-pink-500/60 shadow-lg shadow-pink-500/10"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-pink-300">{voc.name}</span>
                          {voc.isRapper && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                              RAPPER
                            </span>
                          )}
                          {voc.gender === "male" && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                              MALE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                          {voc.f0} Hz
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-200">{voc.character}</span>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{voc.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Waveform Canvas */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Vocal Harmonic Contour
            </span>
            <div className="h-20 w-full bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {voiceProfile ? (
                <canvas
                  ref={waveformCanvasRef}
                  width={320}
                  height={80}
                  className="w-full h-full"
                />
              ) : (
                <span className="text-xs text-slate-600">No vocal sample loaded yet</span>
              )}
            </div>
          </div>

          {/* Voice Profile Card */}
          {voiceProfile && (
            <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/30 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white truncate max-w-42.5">
                  {voiceProfile.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-violet-950 border border-violet-800/60 text-violet-300 text-[10px]">
                  {voiceProfile.timbreDescription}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] block">Fundamental (F0)</span>
                  <span className="font-semibold text-cyan-300">{voiceProfile.pitchNote}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Formant (F1 / F2)</span>
                  <span className="font-semibold text-violet-300">
                    {voiceProfile.formants.f1}Hz / {voiceProfile.formants.f2}Hz
                  </span>
                </div>
              </div>

              {/* Sample playback & audition */}
              <div className="pt-2 flex items-center gap-2">
                {voiceProfile.audioUrl && (
                  <audio
                    src={voiceProfile.audioUrl}
                    controls
                    className="h-8 w-full rounded filter invert brightness-90 contrast-125"
                  />
                )}
              </div>
            </div>
          )}

          {/* Quick preset voices if user hasn't uploaded their own */}
          {!voiceProfile && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">
                Or Quick-Pick a Reference Timbre:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: "Deep Tech Vocals", f0: 110, f1: 450, f2: 1350, f3: 2300, timbre: "Deep Resonant Bass" },
                  { name: "Trance Diva", f0: 245, f1: 680, f2: 1950, f3: 2950, timbre: "Bright Ethereal Soprano" },
                  { name: "Cyber Vocoder", f0: 130, f1: 520, f2: 1600, f3: 2500, timbre: "Crisp Synthetic Tenor" },
                  { name: "Liquid Soul Alto", f0: 180, f1: 580, f2: 1720, f3: 2680, timbre: "Warm Soulful Alto" }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setVoiceProfile({
                        name: preset.name,
                        f0Hz: preset.f0,
                        pitchNote: freqToNote(preset.f0),
                        formants: { f1: preset.f1, f2: preset.f2, f3: preset.f3 },
                        brightness: 0.6,
                        timbreDescription: preset.timbre,
                        waveformPeaks: Array.from({ length: 60 }, (_, i) =>
                          Math.sin(i * 0.3) * 0.5 + 0.4
                        ),
                        audioUrl: null
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Center & Right Columns (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Section 2: Electronic Genres & Subgenres Selection */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Music className="w-4 h-4 text-violet-400" />
                <span>2. Electronic Genre & Subgenre Matrix</span>
              </div>

              {/* Subgenre Search Bar */}
              <div className="relative min-w-50">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subgenres (e.g. Liquid DnB, Hard Techno)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Category tabs */}
            {!searchQuery && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {ELECTRONIC_GENRES.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      setSelectedSubgenreId(cat.subgenres[0].id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.category
                        ? "bg-linear-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/20"
                        : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/60"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>
            )}

            {/* Subgenre Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {(searchQuery ? filteredCategories.flatMap((c) => c.subgenres) : ELECTRONIC_GENRES.find((c) => c.category === selectedCategory)?.subgenres || []).map((sub) => {
                const isSelected = selectedSubgenreId === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubgenreId(sub.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{sub.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                          {sub.bpm} BPM
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected subgenre indicator */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target Genre:</span>
                <span className="font-bold text-cyan-300">{activeSubgenre.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-mono">{activeSubgenre.bpm} BPM</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline-block italic">
                "{activeSubgenre.description}"
              </span>
            </div>
          </div>

          {/* Section 3: Lyrics Input & Synthesis */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>3. Lyrics to Vocalized Track</span>
              </div>

              {/* Generate AI lyrics button */}
              <button
                onClick={handleGenerateLyrics}
                disabled={isWritingLyrics || isGeneratingSong}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors disabled:opacity-50"
              >
                {isWritingLyrics ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                )}
                <span>Generate Lyrics</span>
              </button>
            </div>

            {/* Lyrics textarea */}
            <div className="flex flex-col gap-1.5">
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Enter or paste any lyrics here to convert into vocals..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>{lyrics.split("\n").filter((l) => l.trim().length > 0).length} lines | {lyrics.length} characters</span>
                <span>Cloned vocal tone: {voiceProfile ? voiceProfile.timbreDescription : "Custom Pitch Profile"}</span>
              </div>
            </div>

            {/* Acapella toggle option */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  Render as Acapella
                </span>
                <span className="text-[11px] text-slate-400">
                  Generate pure isolated vocals with no drums, beat, or synths
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAcapella(!isAcapella)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAcapella ? "bg-cyan-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAcapella ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Action Bar: Audition and Generate Song */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {/* Instant Formant Audition */}
              <button
                onClick={handleAuditionVocal}
                disabled={isGeneratingSong}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  isAuditioning
                    ? "bg-amber-600/30 border-amber-500 text-amber-200"
                    : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200"
                }`}
              >
                {isAuditioning ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <span>Audition Cloned Vocals</span>
                  </>
                )}
              </button>

              {/* Full Electronic Track Generation */}
              <button
                onClick={handleGenerateFullSong}
                disabled={isGeneratingSong || !lyrics.trim()}
                className="w-full sm:flex-1 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingSong ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{generationStep || "Synthesizing Cloned Track..."}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {isAcapella
                        ? "Render Isolated Acapella Vocals"
                        : `Render Track with Cloned Vocals (${activeSubgenre.name})`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Song Clip Player */}
            {generatedClip && (
              <div className="mt-4 p-4 rounded-xl bg-linear-to-r from-slate-950 to-slate-900 border border-cyan-500/40 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {generatedClip.coverImageUrl ? (
                    <img
                      src={generatedClip.coverImageUrl}
                      alt="Track Cover"
                      className="w-20 h-20 rounded-lg object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <Music className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 w-full flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {generatedClip.title || `${activeSubgenre.name} Vocal Master`}
                        </h4>
                        <p className="text-xs text-cyan-400">
                          {activeSubgenre.name} • {activeSubgenre.bpm} BPM • Cloned Voice
                        </p>
                      </div>
                      {generatedClip.duration && (
                        <span className="text-xs text-slate-400 font-mono">
                          {Math.round(generatedClip.duration)}s
                        </span>
                      )}
                    </div>

                    <audio
                      src={generatedClip.audioUrl}
                      controls
                      autoPlay
                      className="w-full h-9 rounded filter invert brightness-95"
                    />
                  </div>
                </div>

                {/* Stem Separation Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-violet-400" />
                      Stem Separation (AI Stem Extractor)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Isolate the pure vocal track away from instruments and drums into a standalone acapella
                    </span>
                  </div>

                  <button
                    onClick={() => handleSplitStems(generatedClip.id)}
                    disabled={isSplittingStems || isGeneratingSong}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-violet-600/30 disabled:opacity-50"
                  >
                    {isSplittingStems ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Isolating Stems...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Isolate Vocal Acapella</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress banner during stem separation */}
                {isSplittingStems && (
                  <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/50 flex items-center gap-3 text-xs text-violet-300 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                    <span>{stemSplitProgress || "Processing neural stem separation..."}</span>
                  </div>
                )}

                {/* Separated Stems Showcase */}
                {stems && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-violet-500/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Isolated Stems Ready
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        4 Independent Audio Tracks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* 1. Isolated Vocals (Featured Acapella) */}
                      <div className="p-3 rounded-xl bg-linear-to-r from-violet-950/90 to-cyan-950/70 border border-cyan-500/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-cyan-400" />
                            Isolated Vocals (Pure Acapella)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                            Vocals Only
                          </span>
                        </div>
                        <audio
                          src={stems.vocals.audioUrl}
                          controls
                          className="w-full h-8 filter invert brightness-95"
                        />
                      </div>

                      {/* 2. Isolated Drums */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-amber-400" />
                            Drum Stem
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Percussion
                          </span>
                        </div>
                        <audio
                          src={stems.drums.audioUrl}
                          controls
                          className="w-full h-8 filter invert brightness-95"
                        />
                      </div>

                      {/* 3. Isolated Bass */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-pink-400" />
                            Bass Stem
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Sub & 808
                          </span>
                        </div>
                        <audio
                          src={stems.bass.audioUrl}
                          controls
                          className="w-full h-8 filter invert brightness-95"
                        />
                      </div>

                      {/* 4. Isolated Other (Synths & Instruments) */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-emerald-400" />
                            Instruments & Synths
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Melodic
                          </span>
                        </div>
                        <audio
                          src={stems.other.audioUrl}
                          controls
                          className="w-full h-8 filter invert brightness-95"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}