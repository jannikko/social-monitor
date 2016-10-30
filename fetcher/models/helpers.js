const rollback = function(client, done) {
  client.query('ROLLBACK', function(err) {
    //if there was a problem rolling back the query
    //something is seriously messed up.  Return the error
    //to the done function to close & remove this client from
    //the pool.  If you leave a client in the pool with an unaborted
    //transaction weird, hard to diagnose problems might happen.
    return done(err);
  });
};
pg.connect(function(err, client, done) {
  if(err) throw err;
  client.query('BEGIN', function(err) {
    if(err) return rollback(client, done);
    //as long as we do not call the `done` callback we can do 
    //whatever we want...the client is ours until we call `done`
    //on the flip side, if you do call `done` before either COMMIT or ROLLBACK
    //what you are doing is returning a client back to the pool while it 
    //is in the middle of a transaction.  
    //Returning a client while its in the middle of a transaction
    //will lead to weird & hard to diagnose errors.
    process.nextTick(function() {
      var text = 'INSERT INTO account(money) VALUES($1) WHERE id = $2';
      client.query(text, [100, 1], function(err) {
        if(err) return rollback(client, done);
        client.query(text, [-100, 2], function(err) {
          if(err) return rollback(client, done);
          client.query('COMMIT', done);
        });
      });
    });
  });
});
