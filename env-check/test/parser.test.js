import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDotenv } from '../index.js';

test('basic key=value, blank lines and comments', () => {
  const src = `
# a comment
FOO=bar
   # indented comment

BAZ = qux
EMPTY=
`;
  assert.deepEqual(parseDotenv(src), { FOO: 'bar', BAZ: 'qux', EMPTY: '' });
});

test('export prefix', () => {
  assert.deepEqual(parseDotenv('export FOO=1\nexport  BAR="two"'), { FOO: '1', BAR: 'two' });
});

test('inline comments on unquoted values', () => {
  assert.deepEqual(parseDotenv('A=hello # comment\nB=hello#not-a-comment\nC=#ff0000\nD= # only comment'), {
    A: 'hello',
    B: 'hello#not-a-comment',
    C: '#ff0000',
    D: '',
  });
});

test('single quotes are literal', () => {
  assert.deepEqual(parseDotenv(`A='hello # world'\nB='a\\nb'\nC='say "hi"'`), {
    A: 'hello # world',
    B: 'a\\nb',
    C: 'say "hi"',
  });
});

test('double quotes handle escapes', () => {
  const env = parseDotenv('A="line1\\nline2"\nB="tab\\there"\nC="quote \\" inside"\nD="back\\\\slash"\nE="keep \\q"');
  assert.equal(env.A, 'line1\nline2');
  assert.equal(env.B, 'tab\there');
  assert.equal(env.C, 'quote " inside');
  assert.equal(env.D, 'back\\slash');
  assert.equal(env.E, 'keep \\q');
});

test('multiline double-quoted values', () => {
  const src = 'KEY="-----BEGIN-----\nabc\ndef\n-----END-----"\nNEXT=1';
  assert.deepEqual(parseDotenv(src), { KEY: '-----BEGIN-----\nabc\ndef\n-----END-----', NEXT: '1' });
});

test('backtick quotes and comments after quoted values', () => {
  assert.deepEqual(parseDotenv('A=`it\'s "fine"`\nB="x" # trailing\nC=\'y\'   # trailing'), {
    A: `it's "fine"`,
    B: 'x',
    C: 'y',
  });
});

test('whitespace, quoted whitespace and CRLF', () => {
  assert.deepEqual(parseDotenv('A=  padded  \r\nB="  keep  "\r\nC=x'), { A: 'padded', B: '  keep  ', C: 'x' });
});

test('values containing = and URLs', () => {
  assert.deepEqual(parseDotenv('URL=postgres://u:p@host:5432/db?ssl=true\nEQ=a=b=c'), {
    URL: 'postgres://u:p@host:5432/db?ssl=true',
    EQ: 'a=b=c',
  });
});

test('unterminated quote is treated as a plain value', () => {
  assert.deepEqual(parseDotenv('A="oops\nB=2'), { A: '"oops', B: '2' });
});

test('invalid lines are ignored, later duplicates win', () => {
  assert.deepEqual(parseDotenv('not a line\n1BAD=x\nA=1\nA=2\nexport\n'), { A: '2' });
});

test('BOM and dotted/dashed keys', () => {
  assert.deepEqual(parseDotenv('﻿app.name=x\nmy-key=y'), { 'app.name': 'x', 'my-key': 'y' });
});
