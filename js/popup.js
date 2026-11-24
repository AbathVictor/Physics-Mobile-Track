// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @file Lista suspensa presa a um botão (comparar no gráfico, família da grandeza do gráfico): abre logo abaixo do
 * botão (ou acima, se não couber), dentro da tela, e fecha num toque fora, no próprio botão, com Esc ou com o Voltar
 * do Android. A abertura entra no histórico, como as gavetas, para o Voltar não sair do aplicativo; um toque no ≡ ou na
 * alça dos objetos não volta no histórico (replaceState), para não fechar a gaveta que o mesmo toque abre.
 */

// botões que abrem uma gaveta com pushState no mesmo toque: um history.back() nosso ao mesmo tempo fecharia a gaveta
const ABREM_GAVETA = "#menuBtn, #pObjBtn";

/**
 * Liga uma lista suspensa a um botão.
 * @param {HTMLElement} btn O botão que abre e fecha a lista.
 * @param {HTMLElement} lista A lista (fixa na tela, fora dos contêineres que a cortariam).
 * @param {string} nome Nome da entrada no histórico (history.state.va).
 * @param {function(): void} montar Monta o conteúdo da lista ao abrir.
 * @returns {{abrir: function(): void, fechar: function(): void, aberta: function(): boolean, posicionar: function(): void}}
 * Os controles da lista.
 */
export function criarPopup(btn, lista, nome, montar) {
  let aberta = false;
  /**
   * Põe a lista logo abaixo do botão, alinhada à direita dele (ou acima, se não couber), dentro da tela.
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
    if (aberta || btn.disabled) return;
    aberta = true;
    history.pushState({ va: nome }, "");
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
    if (!voltou && history.state && history.state.va === nome) {
      if (semVoltar) history.replaceState(null, ""); else history.back();
    }
  }
  btn.addEventListener("click", () => { if (aberta) fechar(); else abrir(); });
  // toque fora (nem na lista nem no botão): fecha, e o toque segue
  document.addEventListener("pointerdown", (e) => {
    if (!aberta || lista.contains(e.target) || btn.contains(e.target)) return;
    fechar(false, !!e.target.closest?.(ABREM_GAVETA));
  }, true);
  document.addEventListener("keydown", (e) => { if (aberta && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); } }, true);
  window.addEventListener("popstate", (e) => { if (aberta && !(e.state && e.state.va === nome)) fechar(true); });
  // a diagramação mudou (girar, tela cheia): o botão mudou de lugar
  document.addEventListener("va:antes-layout", () => fechar());
  window.addEventListener("resize", () => requestAnimationFrame(posicionar));
  return { abrir, fechar, aberta: () => aberta, posicionar };
}
