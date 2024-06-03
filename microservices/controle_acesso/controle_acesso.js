// controle de acesso: verifica se a entrada/saída do veículo deve ser liberada;
// na entrada, deve verificar o número de vagas disponíveis;
// na saída, deve subtrair os créditos da conta do usuário; todas as entradas e saídas devem ser registradas em uma tabela;

const axios = require("axios");
// Inicia o Express.js
const express = require("express");
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const vagas = "http://localhost:8090/Vagas";
const credito = "http://localhost:8001/Credito";
const cadastro = "http://localhost:8080/Cadastro";

const { AbreCancela } = require("../controle_cancela/controle_cancela");

// Inicia o Servidor na porta 8100
let porta = 8100;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

// Importa o package do SQLite
const sqlite3 = require("sqlite3").verbose();

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

app.get("/UltimoRegistro/:cpf", (req, res, next) => {
  db.get(
    `SELECT * FROM controle_acesso WHERE cpf = ? ORDER BY accessId DESC LIMIT 1`,
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

// Método HTTP POST /Entrada - registra a entrada de um veículo
app.post("/Entrada", (req, res, next) => {
  var estacionamentoId = req.body.estacionamentoId;
  var cpf = req.body.cpf;
  var dataHora = new Date().toUTCString();
  var tipo = "entrada";

  axios.get("http://localhost:8100/UltimoRegistro/" + cpf).then((response) => {
    console.log("dentro de ultimo registro");
    if (response.status === 200) {
      if (response.data && response.data.tipo === "entrada") {
        console.log(response.data);
        console.log("Usuário já está no estacionamento.");
        errorMessage = "Usuário já está no estacionamento.";
        res.status(500).send(errorMessage);
      } else {
        db.run(
          `INSERT INTO controle_acesso (estacionamentoId, cpf, dataHora, tipo) VALUES (?, ?, ?, ?)`,
          [estacionamentoId, cpf, dataHora, tipo],
          (err) => {
            if (err) {
              console.log("Erro: " + err);
              res.status(500).send("Erro ao registrar entrada.");
            } else {
              console.log("to aqui diabo");
              axios.get(vagas + "/" + estacionamentoId).then((response) => {
                var vagasDisponiveis = response.data.vagasDisponiveis;
                if (vagasDisponiveis > 0) {
                  axios
                    .put(vagas + "/" + estacionamentoId, {
                      nomeEstacionamento: response.data.nomeEstacionamento,
                      totalVagas: response.data.totalVagas,
                      vagasOcupadas: response.data.vagasOcupadas + 1,
                      vagasDisponiveis: vagasDisponiveis - 1,
                      estacionamentoId: estacionamentoId,
                    })
                    .then(() => {
                      res.status(200).send("Entrada registrada com sucesso.");
                      AbreCancela();
                    })
                    .catch((err) => {
                      res.status(500).send("Erro ao subtrair vaga.");
                    });
                } else {
                  res.status(400).send("Não há vagas disponíveis.");
                }
              });
            }
          }
        );
      }
    } else {
      console.error("Erro ao verificar último registro de entrada.");
      errorMessage = "Erro ao verificar último registro de entrada.";
      res.status(500).send(errorMessage);
    }
  });
});

// Método HTTP POST /Saida - registra a saída de um veículo
app.post("/Saida", (req, res, next) => {
  var estacionamentoId = req.body.estacionamentoId;
  var cpf = req.body.cpf;
  var dataHora = new Date().toUTCString();
  var tipo = "saída";

  axios.get("http://localhost:8100/UltimoRegistro/" + cpf).then((response) => {
    if (response.status === 200) {
      if (response.data && response.data.tipo === "saída") {
        console.log("Usuário já saiu do estacionamento.");
        errorMessage = "Usuário já saiu do estacionamento.";
        res.status(500).send(errorMessage);
      } else {
        db.run(
          `INSERT INTO controle_acesso (estacionamentoId, cpf, dataHora, tipo) VALUES (?, ?, ?, ?)`,
          [estacionamentoId, cpf, dataHora, tipo],
          (err) => {
            if (err) {
              console.log("Erro: " + err);
              res.status(500).send("Erro ao registrar saída.");
            } else {
              axios
                .get(cadastro + "/" + cpf)
                .then((response) => {
                  var categoria = response.data.categoria;
                  console.log(categoria);
                  if (categoria == "estudante" || categoria == "visitante") {
                    axios
                      .get(credito + "/" + cpf)
                      .then((response) => {
                        console.log(response.data);
                        var creditos = response.data.credito;
                        console.log("creditos: " + creditos);
                        if (creditos > 0) {
                          axios
                            .patch(credito + "/" + cpf, {
                              cpf: cpf,
                              credito: creditos - 1,
                            })
                            .then(() => {
                              axios
                                .get(vagas + "/" + estacionamentoId)
                                .then((response) => {
                                  var vagasDisponiveis =
                                    response.data.vagasDisponiveis;
                                  axios
                                    .put(vagas + "/" + estacionamentoId, {
                                      nomeEstacionamento:
                                        response.data.nomeEstacionamento,
                                      totalVagas: response.data.totalVagas,
                                      vagasOcupadas:
                                        response.data.vagasOcupadas - 1,
                                      vagasDisponiveis: vagasDisponiveis + 1,
                                      estacionamentoId: estacionamentoId,
                                    })
                                    .then(() => {
                                      res
                                        .status(200)
                                        .send("Saída registrada com sucesso.");
                                      AbreCancela();
                                    })
                                    .catch((err) => {
                                      res
                                        .status(500)
                                        .send("Erro ao adicionar vaga.");
                                    });
                                })
                                .catch((err) => {
                                  res.status(500).send("Erro ao buscar vagas.");
                                });
                            })
                            .catch((err) => {
                              res.status(500).send("Erro ao subtrair crédito.");
                            });
                        } else {
                          res.status(400).send("Créditos insuficientes.");
                        }
                      })
                      .catch((err) => {
                        res.status(500).send("Erro ao procurar crédito.");
                      });
                  } else {
                    axios
                      .get(vagas + "/" + estacionamentoId)
                      .then((response) => {
                        var vagasDisponiveis = response.data.vagasDisponiveis;
                        axios
                          .put(vagas + "/" + estacionamentoId, {
                            nomeEstacionamento:
                              response.data.nomeEstacionamento,
                            totalVagas: response.data.totalVagas,
                            vagasOcupadas: response.data.vagasOcupadas - 1,
                            vagasDisponiveis: vagasDisponiveis + 1,
                            estacionamentoId: estacionamentoId,
                          })
                          .then(() => {
                            res
                              .status(200)
                              .send("Saída registrada com sucesso.");
                            AbreCancela();
                          })
                          .catch((err) => {
                            res.status(500).send("Erro ao adicionar vaga.");
                          });
                      })
                      .catch((err) => {
                        res.status(500).send("Erro ao buscar vagas.");
                      });
                  }
                })
                .catch((err) => {
                  res.status(500).send("Erro ao procurar usuário.");
                });
            }
          }
        );
      }
    }
  });
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

// Metodo HPP GET para busacr os dados de entrada
app.get("/Entrada", (req, res, next) => {
  db.all(
    `SELECT * FROM controle_acesso WHERE tipo = 'entrada'`,
    [],
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

// Metodo HPP GET para busacr os dados de saida
app.get("/Saida", (req, res, next) => {
  db.all(
    `SELECT * FROM controle_acesso WHERE tipo = 'saída'`,
    [],
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
