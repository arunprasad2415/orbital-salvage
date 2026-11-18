// Orbital Salvage: the make.fun entrypoint (Node 22+, standard library only).
//
// It stages the entry for the grader: game/ and screenshots/ beside this file are
// copied into the output directory, then dossier.json is written there with the
// vendored dossier builder, which reads game/ back off the disk and summarises it.
// The output directory is /output inside the grader's container; outside it,
// MAKEFUN_OUTPUT_DIR stands in:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// To play the game locally, serve game/ with `node serve.ts` and open
// http://localhost:8080 (or any static file server, no build step).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, type DossierCaps } from './vendor/makefun-game.ts';

/** This file's directory: the entry as it sits in the repository. */
const here = dirname(fileURLToPath(import.meta.url));

/** Where the grader reads the entry, or the stand-in named above. */
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/**
 * The scorer's caps (reference/gate.json), passed straight through: the dossier
 * refuses an entry the scorer would refuse, and text_max_bytes shapes its bytes.
 */
const CAPS: DossierCaps = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  game_max_files: 993,
  game_max_bytes: 50_331_648,
  game_path_max_bytes: 1_000,
};

interface Tree {
  files: number;
  bytes: number;
}

/** Count what a staged directory holds, so the log states facts, not hopes. */
function measure(dir: string): Tree {
  let files = 0;
  let bytes = 0;
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        files += 1;
        bytes += statSync(path).size;
      }
    }
  };
  walk(dir);
  return { files, bytes };
}

/** The scorer refuses a screenshots/ that breaks its caps: name the file and stop. */
function checkShots(dir: string): void {
  const caps = CAPS.screenshots!;
  const images = readdirSync(dir).filter((name) => /\.(jpe?g|png)$/i.test(name));
  if (images.length === 0) throw new Error('screenshots/ holds no image: the first is the cover');
  if (images.length > caps.max) throw new Error(`screenshots/ holds ${images.length} images, the cap is ${caps.max}`);
  for (const name of images) {
    const bytes = statSync(join(dir, name)).size;
    if (bytes > caps.max_bytes) throw new Error(`screenshots/${name} is ${bytes} bytes, the cap is ${caps.max_bytes}`);
  }
}

/** Copy one staged directory into the output, creating it when it is optional. */
function stage(name: string, required: boolean): Tree | null {
  const from = join(here, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) {
    if (required) throw new Error(`entry is missing ${name}/ beside main.ts`);
    mkdirSync(to, { recursive: true });
    return null;
  }
  cpSync(from, to, { recursive: true });
  return measure(to);
}

mkdirSync(outputDir, { recursive: true });

const game = stage('game', true);
const shots = stage('screenshots', false);

checkShots(join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const kib = (n: number): string => `${(n / 1024).toFixed(1)} KiB`;
console.log(
  `staged game/ (${game?.files ?? 0} files, ${kib(game?.bytes ?? 0)}) and ` +
    `screenshots/ (${shots?.files ?? 0} files, ${kib(shots?.bytes ?? 0)}) into ${outputDir}`,
);
console.log(`wrote ${join(outputDir, 'dossier.json')} (${kib(dossier.byteLength)})`);
