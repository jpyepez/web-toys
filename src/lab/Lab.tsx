/**
 * The lab. Scaffolding, not product — nothing in `src/shell` or `src/toys`
 * imports it, and it ships from its own Vite entry (`lab.html`) which is not in
 * the production build's input list.
 *
 * The economics only work if a new variation is one click and never one prompt.
 * Click the canvas to reseed, drag knobs to tune, hit Save to keep a config.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Critter } from './Critter';
import { DEFAULT_CONFIG, SPECIES, derive, type Config, type Species } from './config';
import { deltaL, hex, type Oklch } from '../shell/art/oklch';
import { sceneColours } from './scene';
import { FrameView, birdWidthInFrame } from './CanopyScene';
import { MeadowFrameView } from './MeadowScene';
import { ReefFrameView } from './ReefScene';
import { BarnyardFrameView } from './BarnyardScene';
import { SkyFrameView } from './SkyScene';
import { check as checkCanopy } from '../toys/nestlings/canopy';
import { ASPECTS, type AspectName } from './config';

/* ------------------------------------------------------------------ *
 * path get/set so the knob table can stay declarative
 * ------------------------------------------------------------------ */
type Path = string;

function getAt(obj: unknown, path: Path): number {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as number;
}

function setAt<T>(obj: T, path: Path, value: unknown): T {
  const keys = path.split('.');
  const clone = structuredClone(obj) as Record<string, unknown>;
  let cur: Record<string, unknown> = clone;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>;
  cur[keys[keys.length - 1]] = value;
  return clone as T;
}

type Knob = { path: Path; label: string; min: number; max: number; step: number; note?: string };

/**
 * Every taste decision, on a control. A number that is hardcoded somewhere else
 * is a decision the user hasn't been allowed to make.
 */
const KNOB_GROUPS: Array<{ title: string; knobs: Knob[] }> = [
  {
    title: 'Paper & ink · RULE 1',
    knobs: [
      { path: 'paper.l', label: 'paper lightness', min: 0.86, max: 0.99, step: 0.005, note: 'must be the lightest surface' },
      { path: 'paper.c', label: 'paper chroma', min: 0, max: 0.05, step: 0.002 },
      { path: 'paper.h', label: 'paper hue', min: 0, max: 360, step: 1 },
      { path: 'ink.l', label: 'ink lightness', min: 0.1, max: 0.35, step: 0.005, note: 'RULE 3 caps ink at 0.35' },
      { path: 'ink.c', label: 'ink chroma', min: 0, max: 0.08, step: 0.002 },
      { path: 'ink.h', label: 'ink hue', min: 0, max: 360, step: 1 },
      { path: 'print.plateOpacity', label: 'plate opacity', min: 0.75, max: 1, step: 0.01, note: 'paper showing through the ink' },
      { path: 'print.misregistration', label: 'misregistration', min: 0, max: 2.5, step: 0.05, note: 'above ~2.5 it reads as a bug' },
    ],
  },
  {
    title: 'Scene',
    knobs: [
      { path: 'scene.sky.l', label: 'sky lightness', min: 0.5, max: 0.95, step: 0.005 },
      { path: 'scene.sky.c', label: 'sky chroma', min: 0, max: 0.12, step: 0.002, note: 'ground must not out-chroma the critter' },
      { path: 'scene.sky.h', label: 'sky hue', min: 0, max: 360, step: 1 },
      { path: 'scene.groundDl', label: 'ground ΔL', min: 0, max: 0.4, step: 0.005 },
      { path: 'scene.groundHueRotate', label: 'ground hue rotate', min: -180, max: 180, step: 1 },
    ],
  },
  {
    title: 'The cast · RULE 3',
    knobs: [
      { path: 'critter.l', label: 'sibling lightness', min: 0.45, max: 0.85, step: 0.005, note: 'shared by all five' },
      { path: 'critter.c', label: 'sibling chroma', min: 0.04, max: 0.22, step: 0.002, note: 'shared by all five' },
      { path: 'critter.hueAnchor', label: 'hue anchor', min: 0, max: 360, step: 1 },
      { path: 'critter.hueSpread', label: 'hue spread', min: 0, max: 300, step: 1, note: 'the ONLY axis siblings differ on' },
    ],
  },
  {
    title: 'Proportion · RULE 6',
    knobs: [
      { path: 'critter.headBodyRatio', label: 'head ÷ body area', min: 0.4, max: 2.2, step: 0.01, note: '0.7–1.5 is the snowman band' },
      { path: 'critter.bodyWidth', label: 'body width', min: 16, max: 32, step: 0.5 },
      { path: 'critter.eyeRadius', label: 'eye radius', min: 3, max: 10, step: 0.1, note: 'must beat every other face feature' },
      { path: 'critter.eyeBelowMidline', label: 'eye below midline', min: -6, max: 12, step: 0.1, note: 'negative = adult skull' },
      { path: 'critter.eyeSpread', label: 'eye spread', min: 4, max: 16, step: 0.1 },
      { path: 'critter.cheekScale', label: 'blush ÷ eye', min: 0.2, max: 1.4, step: 0.02, note: '≥ 1 inverts the hierarchy' },
      { path: 'critter.cheekChroma', label: 'blush chroma', min: 0, max: 0.2, step: 0.005 },
      { path: 'critter.beakLength', label: 'beak length', min: 4, max: 16, step: 0.2 },
      { path: 'critter.bellyRise', label: 'belly drop', min: 0.1, max: 1, step: 0.01, note: 'how far it breaks the body outline' },
      { path: 'critter.crownFlatten', label: 'crown flatten', min: 0.4, max: 1, step: 0.01, note: 'sparrow only; 1 = domed like the rest' },
    ],
  },
  {
    title: 'Line · RULE 9',
    knobs: [
      { path: 'line.width', label: 'contour width', min: 0, max: 6, step: 0.05 },
      { path: 'line.taper', label: 'contour taper', min: 0, max: 0.9, step: 0.01, note: 'heavier underneath' },
      { path: 'line.wobble', label: 'wobble (the hand)', min: 0, max: 0.5, step: 0.01, note: "Bruna's 'heartbeat'" },
      { path: 'line.detailWidth', label: 'detail width', min: 0.3, max: 3, step: 0.05 },
    ],
  },
  {
    title: 'Shading · RULE 8',
    knobs: [
      { path: 'shading.occlusionDl', label: 'occlusion ΔL', min: 0, max: 0.3, step: 0.005 },
      { path: 'shading.occlusionHueRotate', label: 'occlusion hue rotate', min: -60, max: 60, step: 1, note: 'toward the ambient, never toward black' },
      { path: 'shading.occlusionDc', label: 'occlusion Δchroma', min: -0.05, max: 0.08, step: 0.002 },
      { path: 'shading.contactStrength', label: 'contact shadow', min: 0, max: 1, step: 0.02, note: 'without it the bird floats' },
    ],
  },
  {
    title: 'Disorder · RULE 5 & 7',
    knobs: [
      { path: 'disorder.blobAmp', label: 'path jitter', min: 0, max: 0.12, step: 0.002, note: '0 gives you back a primitive' },
      { path: 'disorder.asymmetry', label: 'asymmetry', min: 0, max: 4, step: 0.05, note: '0 = a manufactured object' },
      { path: 'disorder.instanceRotate', label: 'instance rotate °', min: 0, max: 10, step: 0.2 },
      { path: 'disorder.instanceScale', label: 'instance scale', min: 0, max: 0.2, step: 0.005 },
      { path: 'disorder.instanceHue', label: 'instance hue °', min: 0, max: 20, step: 0.5 },
    ],
  },
  {
    title: 'Scene hierarchy — the whole question',
    knobs: [
      { path: 'scenery.contourRatio', label: 'scenery ÷ critter contour', min: 0, max: 1.4, step: 0.02, note: 'at 1 the nest is as assertive as a bird' },
      { path: 'scenery.chromaRatio', label: 'scenery ÷ cast chroma', min: 0.2, max: 1.3, step: 0.02, note: 'above ~0.8 the ground competes' },
      { path: 'scenery.horizon', label: 'horizon', min: 80, max: 112, step: 0.5 },
      { path: 'scenery.handCutFrequency', label: 'hand-cut frequency', min: 0.01, max: 0.14, step: 0.005, note: 'user-space units, not pixels' },
      { path: 'scenery.handCutScale', label: 'hand-cut amount', min: 0, max: 3.5, step: 0.05, note: 'past ~1.5× a twig it shreds it' },
    ],
  },
  {
    title: 'Nest',
    knobs: [
      { path: 'scenery.nest.x', label: 'nest x', min: 20, max: 90, step: 0.5 },
      { path: 'scenery.nest.width', label: 'bowl width', min: 16, max: 54, step: 0.5 },
      { path: 'scenery.nest.height', label: 'bowl height', min: 8, max: 30, step: 0.5 },
      { path: 'scenery.nest.weaveCount', label: 'weave count', min: 0, max: 12, step: 1, note: 'counted texture, never a random scatter' },
      { path: 'scenery.nest.weaveWeight', label: 'weave weight', min: 0.3, max: 4, step: 0.05 },
      { path: 'scenery.nest.twigCount', label: 'twig count', min: 0, max: 16, step: 1 },
      { path: 'scenery.nest.twigLength', label: 'twig length', min: 3, max: 20, step: 0.5 },
      { path: 'scenery.nest.twigWeight', label: 'twig weight', min: 0.3, max: 2.5, step: 0.05 },
      { path: 'scenery.branch.thickness', label: 'branch thickness', min: 1.5, max: 12, step: 0.1 },
      { path: 'scenery.branch.sag', label: 'branch sag', min: -6, max: 8, step: 0.2 },
      { path: 'scenery.branch.drop', label: 'branch drop', min: 0, max: 20, step: 0.5 },
    ],
  },
  {
    title: 'Background',
    knobs: [
      { path: 'scenery.fieldLightness', label: 'field lightness', min: 0.2, max: 0.97, step: 0.005, note: 'the whole guarantee hangs off this' },
      { path: 'scenery.halftone.cell', label: 'screen cell', min: 1.5, max: 12, step: 0.1, note: '<3 fuses to flat, >10 becomes countable' },
      { path: 'scenery.halftone.angle', label: 'screen angle', min: 0, max: 90, step: 1, note: '45 avoids beating with the pixel grid' },
      { path: 'scenery.halftone.extent', label: 'glow reach', min: 0.1, max: 1, step: 0.02 },
      { path: 'scenery.halftone.bands', label: 'glow bands', min: 3, max: 16, step: 1 },
      { path: 'scenery.halftone.inkDl', label: 'dot ΔL', min: 0.01, max: 0.3, step: 0.005, note: 'contrast is measured against the DOTS' },
      { path: 'scenery.motif.size', label: 'motif size', min: 8, max: 60, step: 0.5 },
      { path: 'scenery.motif.x', label: 'motif x', min: 0, max: 100, step: 1 },
      { path: 'scenery.motif.y', label: 'motif y', min: -10, max: 90, step: 1 },
    ],
  },
  {
    title: 'Canopy — the scene as a PLACE',
    knobs: [
      { path: 'scenery.canopy.ceilingDepth', label: 'ceiling depth', min: 0.06, max: 0.42, step: 0.005, note: 'the roof — what makes sky read as glimpsed' },
      { path: 'scenery.canopy.ceilingRelief', label: 'ceiling relief', min: 0, max: 1, step: 0.05, note: 'how much its underside varies' },
      { path: 'scenery.canopy.lobeRatio', label: 'leaf lobe ÷ bird', min: 0.03, max: 0.3, step: 0.005, note: 'above 1/8 a lobe becomes countable' },
      { path: 'scenery.canopy.lobeVariance', label: 'lobe variance', min: 0, max: 0.9, step: 0.05, note: '0 = a machined scallop' },
      { path: 'scenery.canopy.massCount', label: 'hanging masses', min: 0, max: 6, step: 1, note: 'they make the sky-holes' },
      { path: 'scenery.canopy.massDepth', label: 'mass depth', min: 0.04, max: 0.3, step: 0.005 },
      { path: 'scenery.canopy.limbDensity', label: 'limb density', min: 0.4, max: 2, step: 0.05, note: 'ranks × limbs per rank; the birds stand on these' },
      { path: 'scenery.canopy.limbThickness', label: 'limb ÷ bird', min: 0.03, max: 0.3, step: 0.005 },
      { path: 'scenery.canopy.limbReach', label: 'limb reach (birds)', min: 1, max: 8, step: 0.1, note: 'clamped so it never spans the frame' },
      { path: 'scenery.canopy.limbRake', label: 'limb rake', min: 0, max: 0.2, step: 0.005, note: '0 = parallel limbs = a ladder' },
      { path: 'scenery.canopy.leafDepth', label: 'leaf fringe ÷ lobe', min: 0, max: 7, step: 0.1, note: 'this is what fills the middle' },
      { path: 'scenery.canopy.perchesPerLimb', label: 'perches per limb', min: 1, max: 4, step: 1, note: 'the cast stands on these' },
      { path: 'scenery.canopy.twigCount', label: 'twigs per limb', min: 0, max: 6, step: 1 },
      { path: 'scenery.canopy.boughThickness', label: 'bough ÷ bird', min: 0.15, max: 1.1, step: 0.01, note: 'the nest is cradled in this' },
      { path: 'scenery.canopy.understoryDepth', label: 'understory (repoussoir)', min: 0, max: 0.34, step: 0.005, note: 'the third plane; 0 = off' },
      { path: 'scenery.canopy.moonScale', label: 'moon ÷ bird', min: 0, max: 6, step: 0.1, note: '0 or ≥ 2.5 — never between' },
      { path: 'scenery.canopy.moonX', label: 'moon x', min: 0, max: 100, step: 1 },
      { path: 'scenery.canopy.moonY', label: 'moon y (÷ height)', min: 0, max: 0.7, step: 0.01 },
      { path: 'scenery.canopy.moteCount', label: 'seed fluff', min: 0, max: 8, step: 1, note: 'the only moving thing' },
    ],
  },
  {
    title: 'Foliage colour — separation bought with CHROMA',
    knobs: [
      { path: 'scenery.foliage.hue', label: 'foliage hue', min: 60, max: 220, step: 1 },
      { path: 'scenery.foliage.chroma', label: 'foliage chroma', min: 0.01, max: 0.16, step: 0.002 },
      { path: 'scenery.foliage.depthDl', label: 'plane ΔL', min: 0, max: 0.09, step: 0.002, note: 'keep small — both planes are corridor' },
      { path: 'scenery.foliage.depthDc', label: 'plane Δchroma', min: 0, max: 0.09, step: 0.002, note: 'this is where depth is actually bought' },
    ],
  },
  {
    title: 'Grain · RULE 10',
    knobs: [
      { path: 'print.grainFrequency', label: 'grain frequency', min: 0.3, max: 1.2, step: 0.01, note: 'above ~0.9 it greys out' },
      { path: 'print.grainOpacity', label: 'grain opacity', min: 0, max: 0.4, step: 0.005, note: '0.10 critters, 0.18 backdrops' },
    ],
  },
  {
    /*
     * The meadow — Counting Sheep's scene. Visible in the frame view with the
     * `meadow` background selected; the numbers harvest into
     * `toys/counting-sheep/meadow-config.ts`.
     *
     * Every SIZE here is a multiple of a SHEEP, never of the frame, and the
     * bounds enforce the shape classes: a sun under 2.5 Sheep and a bank under
     * 2.5 Sheep are the cloud cluster and the lollipop tree coming back, so the
     * sliders cannot reach them.
     */
    title: 'Meadow · Counting Sheep',
    knobs: [
      { path: 'scenery.meadow.groundY', label: 'walking line', min: 0.45, max: 0.9, step: 0.005, note: 'where the Sheep stands, as a fraction of height' },
      { path: 'scenery.meadow.groundRelief', label: 'ground relief', min: 0, max: 0.35, step: 0.005, note: 'in Sheep — 0 is a rule drawn across the picture' },
      { path: 'scenery.meadow.bankCount', label: 'far banks', min: 0, max: 4, step: 1, note: 'a phone gets none however high this goes' },
      { path: 'scenery.meadow.bankSpread', label: 'bank reach', min: 2.5, max: 6, step: 0.1, note: 'in Sheep — under 2.5 is a rival hill' },
      { path: 'scenery.meadow.bankRise', label: 'bank rise', min: 0.02, max: 0.3, step: 0.005 },
      { path: 'scenery.meadow.sunScale', label: 'sun size', min: 2.5, max: 6, step: 0.1, note: 'in Sheep — the band under 2.5 is where the clouds were' },
      { path: 'scenery.meadow.sunX', label: 'sun x', min: 0, max: 100, step: 1 },
      { path: 'scenery.meadow.sunY', label: 'sun y', min: 0, max: 0.6, step: 0.01 },
      { path: 'scenery.meadow.boughThickness', label: 'bough thickness', min: 0, max: 0.7, step: 0.01, note: 'in Sheep; 0 removes it' },
      { path: 'scenery.meadow.boughReach', label: 'bough reach', min: 0.8, max: 4, step: 0.1, note: 'in Sheep, clamped so it never spans' },
      { path: 'scenery.meadow.boughDrop', label: 'bough drop', min: 0.02, max: 0.4, step: 0.005 },
      { path: 'scenery.meadow.lobeRatio', label: 'leaf lobe', min: 0.02, max: 0.125, step: 0.002, note: 'in Sheep — above 1/8 radius a lobe is countable' },
      { path: 'scenery.meadow.lobeVariance', label: 'lobe variance', min: 0, max: 0.9, step: 0.05, note: '0 = a machined scallop' },
      { path: 'scenery.meadow.leafDepth', label: 'leaf depth', min: 0, max: 8, step: 0.1 },
      { path: 'scenery.meadow.tuftDensity', label: 'tufts per Sheep', min: 0.5, max: 6, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.meadow.tuftHeight', label: 'tuft height', min: 0.08, max: 0.8, step: 0.01, note: 'in Sheep — sizes follow the cast' },
      { path: 'scenery.meadow.tuftWidth', label: 'tuft width', min: 0.05, max: 0.5, step: 0.01, note: 'keep under 2/3 the height or it is a bush' },
      { path: 'scenery.meadow.bladesPerTuft', label: 'blades per tuft', min: 2, max: 9, step: 1 },
      { path: 'scenery.meadow.flowerDensity', label: 'blooms per Sheep', min: 0, max: 4, step: 0.1 },
      { path: 'scenery.meadow.flowerLobe', label: 'bloom lobe', min: 0.01, max: 0.0625, step: 0.001, note: 'in Sheep — a discrete object stays under 1/8 across' },
      { path: 'scenery.meadow.foreDepth', label: 'foreground depth', min: 0, max: 0.3, step: 0.005, note: 'corner-weighted; never over the standing zone' },
      { path: 'scenery.meadow.foreHeight', label: 'foreground blades', min: 0.1, max: 1.2, step: 0.02, note: 'in Sheep' },
      { path: 'scenery.meadow.moteCount', label: 'seed fluff', min: 0, max: 8, step: 1 },
    ],
  },
  {
    /*
     * The barnyard — Muddy Puddle's scene. Visible in the frame view with the
     * `barnyard` background selected; the numbers harvest into
     * `toys/muddy-puddle/barnyard-config.ts`.
     *
     * Every SIZE here is a multiple of a CRITTER, never of the frame, and the
     * bounds enforce the shape classes: a barn under 2.5 Critters and a puddle
     * under 2.5 Critters are the gable silhouette and the tidy oval pool coming
     * back, so the sliders cannot reach them.
     */
    title: 'Barnyard \u00b7 Muddy Puddle',
    knobs: [
      { path: 'scenery.barnyard.groundY', label: 'trotting line', min: 0.45, max: 0.9, step: 0.005, note: 'where a Critter stands, as a fraction of height' },
      { path: 'scenery.barnyard.groundRelief', label: 'ground relief', min: 0, max: 0.35, step: 0.005, note: 'in Critters \u2014 0 is a rule drawn across the picture' },
      { path: 'scenery.barnyard.bankCount', label: 'far banks', min: 0, max: 4, step: 1, note: 'a phone gets none however high this goes' },
      { path: 'scenery.barnyard.bankSpread', label: 'bank reach', min: 2.5, max: 6, step: 0.1, note: 'in Critters \u2014 under 2.5 is a rival hill' },
      { path: 'scenery.barnyard.bankRise', label: 'bank rise', min: 0.02, max: 0.3, step: 0.005 },
      { path: 'scenery.barnyard.barnScale', label: 'barn size', min: 2.5, max: 7, step: 0.1, note: 'in Critters \u2014 the band under 2.5 is where the gable barn was' },
      { path: 'scenery.barnyard.barnReach', label: 'barn reach', min: 0.1, max: 0.6, step: 0.01, note: 'how much of it the frame lets in; area is what the squint test catches' },
      { path: 'scenery.barnyard.barnEave', label: 'barn eave', min: 0.1, max: 0.6, step: 0.005 },
      { path: 'scenery.barnyard.barnPitch', label: 'roof pitch', min: 0.05, max: 0.5, step: 0.01, note: 'the ridge may go above the frame \u2014 cropped twice is what stops it being an object' },
      { path: 'scenery.barnyard.fenceReach', label: 'fence reach', min: 0.8, max: 5, step: 0.1, note: 'in Critters, clamped so it never spans' },
      { path: 'scenery.barnyard.postHeight', label: 'post height', min: 0.08, max: 0.7, step: 0.01, note: 'in Critters \u2014 sizes follow the cast' },
      { path: 'scenery.barnyard.postWidth', label: 'post width', min: 0.02, max: 0.2, step: 0.005, note: 'keep well under the height or a post is a block' },
      { path: 'scenery.barnyard.postDensity', label: 'posts per Critter', min: 0.5, max: 4, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.barnyard.puddleSpread', label: 'puddle width', min: 2.5, max: 7, step: 0.1, note: 'in Critters \u2014 under 2.5 is the oval pool coming back' },
      { path: 'scenery.barnyard.puddleFlat', label: 'puddle depth', min: 0.12, max: 0.7, step: 0.01, note: 'as a fraction of its width' },
      { path: 'scenery.barnyard.puddleDrop', label: 'puddle drop', min: 0, max: 0.25, step: 0.005, note: 'the bank a Critter trots along before it jumps in' },
      { path: 'scenery.barnyard.rippleCount', label: 'ripples', min: 0, max: 10, step: 1 },
      { path: 'scenery.barnyard.strawDensity', label: 'straw per Critter', min: 0.5, max: 6, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.barnyard.strawHeight', label: 'straw height', min: 0.08, max: 0.8, step: 0.01, note: 'in Critters' },
      { path: 'scenery.barnyard.strawWidth', label: 'straw width', min: 0.05, max: 0.5, step: 0.01, note: 'keep under 2/3 the height or it is a bush' },
      { path: 'scenery.barnyard.bladesPerTuft', label: 'blades per tuft', min: 2, max: 9, step: 1 },
      { path: 'scenery.barnyard.foreDepth', label: 'foreground depth', min: 0, max: 0.3, step: 0.005, note: 'corner-weighted; never over the standing zone' },
      { path: 'scenery.barnyard.clodRadius', label: 'clod radius', min: 0.01, max: 0.0625, step: 0.001, note: 'in Critters \u2014 a discrete object stays under 1/8 across' },
      { path: 'scenery.barnyard.moteCount', label: 'drifting dust', min: 0, max: 8, step: 1 },
    ],
  },
  {
    /*
     * The sky — Up & Away's scene. Visible in the frame view with the `sky`
     * background selected; the numbers harvest into
     * `toys/balloons/sky-config.ts`.
     *
     * Every SIZE here is a multiple of a BALLOON, never of the frame, and the
     * bounds enforce the shape classes: a cloud bank under 2.5 balloons is the
     * five round puffs coming back, which in this Toy of all of them is a
     * background made of decoys.
     *
     * The bunch sliders are here rather than in the Toy because the fan is part
     * of the COMPOSITION — where the balloons sit relative to the peg, the
     * ground and the open sky above them is exactly the judgement this view
     * exists to support, and it cannot be made against an empty backdrop.
     */
    title: 'Sky · Up & Away',
    knobs: [
      { path: 'scenery.sky.groundY', label: 'ground line', min: 0.6, max: 0.95, step: 0.005, note: 'LOW \u2014 the tall sky above is the load-bearing space' },
      { path: 'scenery.sky.groundRelief', label: 'ground relief', min: 0, max: 0.35, step: 0.005, note: 'in balloons \u2014 0 is a rule drawn across the picture' },
      { path: 'scenery.sky.bankCount', label: 'far banks', min: 0, max: 4, step: 1, note: 'a phone gets none however high this goes' },
      { path: 'scenery.sky.bankSpread', label: 'bank reach', min: 2.5, max: 6, step: 0.1, note: 'in balloons \u2014 under 2.5 is a rival hill' },
      { path: 'scenery.sky.bankRise', label: 'bank rise', min: 0.02, max: 0.2, step: 0.005 },
      { path: 'scenery.sky.cloudCount', label: 'cloud banks', min: 0.4, max: 2.4, step: 0.1, note: 'one per top corner; a third lands back on the first' },
      { path: 'scenery.sky.cloudSpan', label: 'cloud span', min: 2.5, max: 6, step: 0.1, note: 'in balloons \u2014 the band under 2.5 is where the five puffs were' },
      { path: 'scenery.sky.cloudDepth', label: 'cloud depth', min: 0.05, max: 0.4, step: 0.005, note: 'never down to the bunch \u2014 a roof says the balloons cannot leave' },
      { path: 'scenery.sky.lobeRatio', label: 'cloud lobe', min: 0.02, max: 0.125, step: 0.002, note: 'in balloons \u2014 above 1/8 radius a lobe is a puff again' },
      { path: 'scenery.sky.lobeVariance', label: 'lobe variance', min: 0, max: 0.9, step: 0.05, note: '0 = a machined scallop' },
      { path: 'scenery.sky.pegHeight', label: 'peg height', min: 0.15, max: 1.2, step: 0.01, note: 'in balloons \u2014 the stake every string ties to' },
      { path: 'scenery.sky.pegThickness', label: 'peg thickness', min: 0.03, max: 0.25, step: 0.005, note: 'keep under a third of the height or it is a block' },
      { path: 'scenery.sky.pegX', label: 'peg x', min: 0.15, max: 0.85, step: 0.01 },
      { path: 'scenery.sky.bunchSpread', label: 'bunch spread', min: 0.8, max: 4, step: 0.05, note: 'in balloons \u2014 the upper row\u2019s span' },
      { path: 'scenery.sky.bunchRise', label: 'bunch rise', min: 0.6, max: 3, step: 0.05, note: 'in balloons \u2014 past 3 the bunch fills the sky it should rise into' },
      { path: 'scenery.sky.bunchStagger', label: 'bunch stagger', min: 0.2, max: 1.8, step: 0.05, note: 'how far the lower row hangs below the upper' },
      { path: 'scenery.sky.tuftDensity', label: 'tufts per balloon', min: 0.5, max: 6, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.sky.tuftHeight', label: 'tuft height', min: 0.08, max: 0.8, step: 0.01, note: 'in balloons \u2014 sizes follow the cast' },
      { path: 'scenery.sky.tuftWidth', label: 'tuft width', min: 0.05, max: 0.5, step: 0.01, note: 'keep under 2/3 the height or it is a bush' },
      { path: 'scenery.sky.bladesPerTuft', label: 'blades per tuft', min: 2, max: 9, step: 1 },
      { path: 'scenery.sky.foreDepth', label: 'foreground depth', min: 0, max: 0.3, step: 0.005, note: 'corner-weighted; never over the tether zone' },
      { path: 'scenery.sky.foreHeight', label: 'foreground blades', min: 0.1, max: 1.2, step: 0.02, note: 'in balloons' },
      { path: 'scenery.sky.moteCount', label: 'seed fluff', min: 0, max: 8, step: 1 },
    ],
  },
  {
    /*
     * The reef — Puffer Fish's scene. Visible in the frame view with the `reef`
     * background selected; the numbers harvest into
     * `toys/puffer-fish/reef-config.ts`.
     *
     * Every SIZE here is a multiple of a FISH, never of the frame, and the
     * bounds enforce the shape classes: a sun under 2.5 Fish and a ridge under
     * 2.5 Fish are the two coral clumps coming back, so the sliders cannot reach
     * them.
     */
    title: 'Reef · Puffer Fish',
    knobs: [
      { path: 'scenery.reef.bedY', label: 'seabed line', min: 0.5, max: 0.95, step: 0.005, note: 'as a fraction of height; the Fish hovers above it' },
      { path: 'scenery.reef.bedRelief', label: 'bed relief', min: 0, max: 0.35, step: 0.005, note: 'in Fish — 0 is a rule drawn across the picture' },
      { path: 'scenery.reef.hoverGap', label: 'hover gap', min: 0.55, max: 3, step: 0.05, note: 'in Fish, bed → body centre. This replaced `top: 42%`' },
      { path: 'scenery.reef.ridgeCount', label: 'far ridges', min: 0, max: 4, step: 1, note: 'a phone gets none however high this goes' },
      { path: 'scenery.reef.ridgeSpread', label: 'ridge reach', min: 2.5, max: 6, step: 0.1, note: 'in Fish — under 2.5 is a rival rock' },
      { path: 'scenery.reef.ridgeRise', label: 'ridge rise', min: 0.02, max: 0.3, step: 0.005 },
      { path: 'scenery.reef.sunScale', label: 'sun size', min: 2.5, max: 6, step: 0.1, note: 'in Fish — the band under 2.5 is where the coral was' },
      { path: 'scenery.reef.sunX', label: 'sun x', min: 0, max: 100, step: 1 },
      { path: 'scenery.reef.sunY', label: 'sun y', min: 0, max: 0.6, step: 0.01 },
      { path: 'scenery.reef.rayCount', label: 'light shafts', min: 0, max: 6, step: 1, note: 'light, not mass — cropped at both ends' },
      { path: 'scenery.reef.rayWidth', label: 'shaft width', min: 0.1, max: 1, step: 0.02, note: 'in Fish, at depth' },
      { path: 'scenery.reef.rayTilt', label: 'shaft lean', min: 0, max: 1.5, step: 0.05, note: 'in Fish, over the full height' },
      { path: 'scenery.reef.kelpThickness', label: 'kelp thickness', min: 0, max: 0.5, step: 0.005, note: 'in Fish; 0 removes it' },
      { path: 'scenery.reef.kelpCount', label: 'kelp per Fish', min: 0, max: 2, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.reef.kelpSway', label: 'kelp sway', min: 0, max: 1.2, step: 0.05, note: 'in Fish — 0 is a mast, not a plant' },
      { path: 'scenery.reef.lobeRatio', label: 'blade lobe', min: 0.02, max: 0.125, step: 0.002, note: 'in Fish — above 1/8 radius a lobe is countable' },
      { path: 'scenery.reef.lobeVariance', label: 'lobe variance', min: 0, max: 0.9, step: 0.05, note: '0 = a machined scallop' },
      { path: 'scenery.reef.leafDepth', label: 'blade depth', min: 0, max: 8, step: 0.1 },
      { path: 'scenery.reef.frondDensity', label: 'fans per Fish', min: 0.5, max: 6, step: 0.1, note: 'counts follow the frame' },
      { path: 'scenery.reef.frondHeight', label: 'fan height', min: 0.08, max: 0.8, step: 0.01, note: 'in Fish — sizes follow the cast' },
      { path: 'scenery.reef.frondWidth', label: 'fan width', min: 0.05, max: 0.5, step: 0.01, note: 'keep under 2/3 the height or it is a clump' },
      { path: 'scenery.reef.bladesPerFrond', label: 'blades per fan', min: 2, max: 9, step: 1 },
      { path: 'scenery.reef.polypDensity', label: 'polyps per Fish', min: 0, max: 4, step: 0.1 },
      { path: 'scenery.reef.polypLobe', label: 'polyp lobe', min: 0.01, max: 0.0625, step: 0.001, note: 'in Fish — a discrete object stays under 1/8 across' },
      { path: 'scenery.reef.foreDepth', label: 'foreground depth', min: 0, max: 0.3, step: 0.005, note: 'corner-weighted; never over the hover band' },
      { path: 'scenery.reef.foreHeight', label: 'foreground blades', min: 0.1, max: 1.2, step: 0.02, note: 'in Fish' },
      { path: 'scenery.reef.bubbleCount', label: 'bubbles', min: 0, max: 10, step: 1, note: 'the only moving thing' },
    ],
  },
];

/* ------------------------------------------------------------------ */

type Saved = { name: string; config: Config; at: number };

export function Lab() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState<Saved[]>([]);
  /**
   * Which instrument. `critter` is the original one-bird canvas — the right tool
   * for proportion and line. `frame` is the whole scene at a real viewport
   * aspect with the cast on the limbs, which is the only place a COMPOSITION
   * problem is visible at all.
   */
  const [view, setView] = useState<'critter' | 'frame'>('frame');
  const [status, setStatus] = useState<string>('');

  const derived = useMemo(() => derive(config), [config]);

  const set = useCallback((path: Path, value: unknown) => {
    setConfig((c) => setAt(c, path, value));
  }, []);

  const reseed = useCallback(() => {
    setConfig((c) => ({ ...c, seed: Math.floor(Math.random() * 1e6) }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        reseed();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reseed]);

  const save = useCallback(async () => {
    const json = JSON.stringify(config, null, 2);
    const name = `${config.mode.species}-${config.mode.line}-${config.seed}`;
    setSaved((s) => [{ name, config, at: Date.now() }, ...s].slice(0, 12));
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      /* clipboard can be blocked; the file write below is the real path */
    }
    try {
      const res = await fetch('/__lab/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
      const body = (await res.json()) as { path?: string };
      setStatus(body.path ? `saved → ${body.path} (also on the clipboard)` : 'saved to clipboard');
    } catch {
      setStatus('saved to clipboard');
    }
  }, [config]);

  const M = config.mode;

  return (
    <div className="lab">
      <style>{CSS}</style>

      {/* RULE 10 — one static, screen-space grain layer above everything. It is
          NOT inside the scene's viewBox: baseFrequency is in user-space units,
          so grain authored inside a 0 0 100 120 box would change size with the
          viewport. It never animates, so it rasterises once. */}
      <GrainOverlay frequency={config.print.grainFrequency} opacity={config.print.grainOpacity} />

      <main className="stage">
        <button
          className={view === 'frame' ? 'canvasFrame' : 'canvas'}
          onClick={reseed}
          title="click for a new one (or press space)"
        >
          {view === 'frame' ? (
            // The meadow and the reef are other Toys' scenes, each with its own
            // already-derived palette and its own cast, so each gets its own
            // frame view rather than a branch inside the canopy's — see
            // `MeadowScene.tsx` and `ReefScene.tsx`.
            M.background === 'meadow' ? (
              <MeadowFrameView config={config} />
            ) : M.background === 'reef' ? (
              <ReefFrameView config={config} />
            ) : M.background === 'barnyard' ? (
              <BarnyardFrameView config={config} />
            ) : M.background === 'sky' ? (
              <SkyFrameView config={config} />
            ) : (
              <FrameView config={config} />
            )
          ) : (
            <Critter config={config} />
          )}
        </button>

        <div className="cast">
          {SPECIES.map((sp) => (
            <button
              key={sp}
              className={`castItem ${M.species === sp ? 'on' : ''}`}
              onClick={() => set('mode.species', sp)}
              title={sp}
            >
              <Critter config={{ ...config, mode: { ...M, species: sp as Species, showBackdrop: false } }} />
              <span>{sp}</span>
            </button>
          ))}
        </div>

        <p className="seed">
          seed <b>{config.seed}</b> · click the canvas or press space for a new one
        </p>
      </main>

      <aside className="panel">
        <div className="row modes">
          <Tab label="Bruna contour" on={M.line === 'contour'} onClick={() => set('mode.line', 'contour')} />
          <Tab label="Harper no line" on={M.line === 'none'} onClick={() => set('mode.line', 'none')} />
        </div>
        <div className="row modes">
          <Tab label="2 inks" on={M.inks === 2} onClick={() => set('mode.inks', 2)} />
          <Tab label="3 inks" on={M.inks === 3} onClick={() => set('mode.inks', 3)} />
          <Tab
            label="silhouette test"
            on={M.silhouetteTest}
            onClick={() => set('mode.silhouetteTest', !M.silhouetteTest)}
          />
        </div>
        <div className="row modes">
          <Tab label="light ground" on={M.ground === 'light'} onClick={() => { set('mode.ground', 'light'); set('scenery.fieldLightness', 0.9); }} />
          <Tab label="dark ground" on={M.ground === 'dark'} onClick={() => { set('mode.ground', 'dark'); set('scenery.fieldLightness', 0.34); }} />
        </div>
        <div className="row modes">
          <Tab label="frame view" on={view === 'frame'} onClick={() => setView('frame')} />
          <Tab label="critter view" on={view === 'critter'} onClick={() => setView('critter')} />
        </div>
        <div className="row modes">
          {(Object.keys(ASPECTS) as AspectName[]).map((a) => (
            <Tab
              key={a}
              label={ASPECTS[a].label}
              on={M.aspect === a}
              onClick={() => set('mode.aspect', a)}
            />
          ))}
        </div>
        <div className="row modes">
          {(['canopy', 'meadow', 'reef', 'barnyard', 'sky', 'glow', 'paper', 'motif', 'split'] as const).map((b) => (
            <Tab key={b} label={b} on={M.background === b} onClick={() => { set('mode.background', b); set('scenery.motif.show', b === 'motif'); }} />
          ))}
        </div>
        <div className="row modes">
          <Tab label="scenery contour" on={M.sceneryLine === 'contour'} onClick={() => set('mode.sceneryLine', 'contour')} />
          <Tab label="scenery no line" on={M.sceneryLine === 'none'} onClick={() => set('mode.sceneryLine', 'none')} />
          <Tab label="bird" on={M.showCritter} onClick={() => set('mode.showCritter', !M.showCritter)} />
          <Tab label="scene" on={M.showBackdrop} onClick={() => set('mode.showBackdrop', !M.showBackdrop)} />
        </div>

        {M.silhouetteTest && (
          <p className="hint">
            RULE 4's gate. All five must stay mutually distinguishable as solid shapes. The shipped
            birds fail this — robin, sparrow and goldfinch are byte-identical.
          </p>
        )}

        <Separation config={config} />

        <Swatches config={config} />

        {(() => {
          /* The shape-class rules, evaluated at the CURRENT frame's bird size —
             the same rules that were written down last time and then broken in
             the same session, which is why they run instead of sitting in a
             comment. A lobe that is fine on a phone is not automatically fine at
             16:10, because the bird shrinks relative to the frame and the
             foliage grain has to follow it. */
          const vio = checkCanopy(config.scenery.canopy, birdWidthInFrame(ASPECTS[M.aspect]));
          const all = [...derived.warnings, ...vio];
          return all.length > 0 ? (
            <ul className="warnings">
              {all.map((w, i) => (
                <li key={i}>
                  <b>{w.rule}</b> {w.message}
                </li>
              ))}
            </ul>
          ) : null;
        })()}

        {KNOB_GROUPS.map((g) => (
          <section key={g.title}>
            <h3>{g.title}</h3>
            {g.knobs.map((k) => (
              <label key={k.path} className="knob">
                <span className="knobLabel">
                  {k.label}
                  <em>{Number(getAt(config, k.path)).toFixed(k.step < 0.01 ? 3 : 2)}</em>
                </span>
                <input
                  type="range"
                  min={k.min}
                  max={k.max}
                  step={k.step}
                  value={getAt(config, k.path)}
                  onChange={(e) => set(k.path, Number(e.target.value))}
                />
                {k.note && <small>{k.note}</small>}
              </label>
            ))}
          </section>
        ))}

        <div className="actions">
          <button className="primary" onClick={save}>
            Save this config
          </button>
          <button onClick={() => setConfig(DEFAULT_CONFIG)}>Reset</button>
        </div>
        {status && <p className="status">{status}</p>}

        {saved.length > 0 && (
          <section>
            <h3>Saved</h3>
            <div className="rail">
              {saved.map((s) => (
                <button key={s.at} className="railItem" onClick={() => setConfig(s.config)} title={s.name}>
                  <Critter config={{ ...s.config, mode: { ...s.config.mode, showBackdrop: false } }} />
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

function Tab({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`tab ${on ? 'on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

/**
 * The separation readout — the rule that actually matters, made visible.
 *
 * A Critter is dragged across the WHOLE frame, so its legibility is set by the
 * worst contrast anywhere it can go, never the average. That minimum is exactly
 * what visual review misses: the mush zone is a small part of the frame and you
 * never happen to park a bird in it. So the tool computes it.
 *
 * 0.30 ΔL is roughly WCAG's 3:1 floor for non-text; 0.40 is the target, because
 * contrast sensitivity roughly doubles between age 4 and adulthood at the coarse
 * spatial scale a whole bird is detected at. Both the body fill AND the ink are
 * checked — a background that clears the fills but not the ink dissolves the
 * silhouette while the colours still read, which looks worse than no contour.
 */
function Separation({ config }: { config: Config }) {
  const d = derive(config);
  const col = sceneColours(config);
  const grounds: Array<[string, Oklch]> = [
    ['field', col.fieldOklch],
    ['glow dots', col.glowOklch],
    ['ground', col.groundOklch],
  ];
  const worstBody = Math.min(
    ...SPECIES.flatMap((sp) => grounds.map(([, g]) => deltaL(d.cast[sp].base, g))),
  );
  const worstInk = Math.min(...grounds.map(([, g]) => deltaL(config.ink, g)));
  const worst = Math.min(worstBody, worstInk);
  const state = worst >= 0.4 ? 'good' : worst >= 0.3 ? 'ok' : 'bad';
  return (
    <div className={`sep ${state}`}>
      <b>min ΔL {worst.toFixed(3)}</b>
      <span>
        body {worstBody.toFixed(2)} · ink {worstInk.toFixed(2)} — floor 0.30, target 0.40
      </span>
      {grounds.map(([label, g]) => (
        <span key={label}>
          {label} L {g.l.toFixed(2)}
        </span>
      ))}
    </div>
  );
}

function Swatches({ config }: { config: Config }) {
  const d = derive(config);
  const items: Array<[string, string]> = [
    ['paper', d.paper],
    ['ink', hex(config.ink)],
    ['sky', d.skyInk],
    ['ground', d.groundInk],
    ...SPECIES.map((s) => [s, d.cast[s].fill] as [string, string]),
  ];
  return (
    <div className="swatches">
      {items.map(([label, value]) => (
        <div key={label} className="swatch" title={`${label} ${value}`}>
          <i style={{ background: value }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The grain. `fractalNoise` (not `turbulence`) because it is symmetric about
 * 0.5, which gives an even wash rather than sparse ridges. `numOctaves` stays at
 * 2 — above `baseFrequency` 0.3 the extra octaves land below the device pixel
 * and cost raster time for nothing.
 */
function GrainOverlay({ frequency, opacity }: { frequency: number; opacity: number }) {
  return (
    <svg className="grain" aria-hidden="true" style={{ opacity }}>
      <filter id="lab-paper" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={11} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.20  0 0 0 0 0.17  0 0 0 0 0.13  0.16 0.16 0.16 0 -0.05"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#lab-paper)" />
    </svg>
  );
}

export type { Oklch };

const CSS = `
/* The frame view: a real viewport aspect, sized to fit the stage in whichever
   direction runs out first. Composition is judged at true proportion or not at
   all — a scene that reads on a square canvas is exactly how the old one passed. */
.canvasFrame { border:0; padding:0; background:none; cursor:pointer;
  height:min(84vh, 900px); max-width:min(64vw, 1100px); display:flex; }
.frameView { position:relative; overflow:hidden; border-radius:6px;
  height:100%; max-width:100%; box-shadow:0 6px 30px rgba(0,0,0,.35); }
.frameTag { position:absolute; left:6px; bottom:5px; font:10px/1.4 ui-monospace,monospace;
  color:rgba(255,255,255,.9); background:rgba(0,0,0,.45); padding:2px 6px; border-radius:4px; }
.lab { display:grid; grid-template-columns: 1fr 340px; min-height:100vh;
  font: 13px/1.5 ui-rounded, system-ui, sans-serif; color:#2b2622; background:#efe9dd; }
.grain { position:fixed; inset:0; width:100%; height:100%; pointer-events:none;
  mix-blend-mode:multiply; z-index:50; }
.stage { display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:20px; padding:28px; }
.canvas { width:min(58vh, 460px); aspect-ratio: 100/120; border:0; padding:0; cursor:pointer;
  background:transparent; border-radius:10px; overflow:hidden; box-shadow:0 18px 44px rgba(60,44,28,.18); }
.cast { display:flex; gap:10px; }
.castItem { width:88px; border:1px solid transparent; background:#fff8; border-radius:10px;
  padding:4px; cursor:pointer; display:grid; gap:2px; }
.castItem.on { border-color:#2b2622; background:#fffc; }
.castItem span { font-size:10px; letter-spacing:.02em; opacity:.7; }
.seed { opacity:.65; font-size:12px; }
.panel { background:#f7f2e8; border-left:1px solid #0001; padding:16px; overflow-y:auto;
  max-height:100vh; position:relative; z-index:60; }
.panel h3 { margin:18px 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:.08em; opacity:.55; }
.row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
.tab { border:1px solid #0002; background:#fff6; border-radius:999px; padding:5px 11px;
  cursor:pointer; font-size:12px; }
.tab.on { background:#2b2622; color:#f7f2e8; border-color:#2b2622; }
.hint { font-size:11px; background:#fff8; border-left:2px solid #2b2622; padding:7px 9px; margin:6px 0; }
.sep { margin:10px 0; padding:8px 10px; border-radius:6px; display:grid; gap:2px; font-size:11px; }
.sep b { font-size:13px; }
.sep span { opacity:.7; }
.sep.good { background:#dff0dd; }
.sep.ok { background:#fbf0d8; }
.sep.bad { background:#fbe0e0; }
.swatches { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0; }
.swatch { display:grid; justify-items:center; gap:2px; font-size:9px; opacity:.7; width:46px; }
.swatch i { width:100%; height:20px; border-radius:4px; border:1px solid #0002; }
.warnings { margin:10px 0; padding:8px 10px 8px 24px; background:#fbe9d8; border-radius:6px;
  font-size:11px; display:grid; gap:5px; }
.warnings b { font-variant:small-caps; }
.knob { display:block; margin-bottom:9px; }
.knobLabel { display:flex; justify-content:space-between; font-size:11px; }
.knobLabel em { font-style:normal; opacity:.55; font-variant-numeric:tabular-nums; }
.knob input { width:100%; }
.knob small { display:block; font-size:10px; opacity:.5; }
.actions { display:flex; gap:8px; margin:16px 0 6px; }
.actions button { flex:1; padding:9px; border-radius:8px; border:1px solid #0002;
  background:#fff8; cursor:pointer; }
.actions .primary { background:#2b2622; color:#f7f2e8; border-color:#2b2622; }
.status { font-size:11px; opacity:.65; }
.rail { display:flex; gap:6px; flex-wrap:wrap; }
.railItem { width:56px; aspect-ratio:100/120; border:1px solid #0002; border-radius:6px;
  background:#fff8; padding:2px; cursor:pointer; }
`;
