import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chooseNextCardReducer, canTarget } = require('../build-test/state/chooseNextCardReducer.cjs');

function createBaseState() {
  return {
    intensity: 'medio',
    remainingByIntensity: {
      leve: [],
      medio: ['card-1', 'card-2'],
      pesado: [],
      extremo: [],
    },
    cardsById: {
      'card-1': {
        id: 'card-1',
        type: 'truth',
        text: 'Teste verdade',
        intensity: 'medio',
        createdAt: Date.now(),
        source: 'seed',
      },
      'card-2': {
        id: 'card-2',
        type: 'dare',
        text: 'Teste desafio',
        intensity: 'medio',
        createdAt: Date.now(),
        source: 'seed',
      },
    },
    players: {
      alice: { id: 'alice', name: 'Alice', points: 10, lastTargetedByChooseNextCard: null },
      bob: { id: 'bob', name: 'Bob', points: 10, lastTargetedByChooseNextCard: null },
    },
    queuedNextForPlayer: {
      alice: null,
      bob: null,
    },
    cooldowns: {
      alice: { choose_next_card: 0 },
      bob: { choose_next_card: 0 },
    },
    logs: [],
  };
}

test('refund action restores points and logs', () => {
  const state = createBaseState();
  state.players.alice.points = 5;
  const result = chooseNextCardReducer(state, { type: 'POWER_CHOOSE_NEXT_REFUND', chooserId: 'alice' });
  assert.strictEqual(result.players.alice.points, 10);
  assert.ok(result.logs[result.logs.length - 1].includes('Reembolso'));
});

test('local card creation adds to deck and logs', () => {
  const state = createBaseState();
  const card = {
    id: 'card-new',
    type: 'truth',
    text: 'Nova carta de teste',
    intensity: 'medio',
    createdAt: Date.now(),
    source: 'created',
  };
  const result = chooseNextCardReducer(state, { type: 'CARD_CREATED_LOCAL', card });
  assert.deepStrictEqual(result.cardsById['card-new'], card);
  assert.ok(result.remainingByIntensity.medio.includes('card-new'));
  assert.ok(result.logs[result.logs.length - 1].includes('Carta criada'));
});

test('commit debits points, queues card, and sets cooldown', () => {
  const state = createBaseState();
  const action = {
    type: 'POWER_CHOOSE_NEXT_COMMIT',
    payload: { chooserId: 'alice', targetId: 'bob', chosenCardId: 'card-1' },
  };
  const result = chooseNextCardReducer(state, action);
  assert.strictEqual(result.players.alice.points, 5);
  assert.strictEqual(result.cooldowns.alice.choose_next_card, 2);
  assert.strictEqual(result.queuedNextForPlayer.bob, 'card-1');
  assert.ok(!result.remainingByIntensity.medio.includes('card-1'));
  assert.strictEqual(result.players.bob.lastTargetedByChooseNextCard, 'alice');
});

test('noRepeatTargetBackToBack guard blocks repeat target', () => {
  const state = createBaseState();
  state.players.alice.points = 10;
  state.players.bob.lastTargetedByChooseNextCard = 'alice';
  const action = {
    type: 'POWER_CHOOSE_NEXT_COMMIT',
    payload: { chooserId: 'alice', targetId: 'bob', chosenCardId: 'card-2' },
  };
  const result = chooseNextCardReducer(state, action);
  assert.strictEqual(result.players.alice.points, 10);
  assert.strictEqual(result.queuedNextForPlayer.bob, null);
  assert.ok(result.logs[result.logs.length - 1].includes('Alvo inválido'));
});

test('canTarget prevents repeating the same target by another player', () => {
  const state = createBaseState();
  state.players.bob.lastTargetedByChooseNextCard = 'alice';
  assert.strictEqual(canTarget(state, 'alice', 'bob'), false);
  assert.strictEqual(canTarget(state, 'bob', 'bob'), true);
});
