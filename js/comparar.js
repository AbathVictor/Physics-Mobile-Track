// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @file Comparar no gráfico: além do objeto ativo, o gráfico mostra as curvas de outros objetos escolhidos pelo
 * usuário, cada uma na sua cor, como o "Comparar com" do gráfico do Tracker (pedido do autor, 22/11/2026).
 *
 * O botão "comparar" fica ao lado do seletor da grandeza (e vai com ele para a linha da alça e para o cabeçalho da
 * janela do gráfico, paisagem.js). Ele abre uma lista suspensa (popup.js) com uma caixa por objeto; o ativo está
 * sempre no gráfico. A escolha fica em S.comparar (nomes dos objetos) e vai no salvamento do vídeo (analise.js); um
 * objeto excluído sai dela (massas.js).
 */

import { persist } from "./analise.js";
import { drawPlot } from "./dados.js";
import { S } from "./estado.js";
import { IC } from "./icones.js";
import { objAtivo } from "./objetos.js";
import { criarPopup } from "./popup.js";
import { $, esc } from "./util.js";

const btn = $("cmpBtn"), lista = $("cmpLista");

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
const pop = criarPopup(btn, lista, "comparar", montar);

/**
 * Atualiza o botão "comparar": quantos objetos estão sendo comparados (além do ativo) e, aberta, a lista.
 */
export function renderComparar() {
  const o = objAtivo(), n = S.objs.filter((x) => x !== o && S.comparar.has(x.nome)).length;
  btn.innerHTML = IC.comparar + (n ? `<span class="n">+${n}</span>` : "");
  btn.classList.toggle("on", n > 0);
  btn.setAttribute("aria-label", n ? `Comparar com outros objetos (${n} no gráfico)` : "Comparar com outros objetos");
  btn.disabled = !S.frames.length;
  if (pop.aberta()) montar();
}
lista.addEventListener("change", (e) => {
  const x = S.objs[Number(e.target.dataset.cmp)]; if (!x || x === objAtivo()) return;
  if (e.target.checked) S.comparar.add(x.nome); else S.comparar.delete(x.nome);
  persist(); renderComparar(); drawPlot();
});
