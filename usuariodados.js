/**
 * Função que retorna os dados dos emblemas que o jogador tem!
 * @param {*} mysql biblioteca mysql
 * @param {*} con dados de acesso ao banco
 * @param {*} contaID clienteID
 */
function retorno_emblemas(mysql, con, contaID) {

    var sql = 'SELECT * from emblemas WHERE contaID =' + mysql.escape(contaID);

    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result);
        if (result == 0) {
            console.log("Nenhum emblema encontrado no usuário de Id: " + contaID);
        }
    });
}

exports.retorno_emblemas = retorno_emblemas;