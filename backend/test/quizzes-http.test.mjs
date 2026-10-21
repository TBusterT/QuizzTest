import 'reflect-metadata';

import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configureHttp } from '../dist/config/configure-http.js';
import { QuizzesController } from '../dist/quizzes/quizzes.controller.js';
import { QuizzesService } from '../dist/quizzes/quizzes.service.js';

let app;
let baseUrl;
let received;

// Exercise the real controller, DTO and HTTP configuration without a database.
class HttpTestModule {}
Module({
  controllers: [QuizzesController],
  providers: [
    {
      provide: QuizzesService,
      useValue: {
        create(dto) {
          received.push(dto);
          return { id: 'test-quiz', ...dto };
        },
      },
    },
  ],
})(HttpTestModule);

before(async () => {
  app = await NestFactory.create(HttpTestModule, { logger: false });
  configureHttp(app, 'http://localhost:3000');
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});

beforeEach(() => {
  received = [];
});

after(async () => {
  await app?.close();
});

function post(body) {
  return fetch(`${baseUrl}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
}

const booleanQuestion = { type: 'BOOLEAN', text: 'Question' };
const option = { label: 'Correct', isCorrect: true };
const invalidCases = [
  ['nested question array', [[booleanQuestion]]],
  ['empty nested question array', [[]]],
  ['null question', [null]],
  ['primitive question', ['question']],
  ...[
    ['nested option array', [option, [{ label: 'Wrong', isCorrect: false }]]],
    ['empty nested option array', [option, []]],
    ['null option', [option, null]],
    ['primitive option', [option, 'wrong']],
  ].map(([name, options]) => [
    name,
    [{ type: 'CHECKBOX', text: 'Choose', options }],
  ]),
];

for (const [name, questions] of invalidCases) {
  test(`rejects ${name} before calling the service`, async () => {
    const response = await post({ title: 'Validation', questions });
    assert.equal(response.status, 400);
    assert.equal(received.length, 0);
  });
}

test('accepts all three question types, multiple correct options and trimming', async () => {
  const response = await post({
    title: '  Three types  ',
    questions: [
      { type: 'BOOLEAN', text: '  True or false?  ' },
      { type: 'INPUT', text: 'Short answer?' },
      {
        type: 'CHECKBOX',
        text: 'Choose',
        options: [option, { label: 'Also correct', isCorrect: true }],
      },
    ],
  });
  assert.equal(response.status, 201);
  assert.equal(received[0].title, 'Three types');
  assert.equal(received[0].questions[0].text, 'True or false?');
  assert.equal(received[0].questions[2].options.length, 2);
});

function largestQuiz(character) {
  return {
    title: character.repeat(200),
    questions: Array.from({ length: 50 }, () => ({
      type: 'CHECKBOX',
      text: character.repeat(500),
      options: Array.from({ length: 20 }, (_, index) => ({
        label: character.repeat(300),
        isCorrect: index === 0,
      })),
    })),
  };
}

test('accepts a quiz at every advertised maximum (over 100 KB)', async () => {
  const body = JSON.stringify(largestQuiz('a'));
  assert.ok(Buffer.byteLength(body) > 100 * 1024);
  assert.equal((await post(body)).status, 201);
  assert.equal(received[0].questions.length, 50);
});

test('accepts maximum content serialized as escaped Unicode', async () => {
  const body = JSON.stringify(largestQuiz('Ж')).replace(/Ж/g, () => '\\u0416');
  assert.ok(Buffer.byteLength(body) > 1024 * 1024);
  assert.equal((await post(body)).status, 201);
  assert.equal(received[0].title, 'Ж'.repeat(200));
});

test('accepts maximum content serialized as escaped surrogate pairs', async () => {
  const body = JSON.stringify(largestQuiz('😀')).replace(
    /😀/g,
    () => '\\ud83d\\ude00',
  );
  assert.ok(Buffer.byteLength(body) > 3 * 1024 * 1024);
  assert.equal((await post(body)).status, 201);
  assert.equal(received[0].title, '😀'.repeat(200));
});

test('still rejects JSON exceeding the bounded 4 MB limit', async () => {
  const response = await post({ title: 'x'.repeat(4 * 1024 * 1024) });
  assert.equal(response.status, 413);
  assert.equal(received.length, 0);
});

test('rejects malformed JSON before calling the service', async () => {
  assert.equal((await post('{"title":')).status, 400);
  assert.equal(received.length, 0);
});
