import MySQL from "mysql";

const pool = MySQL.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "a841221w",
  database: "dormitory"
});

const query = (sql: any, values?: any) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        console.log("数据库开启成功！");
        pool.query(sql, values, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          connection.release();
        });
      }
    });
  });
};

export default query;
