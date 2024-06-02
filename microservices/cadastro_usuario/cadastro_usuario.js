// Inicia o Express.js
const express = require("express");
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Inicia o Servidor na porta 8080
let porta = 8080;
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

// Cria a tabela cadastro, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS cadastro 
        (cpf INTEGER PRIMARY KEY NOT NULL UNIQUE, nome TEXT NOT NULL, categoria TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  }
);

// Método HTTP POST /Cadastro - cadastra um novo usuario
app.post("/Cadastro", (req, res, next) => {
  db.run(
    `INSERT INTO cadastro(cpf, nome, categoria) VALUES(?,?,?)`,
    [req.body.cpf, req.body.nome, req.body.categoria],
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


// Método HTTP GET /Cadastro - retorna todos os cadastros
app.get('/Cadastro', (req, res, next) => {
    db.all(`SELECT * FROM cadastro`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Cadastro/:cpf - retorna cadastro do usuário com base no CPF
app.get('/Cadastro/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM cadastro WHERE cpf = ?`, 
            req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Usuário não encontrado.");
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP PATCH /Cadastro/:cpf - altera o cadastro de um usuario
app.patch('/Cadastro/:cpf', (req, res, next) => {
    db.run(`UPDATE cadastro SET nome = COALESCE(?,nome), categoria = COALESCE(?,categoria) WHERE cpf = ?`,
           [req.body.nome, req.body.categoria, req.params.cpf], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Usuário não encontrado.");
                res.status(404).send('Usuário não encontrado.');
            } else {
                res.status(200).send('Usuário alterado com sucesso!');
            }
    });
});

//Método HTTP DELETE /Cadastro/:cpf - remove um usuário do cadastro
app.delete('/Cadastro/:cpf', (req, res, next) => {
    db.run(`DELETE FROM cadastro WHERE cpf = ?`, req.params.cpf, function(err) {
      if (err){
         res.status(500).send('Erro ao remover usuário.');
      } else if (this.changes == 0) {
         console.log("Usuário não encontrado.");
         res.status(404).send('Usuário não encontrado.');
      } else {
         res.status(200).send('Usuário removido com sucesso!');
      }
   });
});