const axios = require("axios");
// Inicia o Express.js
const express = require("express");
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Inicia o Servidor na porta 8001
let porta = 8001;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

// Importa o package do SQLite
const sqlite3 = require("sqlite3");

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database("./dados.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// Cria a tabela Credito, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS creditos 
        (cpf INTEGER PRIMARY KEY NOT NULL UNIQUE, credito INT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  }
);

const cadastro = "https://localhost:8080/Cadastro:cpf";

// Método HTTP GET /Credito - retorna todos os creditos
app.get("/Credito", (req, res, next) => {
  db.all(`SELECT * FROM creditos`, [], (err, result) => {
    if (err) {
      console.log("Erro: " + err);
      res.status(500).send("Erro ao obter dados.");
    } else {
      res.status(200).json(result);
    }
  });
});

// Método HTTP GET /Credito/:cpf - retorna Credito do usuário com base no CPF
app.get("/Credito/:cpf", (req, res, next) => {
  db.get(
    `SELECT * FROM creditos WHERE cpf = ?`,
    req.params.cpf,
    (err, result) => {
      if (err) {
        console.log("Erro: " + err);
        res.status(500).send("Erro ao obter dados.");
      } else if (result == null) {
        console.log("Usuário não encontrado.");
        res.status(404).send("Usuário não encontrado.");
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.post("/Credito/:cpf", async (req, res, next) => {
  const { cpf } = req.params;
  if (!cpf) {
    return res.status(400).send("CPF é obrigatório.");
  }
  await axios
    .get(cadastro, {
      params: {
        cpf: cpf,
      },
    })
    .then(function (response) {
      if (response.status == 200) {
        console.log(response.data);
      }
    })
    .catch((error) => {
      console.error("Ocorreu um erro:", error);
    });
  db.run(
    `INSERT INTO creditos(cpf, credito) VALUES(?, ?)`,
    [req.body.cpf, req.body.credito],
    (err) => {
      if (err) {
        console.log("Error: " + err);
        res.status(500).send("Erro ao cadastrar usuário.");
      } else {
        console.log("Usuário cadastrado com sucesso!");
        res.status(200).send("Usuário cadastrado com sucesso!");
      }
    }
  );
});

// Método HTTP PATCH /Credito/:cpf - altera o credito de um usuario
app.patch("/Credito/:cpf", (req, res, next) => {
  db.run(
    `UPDATE creditos SET credito = COALESCE(?,credito) WHERE cpf = ?`,
    [req.body.credito, req.params.cpf],
    function (err) {
      if (err) {
        res.status(500).send("Erro ao alterar dados.");
      } else if (this.changes == 0) {
        console.log("Usuário não encontrado.");
        res.status(404).send("Usuário não encontrado.");
      } else {
        res.status(200).send("Usuário alterado com sucesso!");
      }
    }
  );
});

//Método HTTP DELETE /Credito/:cpf - remove um usuário do credito
app.delete("/Credito/:cpf", (req, res, next) => {
  db.run(`DELETE FROM creditos WHERE cpf = ?`, req.params.cpf, function (err) {
    if (err) {
      res.status(500).send("Erro ao remover usuário.");
    } else if (this.changes == 0) {
      console.log("Usuário não encontrado.");
      res.status(404).send("Usuário não encontrado.");
    } else {
      res.status(200).send("Usuário removido com sucesso!");
    }
  });
});
