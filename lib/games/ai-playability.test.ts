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

test('assertAiGameHtmlPlayable fails when a start button never starts the game', () => {
  assert.throws(
    () =>
      assertAiGameHtmlPlayable(`
        <html>
          <body>
            <canvas id="game"></canvas>
            <button>Start</button>
            <script>
              const canvas = document.getElementById('game');
              canvas.getContext('2d');
              document.querySelector('button').addEventListener('click', () => {});
            </script>
          </body>
        </html>
      `),
    /start button|playable loop|start controls/i
  );
});

test('assertAiGameHtmlPlayable passes when a start button boots the playable loop', () => {
  const result = assertAiGameHtmlPlayable(`
    <html>
      <body>
        <canvas id="game"></canvas>
        <button>Start</button>
        <script>
          const canvas = document.getElementById('game');
          const ctx = canvas.getContext('2d');
          const startButton = document.querySelector('button');
          startButton.addEventListener('click', () => {
            window.addEventListener('keydown', () => {});
            requestAnimationFrame(function frame() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
          });
        </script>
      </body>
    </html>
  `);

  assert.ok(result.animationFrameRequests >= 1);
  assert.ok(result.canvasContextRequests >= 1);
});

test('assertAiGameHtmlPlayable fails when score HUD overlays the top-left play area', () => {
  assert.throws(
    () =>
      assertAiGameHtmlPlayable(`
        <html>
          <head>
            <style>
              #scoreBoard {
                position: absolute;
                top: 12px;
                left: 12px;
                padding: 10px 14px;
              }
            </style>
          </head>
          <body>
            <div id="scoreBoard">Score: <b>0</b></div>
            <canvas id="game"></canvas>
            <script>
              const canvas = document.getElementById('game');
              canvas.getContext('2d');
              requestAnimationFrame(() => {});
            </script>
          </body>
        </html>
      `),
    /score hud|top-left play area|playfield/i
  );
});

test('assertAiGameHtmlPlayable passes when score UI lives in a reserved top bar', () => {
  const result = assertAiGameHtmlPlayable(`
    <html>
      <head>
        <style>
          .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
          }
        </style>
      </head>
      <body>
        <div class="topbar">
          <div>Score: <b>0</b></div>
          <button>Start</button>
        </div>
        <canvas id="game"></canvas>
        <script>
          const canvas = document.getElementById('game');
          const ctx = canvas.getContext('2d');
          document.querySelector('button').addEventListener('click', () => {
            requestAnimationFrame(function frame() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
          });
        </script>
      </body>
    </html>
  `);

  assert.ok(result.animationFrameRequests >= 1);
  assert.ok(result.canvasContextRequests >= 1);
});
