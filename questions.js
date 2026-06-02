/**
 * Questionário: Experiência — Antecipação de Recebíveis
 * Edite msgs, opções e keys conforme necessário.
 */

window.PESQUISA_QUESTIONS = [
  {
    msgs: [
      'Olá, parceiro. 👋',
      'Estamos trabalhando para aprimorar nossos serviços financeiros e gostaríamos de ouvir a sua opinião real sobre o processo de antecipação de recebíveis.',
      'Este questionário leva menos de 2 minutos e suas respostas são fundamentais para os nossos próximos lançamentos.'
    ],
    action: { type: 'single', opts: ['Vamos lá', 'Pode começar'] }
  },

  {
    key: 'q1',
    msgs: ['Qual é o modelo da sua parceria atual com a MadeiraMadeira?'],
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
    msgs: [
      'Em uma escala de 1 a 5, quão satisfeito você está com a experiência geral do processo atual de antecipação?'
    ],
    action: {
      type: 'single',
      opts: [
        '1 – Muito insatisfeito',
        '2 – Insatisfeito',
        '3 – Neutro',
        '4 – Satisfeito',
        '5 – Muito satisfeito'
      ]
    }
  },

  {
    key: 'q4',
    msgs: [
      'Qual das seguintes etapas exige mais esforço ou gera mais dúvidas na sua rotina de antecipação?',
      'Selecione até 2 opções.'
    ],
    action: {
      type: 'multi',
      max: 2,
      opts: [
        'Fazer login e navegar por portais diferentes',
        'Entender o saldo real que está disponível para antecipar',
        'Compreender as taxas aplicadas e o valor líquido final',
        'O tempo de espera entre a solicitação e o depósito do dinheiro',
        'Realizar a conciliação do extrato (bater o que foi pago com as notas)',
        'Nenhuma das opções (O processo atual atende perfeitamente à minha empresa)'
      ]
    }
  },

  {
    key: 'q5',
    msgs: [
      'Se a simulação e a contratação de antecipações estivessem disponíveis através de uma conta oficial e segura no WhatsApp, qual seria o seu nível de interesse em utilizar esse canal?'
    ],
    action: {
      type: 'single',
      opts: [
        '1 – Nenhum interesse (Prefiro manter exclusivamente via Portal Web)',
        '2 – Pouco interesse',
        '3 – Neutro',
        '4 – Interessado',
        '5 – Muito interessado'
      ]
    }
  },

  {
    key: 'q6',
    msgs: [
      'Qual é o fator principal que influenciaria a sua decisão de adotar ou não o WhatsApp para antecipações?'
    ],
    action: {
      type: 'single',
      opts: [
        'A praticidade de simular o saldo sem precisar acessar um navegador de internet',
        'Preocupação com a segurança da informação e validação de quem está operando',
        'A facilidade de passar a operação para a equipe de campo/operacional do celular',
        'A preferência cultural e corporativa de resolver finanças apenas por computadores',
        'Outro'
      ]
    }
  }
];

window.PESQUISA_END = {
  botMessages: [
    'Perfeito, isso foi tudo! 🎉',
    'Muito obrigado por compartilhar sua experiência conosco.'
  ],
  emoji: '💬',
  title: 'Obrigado, parceiro!',
  text: 'Suas respostas vão nos ajudar a evoluir a antecipação de recebíveis e os próximos lançamentos dos serviços financeiros da MadeiraMadeira.'
};
