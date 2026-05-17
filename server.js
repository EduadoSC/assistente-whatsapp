require("dotenv").config();
const pool = require("./db");
const express = require("express");
const cron = require("node-cron");
const twilio = require("twilio");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Twilio envia form-urlencoded

// ─── Twilio ───────────────────────────────────────────────────────────────────

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function enviarMensagem(numero, texto) {
    try {
        await twilioClient.messages.create({
            from: process.env.TWILIO_NUMBER,        // whatsapp:+14155238886
            to: numero,                              // whatsapp:+55119999999
            body: texto
        });
        console.log(`Mensagem enviada para ${numero}`);
    } catch (erro) {
        console.error("Erro ao enviar mensagem Twilio:", erro.message);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extrairLembrete(texto) {
    const frase = texto.toLowerCase();
    const data = interpretarData(frase);

    // linha do match
    const horaEncontrada = frase.match(/\b\d{1,2}:\d{2}h?\b|\b\d{1,2}h\b/);
    let hora = horaEncontrada ? horaEncontrada[0] : null;

    if (hora) {
        hora = hora.replace(/h$/, ""); // remove só o 'h' do final
        if (/^\d{1,2}$/.test(hora)) hora = hora.padStart(2, "0") + ":00"; // ex: "9" → "09:00"
        if (/^\d{1,2}:\d{2}$/.test(hora)) hora = hora.padStart(5, "0");   // ex: "9:00" → "09:00"
    }

    const tarefa = frase
        .replace(/\bme lembra\b/g, "")
        .replace(/\bmudar\b/g, "")
        .replace(/\balterar\b/g, "")
        .replace(/\beditar\b/g, "")
        .replace(/\btrocar\b/g, "")
        .replace(/às|as\b/g, "")
        .replace(/\b\d{1,2}:\d{2}h?\b|\b\d{1,2}h\b/g, "")
        .replace(/\bamanhã\b/g, "")
        .replace(/\bhoje\b/g, "")
        .replace(/\bsegunda\b/g, "")
        .replace(/\bterça\b/g, "")
        .replace(/\bterca\b/g, "")
        .replace(/\bquarta\b/g, "")
        .replace(/\bquinta\b/g, "") 
        .replace(/\bsexta\b/g, "")
        .replace(/\bsábado\b/g, "")
        .replace(/\bsabado\b/g, "")
        .replace(/\bdomingo\b/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^(de|do|da|o|sobre)\s+/i, "") // remove só se estiver no começo

    return { tarefa, hora, data };
}

function interpretarData(frase) {
    frase = frase.toLowerCase();
    const hoje = new Date();
    const data = new Date(hoje);

    const diasSemana = {
        domingo: 0, segunda: 1, terça: 2, terca: 2,
        quarta: 3, quinta: 4, sexta: 5, sábado: 6, sabado: 6
    };

    if (frase.includes("amanhã")) {
        data.setDate(data.getDate() + 1);
        return formatarData(data);
    }

    if (frase.includes("hoje")) {
        return formatarData(data);
    }

    for (const nomeDia in diasSemana) {
        if (frase.includes(nomeDia)) {
            const alvo = diasSemana[nomeDia];
            const atual = hoje.getDay();
            let diferenca = alvo - atual;
            if (diferenca <= 0) diferenca += 7;
            data.setDate(data.getDate() + diferenca);
            return formatarData(data);
        }
    }

    return formatarData(data);
}

function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function ehEdicao(frase) {
    return ["mudar", "muda","altera","troca","edita", "alterar", "trocar", "editar"].some(p => frase.includes(p));
}

function extrairEdicao(frase) {
    const partes = frase.split(/\s+(?:para|pra)\s+/);
    if (partes.length < 2) return null;

    const alvo = partes[0]
        .replace(/\bmudar\b|\balterar\b|\beditar\b|\btrocar\b/g, "")
        .replace(/\blembrete\b/g, "")
        .replace(/\bde\b|\bdo\b|\bda\b|\bo\b|\ba\b/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")[0]; // pega só a primeira palavra-chave igual ao cancelamento

    const novo = partes[1].trim();
    return { alvo, novo };
}

function ehLembrete(frase) {
    const temHora = /\b\d{1,2}:\d{2}\b|\b\d{1,2}h\b/.test(frase);
    const palavrasData = ["hoje", "amanhã", "segunda", "terça", "terca",
        "quarta", "quinta", "sexta", "sábado", "sabado", "domingo"];
    const temData = palavrasData.some(p => frase.includes(p));
    return temHora || temData;
}

function ehCancelamento(frase) {
    return ["cancelar", "remover", "apagar", "deletar",
        "cancela", "remove", "apaga", "deleta"].some(p => frase.includes(p));
}

function extrairCancelamento(frase) {
    return frase
        .replace(/cancelar|remover|apagar|deletar|cancela|remove|apaga|deleta/g, "")
        .replace(/\blembrete\b/g, "")
        .replace(/\bde\b|\bdo\b|\bda\b|\bo\b|\ba\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function formatarListaLembretes(lembretes) {
    if (lembretes.length === 0) return "Você não tem lembretes cadastrados ";

    const lista = lembretes.map((l, i) =>
        `${i + 1}. *${l.tarefa}* — ${l.data} às ${l.hora}`
    ).join("\n");

    return `Seus lembretes:\n\n${lista}`;
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("assistente rodando :)"));
app.get("/webhook", (req, res) => res.send("webhook ativo :)"));

app.post("/webhook", async (req, res) => {
    // Twilio envia Body e From no body form-urlencoded
    const mensagem = req.body.Body?.toLowerCase().trim();
    const numero = req.body.From; // ex: whatsapp:+5511999999999

    if (!mensagem || !numero) {
        return res.status(400).send("Requisição inválida");
    }

    console.log(`[${numero}] mensagem: ${mensagem}`);

    // Twilio espera resposta TwiML ou 200 vazio — respondemos 200 vazio
    // e enviamos a resposta via API separadamente
    res.status(200).send();

    try {
        // CANCELAR
        if (ehCancelamento(mensagem)) {
            const termo = extrairCancelamento(mensagem);
            const palavraChave = termo.split(" ")[0]; // pega só a primeira palavra
            console.log("Tentando cancelar com palavra-chave:", palavraChave);

            const [resultado] = await pool.query(
                "DELETE FROM lembretes WHERE tarefa LIKE ? AND numero = ? LIMIT 1",
                [`%${palavraChave}%`, numero]
            );

            console.log("Rows afetadas:", resultado.affectedRows);

            if (resultado.affectedRows > 0) {
                return enviarMensagem(numero, "Lembrete removido ✅");
            }
            return enviarMensagem(numero, "Não encontrei esse lembrete 😕");
        }

        // EDITAR
        if (ehEdicao(mensagem)) {
            const dados = extrairEdicao(mensagem);
            console.log("Edição extraída:", dados);

            if (!dados) {
                return enviarMensagem(numero, "Não entendi a edição \nExemplo: *mudar reunião pra 15h*");
            }

            const novosDados = extrairLembrete(dados.novo);
            const campos = [];
            const valores = [];

            if (novosDados.hora)   { campos.push("hora = ?");   valores.push(novosDados.hora); }
            if (novosDados.data)   { campos.push("data = ?");   valores.push(novosDados.data); }
            if (novosDados.tarefa) { campos.push("tarefa = ?"); valores.push(novosDados.tarefa); }

            if (campos.length === 0) {
                return enviarMensagem(numero, "Não entendi o que editar ");
            }

            valores.push(`%${dados.alvo}%`, numero);

            const [resultado] = await pool.query(
                `UPDATE lembretes SET ${campos.join(", ")} WHERE tarefa LIKE ? AND numero = ? LIMIT 1`,
                valores
            );

            if (resultado.affectedRows > 0) {
                return enviarMensagem(numero, "Lembrete atualizado ");
            }
            return enviarMensagem(numero, "Não encontrei esse lembrete ");
        }

        // LISTAR
        if (mensagem.includes("lembretes")) {
            const [resultados] = await pool.query(
                "SELECT id, tarefa, hora, DATE_FORMAT(data, '%d/%m/%Y') as data FROM lembretes WHERE numero = ? ORDER BY data, hora",
                [numero]
            );
            return enviarMensagem(numero, formatarListaLembretes(resultados));
        }

        // CRIAR
        if (ehLembrete(mensagem)) {
            const dados = extrairLembrete(mensagem);

            if (!dados.hora) {
                return enviarMensagem(numero,
                    "Não entendi o horário 🕘\nTente: *me lembra amanhã às 9h de ligar pro João*"
                );
            }

            await pool.query(
                "INSERT INTO lembretes (tarefa, hora, data, numero) VALUES (?, ?, ?, ?)",
                [dados.tarefa, dados.hora, dados.data, numero]
            );

            return enviarMensagem(numero,
                `Anotado! ✅\n📅 ${dados.data} às ${dados.hora}\n📝 Te aviso sobre: ${dados.tarefa}`
            );
        }

        // FALLBACK
        return enviarMensagem(numero,
            "Não entendi 🤔\n\nVocê pode:\n" +
            "• *me lembra amanhã às 9h de ligar pro João*\n" +
            "• *meus lembretes*\n" +
            "• *cancelar ligar pro João*\n" +
            "• *mudar ligar pro João pra 10h*"
        );

    } catch (erro) {
        console.error("Erro no webhook:", erro);
        enviarMensagem(numero, "Ocorreu um erro interno 😕 Tente novamente.");
    }
});

// ─── Cron ─────────────────────────────────────────────────────────────────────

cron.schedule("* * * * *", async () => {
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    try {
        const [resultados] = await pool.query(
            `SELECT * FROM lembretes WHERE hora = ? AND data = CURDATE() AND enviado = FALSE`,
            [horaAtual]
        );

        for (const item of resultados) {
            console.log(`Disparando lembrete [${item.numero}]: ${item.tarefa}`);

            await enviarMensagem(
                item.numero,
                `⏰ Lembrete!\n\n📝Tarefa: ${item.tarefa}`
            );

            await pool.query(
                "UPDATE lembretes SET enviado = TRUE WHERE id = ?",
                [item.id]
            );
        }
    } catch (erro) {
        console.error("Erro no cron:", erro);
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(3000, () => console.log("servidor rodando na porta 3000"));