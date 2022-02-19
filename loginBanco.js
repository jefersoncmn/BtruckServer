/* Esse código contém dados e funções de acesso ao banco de dados*/

var mysql = require('mysql');//Biblioteca do SQL
const usuario_dados = require('./usuariodados');//codigo de outro arquivo com as coisas de emblema
const servidor = require('./servidor');//codigo de outro arquivo com as funções instanciar usuário no servidor e spawn


/**
 * Info pra acesso ao banco de dados
 */
var con = mysql.createConnection({
  host: "host",
  user: "user",
  password: "password",
  database: "database"
});

/**
 * Função que realiza a busca do usuário no banco de dados para realizar o login
 * @param {*} usuario usuario
 * @param {*} senha senha
 * @param {*} rinfo ip e porta
 * @param {*} mysql biblioteca mysql
 */
var loginBanco = function loginBanco(usuario, senha, rinfo) {

  var sql = 'SELECT * from contas WHERE senha = ' + mysql.escape(senha) + 'and user = ' + mysql.escape(usuario);

  var clientID;

  con.query(sql, function (err, result) {
    if (err) throw err;

    /**
     * Faz a pesquisa e retorna o ID do usuário do banco de dados
     */
    result.forEach((row) => {
      //console.log(`Usuário ${row.User} que logou. ID: ${row.ID} `);
      clientID = row.ID;

    });

    if (result == 0) {
      console.log("Nenhum usuário encontrado!");

    } else {
      console.log("Login realizado!");

      ReturnDataUser(clientID, rinfo);

    }
  });
}

exports.loginBanco = loginBanco;


/**
 * Função que retorna dados do usuário do banco de dados que será levado ao jogo
 * @param {*} clientID Id do cliente
 * @param {*} rinfo Ip e porta do cliente
 */
var ReturnDataUser = function ReturnDataUser(clientID, rinfo) {
  var sql = 'SELECT * from usuario WHERE ID = ' + mysql.escape(clientID);

  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach((row) => {
      var clientData = [];

      clientData['Name'] = row.Nome;
      clientData['Id'] = row.ID;
      clientData['Level'] = row.Level;

      servidor.inserirJogador(clientID, clientData, rinfo);

    });
  });

}

