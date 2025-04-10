import { db } from "./firebase.js";
import {
  doc, getDoc, collection, getDocs, addDoc, Timestamp, query, orderBy, setDoc, deleteDoc
} from "firebase/firestore";

// 🔍 Pegar ID da URL
const params = new URLSearchParams(location.search);
const alunoId = params.get("id");

// Caches
const treinosCache = {};
const avaliacoesCache = {};

// 🔄 Dados do Aluno
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

// 🔄 Treinos
async function carregarTreinos() {
  const snap = await getDocs(collection(db, "trainings"));
  const list = document.getElementById("trainings-list");
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const t = docSnap.data();
    if (t.userId === alunoId) {
      const treinoId = docSnap.id;
      treinosCache[treinoId] = t;

      const li = document.createElement("li");
      const exs = Array.isArray(t.exercises)
        ? `<ul class="exercicios">${t.exercises.map(e => `<li>${e}</li>`).join("")}</ul>` : "";

      li.innerHTML = `
        <strong>${t.title}</strong><br>
        ${t.description}
        ${exs}
        <br>
        <button onclick="editarTreino('${treinoId}')">✏️ Editar</button>
        <button onclick="removerTreino('${treinoId}')">🗑️ Remover</button>
      `;
      list.appendChild(li);
    }
  });
}

window.handleAddTraining = async function () {
  const treinoId = document.getElementById("btn-adicionar-treino")?.getAttribute("data-id");

  const treinoData = {
    userId: alunoId,
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    exercises: document.getElementById("exercises").value.split(",").map(e => e.trim()),
    createdAt: new Date()
  };

  if (treinoId) {
    await setDoc(doc(db, "trainings", treinoId), treinoData, { merge: true });
    document.getElementById("btn-adicionar-treino").removeAttribute("data-id");
    document.getElementById("btn-adicionar-treino").innerText = "Adicionar";
  } else {
    await addDoc(collection(db, "trainings"), treinoData);
  }

  // Limpa campos
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("exercises").value = "";

  carregarTreinos();
};

window.editarTreino = function (treinoId) {
  const treino = treinosCache[treinoId];
  document.getElementById("title").value = treino.title;
  document.getElementById("description").value = treino.description;
  document.getElementById("exercises").value = treino.exercises.join(",");
  document.getElementById("btn-adicionar-treino").innerText = "Salvar Edição";
  document.getElementById("btn-adicionar-treino").setAttribute("data-id", treinoId);
};

window.removerTreino = async function (treinoId) {
  if (confirm("Tem certeza que deseja remover este treino?")) {
    await deleteDoc(doc(db, "trainings", treinoId));
    carregarTreinos();
  }
};

// 🔄 Avaliações
async function carregarAvaliacoes() {
  const q = query(collection(db, "evaluations"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const list = document.getElementById("evaluations-list");
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const e = docSnap.data();
    const avaliacaoId = docSnap.id;
    if (e.userId === alunoId) {
      avaliacoesCache[avaliacaoId] = e;
      const data = e.createdAt?.toDate().toLocaleDateString("pt-BR");
      const li = document.createElement("li");
      li.innerHTML = `
        ${e.peso}kg - ${e.gordura}% (${data})
        <br>
        <button onclick="editarAvaliacao('${avaliacaoId}')">✏️ Editar</button>
        <button onclick="removerAvaliacao('${avaliacaoId}')">🗑️ Remover</button>
      `;
      list.appendChild(li);
    }
  });
}

window.handleAddEvaluation = async function () {
  const avaliacaoId = document.getElementById("btn-adicionar-avaliacao")?.getAttribute("data-id");

  const dados = {
    userId: alunoId,
    peso: document.getElementById("peso").value,
    gordura: document.getElementById("gordura").value,
    createdAt: Timestamp.now()
  };

  if (avaliacaoId) {
    await setDoc(doc(db, "evaluations", avaliacaoId), dados, { merge: true });
    document.getElementById("btn-adicionar-avaliacao").removeAttribute("data-id");
    document.getElementById("btn-adicionar-avaliacao").innerText = "Adicionar";
  } else {
    await addDoc(collection(db, "evaluations"), dados);
  }

  document.getElementById("peso").value = "";
  document.getElementById("gordura").value = "";

  carregarAvaliacoes();
};

window.editarAvaliacao = function (avaliacaoId) {
  const e = avaliacoesCache[avaliacaoId];
  document.getElementById("peso").value = e.peso;
  document.getElementById("gordura").value = e.gordura;
  document.getElementById("btn-adicionar-avaliacao").innerText = "Salvar Edição";
  document.getElementById("btn-adicionar-avaliacao").setAttribute("data-id", avaliacaoId);
};

window.removerAvaliacao = async function (avaliacaoId) {
  if (confirm("Deseja remover esta avaliação?")) {
    await deleteDoc(doc(db, "evaluations", avaliacaoId));
    carregarAvaliacoes();
  }
};

// ⏳ Inicializar
carregarAluno();
carregarTreinos();
carregarAvaliacoes();
