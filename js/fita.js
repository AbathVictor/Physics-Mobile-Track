// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @file Número da fita de calibração: na ferramenta Escala, um toque na etiqueta da fita (a distância, ou "digite a
 * distância") abre ali mesmo um campo para digitar a distância real, como no Tracker (pedido do autor, 22/11/2026).
 *
 * O campo é o mesmo valor do "Distância entre as pontas" do passo 3: ao confirmar, o valor vai para aquele campo e o
 * evento input dele faz o resto (sem lógica copiada). Confirma com Enter (o "concluído" do teclado) ou com um toque
 * fora; cancela com Esc ou com o Voltar do Android (a abertura entra no histórico, como as gavetas, para o Voltar não
 * sair do aplicativo). Deitado, o teclado do Android cobre a metade de baixo da tela e o Chrome não muda o tamanho da
 * página (armadilha 17): se o teclado cobriria o campo, ele sobe para o alto da área do vídeo.
 */

import { cv, rotuloDaFita } from "./desenho.js";
import { S } from "./estado.js";
import { $, clampF, parseNum, toast } from "./util.js";

const ed = $("fitaEd"), inp = $("fitaIn");
let aberto = false;
// botões que abrem uma gaveta com pushState no mesmo toque: um history.back() nosso ao mesmo tempo fecharia a gaveta
const ABREM_GAVETA = "#menuBtn, #pObjBtn";

/**
 * Diz se o campo da fita está aberto.
 * @returns {boolean} Aberto.
 */
export const fitaAberta = () => aberto;
/**
 * Diz se um ponto do canvas do vídeo cai na etiqueta da fita (com 8 px de folga para o dedo). Só vale na ferramenta
 * Escala: fora dela, a etiqueta não é guardada pelo desenho.
 * @param {number} x x em px do canvas.
 * @param {number} y y em px do canvas.
 * @returns {boolean} Caiu na etiqueta.
 */
export function tocouNoRotulo(x, y) {
  const r = rotuloDaFita(), m = 8;
  return !!r && x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;
}
/**
 * Abre o campo sobre a etiqueta da fita, com o valor atual selecionado e o teclado numérico.
 */
export function abrirFita() {
  if (aberto || !rotuloDaFita() || S.mode !== "escala") return;
  aberto = true;
  history.pushState({ va: "fita" }, "");
  inp.value = S.scale.len; inp.classList.remove("bad");
  $("fitaUn").textContent = S.scale.unit;
  ed.hidden = false;
  posicionar();
  inp.focus(); inp.select();
}
/**
 * Põe o campo sobre a etiqueta da fita, dentro da tela; se o teclado o cobriria (a área visível encolhe, o
 * visualViewport diz quanto), sobe para o alto da área do vídeo.
 */
function posicionar() {
  if (!aberto) return;
  const r = rotuloDaFita(), c = cv.getBoundingClientRect(), w = ed.offsetWidth, h = ed.offsetHeight;
  const cx = c.left + (r ? r.x + r.w / 2 : c.width / 2), cy = c.top + (r ? r.y + r.h / 2 : c.height / 2);
  const vv = window.visualViewport, vTopo = vv ? vv.offsetTop : 0, vAlt = vv ? vv.height : innerHeight;
  let top = cy - h / 2;
  if (top + h > vTopo + vAlt - 8) top = Math.max(vTopo + 8, c.top + 8);
  ed.style.left = clampF(cx - w / 2, 8, Math.max(8, innerWidth - w - 8)) + "px";
  ed.style.top = Math.max(vTopo + 4, top) + "px";
}
/**
 * Fecha o campo. Ao confirmar, um valor que não é número maior que zero não entra: com Enter o campo fica aberto
 * para corrigir; com um toque fora, o valor anterior continua. Campo vazio apaga a distância (escala genérica).
 * @param {"enter"|"fora"|"cancelar"|"voltou"} como Enter, toque fora, Esc, ou o Voltar (o histórico já voltou).
 * @param {boolean} [semVoltar=false] Não voltar no histórico (o mesmo toque vai abrir uma gaveta): a entrada da fita
 * fica sem efeito.
 */
function fechar(como, semVoltar = false) {
  if (!aberto) return;
  const v = inp.value.trim(), salvar = como === "enter" || como === "fora";
  const ruim = salvar && v !== "" && !(parseNum(v) > 0);
  if (ruim && como === "enter") { inp.classList.add("bad"); toast("Digite um número maior que zero, como 30 ou 12,5."); return; }
  if (ruim) toast("A distância não mudou: digite um número maior que zero.");
  // aberto = false antes de esconder: esconder tira o foco, e o blur chamaria fechar de novo
  aberto = false;
  ed.hidden = true;
  if (salvar && !ruim && v !== S.scale.len) { const s = $("scaleLen"); s.value = v; s.dispatchEvent(new Event("input")); }
  if (como !== "voltou" && history.state && history.state.va === "fita") {
    if (semVoltar) history.replaceState(null, ""); else history.back();
  }
}

inp.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); fechar("enter"); }
  else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar("cancelar"); }
});
inp.addEventListener("blur", () => fechar("fora"));
// toque fora: confirma (o toque segue para onde foi). O canvas do vídeo cancela o pointerdown (gestos.js), e o foco
// não sairia do campo sozinho
document.addEventListener("pointerdown", (e) => {
  if (!aberto || ed.contains(e.target)) return;
  fechar("fora", !!e.target.closest?.(ABREM_GAVETA));
}, true);
window.addEventListener("popstate", (e) => { if (aberto && !(e.state && e.state.va === "fita")) fechar("voltou"); });
// troca de ferramenta: confirma. Mudança de tamanho (teclado, girar): o campo acompanha; não fecha, porque em algum
// aparelho o teclado pode mudar o tamanho da página, e o campo fecharia ao abrir
document.addEventListener("va:modo", () => { if (S.mode !== "escala") fechar("fora"); });
window.visualViewport?.addEventListener("resize", () => requestAnimationFrame(posicionar));
window.addEventListener("resize", () => requestAnimationFrame(posicionar));
