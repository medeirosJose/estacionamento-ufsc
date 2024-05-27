// Inicia o Express.js
const express = require("express");
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Método HTTP GET /hello - envia a mensagem: Hello World
app.get("/hello", (req, res) => {
  res.send("Hello World");
});

// Importa o package do SQLite
const sqlite3 = require("sqlite3");

var db = new sqlite3.Database("./dados.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// Cria a tabela cadastro, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS vagas (
        estacionamentoId TEXT PRIMARY KEY NOT NULL UNIQUE,
        nomeEstacionamento TEXT NOT NULL,
        totalVagas INTEGER NOT NULL,
        vagasOcupadas INTEGER NOT NULL DEFAULT 0,
        vagasDisponiveis INTEGER NOT NULL DEFAULT 0
    )`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar a tabela 'vagas'.");
      throw err;
    } else {
      console.log("Tabela 'vagas' criada com sucesso.");
    }
  }
);

// Método HTTP GET /vagas - retorna todas as vagas
app.get("/vagas", (req, res) => {
  db.all("SELECT * FROM vagas", [], (err, rows) => {
    if (err) {
      console.log("ERRO: não foi possível selecionar as vagas.");
      throw err;
    }
    res.send(rows);
  });
});

// Método HTTP GET /vagas/:estacionamentoId - retorna uma vaga específica
app.get("/vagas/:estacionamentoId", (req, res) => {
  db.get(
    "SELECT * FROM vagas WHERE estacionamentoId = ?",
    [req.params.estacionamentoId],
    (err, row) => {
      if (err) {
        console.log("ERRO: não foi possível selecionar a vaga.");
        throw err;
      }
      res.send(row);
    }
  );
});

// Método HTTP POST /vagas - insere uma nova vaga
app.post("/vagas", (req, res) => {
  //! FAZER A VALIDAÇÃO DE VAGAS DISPONÍVEIS
  db.run(
    "INSERT INTO vagas (estacionamentoId, nomeEstacionamento, totalVagas, vagasOcupadas, vagasDisponiveis) VALUES (?, ?, ?, ?, ?)",
    [
      req.body.estacionamentoId,
      req.body.nomeEstacionamento,
      req.body.totalVagas,
      req.body.vagasOcupadas,
      req.body.vagasDisponiveis,
    ],
    (err) => {
      if (err) {
        console.log("ERRO: não foi possível inserir a vaga.");
        throw err;
      }
      res.send("Vaga inserida com sucesso!");
    }
  );
});

// Método HTTP PUT /vagas/:estacionamentoId - atualiza uma vaga
app.put("/vagas/:estacionamentoId", (req, res) => {
  db.run(
    "UPDATE vagas SET nomeEstacionamento = ?, totalVagas = ?, vagasOcupadas = ?, vagasDisponiveis = ? WHERE estacionamentoId = ?",
    [
      req.body.nomeEstacionamento,
      req.body.totalVagas,
      req.body.vagasOcupadas,
      req.body.vagasDisponiveis,
      req.params.estacionamentoId,
    ],
    (err) => {
      if (err) {
        console.log("ERRO: não foi possível atualizar a vaga.");
        throw err;
      }
      res.send("Vaga atualizada com sucesso!");
    }
  );
});

// Método HTTP DELETE /vagas/:estacionamentoId - deleta uma vaga
app.delete("/vagas/:estacionamentoId", (req, res) => {
  db.run(
    "DELETE FROM vagas WHERE estacionamentoId = ?",
    [req.params.estacionamentoId],
    function (err) {
      if (err) {
        res.status(500).send("Erro ao remover cliente.");
      } else if (this.changes == 0) {
        console.log("Cliente não encontrado.");
        res.status(404).send("Cliente não encontrado.");
      } else {
        res.status(200).send("Cliente removido com sucesso!");
      }
      res.send("Vaga deletada com sucesso!");
    }
  );
});

let porta = 8090;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});
