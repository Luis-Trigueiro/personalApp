import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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
      <input id="new-nome-${treinoId}" placeholder="Nome">
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

  location.reload();
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
      const data = e.createdAt?.toDate().toLocaleDateString("pt-BR");
      const li = document.createElement("li");
      li.classList.add("avaliacao-item");
      li.innerHTML = `
        <div><strong>${e.peso}kg</strong> – ${e.gordura}% (${data})</div>
        <div class="exercise-actions">
          <button onclick="editarAvaliacao('${id}')">✏️</button>
          <button onclick="removerAvaliacao('${id}')">🗑️</button>
        </div>
        <div id="form-edit-avaliacao-${id}" class="form-edit-avaliacao" style="display:none;"></div>
      `;
      list.appendChild(li);
    }
  });
}


window.editarAvaliacao = function (id) {
  const a = avaliacoesCache[id];

  abrirModal({
    titulo: "Editar Avaliação",
    campos: ["Peso (kg)", "% Gordura"],
    valores: [a.peso, a.gordura],
    onConfirmar: async ([peso, gordura]) => {
      await setDoc(doc(db, "evaluations", id), {
        peso,
        gordura
      }, { merge: true });
      carregarAvaliacoes();
    }
  });
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
  document.getElementById("peso").value = "";
  document.getElementById("gordura").value = "";
  const btn = document.getElementById("btn-adicionar-avaliacao");
  btn.innerText = "Adicionar";
  btn.removeAttribute("data-id");
};


window.handleAddEvaluation = async function () {
  const peso = document.getElementById("peso").value.trim();
  const gordura = document.getElementById("gordura").value.trim();

  if (!peso || !gordura) {
    alert("Preencha todos os campos da avaliação.");
    return;
  }

  const dados = {
    userId: alunoId,
    peso,
    gordura,
    createdAt: Timestamp.now()
  };

  await addDoc(collection(db, "evaluations"), dados);

  document.getElementById("peso").value = "";
  document.getElementById("gordura").value = "";

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



// Inicialização
carregarAluno();
carregarTreinos();
carregarAvaliacoes();
