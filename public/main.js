// importa auth e db já configurados
import { auth, db } from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// importa funções específicas da CDN
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

import {
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

import {
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";





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
  let avaliacoesAluno = [];
  let treinosAluno = [];



  const loading = document.getElementById("loading-screen");
  if (loading) loading.style.display = "flex";

  // esconde todas as seções
  if (userSection) userSection.style.display = "none";
  if (personalSection) personalSection.style.display = "none";
  if (alunoSection) alunoSection.style.display = "none";


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
      alert("Cadastro realizado com sucesso!");
    } catch (error) {
      let msg = "Erro ao registrar. ";
      switch (error.code) {
        case "auth/email-already-in-use":
          msg += "Este e-mail já está em uso.";
          break;
        case "auth/invalid-email":
          msg += "E-mail inválido.";
          break;
        case "auth/weak-password":
          msg += "A senha deve ter pelo menos 6 caracteres.";
          break;
        default:
          msg += error.message;
      }
      alert(msg);
    }
  };


  // Login
  window.handleLogin = async function () {
    try {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value.trim());
    } catch (error) {
      let msg = "Erro ao fazer login. ";
      switch (error.code) {
        case "auth/invalid-credential":
          msg += "Usuário ou senha incorreta.";
          break;
        default:
          msg += error.message;
      }
      alert(msg);
    }
  };


  // Logout
  window.handleLogout = async function () {
    await signOut(auth);
  };

  window.deletarContaAluno = async function () {
    const senha = document.getElementById("senha-exclusao-aluno").value.trim();

    if (!senha) {
      alert("Por favor, digite sua senha para excluir sua conta.");
      return;
    }

    const user = auth.currentUser;

    const credential = EmailAuthProvider.credential(user.email, senha);

    try {
      await reauthenticateWithCredential(user, credential);

      // Deleta o documento do Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // Deleta o usuário do Auth
      await deleteUser(user);

      alert("Conta excluída com sucesso.");
      location.reload();

    } catch (error) {
      let msg = "Erro ao excluir conta. ";
      if (error.code === "auth/wrong-password") {
        msg += "Senha incorreta.";
      } else if (error.code === "auth/too-many-requests") {
        msg += "Muitas tentativas. Tente novamente mais tarde.";
      } else {
        msg += error.message;
      }
      alert(msg);
    }
  };


  window.deletarPerfilComSenha = async function () {
    const senha = document.getElementById("senha-exclusao").value.trim();

    if (!senha) {
      alert("Por favor, insira sua senha para confirmar.");
      return;
    }

    const user = auth.currentUser;

    const credential = EmailAuthProvider.credential(user.email, senha);

    try {
      await reauthenticateWithCredential(user, credential);

      // Desassocia os alunos se for personal
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData.tipo === "personal" && Array.isArray(userData.alunos)) {
        for (const alunoId of userData.alunos) {
          await setDoc(doc(db, "users", alunoId), { personalId: null }, { merge: true });
        }
      }

      // Deleta o documento do Firestore
      await deleteDoc(doc(db, "users", user.uid));


      // Deleta o usuário do Auth
      await deleteUser(user);

      alert("Conta excluída com sucesso.");
      location.reload();

    } catch (error) {
      let msg = "Erro ao excluir conta. ";
      if (error.code === "auth/wrong-password") {
        msg += "Senha incorreta.";
      } else if (error.code === "auth/too-many-requests") {
        msg += "Muitas tentativas. Tente novamente mais tarde.";
      } else {
        msg += error.message;
      }
      alert(msg);
    }
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

    carregarAlunos(auth.currentUser.uid);

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

  async function carregarAlunos(userId) {
    const alunosLista = document.getElementById("alunos-lista");
    if (!alunosLista) return;

    const personalDocRef = doc(db, "users", userId);
    const personalSnap = await getDoc(personalDocRef);
    const personalData = personalSnap.data();

    const alunosIds = personalData.alunos || [];
    const alunosValidos = [];

    alunosLista.innerHTML = "";

    for (const id of alunosIds) {
      const alunoDoc = await getDoc(doc(db, "users", id));
      if (alunoDoc.exists()) {
        const aluno = alunoDoc.data();
        alunosValidos.push(id); // ainda é válido
        alunosLista.innerHTML += `
          <li>
            <a href="aluno-detalhes.html?id=${id}" class="aluno-link">${aluno.nome || aluno.email}</a>
            <button onclick="removerAluno('${id}')" class="btn-remover-aluno">❌ Remover</button>
          </li>
        `;
      }
    }

    // Atualiza a lista de alunos, removendo os que não existem mais
    if (JSON.stringify(alunosValidos) !== JSON.stringify(alunosIds)) {
      await setDoc(personalDocRef, { alunos: alunosValidos }, { merge: true });
    }
  }



  // Estado do usuário
  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        if (loginSection) loginSection.style.display = "block";
        if (userSection) userSection.style.display = "none";
        const loading = document.getElementById("loading-screen");
        if (loading) loading.style.display = "none";
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


        await carregarAlunos(user.uid);


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
      treinosAluno = trainings.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (trainingsList) {
        trainingsList.innerHTML = trainings.docs.map(doc => {
          const t = doc.data();
          const date = t.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "";

          const exercicios = Array.isArray(t.exercises)
            ? `<ul class="exercicios">${t.exercises.map(e => `
              <li><strong>${e.nome}</strong> – ${e.series}x${e.repeticoes} com ${e.carga}kg</li>
            `).join("")}</ul>` : "";

          return `
          <li>
            <strong>${t.title}</strong><br>
            ${t.description || ""}
            ${exercicios}
            <div style="margin-top:6px;font-size:0.85rem;color:#555;">
              Criado em: ${date}
            </div>
            <button onclick="exportarTreinoPDF('${doc.id}')">📄 Exportar Treino em PDF</button>

          </li>`;
        }).join("");
      }


      // Avaliações
      const evaluations = await getDocs(query(collection(db, "evaluations"), where("userId", "==", user.uid)));
      if (evaluationsList) {
        evaluationsList.innerHTML = evaluations.docs.map(doc => {
          const e = doc.data();
          const id = doc.id;
          const data = e.createdAt?.toDate?.().toLocaleDateString("pt-BR") || "-";

          return `
            <div class="avaliacao-card">
              <div><strong>${e.peso || '-'}kg – ${e.gordura || '-'}%</strong></div>
              <div>Registrado em: ${data}</div>
              <div style="font-size: 0.9rem; margin-top: 6px;">
                Altura: ${e.altura || '-'}m<br>
                Massa Muscular: ${e.massaMuscular || '-'}kg<br>
                Medidas: Peitoral ${e.peitoral || '-'}cm, Cintura ${e.cintura || '-'}cm, Quadril ${e.quadril || '-'}cm, Braço ${e.braco || '-'}cm, Coxa ${e.coxa || '-'}cm, Panturrilha ${e.panturrilha || '-'}cm<br>
                FC: ${e.frequenciaCardiaca || '-'} bpm, PA: ${e.pressaoArterial || '-'}, Flexibilidade: ${e.flexibilidade || '-'}cm<br>
                Condicionamento: ${e.condicionamento || '-'}<br>
                Objetivo: ${e.objetivoAtual || '-'}<br>
                Obs: ${e.observacoes || '-'}
              </div>
              <button onclick="exportarAvaliacaoPDF('${id}')">📄 Exportar Avaliação em PDF</button>
            </div>
          `;
        }).join("");

      }

      avaliacoesAluno = evaluations.docs.map(doc => ({ id: doc.id, ...doc.data() }));


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
      if (loading) loading.style.display = "none";
    } catch (err) {
      console.error("Erro no onAuthStateChanged:", err);
    } finally {
      const loading = document.getElementById("loading-screen");
      if (loading) loading.style.display = "none";
    }

  });
  window.exportarAvaliacaoPDF = function (avaliacaoId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const e = avaliacoesAluno.find(av => av.id === avaliacaoId);

    if (!e) return alert("Avaliação não encontrada.");

    let y = 20;
    doc.setFontSize(16);
    doc.text("Avaliação Física", 105, y, { align: "center" });
    y += 10;

    const campos = [
      ["Peso", e.peso],
      ["Altura", e.altura],
      ["Gordura", e.gordura],
      ["Massa Muscular", e.massaMuscular],
      ["Peitoral", e.peitoral],
      ["Cintura", e.cintura],
      ["Quadril", e.quadril],
      ["Braço", e.braco],
      ["Coxa", e.coxa],
      ["Panturrilha", e.panturrilha],
      ["Frequência Cardíaca", e.frequenciaCardiaca],
      ["Pressão Arterial", e.pressaoArterial],
      ["Flexibilidade", e.flexibilidade],
      ["Condicionamento", e.condicionamento],
      ["Objetivo Atual", e.objetivoAtual],
      ["Observações", e.observacoes]
    ];

    doc.setFontSize(12);
    campos.forEach(([label, valor]) => {
      if (valor) {
        doc.text(`${label}: ${valor}`, 15, y);
        y += 7;
      }
    });

    doc.save(`avaliacao-${avaliacaoId}.pdf`);
  };

  window.exportarTreinoPDF = function (treinoId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const t = treinosAluno.find(t => t.id === treinoId);

    if (!t) return alert("Treino não encontrado.");

    let y = 20;
    doc.setFontSize(16);
    doc.text(`Treino: ${t.title}`, 105, y, { align: "center" });
    y += 10;

    if (t.description) {
      doc.setFontSize(12);
      doc.text(`Descrição: ${t.description}`, 15, y);
      y += 10;
    }

    if (Array.isArray(t.exercises)) {
      doc.setFontSize(12);
      t.exercises.forEach(e => {
        doc.text(`• ${e.nome} – ${e.series}x${e.repeticoes} com ${e.carga}kg`, 15, y);
        y += 7;
      });
    }

    doc.save(`treino-${treinoId}.pdf`);
  };

  window.handleResetPassword = async function () {
    const emailField = document.getElementById("email");
    const email = emailField.value.trim();

    if (!email) {
      alert("Por favor, insira seu e-mail para redefinir a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Um link para redefinir sua senha foi enviado para o seu e-mail.");
    } catch (error) {
      let msg = "Erro ao enviar o e-mail de redefinição. ";
      if (error.code === "auth/user-not-found") {
        msg += "Este e-mail não está cadastrado.";
      } else if (error.code === "auth/invalid-email") {
        msg += "E-mail inválido.";
      } else {
        msg += error.message;
      }
      alert(msg);
    }
  };


});
