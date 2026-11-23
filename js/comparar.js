// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @file Comparar no gráfico: além do objeto ativo, o gráfico mostra as curvas de outros objetos escolhidos pelo
 * usuário, cada uma na sua cor, como o "Comparar com" do gráfico do Tracker (pedido do autor, 22/11/2026).
 *
 * O botão "comparar" fica ao lado de y(t)/x(t) (e vai com eles para a linha da alça e para o cabeçalho da janela do
 * gráfico, paisagem.js). Ele abre uma lista curta, fixa na tela, com uma caixa por objeto; o ativo está sempre no
 * gráfico. A escolha fica em S.comparar (nomes dos objetos) e vai no salvamento do vídeo (analise.js); um objeto
 * excluído sai dela (massas.js). A lista fecha num toque fora, no próprio botão, com Esc ou com o Voltar do Android (a
 * abertura entra no histórico, como as gavetas; um toque no ≡ ou na alça dos objetos não volta no histórico, para não
 * fechar a gaveta que o mesmo toque abre).
 */

import { persist } from "./analise.js";
import { drawPlot } from "./dados.js";
import { S } from "./estado.js";
import { IC } from "./icones.js";
import { objAtivo } from "./objetos.js";
import { $, esc } from "./util.js";

const btn = $("cmpBtn"), lista = $("cmpLista");
let aberta = false;
// botões que abrem uma gaveta com pushState no mesmo toque: um history.back() nosso ao mesmo tempo fecharia a gaveta
const ABREM_GAVETA = "#menuBtn, #pObjBtn";

/**
 * Atualiza o botão "comparar": quantos objetos estão sendo comparados (além do ativo) e o estado da lista.
 */
export function renderComparar() {
  const o = objAtivo(), n = S.objs.filter((x) => x !== o && S.comparar.has(x.nome)).length;
  btn.innerHTML = IC.comparar + (n ? `<span class="n">+${n}</span>` : "");
  btn.classList.toggle("on", n > 0);
  btn.setAttribute("aria-label", n ? `Comparar com outros objetos (${n} no gráfico)` : "Comparar com outros objetos");
  btn.disabled = !S.frames.length;
  if (aberta) montar();
}
/**
 * Monta a lista: uma linha por objeto (caixa, bolinha e nome); o ativo vem marcado e sem poder desmarcar.
 */
function montar() {
  const o = objAtivo();
  const linhas = S.objs.map((x, i) => {
    const eh = x === o, marcado = eh || S.comparar.has(x.nome);
    return `<label class="cmp-item"><input type="checkbox" data-cmp="${i}"${marcado ? " checked" : ""}${eh ? " disabled" : ""}><i class="dot" style="background:${x.cor}"></i>${esc(x.nome)}${eh ? ' <small>(ativo)</small>' : ""}</label>`;
  }).join("");
  lista.innerHTML = `<p class="cmp-t">${o ? `No gráfico, junto com ${o.tipo === "cm" ? "o" : "a"} ${esc(o.nome)}:` : "No gráfico:"}</p>`
    + (S.objs.length > 1 ? linhas : `${linhas}<p class="cmp-vazio">Crie outra massa ou um centro de massa para comparar.</p>`);
}
/**
 * Põe a lista logo abaixo do botão (ou acima, se não couber), dentro da tela.
 */
function posicionar() {
  if (!aberta) return;
  const r = btn.getBoundingClientRect(), w = lista.offsetWidth, h = lista.offsetHeight;
  const left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8));
  const top = r.bottom + 6 + h <= innerHeight - 8 ? r.bottom + 6 : Math.max(8, r.top - 6 - h);
  lista.style.left = left + "px"; lista.style.top = top + "px";
}
/**
 * Abre a lista (com uma entrada no histórico, para o Voltar fechá-la).
 */
function abrir() {
  if (aberta || !S.frames.length) return;
  aberta = true;
  history.pushState({ va: "comparar" }, "");
  montar();
  lista.hidden = false; btn.setAttribute("aria-expanded", "true");
  posicionar();
}
/**
 * Fecha a lista.
 * @param {boolean} [voltou=false] O histórico já voltou (Voltar do Android).
 * @param {boolean} [semVoltar=false] Não voltar no histórico (o mesmo toque vai abrir uma gaveta).
 */
function fechar(voltou = false, semVoltar = false) {
  if (!aberta) return;
  aberta = false;
  lista.hidden = true; btn.setAttribute("aria-expanded", "false");
  if (!voltou && history.state && history.state.va === "comparar") {
    if (semVoltar) history.replaceState(null, ""); else history.back();
  }
}

btn.addEventListener("click", () => { if (aberta) fechar(); else abrir(); });
lista.addEventListener("change", (e) => {
  const x = S.objs[Number(e.target.dataset.cmp)]; if (!x || x === objAtivo()) return;
  if (e.target.checked) S.comparar.add(x.nome); else S.comparar.delete(x.nome);
  persist(); renderComparar(); drawPlot();
});
// toque fora (nem na lista nem no botão): fecha, e o toque segue
document.addEventListener("pointerdown", (e) => {
  if (!aberta || lista.contains(e.target) || btn.contains(e.target)) return;
  fechar(false, !!e.target.closest?.(ABREM_GAVETA));
}, true);
document.addEventListener("keydown", (e) => { if (aberta && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); } }, true);
window.addEventListener("popstate", (e) => { if (aberta && !(e.state && e.state.va === "comparar")) fechar(true); });
// a diagramação mudou (girar, tela cheia): o botão mudou de lugar
document.addEventListener("va:antes-layout", () => fechar());
window.addEventListener("resize", () => requestAnimationFrame(posicionar));
