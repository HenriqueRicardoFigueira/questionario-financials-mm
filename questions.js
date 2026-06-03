/**
 * Questionário: Antecipação de Recebíveis — 6 perguntas
 * Edite msgs, opções e keys conforme necessário.
 */

window.PESQUISA_QUESTIONS = [
  {
    key: 'q1',
    label: 'Perfil',
    msgs: [
      'Olá! 👋 Sou o assistente de pesquisa da MadeiraMadeira. Vou te fazer 6 perguntas rápidas sobre o processo de antecipação. Pode levar menos de 3 minutos!',
      'Primeiro: qual é o modelo da sua parceria atual com a MadeiraMadeira?'
    ],
    action: {
      type: 'single',
      opts: [
        'Fornecedor de Produtos (1P)',
        'Seller do Marketplace (3P)',
        'Transportadora / Operação de Logística (LOG)'
      ]
    }
  },

  {
    key: 'q2',
    label: 'Frequência de uso',
    msgs: [
      'Com que frequência você acessa os nossos portais para consultar ou realizar antecipações?'
    ],
    action: {
      type: 'single',
      opts: [
        'Diariamente',
        'Semanalmente',
        'Mensalmente (nos períodos de repasse/fechamento)',
        'Raramente ou apenas em casos de emergência de caixa'
      ]
    }
  },

  {
    key: 'q3',
    label: 'Satisfação atual',
    msgs: [
      'Em uma escala de 1 a 5, qual é o seu nível de satisfação com a experiência geral do processo atual de antecipação?'
    ],
    action: {
      type: 'scale',
      min: 1,
      max: 5,
      confirm: true,
      l0: '1 Muito insatisfeito',
      l10: '5 Muito satisfeito',
      scaleLabels: {
        1: 'Muito insatisfeito',
        2: 'Insatisfeito',
        3: 'Neutro',
        4: 'Satisfeito',
        5: 'Muito satisfeito'
      }
    }
  },

  {
    key: 'q4',
    label: 'Mapeamento de dores',
    msgs: [
      'Qual das etapas abaixo exige mais esforço ou gera mais dúvidas na sua rotina de antecipação? Selecione até 2 opções.'
    ],
    action: {
      type: 'multi',
      max: 2,
      opts: [
        'Fazer login e navegar por portais diferentes',
        'Entender o saldo real disponível para antecipar',
        'Compreender as taxas e o valor líquido final',
        'O tempo de espera entre solicitação e depósito',
        'Conciliação do extrato (bater pagamentos com notas)',
        'Nenhuma — o processo atual atende perfeitamente'
      ]
    }
  },

  {
    key: 'q5',
    label: 'Interesse no WhatsApp',
    msgs: [
      'Se a simulação e contratação de antecipações estivessem disponíveis via WhatsApp oficial e seguro da MadeiraMadeira, qual seria seu nível de interesse?'
    ],
    action: {
      type: 'scale',
      min: 1,
      max: 5,
      confirm: true,
      l0: '1 Nenhum interesse',
      l10: '5 Muito interessado',
      scaleLabels: {
        1: 'Nenhum interesse',
        2: 'Pouco interesse',
        3: 'Neutro',
        4: 'Interessado',
        5: 'Muito interessado'
      }
    }
  },

  {
    key: 'q6',
    label: 'Fator de decisão',
    msgs: [
      'Por último: qual é o fator principal que influenciaria sua decisão de adotar (ou não) o WhatsApp para antecipações?'
    ],
    action: {
      type: 'single',
      confirm: true,
      outro: 'Outro motivo',
      opts: [
        'Praticidade de simular sem abrir navegador',
        'Preocupação com segurança e validação de identidade',
        'Facilidade de delegar a operação ao time de campo',
        'Preferência por resolver finanças apenas no computador',
        'Outro motivo'
      ]
    }
  }
];

window.PESQUISA_END = {
  showSummary: true,
  summaryTitle: 'Resumo das suas respostas',
  botMessages: [
    'Perfeito, isso foi tudo! 🎉',
    'Muito obrigado por compartilhar sua experiência conosco.'
  ],
  emoji: '💬',
  title: 'Obrigado, parceiro!',
  text: 'Suas respostas vão nos ajudar a evoluir a antecipação de recebíveis e os próximos lançamentos dos serviços financeiros da MadeiraMadeira.'
};
