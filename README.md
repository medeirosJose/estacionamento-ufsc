# 🚗 Estacionamento UFSC - Backend

Este é o backend do sistema de controle de acesso e gestão de estacionamento como atividade proposta pela disciplina Desenvolvimento de Sistemas Móveis e Embarcados da Universidade Federal de Santa Catarina (UFSC). 

O sistema é composto por cinco microservices responsáveis por diferentes funcionalidades.
## 🌐 Microservices
### Cadastro de Usuários

Responsável por manter os dados de cada usuário do sistema, incluindo CPF, nome e categoria (estudante, professor, TAE ou visitante).
### Controle de Créditos
Estudantes e visitantes devem adquirir créditos para utilizar os estacionamentos da UFSC. Este microservice é responsável por gerenciar esses créditos.

### Controle de Vagas
Controla a quantidade de vagas disponíveis em cada estacionamento da UFSC.

### Controle de Acesso
Verifica se a entrada/saída do veículo deve ser liberada. Na entrada, verifica o número de vagas disponíveis e na saída, subtrai os créditos da conta do usuário. Todas as entradas e saídas são registradas em uma tabela.

### Controle de Cancela
Envia o comando para abertura de uma cancela quando a entrada/saída for autorizada. Basta imprimir uma mensagem na tela para simular a abertura da cancela.



## 💻 Tecnologias Utilizadas
- JavaScript
- Node.js
- Express
- SQLite
- Axios
