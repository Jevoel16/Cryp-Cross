const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { hashString, createRng } = require('../puzzle/rng');

const draw = (seed, count = 20) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('rng', () => {
  test('hashString gives the same unsigned 32-bit seed for the same text', () => {
    const hash = hashString('2026-11-12');
    assert.equal(hash, hashString('2026-11-12'));
    assert.notEqual(hash, hashString('2026-11-13'));
    assert.ok(Number.isInteger(hash) && hash >= 0 && hash <= 0xffffffff);
  });

  test('the same seed replays the same sequence and another seed does not', () => {
    assert.deepEqual(draw('2026-11-12'), draw('2026-11-12'));
    assert.notDeepEqual(draw('2026-11-12'), draw('2026-11-13'));
  });

  test('next stays in [0, 1) and int stays within its bounds', () => {
    assert.ok(draw('floats', 500).every((n) => n >= 0 && n < 1));
    const rng = createRng('ints');
    const ints = Array.from({ length: 500 }, () => rng.int(1, 25));
    assert.ok(ints.every((n) => Number.isInteger(n) && n >= 1 && n <= 25));
    assert.ok(ints.includes(1) && ints.includes(25));
  });

  test('pick returns a member and shuffle keeps every item without touching the input', () => {
    const rng = createRng('lists');
    const list = ['a', 'b', 'c', 'd', 'e'];
    assert.ok(list.includes(rng.pick(list)));
    const shuffled = rng.shuffle(list);
    assert.deepEqual(list, ['a', 'b', 'c', 'd', 'e']);
    assert.deepEqual([...shuffled].sort(), list);
  });
});
