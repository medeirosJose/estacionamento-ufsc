# estacionamento-ufsc

Atividade 3 proposta para a disciplina de Desenvolvimento de Sistemas Embarcados com foco em backend.

O backend será composto por cinco microservices, responsáveis pelas funcionalidades descritas a seguir:

    cadastro de usuários: mantém os dados de cada usuário do sistema, como o CPF, nome e categoria (estudante, professor, TAE ou visitante);

    controle de créditos: estudantes e visitantes devem adquirir créditos para utilizar os estacionamentos da UFSC;

    controle de vagas: controla a quantidade de vagas disponíveis em cada estacionamento; 

    controle de acesso: verifica se a entrada/saída do veículo deve ser liberada; na entrada, deve verificar o número de vagas disponíveis; na saída, deve subtrair os créditos da conta do usuário; todas as entradas e saídas devem ser registradas em uma tabela;
    
    controle de cancela: envia o comando para abertura de uma cancela quando a entrada/saída for autorizada (obs.: basta imprimir uma mensagem na tela para simular a abertura).

