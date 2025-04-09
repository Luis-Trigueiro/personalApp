import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Util para extrair o ID do aluno da URL
function getAlunoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const alunoId = getAlunoId();
const dadosAlunoDiv = document.getElementById("dados-aluno");

// 🔽 Buscar dados do aluno
async function carregarDadosDoAluno() {
  const docRef = doc(db, "users", alunoId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    dadosAlunoDiv.innerHTML = `
      <p><strong>Nome:</strong> ${data.nome}</p>
      <p><strong>Idade:</strong> ${data.idade}</p>
      <p><strong>Objetivo:</strong> ${data.objetivo}</p>
      <p><strong>Email:</strong> ${data.email}</p>
    `;
  }
}

// 🔽 Listar treinos do aluno
async function carregarTreinos() {
  const ref = collection(db, "users", alunoId, "treinos");
  const snapshot = await getDocs(ref);
  const ul = document.getElementById("trainings-list");
  ul.innerHTML = "";
  snapshot.forEach(doc => {
    const treino = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `<strong>${treino.title}</strong><br>${treino.description}<ul class="exercicios">${treino.exercises.map(e => `<li>${e}</li>`).join("")}</ul>`;
    ul.appendChild(li);
  });
}

// 🔽 Listar avaliações do aluno
async function carregarAvaliacoes() {
  const ref = collection(db, "users", alunoId, "avaliacoes");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const ul = document.getElementById("evaluations-list");
  ul.innerHTML = "";
  snapshot.forEach(doc => {
    const a = doc.data();
    const data = a.createdAt?.toDate().toLocaleDateString("pt-BR");
    const li = document.createElement("li");
    li.textContent = `${a.peso}kg - ${a.gordura}% (em ${data})`;
    ul.appendChild(li);
  });
}

// 🔼 Adicionar treino
window.handleAddTraining = async function () {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const exercises = document.getElementById("exercises").value.split(",").map(e => e.trim());

  await addDoc(collection(db, "users", alunoId, "treinos"), {
    title,
    description,
    exercises,
    createdAt: Timestamp.now()
  });

  await carregarTreinos();
};

// 🔼 Adicionar avaliação
window.handleAddEvaluation = async function () {
  const peso = document.getElementById("peso").value;
  const gordura = document.getElementById("gordura").value;

  await addDoc(collection(db, "users", alunoId, "avaliacoes"), {
    peso,
    gordura,
    createdAt: Timestamp.now()
  });

  await carregarAvaliacoes();
};

// Inicializar página
carregarDadosDoAluno();
carregarTreinos();
carregarAvaliacoes();
