// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @file Grandezas cinemáticas lineares de um objeto, como no Tracker (pedido do autor, 23/11/2026): módulo da posição
 * r, velocidade (vx, vy, v) e aceleração (ax, ay, a). Sem DOM: testado no Node.
 *
 * Mesmo cálculo do Tracker (PointMass com o algoritmo padrão FINITE_DIFF; FirstDerivative e SecondDerivative):
 * - r = √(x² + y²), a partir da origem dos eixos;
 * - velocidade por diferença centrada nos passos vizinhos: vx(n) = (x(n+1) − x(n−1)) / (2 Δt);
 * - aceleração pelo ajuste de 5 pontos por mínimos quadrados do Tracker (vDerivSpill = 1, aDerivSpill = 2):
 *   ax(n) = (2 x(n−2) − x(n−1) − 2 x(n) − x(n+1) + 2 x(n+2)) / (7 Δt²), exato para um movimento uniformemente
 *   acelerado e menos sensível ao ruído da marcação que a diferença de 3 pontos;
 * - v e a são os módulos dos vetores.
 * Um passo é o "a cada" da marcação (como o step size do clipe do Tracker): n ± 1 é o quadro ± h, e Δt é o tempo de
 * um passo, h vezes o Δt por quadro (o mesmo para todos os quadros, como no Tracker; analise.js). Sem um dos
 * vizinhos (pontas da trilha, ponto faltando, fora do intervalo), a grandeza não existe (NaN), como as células vazias
 * do Tracker: v falta no primeiro e no último ponto; a, nos dois primeiros e nos dois últimos.
 */

/** As grandezas, na ordem das colunas do Tracker. */
export const GRANDEZAS = ["x", "y", "r", "vx", "vy", "v", "ax", "ay", "a"];
/** Famílias do seletor do gráfico e as três grandezas de cada uma (componentes x e y e o módulo). */
export const FAMILIAS = { pos: ["x", "y", "r"], vel: ["vx", "vy", "v"], acel: ["ax", "ay", "a"] };

/**
 * Família de uma grandeza.
 * @param {string} g A grandeza ("x", "vx", "a"…).
 * @returns {"pos"|"vel"|"acel"} A família.
 */
export const familia = (g) => g.startsWith("v") ? "vel" : g.startsWith("a") ? "acel" : "pos";
/**
 * Unidade de uma grandeza a partir da unidade das posições: cm, cm/s, cm/s² (ou u.a., u.a./s, u.a./s²).
 * @param {string} g A grandeza.
 * @param {string} u Unidade das posições.
 * @returns {string} A unidade.
 */
export const unidadeDe = (g, u) => { const f = familia(g); return f === "vel" ? `${u}/s` : f === "acel" ? `${u}/s²` : u; };
/**
 * Nome da grandeza em HTML, com o índice da componente abaixo da linha: v<sub>x</sub> (no canvas do gráfico, o
 * nome simples, vx).
 * @param {string} g A grandeza.
 * @returns {string} O HTML.
 */
export const nomeHtml = (g) => g.length === 2 ? `${g[0]}<sub>${g[1]}</sub>` : g;
/**
 * Nome da grandeza no CSV, como no Tracker: v_{x}, a_{y}.
 * @param {string} g A grandeza.
 * @returns {string} O nome.
 */
export const nomeTracker = (g) => g.length === 2 ? `${g[0]}_{${g[1]}}` : g;

/**
 * Calcula as grandezas de cada ponto de uma trilha.
 * @param {Map<number, {x: number, y: number}>} pos Quadro → posição em unidades físicas (só os pontos válidos: dentro
 * do intervalo de análise).
 * @param {number} h Passo em quadros (o "a cada" da marcação), como o step size do clipe do Tracker.
 * @param {number} dt Tempo de um quadro, em segundos.
 * @returns {Map<number, {x: number, y: number, r: number, vx: number, vy: number, v: number, ax: number, ay: number, a: number}>}
 * Quadro → grandezas; NaN onde falta um vizinho.
 */
export function cinematica(pos, h, dt) {
  const out = new Map(), T = h * dt, p = (i) => pos.get(i);
  for (const [i, q] of pos) {
    const g = { x: q.x, y: q.y, r: Math.hypot(q.x, q.y), vx: NaN, vy: NaN, v: NaN, ax: NaN, ay: NaN, a: NaN };
    const m1 = p(i - h), p1 = p(i + h);
    if (m1 && p1 && T > 0) {
      g.vx = (p1.x - m1.x) / (2 * T); g.vy = (p1.y - m1.y) / (2 * T); g.v = Math.hypot(g.vx, g.vy);
      const m2 = p(i - 2 * h), p2 = p(i + 2 * h);
      if (m2 && p2) {
        const d2 = (c) => (2 * m2[c] - m1[c] - 2 * q[c] - p1[c] + 2 * p2[c]) / (7 * T * T);
        g.ax = d2("x"); g.ay = d2("y"); g.a = Math.hypot(g.ax, g.ay);
      }
    }
    out.set(i, g);
  }
  return out;
}
