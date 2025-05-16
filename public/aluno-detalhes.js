import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase.js";


const listaExercicios = [];
const previewList = document.getElementById("exercise-preview-list");
const params = new URLSearchParams(location.search);
const alunoId = params.get("id");

const treinosCache = {};
const avaliacoesCache = {};
const dadosDiv = document.getElementById("dados-aluno");

async function carregarAluno() {
  const snap = await getDoc(doc(db, "users", alunoId));
  const d = snap.data();
  dadosDiv.innerHTML = `
    <p><strong>Nome:</strong> ${d.nome}</p>
    <p><strong>Idade:</strong> ${d.idade}</p>
    <p><strong>Objetivo:</strong> ${d.objetivo}</p>
    <p><strong>Email:</strong> ${d.email}</p>
  `;
}

window.adicionarExercicio = function () {
  const nome = document.getElementById("exercise-name").value;
  const repeticoes = document.getElementById("exercise-reps").value;
  const series = document.getElementById("exercise-sets").value;
  const carga = document.getElementById("exercise-weight").value;

  if (!nome || !repeticoes || !series || !carga) {
    alert("Preencha todos os campos do exercício.");
    return;
  }

  const exercicio = {
    nome,
    repeticoes: parseInt(repeticoes),
    series: parseInt(series),
    carga: parseFloat(carga)
  };

  listaExercicios.push(exercicio);

  const li = document.createElement("li");
  li.innerText = `${nome} - ${series}x${repeticoes} (${carga}kg)`;
  previewList.appendChild(li);

  document.getElementById("exercise-name").value = "";
  document.getElementById("exercise-reps").value = "";
  document.getElementById("exercise-sets").value = "";
  document.getElementById("exercise-weight").value = "";
};

async function carregarTreinos() {
  const snap = await getDocs(collection(db, "trainings"));
  const list = document.getElementById("trainings-list");
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const t = docSnap.data();
    const id = docSnap.id;

    if (t.userId === alunoId) {
      treinosCache[id] = t;

      const li = document.createElement("li");

      const exercicios = Array.isArray(t.exercises)
        ? `<ul class="exercicios">` +
        t.exercises.map((e, idx) => `
            <li class="exercicio-item">
              <span><strong>${e.nome}</strong> – ${e.series}x${e.repeticoes} com ${e.carga}kg</span>
              <div class="exercise-actions">
                <button class="mini-btn" onclick="editarExercicio('${id}', ${idx})">✏️</button>
                <button class="mini-btn danger" onclick="removerExercicio('${id}', ${idx})">🗑️</button>
              </div>
            </li>
          `).join("") + `</ul>`
        : "";

      const data = t.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "";

      li.innerHTML = `
      <div class="treino-header">
        <div>
          <strong>${t.title}</strong><br>
          <span>${t.description || ""}</span>
        </div>
        <div class="exercise-actions">
          <button onclick="abrirEdicaoTreino('${id}')">✏️</button>
        </div>
      </div>
      <div id="form-edicao-treino-${id}"></div>
      ${exercicios}
      <button class="mini-btn add-ex-btn" onclick="abrirFormAdicionarExercicio('${id}')">➕ Adicionar Exercício</button>
      <div id="form-add-ex-${id}"></div>
      <div class="botoes-treino">
        <button onclick="removerTreino('${id}')">🗑️ Remover Treino</button>
        <button onclick="exportarTreinoPDF('${id}')">📄 Exportar PDF</button>
      </div>
      <div style="font-size: 0.85rem; color: #555; margin-top: 4px;">
        Criado em: ${data}
      </div>
    `;


      list.appendChild(li);
    }
  });
}

window.abrirFormAdicionarExercicio = function (treinoId) {
  const container = document.getElementById(`form-add-ex-${treinoId}`);
  container.innerHTML = `
    <div class="form-edit-exercicio">
      <input id="new-nome-${treinoId}" list="lista-exercicios" placeholder="Nome do exercício">
      <datalist id="lista-exercicios">
            <!-- Peito -->
            <option value="Supino Reto com Barra">
            <option value="Supino Inclinado com Halteres">
            <option value="Crucifixo no Banco Reto">
            <option value="Crossover no Cabo">
            <option value="Flexão de Braço">

              <!-- Costas -->
            <option value="Puxada na Frente na Barra Guiada">
            <option value="Remada Curvada com Barra">
            <option value="Remada Baixa no Cabo">
            <option value="Puxada na Barra Fixa">
            <option value="Pullover no Cabo">

              <!-- Pernas -->
            <option value="Agachamento Livre">
            <option value="Leg Press 45°">
            <option value="Cadeira Extensora">
            <option value="Mesa Flexora">
            <option value="Cadeira Abdutora">
            <option value="Avanço com Halteres">
            <option value="Stiff com Halteres">
            <option value="Panturrilha em Pé">
            <option value="Panturrilha Sentado">
            <option value="Agachamento Búlgaro">

              <!-- Ombros -->
            <option value="Desenvolvimento com Halteres">
            <option value="Elevação Lateral">
            <option value="Elevação Frontal">
            <option value="Remada Alta com Barra">
            <option value="Crucifixo Inverso no Peck Deck">

              <!-- Bíceps -->
            <option value="Rosca Direta com Barra">
            <option value="Rosca Alternada com Halteres">
            <option value="Rosca Concentrada">
            <option value="Rosca Scott na Máquina">
            <option value="Rosca Martelo">

              <!-- Tríceps -->
            <option value="Tríceps Pulley com Barra">
            <option value="Tríceps Testa com Barra">
            <option value="Tríceps Francês com Halteres">
            <option value="Tríceps Coice">
            <option value="Mergulho entre Bancos">

              <!-- Abdômen -->
            <option value="Abdominal Supra no Solo">
            <option value="Prancha Isométrica">
            <option value="Abdominal Infra com Elevação de Pernas">
            <option value="Abdominal na Corda">
            <option value="Abdominal Lateral com Peso">

              <!-- Cardio / Funcionais -->
            <option value="Esteira">
            <option value="Bicicleta Ergométrica">
            <option value="Elíptico">
            <option value="Pular Corda">
            <option value="Burpee">
            <option value="Escalador">
            <option value="Polichinelo">
          </datalist>
      <input id="new-reps-${treinoId}" placeholder="Repetições">
      <input id="new-sets-${treinoId}" placeholder="Séries">
      <input id="new-carga-${treinoId}" placeholder="Carga (kg)">
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button onclick="salvarNovoExercicio('${treinoId}')">💾 Salvar</button>
        <button onclick="cancelarNovoExercicio('${treinoId}')">❌ Cancelar</button>
      </div>
    </div>
  `;
};

window.salvarNovoExercicio = async function (treinoId) {
  const nome = document.getElementById(`new-nome-${treinoId}`).value.trim();
  const reps = parseInt(document.getElementById(`new-reps-${treinoId}`).value);
  const sets = parseInt(document.getElementById(`new-sets-${treinoId}`).value);
  const carga = parseFloat(document.getElementById(`new-carga-${treinoId}`).value);

  if (!nome || isNaN(reps) || isNaN(sets) || isNaN(carga)) {
    alert("Preencha corretamente todos os campos do exercício.");
    return;
  }


  const treinoRef = doc(db, "trainings", treinoId);
  const snap = await getDoc(treinoRef);
  const treino = snap.data();

  treino.exercises.push({ nome, repeticoes: reps, series: sets, carga });

  await setDoc(treinoRef, treino, { merge: true });
  carregarTreinos();
};

window.cancelarNovoExercicio = function (treinoId) {
  document.getElementById(`form-add-ex-${treinoId}`).innerHTML = "";
};

window.handleAddTraining = async function () {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title || !description || listaExercicios.length === 0) {
    alert("Preencha o título, a descrição e adicione pelo menos 1 exercício.");
    return;
  }

  const treinoData = {
    userId: alunoId,
    title,
    description,
    exercises: listaExercicios,
    createdAt: new Date()
  };

  const treinoId = document.getElementById("btn-adicionar-treino").getAttribute("data-id");

  if (treinoId) {
    await setDoc(doc(db, "trainings", treinoId), treinoData, { merge: true });
    document.getElementById("btn-adicionar-treino").removeAttribute("data-id");
    document.getElementById("btn-adicionar-treino").innerText = "Salvar Treino";
  } else {
    await addDoc(collection(db, "trainings"), treinoData);
  }

  const campos = [
    "exercise-sets", "exercise-reps", "exercise-weight", "exercise-name", "title", "description", "exercise-preview-list"
  ];

  campos.forEach(id => document.getElementById(id).value = "");

  document.querySelectorAll('#exercise-preview-list').forEach(item => item.textContent = "");
  document.querySelectorAll('#exercise-preview').forEach(item => item.textContent = "");

  const preview = document.querySelectorAll('#exercise-preview-list li');
  preview.forEach(item => {
    item.textContent = ""
  });


  carregarTreinos();
};


window.abrirEdicaoTreino = function (treinoId) {
  const t = treinosCache[treinoId];
  const container = document.getElementById(`form-edicao-treino-${treinoId}`);

  document.querySelectorAll(".form-edit-treino").forEach(f => f.remove());

  const form = document.createElement("div");
  form.className = "form-edit-treino";
  form.innerHTML = `
    <input id="edit-title-${treinoId}" value="${t.title}" placeholder="Título do treino">
    <input id="edit-desc-${treinoId}" value="${t.description || ''}" placeholder="Descrição do treino">
    <div class="botoes-inline">
      <button onclick="salvarEdicaoTreino('${treinoId}')">💾 Salvar</button>
      <button onclick="cancelarEdicaoTreino('${treinoId}')">❌ Cancelar</button>
    </div>
  `;
  container.appendChild(form);
};

window.salvarEdicaoTreino = async function (treinoId) {
  const title = document.getElementById(`edit-title-${treinoId}`).value;
  const description = document.getElementById(`edit-desc-${treinoId}`).value;

  await setDoc(doc(db, "trainings", treinoId), {
    title,
    description
  }, { merge: true });

  carregarTreinos();
};

window.cancelarEdicaoTreino = function (treinoId) {
  const container = document.getElementById(`form-edicao-treino-${treinoId}`);
  if (container) container.innerHTML = "";
};

window.removerTreino = async function (treinoId) {
  if (confirm("Tem certeza que deseja remover este treino?")) {
    await deleteDoc(doc(db, "trainings", treinoId));
    carregarTreinos();
  }
};

window.editarExercicio = function (treinoId, index) {
  const treino = treinosCache[treinoId];
  const e = treino.exercises[index];

  abrirModal({
    titulo: "Editar Exercício",
    campos: ["Nome", "Repetições", "Séries", "Carga (kg)"],
    valores: [e.nome, e.repeticoes, e.series, e.carga],
    onConfirmar: async ([nome, rep, sets, carga]) => {
      treino.exercises[index] = {
        nome,
        repeticoes: parseInt(rep),
        series: parseInt(sets),
        carga: parseFloat(carga)
      };
      await setDoc(doc(db, "trainings", treinoId), treino, { merge: true });
      carregarTreinos();
    }
  });
};


window.salvarExercicio = async function (treinoId, index) {
  const nome = document.getElementById(`edit-nome-${treinoId}-${index}`).value.trim();
  const reps = parseInt(document.getElementById(`edit-reps-${treinoId}-${index}`).value);
  const sets = parseInt(document.getElementById(`edit-sets-${treinoId}-${index}`).value);
  const carga = parseFloat(document.getElementById(`edit-carga-${treinoId}-${index}`).value);

  if (!nome || isNaN(reps) || isNaN(sets) || isNaN(carga)) {
    alert("Preencha corretamente todos os campos do exercício.");
    return;
  }


  const treinoRef = doc(db, "trainings", treinoId);
  const treinoSnap = await getDoc(treinoRef);
  const treino = treinoSnap.data();

  treino.exercises[index] = { nome, repeticoes: reps, series: sets, carga };

  await setDoc(treinoRef, treino, { merge: true });
  carregarTreinos();
};

window.cancelarEdicaoExercicio = function (btn) {
  const formDiv = btn.closest(".form-edit-exercicio");
  if (formDiv) formDiv.remove();
};

window.removerExercicio = async function (treinoId, index) {
  if (!confirm("Deseja remover este exercício?")) return;

  const treinoRef = doc(db, "trainings", treinoId);
  const treinoSnap = await getDoc(treinoRef);
  const treino = treinoSnap.data();

  treino.exercises.splice(index, 1);

  await setDoc(treinoRef, treino, { merge: true });
  carregarTreinos();
};

async function carregarAvaliacoes() {
  const q = query(collection(db, "evaluations"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const list = document.getElementById("evaluations-list");
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const e = docSnap.data();
    const id = docSnap.id;

    if (e.userId === alunoId) {
      avaliacoesCache[id] = e;
      const data = e.dataAvaliacao
        ? new Date(e.dataAvaliacao).toLocaleDateString("pt-BR")
        : e.createdAt?.toDate().toLocaleDateString("pt-BR");

      const li = document.createElement("li");
      li.classList.add("avaliacao-item");

      li.innerHTML = `
  <div class="avaliacao-bloco">
    <div class="peso-gordura">
      <strong>${e.peso}kg</strong> – ${e.gordura}%<br>
      <span class="data-avaliacao">📅 ${data}</span>
    </div>
    <div class="dados-completos">
      Altura: ${e.altura || "-"}m<br>
      Massa Muscular: ${e.massaMuscular || "-"}kg<br>
      <strong>Medidas:</strong><br>
      Peitoral: ${e.peitoral || "-"}cm, Cintura: ${e.cintura || "-"}cm, Quadril: ${e.quadril || "-"}cm<br>
      Braço: ${e.braco || "-"}cm, Coxa: ${e.coxa || "-"}cm, Panturrilha: ${e.panturrilha || "-"}cm<br>
      <strong>FC:</strong> ${e.frequenciaCardiaca || "-"} bpm, <strong>PA:</strong> ${e.pressaoArterial || "-"}<br>
      <strong>Flexibilidade:</strong> ${e.flexibilidade || "-"}cm<br>
      <strong>Condicionamento:</strong> ${e.condicionamento || "-"}<br>
      <strong>Objetivo:</strong> ${e.objetivoAtual || "-"}<br>
      <strong>Obs:</strong> ${e.observacoes || "-"}
    </div>
    <div class="evaluation-actions">
      <button onclick="editarAvaliacao('${id}')">✏️</button>
      <button onclick="removerAvaliacao('${id}')">🗑️</button>
      <button onclick="exportarAvaliacaoPDF('${id}')">📄</button>
    </div>
  </div>
`;

      list.appendChild(li);
    }
  });
}



window.editarAvaliacao = function (id) {
  const e = avaliacoesCache[id];

  const html = `
    <h3 id="modal-title">Editar Avaliação</h3>
    <input id="edit-peso" placeholder="Peso (kg)" value="${e.peso || ''}" />
    <input id="edit-altura" placeholder="Altura (m)" value="${e.altura || ''}" />
    <input id="edit-gordura" placeholder="% Gordura" value="${e.gordura || ''}" />
    <input id="edit-massaMuscular" placeholder="Massa Muscular (kg)" value="${e.massaMuscular || ''}" />

    <h4>📏 Medidas</h4>
    <input id="edit-peitoral" placeholder="Peitoral (cm)" value="${e.peitoral || ''}" />
    <input id="edit-cintura" placeholder="Cintura (cm)" value="${e.cintura || ''}" />
    <input id="edit-quadril" placeholder="Quadril (cm)" value="${e.quadril || ''}" />
    <input id="edit-braco" placeholder="Braço (cm)" value="${e.braco || ''}" />
    <input id="edit-coxa" placeholder="Coxa (cm)" value="${e.coxa || ''}" />
    <input id="edit-panturrilha" placeholder="Panturrilha (cm)" value="${e.panturrilha || ''}" />

    <h4>❤️ Parâmetros Vitais</h4>
    <input id="edit-frequenciaCardiaca" placeholder="Frequência Cardíaca" value="${e.frequenciaCardiaca || ''}" />
    <input id="edit-pressaoArterial" placeholder="Pressão Arterial" value="${e.pressaoArterial || ''}" />
    <input id="edit-flexibilidade" placeholder="Flexibilidade (cm)" value="${e.flexibilidade || ''}" />

    <input id="edit-condicionamento" placeholder="Nível de Condicionamento" value="${e.condicionamento || ''}" />
    <input id="edit-objetivoAtual" placeholder="Objetivo Atual" value="${e.objetivoAtual || ''}" />
    <input id="edit-dataAvaliacao" type="date" value="${e.dataAvaliacao || ''}" />
    <textarea id="edit-observacoes" placeholder="Observações">${e.observacoes || ''}</textarea>

    <div class="modal-buttons" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
      <button onclick="salvarAvaliacaoEditada('${id}')">💾 Salvar</button>
      <button onclick="fecharPopup()">❌ Cancelar</button>
    </div>
  `;

  abrirPopup(html);
};

window.salvarAvaliacaoEditada = async function (id) {
  const get = (id) => document.getElementById(id)?.value.trim() || "";

  const dados = {
    peso: get("edit-peso"),
    altura: get("edit-altura"),
    gordura: get("edit-gordura"),
    massaMuscular: get("edit-massaMuscular"),
    peitoral: get("edit-peitoral"),
    cintura: get("edit-cintura"),
    quadril: get("edit-quadril"),
    braco: get("edit-braco"),
    coxa: get("edit-coxa"),
    panturrilha: get("edit-panturrilha"),
    frequenciaCardiaca: get("edit-frequenciaCardiaca"),
    pressaoArterial: get("edit-pressaoArterial"),
    flexibilidade: get("edit-flexibilidade"),
    condicionamento: get("edit-condicionamento"),
    objetivoAtual: get("edit-objetivoAtual"),
    dataAvaliacao: get("edit-dataAvaliacao"),
    observacoes: get("edit-observacoes")
  };

  // validação mínima
  if (!dados.peso || !dados.gordura || !dados.altura || !dados.dataAvaliacao) {
    alert("Preencha peso, altura, gordura e data.");
    return;
  }

  await setDoc(doc(db, "evaluations", id), dados, { merge: true });
  fecharPopup();
  carregarAvaliacoes();
};


window.salvarAvaliacao = async function (id) {
  const peso = document.getElementById(`edit-peso-${id}`).value.trim();
  const gordura = document.getElementById(`edit-gordura-${id}`).value.trim();

  if (!peso || !gordura) {
    alert("Preencha todos os campos da avaliação.");
    return;
  }

  await setDoc(doc(db, "evaluations", id), {
    peso,
    gordura
  }, { merge: true });

  carregarAvaliacoes();
};


window.cancelarEdicaoAvaliacao = function () {
  document.querySelectorAll(".form-edit-avaliacao").forEach(f => f.style.display = "none");

  // limpeza dos campos
  const campos = [
    "peso", "altura", "gordura", "massaMuscular", "peitoral", "cintura", "quadril",
    "braco", "coxa", "panturrilha", "frequenciaCardiaca", "pressaoArterial",
    "flexibilidade", "condicionamento", "objetivoAtual", "dataAvaliacao", "observacoes"
  ];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // só manipula o botão se ele existir
  const btn = document.getElementById("btn-adicionar-avaliacao");
  if (btn) {
    btn.innerText = "Adicionar";
    btn.removeAttribute("data-id");
  }
};



window.handleAddEvaluation = async function () {
  const peso = document.getElementById("peso").value.trim();
  const altura = document.getElementById("altura").value.trim();
  const gordura = document.getElementById("gordura").value.trim();
  const massaMuscular = document.getElementById("massaMuscular").value.trim();
  const peitoral = document.getElementById("peitoral").value.trim();
  const cintura = document.getElementById("cintura").value.trim();
  const quadril = document.getElementById("quadril").value.trim();
  const braco = document.getElementById("braco").value.trim();
  const coxa = document.getElementById("coxa").value.trim();
  const panturrilha = document.getElementById("panturrilha").value.trim();
  const frequenciaCardiaca = document.getElementById("frequenciaCardiaca").value.trim();
  const pressaoArterial = document.getElementById("pressaoArterial").value.trim();
  const flexibilidade = document.getElementById("flexibilidade").value.trim();
  const condicionamento = document.getElementById("condicionamento").value.trim();
  const objetivoAtual = document.getElementById("objetivoAtual").value.trim();
  const dataAvaliacao = document.getElementById("dataAvaliacao").value;
  const observacoes = document.getElementById("observacoes").value.trim();

  // Validação de campos obrigatórios
  if (!peso || !altura || !dataAvaliacao) {
    alert("Por favor, preencha peso, altura, gordura corporal e data da avaliação.");
    return;
  }

  const dados = {
    userId: alunoId,
    peso,
    altura,
    gordura,
    massaMuscular,
    peitoral,
    cintura,
    quadril,
    braco,
    coxa,
    panturrilha,
    frequenciaCardiaca,
    pressaoArterial,
    flexibilidade,
    condicionamento,
    objetivoAtual,
    dataAvaliacao,
    observacoes,
    createdAt: Timestamp.now()
  };

  await addDoc(collection(db, "evaluations"), dados);

  // Limpar os campos após salvar
  const campos = [
    "peso", "altura", "gordura", "massaMuscular", "peitoral", "cintura", "quadril",
    "braco", "coxa", "panturrilha", "frequenciaCardiaca", "pressaoArterial", "flexibilidade",
    "condicionamento", "objetivoAtual", "dataAvaliacao", "observacoes"
  ];
  campos.forEach(id => document.getElementById(id).value = "");

  carregarAvaliacoes();
};



window.removerAvaliacao = async function (id) {
  if (confirm("Deseja remover esta avaliação?")) {
    await deleteDoc(doc(db, "evaluations", id));
    carregarAvaliacoes();
  }
};

window.abrirPopup = function (html) {
  const modal = document.getElementById("popup-modal");
  const body = document.getElementById("modal-body");
  body.innerHTML = html;
  modal.style.display = "flex";
};

window.fecharPopup = function () {
  document.getElementById("popup-modal").style.display = "none";
};

// Fechar ao clicar no X
document.getElementById("modal-close").onclick = fecharPopup;

// Fechar ao clicar fora do conteúdo
document.getElementById("popup-modal").onclick = function (e) {
  if (e.target.id === "popup-modal") fecharPopup();
};

let modalContext = {};

window.abrirModal = function ({ titulo, campos, valores, onConfirmar }) {
  document.getElementById("modal-title").innerText = titulo;
  modalContext.onConfirmar = onConfirmar;

  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`modal-input-${i + 1}`);
    if (campos[i]) {
      input.placeholder = campos[i];
      input.value = valores[i] || '';
      input.style.display = 'block';
    } else {
      input.style.display = 'none';
    }
  }

  document.getElementById("modal-overlay").style.display = "flex";
}

window.fecharModal = function () {
  document.getElementById("modal-overlay").style.display = "none";
  modalContext = {};
}

window.confirmarModal = function () {
  const valores = [];
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`modal-input-${i + 1}`);
    if (input.style.display !== 'none' && !input.value.trim()) {
      alert("Preencha todos os campos.");
      return;
    }
    valores.push(input.value.trim());
  }

  if (modalContext.onConfirmar) {
    modalContext.onConfirmar(valores);
    fecharModal();
  }
}


window.gerarPDFTreinos = async function () {
  const { jsPDF } = window.jspdf;
  const document = new jsPDF();
  let y = 20;

  document.setFont("helvetica", "bold");
  document.setFontSize(16);

  const snap = await getDoc(doc(db, "users", alunoId));
  const d = snap.data();
  document.text(`Treinos do Aluno: ${d.nome}`, 15, y);
  y += 10;

  for (const [id, treino] of Object.entries(treinosCache)) {
    const data = treino.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "";
    const titulo = treino.title || "Sem título";
    const desc = treino.description || "";

    // Título e descrição do treino
    document.setFont("helvetica", "bold");
    document.setFontSize(13);
    document.text(`${titulo} – ${desc}`, 15, y);
    y += 7;

    document.setFont("helvetica", "normal");
    document.setFontSize(12);

    for (const ex of treino.exercises || []) {
      const nome = ex.nome || "";
      const series = ex.series || "";
      const reps = ex.repeticoes || "";
      const carga = ex.carga || "";
      document.text(`• ${nome}: ${series}x${reps} com ${carga}kg`, 18, y);
      y += 6;
    }

    y += 8;

    if (y > 270) {
      document.addPage();
      y = 20;
    }
  }

  await salvarPDFMobile(document, "treinos.pdf");

};


window.gerarPDFAvaliacoes = async function () {
  const { jsPDF } = window.jspdf;
  const document = new jsPDF();
  let y = 15;

  document.setFont("helvetica", "bold");
  document.setFontSize(18);

  const snap = await getDoc(doc(db, "users", alunoId));
  const d = snap.data();
  document.text(`Avaliações do Aluno: ${d.nome}`, 105, y, { align: "center" });

  y += 10;

  for (const [id, a] of Object.entries(avaliacoesCache)) {
    const data = a.dataAvaliacao || new Date().toLocaleDateString("pt-BR");

    document.setDrawColor(0);
    document.setFillColor(230, 230, 230); // cinza claro
    document.roundedRect(10, y - 2, 190, 8, 2, 2, 'F');

    document.setFontSize(12);
    document.setTextColor(0, 0, 0);
    document.text(`${data}`, 12, y + 4);
    y += 10;

    const campos = [
      ["Peso", a.peso],
      ["Altura", a.altura],
      ["Gordura", a.gordura],
      ["Massa Muscular", a.massaMuscular],
      ["Peitoral", a.peitoral],
      ["Cintura", a.cintura],
      ["Quadril", a.quadril],
      ["Braço", a.braco],
      ["Coxa", a.coxa],
      ["Panturrilha", a.panturrilha],
      ["FC", a.frequenciaCardiaca],
      ["PA", a.pressaoArterial],
      ["Flexibilidade", a.flexibilidade],
      ["Condicionamento", a.condicionamento],
      ["Objetivo", a.objetivoAtual],
      ["Observações", a.observacoes],
    ];

    document.setFont("helvetica", "normal");
    campos.forEach(([label, valor]) => {
      if (valor) {
        document.text(`${label}:`, 15, y);
        document.text(`${valor}`, 55, y);
        y += 7;
      }
    });

    y += 5;

    if (y > 270) {
      document.addPage();
      y = 15;
    }
  }

  await salvarPDFMobile(document, "avaliacoes.pdf");

};

window.exportarTreinoPDF = async function (id) {
  const { jsPDF } = window.jspdf;
  const treino = treinosCache[id];
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text(`Treino: ${treino.title}`, 15, y);
  y += 8;
  if (treino.description) {
    doc.setFontSize(12);
    doc.text(`Descrição: ${treino.description}`, 15, y);
    y += 10;
  }

  treino.exercises.forEach(e => {
    doc.text(`• ${e.nome}: ${e.series}x${e.repeticoes} com ${e.carga}kg`, 15, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  await salvarPDFMobile(doc, `treino-${treino.title}.pdf`);
};

window.exportarAvaliacaoPDF = async function (id) {
  const { jsPDF } = window.jspdf;
  const a = avaliacoesCache[id];
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Avaliação Física", 15, y);
  y += 10;

  const campos = [
    ["Data", a.dataAvaliacao || ""],
    ["Peso", a.peso],
    ["Altura", a.altura],
    ["% Gordura", a.gordura],
    ["Massa Muscular", a.massaMuscular],
    ["Peitoral", a.peitoral],
    ["Cintura", a.cintura],
    ["Quadril", a.quadril],
    ["Braço", a.braco],
    ["Coxa", a.coxa],
    ["Panturrilha", a.panturrilha],
    ["FC", a.frequenciaCardiaca],
    ["PA", a.pressaoArterial],
    ["Flexibilidade", a.flexibilidade],
    ["Condicionamento", a.condicionamento],
    ["Objetivo", a.objetivoAtual],
    ["Observações", a.observacoes],
  ];

  doc.setFontSize(12);
  campos.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}: ${valor}`, 15, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
  });

  await salvarPDFMobile(doc,`avaliacao-${a.dataAvaliacao || "aluno"}.pdf`);
};


async function salvarPDFMobile(doc, nomeArquivo = "documento.pdf") {
  const pdfBytes = doc.output('arraybuffer');

  // Cria Blob manualmente
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

  // 2. Converte o Blob para base64
  const base64Data = await blobToBase64(pdfBlob);

  const { Filesystem, Share } = Capacitor.Plugins;

  await Filesystem.writeFile({
    path: nomeArquivo,
    data: base64Data,
    directory: 'DOCUMENTS',
    recursive: true
  });

  const fileUri = await Filesystem.getUri({
    path: nomeArquivo,
    directory: 'DOCUMENTS'
  });

  await Share.share({
    title: nomeArquivo,
    text: 'Confira o PDF gerado.',
    url: fileUri.uri,
    dialogTitle: 'Compartilhar PDF'
  });
}


function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]; // remove o prefixo data:application/pdf;base64,
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}



function enviarPorWhatsApp(blob, filename) {
  const reader = new FileReader();
  reader.onload = function () {
    const base64 = reader.result.split(",")[1];
    const link = `https://api.whatsapp.com/send?text=Aqui está o PDF do aluno:`;

    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.click();
  };
  reader.readAsDataURL(blob);
}




// Inicialização
carregarAluno();
carregarTreinos();
carregarAvaliacoes();
