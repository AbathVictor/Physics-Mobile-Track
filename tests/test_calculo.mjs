// SPDX-License-Identifier: AGPL-3.0-or-later
// Testes das partes de cálculo, direto no Node (sem navegador): previsão, máscara circular, correlação e
// modelo de objetos (várias massas e centro de massa).
// Uso:  node tests/test_calculo.mjs
import { predictNext } from "../js/rastreio/previsao.js";
import { finalizeT, nccSearch } from "../js/rastreio/modelo.js";
import { FAMILIAS, cinematica, familia, nomeTracker, unidadeDe } from "../js/cinematica.js";
import { avisoFaltam, desserializar, novaMassa, novoCm, pontosCm, serializar, sistemaCm } from "../js/objetos.js";

let falhas = 0;
const conferir = (ok, msg) => { console.log((ok ? "  ok    " : "  FALHA ") + msg); if (!ok) falhas++; };

console.log("previsão (pêndulo sintético, taxa de quadros variando ±5%)");
for (const [fps, limMedio] of [[30, 0.8], [15, 6]]) {
  const pos = (t) => ({ x: 5000 + 200 * Math.sin(2 * Math.PI * t / 1.6), y: 5000 + 20 * Math.cos(4 * Math.PI * t / 1.6) });
  let eV = 0, eA = 0, n = 0, t = 0, semente = 1;
  const aleat = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  const hist = [];
  for (let i = 0; i < 200; i++) {
    if (hist.length >= 2) {
      const P = pos(t), a = predictNext(hist, t, 1e4, 1e4);
      const l = hist[hist.length - 1], p = hist[hist.length - 2], f = (t - l.t) / (l.t - p.t);
      const v = { x: l.p.x + (l.p.x - p.p.x) * f, y: l.p.y + (l.p.y - p.p.y) * f };
      eV += Math.hypot(v.x - P.x, v.y - P.y); eA += Math.hypot(a.x - P.x, a.y - P.y); n++;
    }
    hist.push({ p: pos(t), t }); if (hist.length > 4) hist.shift();
    t += (1 / fps) * (1 + 0.1 * (aleat() - 0.5));
  }
  conferir(eA / n < limMedio && eA < eV, `${fps} quadros/s: erro médio ${(eA / n).toFixed(2)} px (velocidade constante daria ${(eV / n).toFixed(2)} px)`);
}
const parado = predictNext([{ p: { x: 10, y: 10 }, t: 0 }, { p: { x: 10, y: 10 }, t: 0.1 }], 0.2, 100, 100);
conferir(parado.x === 10 && parado.y === 10, "objeto parado: a previsão fica no lugar");
const borda = predictNext([{ p: { x: 90, y: 50 }, t: 0 }, { p: { x: 99, y: 50 }, t: 0.1 }], 0.2, 100, 100);
conferir(borda.x === 100, "a previsão não sai da imagem");

console.log("máscara circular e correlação");
const W = 80, H = 60, I = new Uint8ClampedArray(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, d = Math.hypot(x - 50, y - 25);
  I[i] = d < 7 ? 220 : 30 + ((x * 7 + y * 13) % 40); I[i + 1] = d < 7 ? 40 : 60; I[i + 2] = 90; I[i + 3] = 255;
}
const raw = new Float32Array(21 * 21 * 3);
for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { const i = ((15 + y) * W + 40 + x) * 4, k = (y * 21 + x) * 3; raw[k] = I[i]; raw[k + 1] = I[i + 1]; raw[k + 2] = I[i + 2]; }
const T = finalizeT({ raw, w: 21, h: 21 });
conferir(T.nm === 349, `máscara 21 × 21: ${T.nm} pixels dentro do círculo (79%)`);
conferir(T.runs[0] === 7 && T.runs[1] === 13 && T.runs[20] === 0 && T.runs[21] === 20, "primeira linha do círculo vai de 7 a 13; a do meio, de 0 a 20");
const r = nccSearch(I, W, H, T);
conferir(r.u === 40 && r.v === 15 && Math.abs(r.score - 1) < 1e-6, `acha o alvo na posição exata (${r.u}, ${r.v}), semelhança ${r.score.toFixed(4)}`);

console.log("várias massas e centro de massa");
const objs = [];
for (let i = 0; i < 10; i++) objs.push(novaMassa(objs));
conferir(objs.map((m) => m.letra).join("") === "ABCDEFGHIJ" && objs[1].nome === "massa B" && novaMassa(objs) === null, "nomes massa A a massa J, como no Tracker, e no máximo 10");
conferir(objs[0].cor === "#ff3030" && objs[1].cor === "#00e5ff" && new Set(objs.map((m) => m.cor)).size === 10, "cores do Tracker em A a D e todas diferentes");
conferir(novaMassa(objs.filter((m) => m.letra !== "C")).letra === "C", "massa nova usa a primeira letra livre");
const A = novaMassa([]), B = novaMassa([A]), cm = novoCm([A, B]), sis = [A, B, cm];
conferir(cm.nome === "cm A" && cm.massas.length === 0 && pontosCm(cm, sis).size === 0, "centro de massa novo: cm A, vazio (as massas são escolhidas pelo usuário, como no Tracker)");
conferir(novoCm(sis).nome === "cm B", "o segundo centro de massa é o cm B");
cm.massas = ["massa A", "massa B"];
A.marks.set(0, { x: 0, y: 0 }); A.marks.set(1, { x: 10, y: 0 }); A.marks.set(2, { x: 20, y: 4 });
B.marks.set(0, { x: 10, y: 0 }); B.marks.set(2, { x: 20, y: 8 });
let s = sistemaCm(cm, sis), P = pontosCm(cm, sis);
conferir(s.generica && s.pesos.join() === "1,1" && P.size === 2 && P.get(0).x === 5 && P.get(2).y === 6 && !P.has(1), "sem valores: massas iguais; sem ponto do cm no quadro em que falta uma massa");
A.massa.val = "100";
s = sistemaCm(cm, sis); P = pontosCm(cm, sis);
conferir(!s.pesos && s.faltam.join() === "massa B" && avisoFaltam(s.faltam) === "massa B faltante" && P.size === 0, `só uma massa informada: cm sem posição e aviso "${avisoFaltam(s.faltam)}"`);
B.massa.val = "300,0";
s = sistemaCm(cm, sis); P = pontosCm(cm, sis);
conferir(s.total === 400 && P.get(0).x === 7.5 && P.get(2).y === 7, "com as massas reais (100 e 300,0): cm ponderado e massa total 400");
B.massa.val = "abc"; A.massa.val = "";
conferir(sistemaCm(cm, sis).faltam.join() === "massa A,massa B", "valor inválido conta como faltante");
B.massa.val = "300"; A.massa.val = "100";
cm.massas = ["massa A"];
conferir(pontosCm(cm, sis).get(1).x === 10, "sistema com uma massa só: o cm é a própria massa");
const cmB = { ...novoCm(sis), massas: ["massa B"] };
const volta = desserializar(JSON.parse(JSON.stringify(serializar([A, B, { ...cm, massas: ["massa A", "massa Z"] }, cmB]))), 2);
conferir(volta.length === 4 && volta[0].marks.size === 2 && volta[1].massa.val === "300" && volta[2].massas.join() === "massa A" && volta[1].cor === B.cor
  && volta[3].nome === "cm B" && volta[3].massas.join() === "massa B",
  "salvar e reabrir: vários centros de massa; pontos fora do vídeo e massas inexistentes descartados");
const C1 = novaMassa([]), C2 = novaMassa([C1]);
C2.cor = "#123456";
const sc = serializar([C1, C2]);
const vc = desserializar(JSON.parse(JSON.stringify(sc)).concat([{ tipo: "massa", letra: "C", cor: "vermelho", massa: {}, marks: [] }]), 2);
conferir(!("cor" in sc[0]) && sc[1].cor === "#123456" && vc[0].cor === "#ff3030" && vc[1].cor === "#123456" && vc[2].cor === "#ff40ff",
  "cor escolhida pelo usuário salva e reaberta; a cor padrão não é gravada; cor inválida volta à padrão");
const semMassas = desserializar([{ tipo: "cm", letra: "A", massas: ["massa A"] }], 2);
conferir(desserializar([], 2).length === 0 && semMassas.length === 1 && semMassas[0].nome === "cm A" && semMassas[0].massas.length === 0,
  "sem massas (a última pode ser excluída): a lista volta vazia, e um cm volta sem as massas que não existem mais");

console.log("grandezas cinemáticas (como no Tracker)");
{
  // movimento uniformemente acelerado em x e uniforme em y: a diferença centrada (v) e o ajuste de 5 pontos (a) do
  // Tracker são exatos para um polinômio de grau 2
  const dt = 1 / 30, x0 = 3, v0x = 2, ax = -9.8, vy = 1.5;
  for (const h of [1, 2]) {
    const pos = new Map();
    for (let i = 0; i <= 40; i += h) { const t = i * dt; pos.set(i, { x: x0 + v0x * t + ax * t * t / 2, y: -1 + vy * t }); }
    const g = cinematica(pos, h, dt), L = [...g.values()], idx = [...g.keys()];
    let eV = 0, eA = 0;
    for (const [i, q] of g) {
      const t = i * dt;
      if (Number.isFinite(q.vx)) eV = Math.max(eV, Math.abs(q.vx - (v0x + ax * t)), Math.abs(q.vy - vy), Math.abs(q.v - Math.hypot(v0x + ax * t, vy)));
      if (Number.isFinite(q.ax)) eA = Math.max(eA, Math.abs(q.ax - ax), Math.abs(q.ay), Math.abs(q.a - Math.abs(ax)));
    }
    const semV = idx.filter((i) => !Number.isFinite(g.get(i).v)), semA = idx.filter((i) => !Number.isFinite(g.get(i).a));
    conferir(eV < 1e-9 && eA < 1e-6, `a cada ${h}: v e a exatos num movimento uniformemente acelerado (erros ${eV.toExponential(1)} e ${eA.toExponential(1)})`);
    conferir(semV.join() === [0, 40].join() && semA.join() === [0, h, 40 - h, 40].join(),
      `a cada ${h}: sem v no primeiro e no último ponto; sem a nos dois primeiros e nos dois últimos (${semV} / ${semA})`);
    conferir(Math.abs(L[3].r - Math.hypot(L[3].x, L[3].y)) < 1e-12, `a cada ${h}: r = √(x² + y²), a partir da origem`);
  }
  // ponto faltando no meio: as grandezas dos vizinhos que dependiam dele não existem
  const pos = new Map(); for (let i = 0; i <= 20; i++) if (i !== 10) pos.set(i, { x: i * i, y: 0 });
  const g = cinematica(pos, 1, 1);
  const semV = [...g.keys()].filter((i) => !Number.isFinite(g.get(i).v)), semA = [...g.keys()].filter((i) => !Number.isFinite(g.get(i).a));
  conferir(semV.join() === "0,9,11,20" && semA.join() === "0,1,8,9,11,12,19,20", `ponto 10 faltando: sem v em ${semV}; sem a em ${semA}`);
  // movimento harmônico: v com erro pequeno (diferença centrada, 30 pontos por período)
  const w = 2 * Math.PI, hp = new Map(); for (let i = 0; i <= 60; i++) hp.set(i, { x: Math.sin(w * i / 30), y: 0 });
  const gh = cinematica(hp, 1, 1 / 30);
  let eh = 0; for (const [i, q] of gh) if (Number.isFinite(q.vx)) eh = Math.max(eh, Math.abs(q.vx - w * Math.cos(w * i / 30)) / w);
  conferir(eh < 0.01, `movimento harmônico (30 pontos por período): erro relativo de v ${(eh * 100).toFixed(2)} %`);
  conferir(unidadeDe("x", "cm") === "cm" && unidadeDe("vy", "cm") === "cm/s" && unidadeDe("a", "u.a.") === "u.a./s²" && familia("ax") === "acel" && familia("r") === "pos",
    "unidades e famílias: cm, cm/s, u.a./s²");
  conferir(nomeTracker("vx") === "v_{x}" && nomeTracker("a") === "a" && FAMILIAS.vel.join() === "vx,vy,v", "nomes como no Tracker: v_{x}");
}

console.log(falhas ? `\n${falhas} falha(s).` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
