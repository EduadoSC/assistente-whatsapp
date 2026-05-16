# 📲 Assistente de Lembretes via WhatsApp

![Deploy](https://img.shields.io/badge/deploy-railway-6B44FF?logo=railway)
![Node](https://img.shields.io/badge/node.js-20+-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/mysql-8.0+-4479A1?logo=mysql)
![Twilio](https://img.shields.io/badge/twilio-whatsapp-F22F46?logo=twilio)
![License](https://img.shields.io/badge/license-ISC-blue)

Um bot para WhatsApp que gerencia seus lembretes por mensagem de texto simples. Você escreve naturalmente e ele entende — sem comandos complicados, sem instalar nada.

> 💼 Projeto desenvolvido como portfólio. Veja o post no LinkedIn: [clique aqui](https://github.com/EduadoSC/assistente-whatsapp)

---

## ✨ Funcionalidades

| Ação | Exemplo |
|---|---|
| ✅ Criar lembrete | `me lembra amanhã às 9h de ligar pro João` |
| ✏️ Editar lembrete | `mudar ligar pro João pra 10h` |
| ❌ Cancelar lembrete | `cancelar ligar pro João` |
| 📋 Listar lembretes | `meus lembretes` |
| ⏰ Aviso automático | Bot manda mensagem no horário certo |
| 👥 Multi-usuário | Cada número tem seus próprios lembretes |

---

## 🛠️ Tecnologias

- **Node.js** + **Express** — servidor e rotas
- **MySQL** — armazenamento dos lembretes
- **Twilio** — integração com WhatsApp
- **node-cron** — disparo automático no horário certo
- **dotenv** — variáveis de ambiente
- **Railway** — hospedagem e banco de dados em produção

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 20+
- MySQL rodando localmente
- Conta no [Twilio](https://twilio.com) (gratuita)
- Conta no [ngrok](https://ngrok.com) (gratuita)

### 1. Clone o repositório

```bash
git clone https://github.com/EduadoSC/assistente-whatsapp.git
cd assistente-whatsapp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

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
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env`:

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

### 6. Exponha com ngrok

```bash
ngrok http 3000
```

Copie a URL gerada e configure no Twilio Sandbox Settings:
```
https://sua-url.ngrok-free.app/webhook
```

### 7. Ative o Twilio Sandbox

Em **Messaging → Try it out → Send a WhatsApp message**, mande a palavra de ativação indicada para `+1 415 523 8886`.

---

## ☁️ Deploy (Railway)

O projeto está em produção no Railway com banco MySQL incluso.

1. Suba o código no GitHub
2. Acesse [railway.app](https://railway.app) e conecte o repositório
3. Adicione um plugin **MySQL**
4. Configure as variáveis de ambiente:

```
MYSQL_URL = ${{ MySQL.MYSQL_URL }}
TWILIO_ACCOUNT_SID = ACxxx...
TWILIO_AUTH_TOKEN = xxx...
TWILIO_NUMBER = whatsapp:+14155238886
```

5. Gere o domínio público em **Settings → Networking → Generate Domain**
6. Use essa URL no Twilio como webhook

---

## ⚠️ Observações

- O Twilio Sandbox é gratuito e ideal para demonstrações
- Cada número precisa ativar o sandbox mandando `join <palavra>` uma vez
- O vínculo expira após 72 horas sem uso

---

## 📁 Estrutura do projeto

```
assistente-whatsapp/
├── server.js        # Servidor principal, rotas e cron
├── db.js            # Conexão com o banco de dados
├── .env.example     # Modelo de variáveis de ambiente
├── .gitignore
└── package.json
```

---

## 👤 Autor

**Eduardo Sales** — [LinkedIn](https://www.linkedin.com/in/eduardosales-91824b25b) · [GitHub](https://github.com/EduadoSC)
