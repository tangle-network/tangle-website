// Tangle v3 art round. Each brief is a complete creative direction written
// like a director's treatment: identity, subject, narrative, palette with
// hexes, lens and light, texture, composition contract, negative space
// contract, motion implication, mood, and hard bans.

const IDENTITY = `
WHO IS SPEAKING: Tangle, infrastructure for self-improving AI systems.
The brand is a precision optical instrument, not a neon arcade. If this
image were a person it would be a quiet laboratory director who owns one
perfect wool coat: exact, unhurried, certain. Every photon in the frame is
deliberate. Wealth is expressed through restraint and through the quality
of light, never through decoration.

THE MATERIAL: light traveling inside fiber. The canvas itself is deep
indigo, never black: the darkest field is #080814, lifting through #0C0B1D
into #11122D. At thumbnail size the image must still read as an indigo
object, visibly a color.

THE CHROMATIC LAW (dispersion with meaning):
- cyan #22D3EE and ice #67E8F9 mean execution, the run, the machine working
- indigo #6366F1 and #4F46E5 mean the wire, routing, the core of the brand
- violet #A855F7 and #C4B5FD mean analysis, reading, understanding
- magenta #EC4899 and orchid #F0ABFC mean the improvement coming back
Color lives only inside light: glowing filament cores, luminous fields,
additive bloom, atmospheric haze catching a glow. Color is never a flat
painted surface, never plastic, never a sticker.

FINISH AND CRAFT: shot like a $200,000 brand film still. Full-frame cinema
sensor, fast prime lens. Fine 35mm film grain over everything. Gradients
carry imperceptible dither so nothing bands. Bright cores are 1 to 3 pixels
crisp with tight 10 to 20 pixel halos; bloom is expensive and controlled.
One plane of the image is tack sharp; everything else melts into soft
bokeh ribbons. Faint volumetric haze exists only where light justifies it.

ABSOLUTE BANS: no text, no letters, no numerals, no logos, no user
interface, no icons, no arrows, no sci-fi grids, no starfields, no space
nebulae, no planets, no lens flares with streaks, no humans, no hands, no
robots, no keyboards, no circuit boards, no cityscapes, no water, no smoke
that reads as fire, no rainbow candy saturation, no pure black anywhere.
`;

export const OPTIMIZE_FLOW = `${IDENTITY}
TITLE OF THE PIECE: "The Tuning Bench".
FORMAT: wide 16:9, a background/side artifact for a section explaining how
Tangle optimizes a coding harness.
SUBJECT AND NARRATIVE: a single thick braid of fiber-optic light enters
from the lower left, slightly frayed and irregular, its strands wavering
cyan and pale ice, visibly imperfect: kinks, small loops, uneven spacing,
like a tool that works but wastes motion. The braid passes through a
narrow, bright instrument region in the center of frame: an abstract
gauntlet of three or four razor-thin vertical planes of violet light,
like optical combs or lithography masks, evenly spaced, each one taking a
little disorder out of the braid. Between the planes, tiny bright beads of
white-violet light mark where a strand is corrected. The braid exits lower
right transformed: the same number of strands, now perfectly parallel,
evenly spaced, glowing warmer, indigo shading into confident magenta at
the very edge of frame. The transformation must be legible at a glance:
messy in, precise out, same material.
WHAT THIS MEANS (for the artist's intuition only): a coding harness runs;
its traces pass through analysis; small exact corrections accumulate; the
same harness comes out measurably better. The image is that sentence with
no words.
PALETTE DOMINANCE: 55 percent deep indigo field, 20 percent cyan entry
braid, 15 percent violet instrument planes, 10 percent magenta exit.
LIGHT: the instrument planes are the brightest zone, a controlled slot of
illumination like a scanner bar frozen mid-pass; the entry braid is dimmer
and cooler; the exit braid is brighter per-strand but calmer in shape.
Additive glow only; haze pools faintly around the instrument slot.
LENS: 85mm feel, f/2 depth. The instrument region and exit strands are
sharp; the entry braid softens toward the frame edge.
COMPOSITION CONTRACT: the braid path forms a shallow S from lower-left to
lower-right; the instrument slot stands at 48 to 58 percent width, spanning
30 to 75 percent height; the TOP 25 percent of frame is calm atmosphere
only, and the LEFT 12 percent stays quiet. Nothing important touches the
frame edges.
TEXTURE: film grain, dithered gradient sky, crisp strand cores.
MOOD WORDS: calibration, honing, a master sharpening a blade, patience,
the satisfaction of alignment.
`;

export const MODEL_FIELD = `${IDENTITY}
TITLE OF THE PIECE: "Every Model, One Wire".
FORMAT: wide 16:9, a backdrop for the Inference section: one key, 477+
models, 61+ providers.
SUBJECT AND NARRATIVE: a single, absolutely straight, brilliant indigo
filament crosses the entire frame horizontally at 62 percent height, the
one unwavering element in the composition: the wire. Above and behind it,
receding into soft depth, hangs a vast quiet field of small luminous
points, dozens to a few hundred, like a shelf of distant instruments in a
dark observatory: each point a slightly different temperature of the brand
palette, ice, cyan, periwinkle, violet, a scattered few orchid, arranged
with natural randomness but a gentle horizontal banding so the field reads
as organized abundance, an inventory, not stars. From the point field,
many hair-thin, barely visible threads of light drop down and converge
onto the single wire, brightening where they merge, tiny junction glints
at each connection. The message read at a glance: everything above feeds
into the one line.
CRITICAL DISTINCTION: this must NOT read as a night sky or space. The
points sit in shallow depth with soft bokeh discs of varying size, warm
and instrument-like, more like a wall of pilot lights in a dark control
room photographed at f/1.4. Horizontal banding, size variation by depth,
and the connecting threads kill the starfield reading.
PALETTE DOMINANCE: 50 percent deep indigo field, 25 percent the point
inventory (mixed brand hues, mostly cyan-periwinkle), 15 percent the
indigo wire and its halo, 10 percent junction glints.
LIGHT: the wire is the brightest continuous element, its halo tight; the
points glow softly; the connecting threads are at the threshold of
visibility, discovered on second look.
LENS: 50mm, f/1.4. The wire and the nearest points are sharp; the field
recedes into creamy bokeh.
COMPOSITION CONTRACT: the wire at 62 percent height, full bleed left to
right; the point field occupies 8 to 55 percent height; the BOTTOM 30
percent below the wire is near-empty calm indigo for text overlay. No
points below the wire.
TEXTURE: film grain, dither, bokeh discs with soft edges, no cross-shaped
sparkles.
MOOD WORDS: abundance under control, an instrument wall at night, one
steady hand on the fader, leverage.
`;

export const RESEARCH_DESK = `${IDENTITY}
TITLE OF THE PIECE: "The Reading Room".
FORMAT: wide 16:9, a backdrop for the Intelligence section: analyst agents
reading every trace, drafting improvements, proving them on held-out runs.
SUBJECT AND NARRATIVE: dozens of parallel horizontal filaments of light
stream across the frame like lines of a manuscript, cool cyan-periwinkle,
slightly undulating, each line carrying tiny irregular brighter ticks
along its length like marginalia of light. In the right third of frame the
lines pass through a soft, tall lens of violet illumination, a reading
lamp made of atmosphere rather than an object. Inside that lit region,
three or four of the lines visibly change: their ticks align, their
undulation settles, and they exit the right edge as clean magenta-warm
strands, subtly brighter than their siblings. Most lines pass through
unchanged; only the few that needed correction transform. This restraint
is the entire story: careful reading, few precise edits, proof by contrast
with the untouched lines around them.
PALETTE DOMINANCE: 55 percent deep indigo field, 25 percent the manuscript
lines in cyan-periwinkle, 12 percent the violet reading light, 8 percent
the corrected magenta exits.
LIGHT: the violet region glows like a lamp through fog, wide and soft; the
corrected lines carry tighter, brighter cores than the rest; everything
else stays hushed.
LENS: 65mm, f/2. Sharpest plane is inside the violet region where the
change happens; the left origins of the lines soften away.
COMPOSITION CONTRACT: lines run full-bleed horizontally between 18 and 78
percent height with even rhythm; the violet region spans 62 to 88 percent
width; the BOTTOM 20 percent stays calm for overlay; the TOP 15 percent
stays calm.
TEXTURE: film grain, dithered fields, the ticks tiny and sharp like
etching marks.
MOOD WORDS: scholarship, a senior engineer reading your logs at 2am and
leaving three perfect comments, quiet diligence, trust.
`;

export const HERO_V3 = `${IDENTITY}
TITLE OF THE PIECE: "Resolution, Wide".
FORMAT: ultra-wide 16:9 website hero backdrop; large white display text
will sit in the LEFT 45 percent of frame.
SUBJECT AND NARRATIVE: the definitive Tangle image. A living knot of
fiber-optic light hangs center-right at 68 percent width, 44 percent
height: dozens of hair-fine strands in cyan and electric indigo looping
through each other in genuinely beautiful chaos, crossings marked by tiny
white-hot junction beads. Out of the knot's right side the strands resolve
into a fan of perfectly parallel horizontal lanes exiting the right edge,
their color maturing through violet into a restrained magenta at the
outermost lane. Under the knot, a faint pool of indigo light falls onto an
implied dark surface, grounding the object in a real space rather than a
void. One single strand escapes the knot toward the upper left, out of
focus, crossing high above the text zone as a soft ribbon: the only
element allowed to enter the left half, and only above 20 percent height.
PALETTE DOMINANCE: 55 percent deep indigo atmosphere, 25 percent the
cyan-indigo knot, 12 percent the resolved lanes shading violet to magenta,
8 percent junction beads and floor pool.
LIGHT: the knot is the luminous heart; its light justifies a soft
volumetric halo and the floor pool. Lanes are individually dimmer than the
knot but read as a calm, confident exit. No light source exists outside
the filaments themselves.
LENS: 35mm environmental feel, f/2.8. The knot's front face is critically
sharp; the lane fan stays legible; the escaping upper-left strand is fully
defocused.
COMPOSITION CONTRACT: LEFT 45 percent of frame is calm deep indigo
gradient (#080814 low, #0C0B1D high) reserved for headline text; nothing
sharp, bright, or busy enters it below 20 percent height. Knot centroid at
68 percent width. Lanes exit between 30 and 62 percent height. The BOTTOM
12 percent stays dark and calm full-width.
TEXTURE: film grain, dithered gradients, crisp cores, soft halos, the
floor pool barely-there.
MOOD WORDS: mastery, the moment complexity yields, gravity, first
impression of a serious company.
`;

export const FOOTER_STRIP = `${IDENTITY}
TITLE OF THE PIECE: "The Quiet Signature".
FORMAT: very wide, short strip (16:9 frame but composed for a bottom-crop
band): the footer backdrop for the site, sitting beneath dense link
columns. It must be nearly silent.
SUBJECT: the lower fifth of a filament field after the work is done. Deep,
almost-still indigo atmosphere (#080814 to #0C0B1D) filling the frame.
Along the very bottom 15 percent, five or six extremely dim, perfectly
parallel horizontal filament lanes glide from left to right, their hues
whispering the full dispersion order (ice, cyan, indigo, violet, orchid)
at perhaps 15 percent of hero brightness, like runway lights seen through
fog from far away. A single, slightly brighter junction bead sits on one
lane at 80 percent width, the one point of focus in the whole image.
COMPOSITION CONTRACT: upper 75 percent of frame is pure calm gradient
atmosphere, grain and dither only, dark enough for light-gray footer text
at AA contrast. The lanes hug the bottom edge. Nothing else exists.
LIGHT: threshold-of-perception. If the hero shouts, this exhales.
TEXTURE: film grain, dither, soft cores.
MOOD WORDS: after-hours, the lab at midnight with one instrument still on,
completion, rest.
`;
