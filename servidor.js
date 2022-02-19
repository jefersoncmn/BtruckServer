const login_banco = require('./loginBanco');//codigo de outro arquivo com as funções de login

const chalk = require('chalk'); //Biblioteca que adiciona cor nos textos de debug

const dgram = require('dgram'); //O módulo fornece uma implementação de soquetes de datagrama UDP.

const server = dgram.createSocket('udp4');

const message = Buffer.from('message');//Buffer usado para manipulação dos dados

var mysql = require('mysql');//Biblioteca do SQL

const PORT = 3000;//Porta do servidor
const HOST = 'localhost';//O ip do servidor

var numplayers = 0; //Indica o numero de jogadores no servidor
var numMaxPlayers = 30; //Indica o numero máximo de jogadores que pode ter no servidor
var serverName = "Server Brasil 1"; //Nome do servidor

var qq = [];//vetor com a mensagem a ser enviada para o jogador
var PlayerList = {};
var clientid = '';
var maxdisconnect = 2000;//ping maximo que o usuário pode ter para se manter conectado

var serverInterval = 2;//intervalo de função
var acessos = 0;
var sessionID = 'S' + getuid();

console.log('========================================================================');
console.log('===================== SESSION : ' + sessionID + '===========================');
console.log('========================================================================');



/**
 * Função que opera na inicialização do servidor, caso erros, é desligado
 */
server.on('error', (err) => {
  console.log(`Erro no servidor:\n${err.stack}`);
  server.close();
});

/**
 * Função que opera na recepção de mensagens de externos (clientes) e sinaliza o pacote recebido
 */
server.on('message', (msg, rinfo) => {
  console.log(chalk.bgBlue.white.bold(`O servidor obteve: ${msg} de ${rinfo.address}:${rinfo.port}`));

  processClientMessage(rinfo, msg);

});


/**
 * Função que informa o endereço e porta do servidor
 */
server.on('listening', () => {
  const address = server.address();
  console.log(chalk.bgBlack.yellow.bold(`O servidor é lido pela porta: ${address.address}:${address.port}`));
});

/**
 * Função que retorna a quantidade de jogadores jogando no momento
 * @param {*} arg 
 */
function contadorUsers(arg) {
  if (numplayers > 0) {
    console.log(chalk.bgGreen.white.bold(`O servidor possuí: ${numplayers} usuários jogando!`));
  }
}

setInterval(contadorUsers, 5000);

server.bind(PORT, HOST);

setInterval(function () { //função repetitiva
  serverTick();
}, serverInterval);

function sendMessageToClient(message, clientAddress, clientPort, clientID) {//função que só manda as informações para respectivo usuário
  console.log('Server envia mensagem para (players=' + numplayers + ') client ID=' + clientID + ' : ' + message);;
  var msg = new Buffer(message);
  server.send(msg, 0, message.length, clientPort, clientAddress, function (err, bytes) {
    if (err) throw err;
    // console.log('Server sent msg to client: ' + clientHost +':'+ clientPort);
  });
}

function serverTick() {
  // check heartbeats/disconnects

  const regrasOut = {

    /**
     * Função que envia dados para todos os jogadores sobre o login realizado de um jogador
     */
    oklogin() {
      sendMessageToClient(qdets.msg, PlayerList[clientid].ad, PlayerList[clientid].po, clientid);//envia mensagem com a linha de envio, endereço, porta, id para o jogador do próprio pc
      if (numplayers > 1) {//se tiver pessoas jogando
        for (var id in PlayerList) {//percorre todas as pessoas
          if (id != clientid && PlayerList[id].connected == 1) {//se o id foi diferente do idcliente, ele estiver conectado e estiver pronto (parece que envia o dado do player para todos os outros)
            console.log('Enviando dados de outros players ' + id + ': ' + PlayerList[id].ad + ',' + PlayerList[id].po);

            qdets.msg = 'getplayers,' + sessionID + ',' + PlayerList[id].id + ',1,' + PlayerList[id].id + ',idle,' + PlayerList[id].px + ',' + PlayerList[id].py + ',' + PlayerList[id].pz + ',0,0,0';
            sendMessageToClient(qdets.msg, PlayerList[clientid].ad, PlayerList[clientid].po, clientid);//envia mensagem com a linha de envio, endereço, porta, id
          }
        }
      }
    },

    /**
     * Função que emite a existência de outros usuários que já estão no servidor para o jogador que acabou de entrar
     */
    getplayers() {
      if (numplayers > 1) {//se tiver pessoas jogando
        for (var id in PlayerList) {//percorre todas as pessoas
          if (id != clientid && PlayerList[id].connected == 1) {//se o id foi diferente do idcliente, ele estiver conectado e estiver pronto (parece que envia o dado do player para todos os outros)
            //console.log('Enviando dados de outros players '+id + ': ' + PlayerList[id].ad+','+PlayerList[id].po);
            sendMessageToClient(qdets.msg, PlayerList[id].ad, PlayerList[id].po, id);//envia mensagem com a linha de envio, endereço, porta, id
          }
        }
      }
    },

    /**
     * Função que envia dados de movimentos para os outros jogadores
     */
    move() {
      if (numplayers > 1) {//se tiver mais de uma pessoa jogando
        for (var id in PlayerList) {//percorre todas as pessoas
          if (PlayerList[id].connected == 1 && PlayerList[id].ready == 1) {//se o id foi diferente do idcliente, ele estiver conectado e estiver pronto (parece que envia o dado do player para todos os outros)
            //console.log('Enviando dados de outros players '+id + ': ' + PlayerList[id].ad+','+PlayerList[id].po);
            sendMessageToClient(qdets.msg, PlayerList[id].ad, PlayerList[id].po, id);//envia mensagem com a linha de envio, endereço, porta, id
          }
        }
      } else {//se o jogador estiver só no servidor é só enviado pra ele mesmo
        sendMessageToClient(qdets.msg, qdets.ad, qdets.po, clientid);
      }
    }

  }



  /**
   * Trecho que verifica se o usuário está conectado
   */
  if (numplayers > 0) { //se tiver players no servidor
    var disconnects = [];  //e criado a variavel disconectados
    // update disconnect heartbeat bins
    for (var id in PlayerList) { //id percorre PlayerList (todos os players)
      if (PlayerList[id].connected == 1) {  //se o jogador tá conectado
        PlayerList[id].dc++; //é incremenado o dc (dc = ping do jogador)
        if (PlayerList[id].dc > maxdisconnect) {  // user disconnected // se o dc do usuário estiver acima do ping maximo defido
          PlayerList[id].connected = 0; //usuário é desconectado
          PlayerList[id].ready = 0; //usuário desativado
          disconnects.push(id);//é armazenado na variavel dos disconectados o seu id
          console.log('==============================');
          console.log('Jogador' + id + ' Desconectou por estar com o Ping muito alto');//mostra o jogador que foi desconectado
          numplayers--;//numero de players reduz
        }
      }
    }
    /**
     * Trecho que informa aos usuários dos usuários que foram desconectados
     */
    if (disconnects.length != 0) { //se tiver usuários que foram desconectados
      if (numplayers > 0) { //e ter pessoas no servidor
        for (var i = 0; i < disconnects.length; i++) { //é percorrido pela quantidade de usuários desconectados
          for (var id in PlayerList) { //id percorre os usuarios
            if (PlayerList[id].connected == 1 && PlayerList[id].ready == 1 && id != disconnects[i]) { //se o usuario estiver conectado, pronto e não estar na lista de desconectados
              //console.log('Sending disconnect msg to player '+id);
              sendMessageToClient('playerdisconnect,' + sessionID + ',' + id + ',0,' + disconnects[i], PlayerList[id].ad, PlayerList[id].po, id);//é enviado a mensagem que os usuários foi desconectados para os outros players

            }
          }
        }
      } else { //se não tiver pessoas no servidor
        console.log('*** Todos os players estão desconectados!');
      }
      console.log('==============================');
    }


    // ==========================
    // QQ são vetores com mensagens a serem enviadas para o jogo
    // ==========================
    if (qq.length > 0) { //se tiver mensagens a ser enviadas

      for (var i = 0; i < qq.length; i++) { //essa função percorre as mensagens que serão enviadas aos jogadores
        qdets = qq[i];//recebe o pacote
        keyword = getword(qdets.msg, 0, ',');//recebe o comando 
        clientid = getword(qdets.msg, 2, ',');//recebe o id do jogador
        if (PlayerList[clientid].connected == 1) { //se o jogador está conectado
          var regras_envio = regrasOut[keyword];

          if (regras_envio) { //executa a função com base nessa chave verificando inicialmente se ela existe no conjunto de funções
            regras_envio();
          }
        }
      }
      qq = [];
    }
  }
}



/**
 * Função que receberá dados do jogador (jogo) e realizará uma respectiva função
 * @param {*} rinfo informação da conexão (IP e PORT) do jogador
 * @param {*} msg mensagem do jogador
 */
function processClientMessage(rinfo, msg) {
  msg = msg.toString('utf-8').trim();//define formato da mensagem recebida
  //    0       1       2        3     4   5     6 7 8 9  10 11 
  // keyword,sessionid,clientid,seq#,objid,state,x,y,z,rx,ry,rz

  const regras = { //conjunto de regras de negócio que serão chamadas de acordo com a chave que o jogo mandar
    /**
     * Função de identificação de sessão
     */
    verify_session() {
      if (getword(msg, 1, ',') != sessionID) {
        console.log('A mensagem obtida do cliente é da sessão anterior!');
        return;
      } else {
        console.log('A mensagem obtida do cliente é da sessão atual!');
      }
    },

    /**
     * Função que login
     */
    login() {
      //regras.verify_session();
      login_banco.loginBanco(getword(msg, 1, ','), getword(msg, 2, ','), rinfo);//(login,senha,rinfo)
    },

    /**
     * Função de verificação de conectividade
     */
    heartbeat() {
      console.log('-heartbeat recebido!-');
      udp = msg.split(","[0]);
      clientid = udp[2];
      PlayerList[clientid].ready = 1;
      if (PlayerList[clientid].connected == 0) {
        PlayerList[clientid].connected = 1;
        PlayerList[clientid].ready = 1;
        PlayerList[clientid].dc = 0;
        console.log('*** Reconectar jogador ' + clientid);
        numplayers++;
      } else {
        PlayerList[clientid].dc = 0;
      }
    },

    /**
     * Função que move o usuário
     */
    Forward() {
      console.log('-move Forward recived-');
      udp = msg.split(","[0]);
      clientid = udp[2];
      lado = udp[0];//lado é a direção de movimento
      PlayerList[clientid].dc = 0;
      console.log('-move recived-' + lado);

      qq.push({ msg: 'Forward,' + sessionID + ',' + clientid + ',1,' + clientid + ',idle,' + PlayerList[clientid].px + ',' + PlayerList[clientid].py + ',' + PlayerList[clientid].pz + ',0,0,0', ad: rinfo.address, po: rinfo.port });
    },

    Left() {
      console.log('-move Left recived-');
      udp = msg.split(","[0]);
      clientid = udp[2];
      lado = udp[0];//lado é a direção de movimento
      PlayerList[clientid].dc = 0;
      console.log('-move recived-' + lado);

      qq.push({ msg: 'Forward,' + sessionID + ',' + clientid + ',1,' + clientid + ',idle,' + PlayerList[clientid].px + ',' + PlayerList[clientid].py + ',' + PlayerList[clientid].pz + ',0,0,0', ad: rinfo.address, po: rinfo.port });
    },

    Right() {
      console.log('-move Right recived-');
      udp = msg.split(","[0]);
      clientid = udp[2];
      lado = udp[0];//lado é a direção de movimento
      PlayerList[clientid].dc = 0;
      console.log('-move recived-' + lado);

      qq.push({ msg: 'Forward,' + sessionID + ',' + clientid + ',1,' + clientid + ',idle,' + PlayerList[clientid].px + ',' + PlayerList[clientid].py + ',' + PlayerList[clientid].pz + ',0,0,0', ad: rinfo.address, po: rinfo.port });
    },

    Down() {
      console.log('-move Down recived-');
      udp = msg.split(","[0]);
      clientid = udp[2];
      lado = udp[0];//lado é a direção de movimento
      PlayerList[clientid].dc = 0;
      console.log('-move recived-' + lado);

      qq.push({ msg: 'Forward,' + sessionID + ',' + clientid + ',1,' + clientid + ',idle,' + PlayerList[clientid].px + ',' + PlayerList[clientid].py + ',' + PlayerList[clientid].pz + ',0,0,0', ad: rinfo.address, po: rinfo.port });
    },

    spawn() {
      console.log('-spawn recebido!-');
      //spawnJogador(getword(msg,1,','),getword(msg,2,','),rinfo);
    }
  }

  var regras_entrada = regras[getword(msg, 0, ',')];

  if (regras_entrada) { //executa a função com base nessa chave verificando inicialmente se ela existe no conjunto de funções
    regras_entrada();
  }


}

/**
 * Função que gera uma ID randomica
 */
function getuid() {
  return Math.random().toString(36).substr(2, 5);
}

/**
 * Função responsável por subdividir as mensagens de envio
 * @param {*} string a chave inteira
 * @param {*} n numero de chaves (palavras)
 * @param {*} delim 
 */
function getword(string, n, delim) {
  var words = string.split(delim);
  if (words[n]) {
    return words[n];
  } else {
    return '';
  }
}

exports.getword = getword;

/**
 * Função que spawna o jogador no mapa
 * @param {*} clienteid id do jogador
 * @param {*} rinfo informações de dados de entrada como o endereço IP e a Port
 */
function spawnJogador(clienteid, cidadeid, rinfo) {

  PlayerList[clientid].ready = 1; //ready
  qq.push({ msg: 'spawnplayer,' + sessionID + ',' + clientid + ',' + PlayerList[clientid].rodasAnguloY + ',' + PlayerList[clientid].velocidade, ad: rinfo.address, po: rinfo.port });
  qq.push({ msg: 'getplayers,' + sessionID + ',' + clientid + ',' + PlayerList[clientid].rodasAnguloY + ',' + PlayerList[clientid].velocidade, ad: rinfo.address, po: rinfo.port });
}

/**
* Função que instancia o usuário no servidor
* @param rinfo informações de dados de entrada como o endereço IP e a Port
*/
function inserirJogador(clientID, clientData, rinfo) {

  numplayers++; // A criar o player o numero de players no servidor aumenta
  acessos++; // Quantidade de acessos também

  clientid = 'P' + acessos;
  console.log(chalk.bgGreen.white.bold(`Acesso de cliente id:${clientid}`));
  PlayerList[clientid] = {};//recebera uma lista de dados do clienteid
  PlayerList[clientid].id = clientID;//id do cliente
  PlayerList[clientid].ad = rinfo.address;//IP do cliente
  PlayerList[clientid].po = rinfo.port;//Porta do cliente
  PlayerList[clientid].ob = clientid;//Próprio id
  PlayerList[clientid].state = 'logado'; //estado do cliente 
  PlayerList[clientid].px = 0;
  PlayerList[clientid].py = 0;
  PlayerList[clientid].pz = 0;
  PlayerList[clientid].rx = 0;
  PlayerList[clientid].ry = 0;
  PlayerList[clientid].rz = 0;
  PlayerList[clientid].rodasAnguloY = 0;//angulação da roda
  PlayerList[clientid].velocidade = 0;//velocidade
  PlayerList[clientid].at = numplayers;
  PlayerList[clientid].ready = 0; //ready
  PlayerList[clientid].connected = 1; //connected
  PlayerList[clientid].dc = 0; //disconnect count

  qq.push({ msg: 'oklogin,' + sessionID + ',' + clientid + ',' + clientData['Name'] + ',' + clientData['Level'], ad: rinfo.address, po: rinfo.port });

}
exports.inserirJogador = inserirJogador;
