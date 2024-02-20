import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { user_id: 1, username: "Eshaan", color: "teal" },
  { user_id: 2, username: "Ved", color: "powderblue"},
];


async function checkVisisted() {
  const result = await db.query("SELECT * from visited_countries v join countries on countries.id=v.cid where UID= $1 ",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getCurrentUser() {
  const result = await db.query("SELECT * FROM people");
  users = result.rows;
  return users.find((user) => user.user_id == currentUserId);
}
app.get("/", async (req, res) => {
  const currentUser = await getCurrentUser();

  const countries = await checkVisisted();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const currentUser = await getCurrentUser();
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT id FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.id;
    try {
      await db.query(
        "INSERT INTO visited_countries (cid,uid) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user",async (req,res)=>{
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO people (username, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


