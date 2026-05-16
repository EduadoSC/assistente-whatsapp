# 📲 Assistente de Lembretes via WhatsApp

Um bot para WhatsApp que gerencia seus lembretes por mensagem de texto simples. Você escreve naturalmente e ele entende — sem comandos complicados.

---

## ✨ Funcionalidades

| Ação | Exemplo |
|---|---|
| Criar lembrete | `me lembra amanhã às 9h de ligar pro João` |
| Listar lembretes | `meus lembretes` |
| Editar lembrete | `mudar ligar pro João pra 10h` |
| Cancelar lembrete | `cancelar ligar pro João` |
| Aviso automático | Bot manda mensagem no horário certo ⏰ |

---

## 🛠️ Tecnologias

- **Node.js** + **Express** — servidor e rotas
- **MySQL** — armazenamento dos lembretes
- **Twilio** — integração com WhatsApp
- **node-cron** — disparo automático no horário certo
- **dotenv** — variáveis de ambiente

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js instalado
- MySQL rodando
- Conta no [Twilio](https://twilio.com) (gratuita)
- Conta no [ngrok](https://ngrok.com) (gratuita)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/assistente-whatsapp.git
cd assistente-whatsapp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Crie o banco e a tabela no MySQL:

```sql
CREATE DATABASE assistente;

USE assistente;

CREATE TABLE lembretes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL,
    tarefa VARCHAR(255) NOT NULL,
    hora TIME NOT NULL,
    data DATE NOT NULL,
    enviado BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_lembretes_numero ON lembretes (numero);
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com seus dados:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=assistente

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_NUMBER=whatsapp:+14155238886
```

> As credenciais do Twilio ficam em [console.twilio.com](https://console.twilio.com)

### 5. Suba o servidor

```bash
node server.js
```

### 6. Exponha o servidor com ngrok

```bash
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok-free.app`) e configure no Twilio.

### 7. Configure o Twilio Sandbox

1. Acesse **Messaging → Try it out → Send a WhatsApp message**
2. Em **Sandbox Settings**, cole sua URL no campo **"When a message comes in"**:
   ```
   https://sua-url.ngrok-free.app/webhook
   ```
3. Ative o sandbox mandando a mensagem indicada pelo Twilio para `+1 415 523 8886`

---

## ☁️ Deploy (Railway)

Para deixar o bot online 24/7 sem precisar do computador ligado:

1. Suba o código no GitHub
2. Acesse [railway.app](https://railway.app) e conecte o repositório
3. Adicione as variáveis de ambiente do `.env` nas configurações do projeto
4. Use a URL gerada pelo Railway no lugar do ngrok no Twilio

---

## ⚠️ Observações

- O Twilio Sandbox é gratuito e ideal para demonstrações
- Cada número precisa ativar o sandbox mandando `join <palavra>` uma vez
- O vínculo do sandbox expira após 72 horas sem uso

---

## 📁 Estrutura do projeto

```
assistente-whatsapp/
├── server.js       # Servidor principal, rotas e cron
├── db.js           # Conexão com o banco de dados
├── .env.example    # Modelo de variáveis de ambiente
├── .gitignore
└── package.json
```
