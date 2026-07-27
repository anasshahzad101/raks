import pg from "pg";
const { Client } = pg;
const c = new Client({ host: "localhost", port: 5432, user: "medusa", password: "medusa", database: "postgres" });
await c.connect();
// terminate other connections then drop+create
await c.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='raks_medusa' AND pid<>pg_backend_pid();`).catch(()=>{});
await c.query(`DROP DATABASE IF EXISTS raks_medusa;`);
await c.query(`CREATE DATABASE raks_medusa;`);
console.log("DB raks_medusa dropped & recreated (fresh).");
await c.end();
