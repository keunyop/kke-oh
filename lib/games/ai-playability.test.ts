import assert from 'node:assert/strict';
import test from 'node:test';
import { AiGamePlayabilityError, assertAiGameHtmlPlayable } from './ai-playability';

test('assertAiGameHtmlPlayable passes a minimal canvas game that boots and schedules frames', () => {
  const result = assertAiGameHtmlPlayable(`
    <!doctype html>
    <html>
      <body>
        <canvas id="game"></canvas>
        <script>
          const canvas = document.getElementById('game');
          const ctx = canvas.getContext('2d');
          function frame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            requestAnimationFrame(frame);
          }
          document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(frame);
          });
        </script>
      </body>
    </html>
  `);

  assert.equal(result.scriptCount, 1);
  assert.ok(result.animationFrameRequests >= 1);
  assert.ok(result.canvasContextRequests >= 1);
});

test('assertAiGameHtmlPlayable fails on syntax errors', () => {
  assert.throws(
    () =>
      assertAiGameHtmlPlayable(`
        <html>
          <body>
            <canvas></canvas>
            <script>
              function broken( {
            </script>
          </body>
        </html>
      `),
    AiGamePlayabilityError
  );
});

test('assertAiGameHtmlPlayable fails on runtime crashes', () => {
  assert.throws(
    () =>
      assertAiGameHtmlPlayable(`
        <html>
          <body>
            <canvas></canvas>
            <script>
              throw new Error('boom');
            </script>
          </body>
        </html>
      `),
    /runtime smoke test/i
  );
});

test('assertAiGameHtmlPlayable records score bridge submissions during bootstrap', () => {
  const result = assertAiGameHtmlPlayable(`
    <html>
      <body>
        <canvas></canvas>
        <script>
          requestAnimationFrame(() => {});
          window.kkeohSubmitScore(42);
        </script>
      </body>
    </html>
  `);

  assert.deepEqual(result.submittedScores, [42]);
});
