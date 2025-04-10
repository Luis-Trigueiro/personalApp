import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  query,
  where
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const loginSection = document.getElementById("login-section");
  const userSection = document.getElementById("user-section");
  const personalSection = document.getElementById("personal-section");
  const alunoSection = document.getElementById("aluno-section");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const nome = document.getElementById("nome");
  const idade = document.getElementById("idade");
  const objetivo = document.getElementById("objetivo");
  const title = document.getElementById("title");
  const description = document.getElementById("description");
  const exercises = document.getElementById("exercises");
  const alunoId = document.getElementById("aluno-id");
  const alunoIdEval = document.getElementById("aluno-id-eval");
  const peso = document.getElementById("peso");
  const gordura = document.getElementById("gordura");
  const trainingsList = document.getElementById("trainings-list");
  const evaluationsList = document.getElementById("evaluations-list");
  const alunosLista = document.getElementById("alunos-lista");
  const searchEmail = document.getElementById("search-email");
  const alunoEncontrado = document.getElementById("aluno-encontrado");


  // Registro
  window.handleRegister = async function () {
    const regEmail = document.getElementById("reg-email").value.trim();
    const regPassword = document.getElementById("reg-password").value.trim();
    const tipoUsuario = document.querySelector('input[name="tipo-usuario"]:checked')?.value;
    const nome = document.getElementById("nome").value.trim();
    const idade = document.getElementById("idade").value.trim();
    const objetivo = document.getElementById("objetivo")?.value.trim(); // Pode estar oculto

    // 🛑 Verificação de campos obrigatórios
    if (!regEmail || !regPassword || !nome || !idade || !tipoUsuario || (tipoUsuario === "aluno" && !objetivo)) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;

      const userData = {
        email: user.email,
        nome,
        idade,
        tipo: tipoUsuario
      };

      if (tipoUsuario === "aluno") {
        userData.objetivo = objetivo;
      }

      await setDoc(doc(db, "users", user.uid), userData);
    } catch (error) {
      console.error("Erro ao registrar:", error);
      alert("Erro ao registrar: " + error.message);
    }
  };


  // Login
  window.handleLogin = async function () {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  };

  // Logout
  window.handleLogout = async function () {
    await signOut(auth);
  };

  // Adicionar treino
  window.handleAddTraining = async function () {
    await addDoc(collection(db, "trainings"), {
      userId: alunoId.value,
      title: title.value,
      description: description.value,
      exercises: exercises.value.split(",").map(e => e.trim()),
      createdAt: new Date()
    });
  };

  // Adicionar avaliação
  window.handleAddEvaluation = async function () {
    await addDoc(collection(db, "evaluations"), {
      userId: alunoIdEval.value,
      peso: peso.value,
      gordura: gordura.value,
      createdAt: new Date()
    });
  };

  // Buscar aluno
  window.buscarAlunoPorEmail = async function () {
    const q = query(collection(db, "users"), where("email", "==", searchEmail.value));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const aluno = snapshot.docs[0];
      alunoId.value = aluno.id;
      alunoIdEval.value = aluno.id;
      alunoEncontrado.innerText = `Aluno encontrado: ${aluno.data().nome || aluno.data().email}`;
    } else {
      alunoEncontrado.innerText = "Aluno não encontrado.";
    }
  };

  // Associar aluno
  window.associarAluno = async function () {
    const alunoEmail = document.getElementById("email-aluno-associar").value;
    const personal = auth.currentUser;

    const q = query(collection(db, "users"), where("email", "==", alunoEmail));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const alunoDoc = snap.docs[0];
      const alunoId = alunoDoc.id;

      await setDoc(doc(db, "users", alunoId), { personalId: personal.uid }, { merge: true });

      const personalDocRef = doc(db, "users", personal.uid);
      const personalSnap = await getDoc(personalDocRef);
      const personalData = personalSnap.data();

      const alunosAtualizados = personalData.alunos || [];
      if (!alunosAtualizados.includes(alunoId)) {
        alunosAtualizados.push(alunoId);
        await setDoc(personalDocRef, { alunos: alunosAtualizados }, { merge: true });
      }

      document.getElementById("aluno-associado-msg").innerText = "Aluno associado com sucesso!";
    } else {
      document.getElementById("aluno-associado-msg").innerText = "Aluno não encontrado.";
    }
  };


  window.removerAluno = async function (alunoId) {
    if (!confirm("Deseja realmente remover este aluno da sua lista?")) return;

    const user = auth.currentUser;

    // Atualiza o aluno: remove o personalId
    await setDoc(doc(db, "users", alunoId), {
      personalId: null
    }, { merge: true });

    // Atualiza o personal: remove o aluno da lista
    const personalDocRef = doc(db, "users", user.uid);
    const personalSnap = await getDoc(personalDocRef);
    const personalData = personalSnap.data();

    const novaLista = (personalData.alunos || []).filter(id => id !== alunoId);
    await setDoc(personalDocRef, { alunos: novaLista }, { merge: true });

    // Recarrega a lista
    location.reload();
  };

  // Salvar perfil
  window.salvarPerfil = async function () {
    const nome = document.getElementById("perfil-nome").value;
    const idade = document.getElementById("perfil-idade").value;
    const objetivo = document.getElementById("perfil-objetivo").value;
    const user = auth.currentUser;

    await setDoc(doc(db, "users", user.uid), {
      nome,
      idade,
      objetivo
    }, { merge: true });

    document.getElementById("perfil-msg").innerText = "Perfil atualizado com sucesso!";
    setTimeout(() => {
      document.getElementById("perfil-msg").innerText = "";
    }, 3000);
  };

  // Estado do usuário
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (loginSection) loginSection.style.display = "block";
      if (userSection) userSection.style.display = "none";
      return;
    }

    if (loginSection) loginSection.style.display = "none";
    if (userSection) userSection.style.display = "block";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (userData.tipo === "personal") {
      if (personalSection) personalSection.style.display = "block";
      if (alunoSection) alunoSection.style.display = "none";
      document.getElementById("boas-vindas-personal").innerText = `👋 Bem-vindo(a), ${userData.nome || "Personal"}!`;

      document.querySelector('.accordion-header[data-section="buscar"]').parentElement.style.display = "none";
      document.querySelector('.accordion-header[data-section="treino"]').parentElement.style.display = "none";
      document.querySelector('.accordion-header[data-section="avaliacao"]').parentElement.style.display = "none";


      const alunosPromises = (userData.alunos || []).map(async (id) => {
        const alunoDoc = await getDoc(doc(db, "users", id));
        const d = alunoDoc.data();
        return {
          nome: d.nome || d.email,
          id
        };
      });


      const alunosList = await Promise.all(alunosPromises);
      alunosLista.innerHTML = alunosList.map(({ nome, id }) => `
  <li>
    <a href="aluno-detalhes.html?id=${id}" class="aluno-link">${nome}</a>
    <button onclick="removerAluno('${id}')" class="btn-remover-aluno">❌ Remover</button>
  </li>
`).join("");




    } else if (userData.tipo === "aluno") {
      if (alunoSection) alunoSection.style.display = "block";
      if (personalSection) personalSection.style.display = "none";

      const boasVindas = document.getElementById("boas-vindas-msg");
      if (boasVindas) boasVindas.innerHTML = `Bem vindo <strong>${userData.nome || "aluno"}</strong>.`;

      document.getElementById("perfil-nome").value = userData.nome || "";
      document.getElementById("perfil-idade").value = userData.idade || "";
      document.getElementById("perfil-objetivo").value = userData.objetivo || "";
      document.getElementById("perfil-email").value = user.email || "";

      if (userData.personalId) {
        const personalDoc = await getDoc(doc(db, "users", userData.personalId));
        const personal = personalDoc.data();
        document.getElementById("personal-info").innerText =
          `Seu personal: ${personal?.nome || personal?.email}`;
      } else {
        document.getElementById("personal-info").innerText =
          "Você ainda não está associado a um personal.";
      }
    }

    // Treinos
    const trainings = await getDocs(query(collection(db, "trainings"), where("userId", "==", user.uid)));
    if (trainingsList) {
      trainingsList.innerHTML = trainings.docs.map(doc => {
        const t = doc.data();
        const date = t.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "";
        const exercicios = Array.isArray(t.exercises)
          ? `<ul class="exercicios">${t.exercises.map(e => `<li>${e}</li>`).join("")}</ul>` : "";

        return `
          <li>
            <strong>${t.title}</strong><br>
            ${t.description}
            ${exercicios}
            <div style="margin-top:6px;font-size:0.85rem;color:#555;">
              Criado em: ${date}
            </div>
          </li>`;
      }).join("");
    }

    // Avaliações
    const evaluations = await getDocs(query(collection(db, "evaluations"), where("userId", "==", user.uid)));
    if (evaluationsList) {
      evaluationsList.innerHTML = evaluations.docs.map(doc => {
        const e = doc.data();
        const date = e.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "";
        return `<li>${e.peso}kg - ${e.gordura}%<br><span style="font-size:0.85rem;color:#555;">Registrado em: ${date}</span></li>`;
      }).join("");
    }

    // Histórico textual
    const historicoList = document.getElementById("historico-avaliacoes");
    if (historicoList) {
      historicoList.innerHTML = evaluations.docs.map(doc => {
        const e = doc.data();
        const data = e.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "sem data";
        return `<li>📅 ${data} - Peso: ${e.peso}kg - Gordura: ${e.gordura}%</li>`;
      }).join("");
    }
    const loading = document.getElementById("loading-screen");
    if (loading) loading.style.display = "none";

  });
});
