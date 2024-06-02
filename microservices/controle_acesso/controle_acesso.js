// controle de acesso: verifica se a entrada/saída do veículo deve ser liberada;
// na entrada, deve verificar o número de vagas disponíveis;
// na saída, deve subtrair os créditos da conta do usuário; todas as entradas e saídas devem ser registradas em uma tabela;

const axios = require("axios");
// Inicia o Express.js
const express = require("express");
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const vagas = "http://localhost:8090/Vagas";
const credito = "http://localhost:8001/Credito";

// Inicia o Servidor na porta 8004
let porta = 8100;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

// Importa o package do SQLite
const sqlite3 = require("sqlite3");
const { AbreCancela } = require("../controle_cancela/controle_cancela");

var db = new sqlite3.Database("./dados.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// Cria a tabela controle_acesso, caso ela não exista, com estacionamentoId, cpf, dataHora, tipo (entrada ou saída)
db.run(
  `CREATE TABLE IF NOT EXISTS controle_acesso 
            (accessId INTEGER PRIMARY KEY AUTOINCREMENT, 
                estacionamentoId TEXT NOT NULL, 
                cpf INTEGER NOT NULL, 
                dataHora TEXT NOT NULL, 
                tipo TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  }
);

// Método HTTP POST /Entrada - registra a entrada de um veículo, deve ser feito usando axios,
//n posso acessar outros microservices e dbs diretamente
// verifica se a entrada/saída do veículo deve ser liberada; na entrada, deve verificar o número de vagas disponíveis e fazer a subtracao de uma vaga disponivel;
app.post("/Entrada", (req, res, next) => {
  var estacionamentoId = req.body.estacionamentoId;
  var cpf = req.body.cpf;
  var dataHora = new Date().toISOString();
  var tipo = "entrada";

  db.run(
    `INSERT INTO controle_acesso (estacionamentoId, cpf, dataHora, tipo) VALUES (?, ?, ?, ?)`,
    [estacionamentoId, cpf, dataHora, tipo],
    (err) => {
      if (err) {
        console.log("Erro: " + err);
        res.status(500).send("Erro ao registrar entrada.");
      } else {
        axios.get(vagas + "/" + estacionamentoId).then((response) => {
          var vagasDisponiveis = response.data.vagasDisponiveis;
          if (vagasDisponiveis > 0) {
            db.run(
              `UPDATE vagas SET vagasDisponiveis = ? WHERE estacionamentoId = ?`,
              [vagasDisponiveis - 1, estacionamentoId],
              (err) => {
                if (err) {
                  console.log("Erro: " + err);
                  res.status(500).send("Erro ao subtrair vaga.");
                } else {
                  res.status(200).send("Entrada registrada com sucesso.");
                  AbreCancela()
                }
              }
            );
          } else {
            res.status(500).send("Vagas esgotadas.");
          }
        });
      }
    }
  );
});

// Método HTTP POST /Saida - registra a saída de um veículo
// na saída, deve subtrair os créditos da conta do usuário
app.post("/Saida", (req, res, next) => {
  var estacionamentoId = req.body.estacionamentoId;
  var cpf = req.body.cpf;
  var dataHora = new Date().toISOString();
  var tipo = "saida";

  db.run(
    `INSERT INTO controle_acesso (estacionamentoId, cpf, dataHora, tipo) VALUES (?, ?, ?, ?)`,
    [estacionamentoId, cpf, dataHora, tipo],
    (err) => {
      if (err) {
        console.log("Erro: " + err);
        res.status(500).send("Erro ao registrar saída.");
      } else {
        axios.get(credito + "/" + cpf).then((response) => {
          var credito = response.data.credito;
          if (credito > 0) {
            db.run(
              `UPDATE creditos SET credito = ? WHERE cpf = ?`,
              [credito - 1, cpf],
              (err) => {
                if (err) {
                  console.log("Erro: " + err);
                  res.status(500).send("Erro ao subtrair crédito.");
                } else {
                  res.status(200).send("Saída registrada com sucesso.");
                  AbreCancela()
                }
              }
            );
          } else {
            res.status(500).send("Créditos insuficientes.");
          }
        });
      }
    }
  );
});

// Método HTTP GET /ControleAcesso - retorna todos os registros de controle de acesso
app.get("/ControleAcesso", (req, res, next) => {
  db.all(`SELECT * FROM controle_acesso`, [], (err, result) => {
    if (err) {
      console.log("Erro: " + err);
      res.status(500).send("Erro ao obter dados.");
    } else {
      res.status(200).json(result);
    }
  });
});

// Método HTTP GET /ControleAcesso/:cpf - retorna todos os registros de controle de acesso de um usuário
app.get("/ControleAcesso/:cpf", (req, res, next) => {
  db.all(
    `SELECT * FROM controle_acesso WHERE cpf = ?`,
    req.params.cpf,
    (err, result) => {
      if (err) {
        console.log("Erro: " + err);
        res.status(500).send("Erro ao obter dados.");
      } else {
        res.status(200).json(result);
      }
    }
  );
});

// Método HTTP GET /ControleAcesso/:estacionamentoId - retorna todos os registros de controle de acesso de um estacionamento
app.get("/ControleAcesso/:estacionamentoId", (req, res, next) => {
  db.all(
    `SELECT * FROM controle_acesso WHERE estacionamentoId = ?`,
    req.params.estacionamentoId,
    (err, result) => {
      if (err) {
        console.log("Erro: " + err);
        res.status(500).send("Erro ao obter dados.");
      } else {
        res.status(200).json(result);
      }
    }
  );
});
