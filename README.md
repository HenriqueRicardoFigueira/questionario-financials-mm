# questionario-financials-mm

Questionário estilo chat (como [pesquisa-mm-servicos](https://github.com/Biadpessoa/pesquisa-mm-servicos)), com perguntas configuráveis e respostas na sua planilha Google (conta MadeiraMadeira).

## Estrutura

| Arquivo | O que faz |
|---------|-----------|
| **`questions.js`** | **Edite aqui** — suas perguntas e mensagens finais |
| `config.js` | URL do Apps Script, título, token (copie de `config.example.js`) |
| `index.html` | Página do questionário |
| `js/survey-engine.js` | Motor do chat (não precisa alterar) |
| `google-apps-script/Code.gs` | Backend que grava na planilha |

## Começar rápido

```bash
cd ~/Documents/projetos/questionario-financials-mm
cp config.example.js config.js   # se ainda não tiver config.js
```

1. Edite **`questions.js`** com suas perguntas.
2. Siga **`SETUP.md`** para conectar a planilha Google.
3. Abra `index.html` no navegador ou publique no GitHub Pages (passo a passo em **`SETUP.md`**).

## Tipos de pergunta

```javascript
{ type: 'single', opts: ['A', 'B', 'Outro'] }
{ type: 'multi',  opts: ['A', 'B'], max: 3 }
{ type: 'text',   ph: 'Digite...' }
{ type: 'scale',  min: 0, max: 10, l0: 'Baixo', l10: 'Alto' }
```

Cada pergunta com resposta salva precisa de `key: 'q1'`, `key: 'q2'`, etc.

## Segurança

Veja [SECURITY.md](SECURITY.md) para riscos conhecidos e boas práticas.
