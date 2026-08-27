import { expect, test } from '@playwright/test';
import {
  deleteValueAtPath,
  pathToString,
  setValueAtPath,
  stringToPath,
} from '../../src/lib/json/updater';

test('nested array updates preserve arrays and source immutability', () => {
  const source = {
    scenes: [
      { lights: ['soft', 'warm'] },
      { lights: ['hard'] },
    ],
  };

  const updated = setValueAtPath(source, ['scenes', '0', 'lights', '1'], 'cool');

  expect(Array.isArray(updated.scenes)).toBe(true);
  expect(updated).toEqual({
    scenes: [
      { lights: ['soft', 'cool'] },
      { lights: ['hard'] },
    ],
  });
  expect(source.scenes[0].lights[1]).toBe('warm');
});

test('nested array deletion splices the target without corrupting siblings', () => {
  const source = { scenes: [{ lights: ['soft', 'warm', 'rim'] }] };
  const updated = deleteValueAtPath(source, ['scenes', '0', 'lights', '1']);

  expect(updated).toEqual({ scenes: [{ lights: ['soft', 'rim'] }] });
  expect(source.scenes[0].lights).toEqual(['soft', 'warm', 'rim']);
});

test('path serialization round-trips dots, slashes, and tildes', () => {
  const path = ['image.generation', 'lighting/key', 'soft~fill'];
  expect(stringToPath(pathToString(path))).toEqual(path);
});
