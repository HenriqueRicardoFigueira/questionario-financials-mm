# Configuração — planilha e Apps Script

## 1. Planilha

1. Acesse o Google Drive com **@madeiramadeira.com.br**.
2. Crie uma planilha (ex.: `Respostas — Financials`).
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/ESTE_ID/edit`.

## 2. Apps Script

1. Na planilha: **Extensões → Apps Script**.
2. Cole `google-apps-script/Code.gs`.
3. Substitua `COLE_O_ID_DA_SUA_PLANILHA_AQUI` pelo ID da planilha.
4. (Recomendado) Defina `API_SECRET` com uma senha longa aleatória.
5. **Implantar → Nova implantação → App da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
6. Copie a URL **`/exec`**.

## 3. Front-end (local)

Em `config.js`:

```javascript
window.PESQUISA_CONFIG = {
  surveyTitle: 'Pesquisa Financials MM',
  appsScriptUrl: 'https://script.google.com/a/macros/madeiramadeira.com.br/s/SEU_ID/exec',
  submitToken: 'MESMO_VALOR_DE_API_SECRET',
  logoUrl: ''
};
```

## 4. Testar localmente

1. Abra `index.html` (ou `python3 -m http.server 8765` na pasta do projeto).
2. Complete o questionário.
3. Verifique nova linha na aba **Respostas**.

## Vincular respondente (opcional)

```
https://seu-dominio/?customer_id=123&order_id=MM-456&utm_source=email
```

Colunas gravadas: `customer_id`, `email`, `order_id`, `utm_*`, `session_id`.

**Atenção:** parâmetros na URL podem ser alterados pelo usuário — use só como referência, não como autenticação.

## GitHub Pages

O repositório inclui o workflow `.github/workflows/deploy-pages.yml`, que gera `config.js` no deploy a partir de secrets (sem commitar tokens).

### 1. Secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Obrigatório | Valor |
|--------|-------------|-------|
| `APPS_SCRIPT_URL` | Sim | URL `/exec` do Apps Script |
| `SUBMIT_TOKEN` | Sim | Mesmo valor de `API_SECRET` em `Code.gs` |
| `SURVEY_TITLE` | Não | Título no cabeçalho (padrão: Pesquisa Financials MM) |
| `LOGO_URL` | Não | URL https de logo |

### 2. Ativar Pages (obrigatório antes do primeiro deploy)

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, escolha **GitHub Actions** (não “Deploy from branch”).
3. Salve. Se não fizer isso, o workflow falha com `Get Pages site failed`.

Se já falhou uma vez: ative Pages como acima e rode de novo em **Actions → Deploy GitHub Pages → Re-run all jobs**.

### 3. Publicar

```bash
git add .
git commit -m "Add survey and GitHub Pages deploy"
git push origin main
```

Acompanhe em **Actions**. Quando terminar, o site fica em:

`https://henriquericardofigueira.github.io/questionario-financials-mm/`

### 4. Testar em produção

1. Abra a URL do Pages.
2. Complete o questionário.
3. Confira nova linha na aba **Respostas** da planilha.

**Não** commite `config.js` — ele continua no `.gitignore` e é criado só no deploy.

## Respostas não aparecem na planilha?

Confira nesta ordem:

1. **`SPREADSHEET_ID` no Apps Script** (não no GitHub) — tem que ser o ID real da planilha, e você precisa **reimplantar** depois de alterar.
2. **`API_SECRET` = `SUBMIT_TOKEN`** — se um estiver preenchido e o outro diferente, o script rejeita com `unauthorized`.
3. **Logs do Apps Script** — no editor: **Execuções** (ícone relógio). Veja se o `doPost` rodou e se deu erro.
4. **Aba correta** — respostas vão na aba **Respostas** (criada automaticamente se não existir).
5. Faça **push** da correção do front (`Content-Type: text/plain`) e teste de novo — `application/json` costuma falhar no POST cross-origin para Apps Script.
