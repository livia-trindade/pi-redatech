class CorretorRedacao {
  constructor() {
    this.redacoes = {
      exemplos: []
    };
    this.init();
  }

  async init() {
    try {
      await this.carregarRedacoes();
      console.log("Redações carregadas com sucesso");
    } catch (error) {
      console.error("Erro ao carregar redações:", error);
    }
  }

  async carregarRedacoes() {
    const response = await fetch("redacoes.json");
    if (!response.ok) throw new Error("Erro ao carregar redacoes.json");
    const dados = await response.json();
    this.redacoes = dados;
  }

  formatarResposta(resposta) {
    let textoFormatado = resposta
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/~~/g, '')
      .replace(/```/g, '')
      .replace(/`/g, '')
      .replace(/---+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<\/?[^>]+(>|$)/g, '');

    textoFormatado = textoFormatado
      .replace(/(Nota Final: \d+\/1000)/, '===== $1 =====\n\n')
      .replace(/(Detalhamento por Competência:)/, '\n$1\n\n')
      .replace(/(Competência [IVXLCDM]+ \(.*?\): \d+\/200)/g, '\n$1\n')
      .replace(/(Pontos Fortes:|Ajustes:)/g, '\n$1\n')
      .replace(/(Recomendações para Melhoria:|Observação Final:)/g, '\n\n$1\n\n')
      .replace(/(\d+\.)\s/g, '\n$1 ')
      .replace(/\n{3,}/g, '\n\n');

    return textoFormatado.trim();
  }

  async corrigirRedacao() {
    const tema = document.getElementById("tema").value.trim();
    const redacao = document.getElementById("redacao").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    const resultadoContainer = document.getElementById("resultado-container");

    if (!tema || !redacao) {
      resultadoDiv.innerText = "Por favor, preencha o tema e a redação.";
      resultadoContainer.style.display = "block";
      return;
    }

    resultadoDiv.innerText = "Corrigindo, aguarde...";
    resultadoContainer.style.display = "block";
    this.toggleLoading(true);

    try {
      const prompt = this.criarPrompt(tema, redacao);
      const respostaBruta = await this.enviarParaAPI(prompt);
      const respostaFormatada = this.formatarResposta(respostaBruta);

      resultadoDiv.innerText = respostaFormatada || "Não houve resposta da IA.";
      resultadoContainer.style.display = "block";
    } catch (erro) {
      resultadoDiv.innerText = "Erro ao processar correção: " + erro.message;
      resultadoContainer.style.display = "block";
    } finally {
      this.toggleLoading(false);
    }
  }

  criarPrompt(tema, redacao) {
    const exemplos = this.redacoes.exemplos.map(ex => `Tema: ${ex.tema}\nNota: ${ex.nota}\nTexto: ${ex.texto}`).join('\n\n');

    return `Você é um avaliador especializado em redações do ENEM. Sua tarefa é avaliar o texto com base nas 5 competências oficiais do exame, atribuindo uma nota de 0 a 1000 e fornecendo um feedback detalhado.

REGRAS GERAIS:
1. Se o texto tiver menos de 7 linhas ou fugir completamente ao tema, atribua 0 em todas as competências.
2. A redação deve estar no formato dissertativo-argumentativo, com 4 parágrafos bem definidos: introdução, desenvolvimento 1, desenvolvimento 2 e conclusão.
3. Reduções de nota devem ocorrer sempre que houver falhas estruturais, incoerência, falta de profundidade ou detalhamento insuficiente, mesmo que a gramática seja boa.

REQUISITOS DE CADA PARTE:

INTRODUÇÃO:
- Deve apresentar contextualização com repertório sociocultural relevante e produtivo (não apenas citado, mas explicado e relacionado ao tema).
- Deve conter problematização clara.
- Deve indicar de forma explícita ou implícita os tópicos que serão abordados nos dois desenvolvimentos.
- Se faltar qualquer desses elementos ou se o repertório for usado superficialmente, reduzir competências II e III.

DESENVOLVIMENTO 1 e 2:
- Devem aprofundar exatamente o que foi indicado na introdução.
- Devem conter repertório sociocultural relevante e analisado, não apenas citado.
- Argumentos precisam ser claros, lógicos e bem encadeados, apresentando causas, consequências ou exemplos.
- Falta de correspondência entre introdução e desenvolvimento deve reduzir competências II e III.
- Uso de repertório sem explicação ou análise crítica deve limitar a competência III a no máximo 120 pontos.

CONCLUSÃO:
- Deve conter: Agente, Ação, Modo/Meio, Efeito/Finalidade e Detalhamento específico e plausível.
- O detalhamento não pode ser genérico; deve explicar pelo menos um elemento da proposta.
- Se faltar qualquer elemento ou se a proposta for vaga, reduzir competência V para no máximo 120 pontos.

AVALIAÇÃO POR COMPETÊNCIA:

Competência I (Norma Culta):
0 = Não segue norma culta.
40 = Domínio precário, erros graves frequentes.
80 = Muitos desvios.
120 = Alguns desvios relevantes.
160 = Poucos desvios.
200 = Excelente domínio, sem erros significativos.

Competência II (Compreensão da Proposta):
0 = Fuga ao tema.
40 = Tangencia o tema.
80 = Estrutura fraca.
120 = Argumentação previsível.
160 = Boa argumentação e repertório.
200 = Argumentação consistente, repertório produtivo, ligação clara entre introdução e desenvolvimento.

Competência III (Seleção e Organização de Argumentos):
0 = Sem relação ao tema.
40 = Pouca relação ou incoerência.
80 = Ideias desorganizadas.
120 = Ideias relevantes, mas pouco aprofundadas.
160 = Ideias bem relacionadas e com indícios de autoria.
200 = Ideias consistentes, organizadas, com análise crítica e autoria clara.

Competência IV (Coesão e Coerência):
0 = Sem ligação entre as partes.
40 = Conectores precários.
80 = Coesão fraca.
120 = Coesão mediana.
160 = Boa coesão.
200 = Coesão excelente, conectores variados e fluidez total.

Competência V (Proposta de Intervenção):
0 = Ausente ou desconectada do tema.
40 = Vaga ou sem ligação.
80 = Pouco articulada.
120 = Completa, mas genérica.
160 = Completa e coerente.
200 = Completa, detalhada, específica e plausível.

IMPORTANTE:
- Não atribuir 200 pontos em nenhuma competência se houver ao menos uma falha significativa.
- Penalizar falta de análise profunda, repetição de ideias ou uso superficial de repertórios.
- Penalizar conclusões genéricas ou com detalhamento insuficiente.
- O uso de exemplos e repertórios deve sempre estar conectado à tese e desenvolvido com clareza.

Exemplos de Redações Nota 1000:
${exemplos}

Tema: ${tema}

Redação do Usuário:
${redacao}`;
  }

  async enviarParaAPI(prompt) {
    const resposta = await fetch("https://redatech-backend.vercel.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: "Você é um corretor de redações especializado no ENEM." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!resposta.ok) throw new Error("Erro na API");
    const dados = await resposta.json();
    return dados.choices?.[0]?.message?.content;
  }

  toggleLoading(loading) {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = loading ? "inline" : "none";
    }
  }

  baixarPDF() {
    const resultado = document.getElementById("resultado").innerText.trim();
    const turmaInput = document.getElementById("turma");
    const alunoInput = document.getElementById("aluno");

    const turma = turmaInput ? turmaInput.value.trim() : null;
    const aluno = alunoInput ? alunoInput.value.trim() : null;
    const tema = document.getElementById("tema").value.trim();

    if (!resultado || resultado.toLowerCase().includes("aguarde")) {
      alert("Nenhum resultado disponível para exportar.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const hoje = new Date().toLocaleDateString("pt-BR");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Avaliação da Redação - ENEM", 10, 10);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);

    let infoLine = `Data: ${hoje} | Tema: ${tema}`;
    if (turma) infoLine = `Turma: ${turma} | ` + infoLine;
    if (aluno) infoLine = `Aluno: ${aluno} | ` + infoLine;
    doc.text(infoLine, 10, 18);

    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text(`Tema: ${tema}`, 10, 26);

    doc.setFont("Helvetica", "normal");
    const linhas = doc.splitTextToSize(resultado, 180);
    let y = 35;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 0; i < linhas.length; i++) {
      if (y > pageHeight - 10) {
        doc.addPage();
        y = 10;
      }
      doc.text(linhas[i], 10, y);
      y += lineHeight;
    }

    let nomeArquivo;
    if (turma && aluno) {
      nomeArquivo = `Correcao_${aluno}_${turma}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    } else {
      nomeArquivo = `Correcao_${tema}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }

    doc.save(`${nomeArquivo}.pdf`);
  }
} // <== VERIFIQUE SE ESTA LINHA ESTÁ NO FINAL MESMO!!

document.addEventListener('DOMContentLoaded', function () {
  const corretor = new CorretorRedacao();
  window.corretor = corretor;

  const btnCorrigir = document.getElementById('btnCorrigir');
  const btnBaixar = document.getElementById('btnBaixar');

  if (btnCorrigir) {
    btnCorrigir.addEventListener('click', () => corretor.corrigirRedacao());
  }

  if (btnBaixar) {
    btnBaixar.addEventListener('click', () => corretor.baixarPDF());
  }
});
