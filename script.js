class CorretorRedacao {
  constructor() {
    this.redacoes = {
      notas1000: "",
      variadas: ""
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
    return `Você é um assistente especializado em correção de redações do ENEM. Sua tarefa é avaliar a redação do usuário com base nas 5 competências oficiais do exame, fornecendo um feedback detalhado e atribuindo uma nota de 0 a 1000.
Se a redação tiver menos de 7 linhas, a nota será 0 em todas as competências. E se não tiver nada a ver com o tema, a nota também será 0, mesmo se a gramática estiver correta.
Competência I: Domínio da Norma Culta da Língua Portuguesa
- Avalie a gramática, a estrutura sintática e a adequação ao registro formal.
- Critérios de Pontuação:  
  - 0: Desconhecimento da modalidade escrita formal.  
  - 40: Domínio precário, com desvios frequentes.  
  - 80: Domínio insuficiente, com muitos desvios.  
  - 120: Domínio mediano, com alguns desvios.  
  - 160: Bom domínio, com poucos desvios.  
  - 200: Excelente domínio, sem desvios significativos.  

Competência II: Compreensão da Proposta de Redação
- Avalie se o candidato compreendeu o tema e a estrutura dissertativo-argumentativa.  
- Critérios de Pontuação:  
  - 0: Fuga ao tema ou inadequação à estrutura.  
  - 40: Tangenciamento do tema ou domínio precário da estrutura.  
  - 80: Cópia dos textos motivadores ou domínio insuficiente da estrutura.  
  - 120: Argumentação previsível e domínio mediano da estrutura.  
  - 160: Argumentação consistente e bom domínio da estrutura.  
  - 200: Argumentação consistente, repertório produtivo e excelente domínio da estrutura.  

Competência III: Seleção e Organização de Argumentos
- Avalie a capacidade de selecionar, relacionar e interpretar informações em defesa de um ponto de vista.  
- Critérios de Pontuação:  
  - 0: Informações irrelevantes ou sem defesa de um ponto de vista.  
  - 40: Informações pouco relacionadas ao tema ou incoerentes.  
  - 80: Informações limitadas aos textos motivadores ou desorganizadas.  
  - 120: Informações relevantes, mas pouco organizadas.  
  - 160: Informações bem relacionadas e com indícios de autoria.  
  - 200: Informações consistentes, organizadas e com autoria clara.  

Competência IV: Coesão e Coerência Textual
- Avalie a articulação entre as partes do texto, o uso de conectores e a estrutura lógica.  
- Critérios de Pontuação:  
  - 0: Ausência de articulação entre as partes do texto.  
  - 40: Articulação precária.  
  - 80: Articulação insuficiente, com muitas inadequações.  
  - 120: Articulação mediana, com algumas inadequações.  
  - 160: Boa articulação e repertório diversificado de conectivos.  
  - 200: Articulação excelente e repertório variado de conectivos.  

Competência V: Proposta de Intervenção
- Avalie a solução apresentada para o problema abordado, considerando respeito aos direitos humanos.  
- Critérios de Pontuação:  
  - 0: Proposta ausente ou desconectada do tema.  
  - 40: Proposta vaga ou precária.  
  - 80: Proposta insuficiente e sem articulação com a discussão.  
  - 120: Proposta mediana e articulada com a discussão.  
  - 160: Proposta bem elaborada e coerente.  
  - 200: Proposta detalhada, bem desenvolvida e articulada com o texto.

Redações Nota 1000:
${this.redacoes.notas1000}

Redações Variadas:
${this.redacoes.variadas}

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

  if (!resultado || resultado.includes("aguarde") || resultado.includes("Aguardando")) {
    alert("Nenhum resultado disponível para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" }); 
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFont("Times", ""); 
  doc.setFontSize(14);
  doc.text("Avaliação da Redação - ENEM", margin, 20);

  doc.setFontSize(10);
  let infoLine = `Data: ${hoje} | Tema: ${tema}`;
  if (turma && aluno) {
    infoLine = `Aluno: ${aluno} | Turma: ${turma} | ${infoLine}`;
  }
  doc.text(infoLine, margin, 28);

  doc.setFontSize(12);

  const linhas = doc.splitTextToSize(resultado, maxWidth);
  let y = 40;

  for (let i = 0; i < linhas.length; i++) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(linhas[i], margin, y);
    y += 7; 
  }

  let nomeArquivo;
  if (turma && aluno) {
    nomeArquivo = `Correcao_${aluno}_${turma}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  } else {
    nomeArquivo = `Correcao_${tema}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  }

  doc.save(`${nomeArquivo}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
  window.corretor = new CorretorRedacao();
});

document.addEventListener('DOMContentLoaded', () => {
  window.corretor = new CorretorRedacao();
});
